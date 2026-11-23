"use client";
import { useCallback, useEffect, useRef, useState } from "react";

import { bffDashboard } from '../../lib/bff-client';
import { isUsableBootstrap, withDefaults } from '../../lib/dashboard-bootstrap';
import { subscribePageReturn } from '@mairie360/lib-components/shared';
import { type DashboardBootstrap, toDashboardModuleData } from '../../lib/dashboard-view';

/** Message of a failed read (MAIR-915): the reason given by the service is never shown. */
export const READ_FAILED_MESSAGE = "Le tableau de bord est temporairement indisponible.";
const UNUSABLE_BOOTSTRAP = new Error("Les données reçues du tableau de bord sont incohérentes. Réessayez.");

/** Result of one read: `ok` with the confirmed bootstrap, or a failure (the last confirmed data stays). */
export type DashboardReadOutcome = { ok: true; data: DashboardBootstrap } | { ok: false };

export interface DashboardData {
  data: DashboardBootstrap | null;
  /** The derived cards of `data`, or null while nothing confirmed was received. */
  view: ReturnType<typeof toDashboardModuleData> | null;
  error: string;
  loading: boolean;
  /**
   * One read at a time; consecutive calls before the disabled state renders are ignored (they resolve
   * with null). Resolves with the outcome of the read, for the recovery toast (MAIR-915).
   */
  reload: () => Promise<DashboardReadOutcome | null>;
}

/**
 * Loads /dashboard/bootstrap once (unless a usable server bootstrap was given),
 * reloads on page return, and retains the last confirmed cards when a read fails.
 */
export function useDashboardData(initialData?: DashboardBootstrap | null): DashboardData {
  const [initial] = useState(() => isUsableBootstrap(initialData) ? withDefaults(initialData) : null);
  const [data, setData] = useState<DashboardBootstrap | null>(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!initial);
  const readController = useRef<AbortController | null>(null);
  const loadDashboard = useCallback(async (): Promise<DashboardReadOutcome | null> => {
    // The ref guards consecutive clicks before React renders the disabled button.
    if (readController.current) return null;
    const controller = new AbortController();
    readController.current = controller;
    try {
      const { data: response } = await bffDashboard.getDashboardBootstrap({ signal: controller.signal });
      if (controller.signal.aborted || readController.current !== controller) return null;
      if (!isUsableBootstrap(response)) {
        throw UNUSABLE_BOOTSTRAP;
      }
      // An older BFF without the MAIR-825 fields gets their neutral values.
      const complete = withDefaults(response);
      setData(complete);
      setError("");
      return { ok: true, data: complete };
    } catch (reason) {
      if (!controller.signal.aborted && readController.current === controller) {
        // Retain the last confirmed cards; a failed read is not an empty result. Only the front's own
        // French wording is kept: no service message or HTTP status reaches the agent (MAIR-915).
        setError(reason === UNUSABLE_BOOTSTRAP ? UNUSABLE_BOOTSTRAP.message : READ_FAILED_MESSAGE);
        return { ok: false };
      }
      return null;
    } finally {
      if (readController.current === controller) {
        readController.current = null;
        setLoading(false);
      }
    }
  }, []);
  useEffect(() => {
    if (!initial) void loadDashboard();
    return () => {
      readController.current?.abort();
      readController.current = null;
    };
  }, [loadDashboard, initial]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const page = document;
    const refresh = () => { if (!page.hidden) void loadDashboard(); };
    return subscribePageReturn(refresh);
  }, [loadDashboard]);
  const reload = useCallback(() => { setLoading(true); return loadDashboard(); }, [loadDashboard]);
  return { data, view: data ? toDashboardModuleData(data) : null, error, loading, reload };
}
