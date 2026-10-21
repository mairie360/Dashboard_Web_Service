"use client";
import { useCallback, useEffect, useRef, useState } from "react";

import { bffDashboard } from "@/lib/bff-client";
import { isUsableBootstrap } from "@/lib/dashboard-bootstrap";
import { subscribePageReturn } from "@/lib/page-return";
import { type DashboardBootstrap, toDashboardModuleData } from "@/lib/dashboard-view";

export interface DashboardData {
  data: DashboardBootstrap | null;
  /** The derived cards of `data`, or null while nothing confirmed was received. */
  view: ReturnType<typeof toDashboardModuleData> | null;
  error: string;
  loading: boolean;
  /** One read at a time; consecutive calls before the disabled state renders are ignored. */
  reload: () => void;
}

/**
 * Loads /dashboard/bootstrap once (unless a usable server bootstrap was given),
 * reloads on page return, and retains the last confirmed cards when a read fails.
 */
export function useDashboardData(initialData?: DashboardBootstrap | null): DashboardData {
  const [initial] = useState(() => isUsableBootstrap(initialData) ? initialData : null);
  const [data, setData] = useState<DashboardBootstrap | null>(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!initial);
  const readController = useRef<AbortController | null>(null);
  const loadDashboard = useCallback(async () => {
    // The ref guards consecutive clicks before React renders the disabled button.
    if (readController.current) return;
    const controller = new AbortController();
    readController.current = controller;
    try {
      const { data: response } = await bffDashboard.getDashboardBootstrap({ signal: controller.signal });
      if (controller.signal.aborted || readController.current !== controller) return;
      if (!isUsableBootstrap(response)) {
        throw new Error("Les données reçues du tableau de bord sont incohérentes. Réessayez.");
      }
      setData(response);
      setError("");
    } catch (reason) {
      if (!controller.signal.aborted && readController.current === controller) {
        // Retain the last confirmed cards; a failed read is not an empty result.
        setError(reason instanceof Error ? reason.message : "Le tableau de bord est temporairement indisponible.");
      }
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
  const reload = useCallback(() => { setLoading(true); void loadDashboard(); }, [loadDashboard]);
  return { data, view: data ? toDashboardModuleData(data) : null, error, loading, reload };
}
