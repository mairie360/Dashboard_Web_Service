"use client";
import React from "react";
import { Panel } from "@mairie360/lib-components/primitives";

import type { DashboardQuickAction, DashboardQuickActionId } from "../types";
import { QuickActionButton } from "./QuickActionButton";

export interface DashboardQuickActionsProps extends React.HTMLAttributes<HTMLElement> {
  actions?: DashboardQuickAction[];
  onAction?: (action: DashboardQuickActionId) => void;
}

/** The quick actions panel. */
export const DashboardQuickActions = ({ actions = [], onAction, className = "", ...props }: DashboardQuickActionsProps) => (
  <Panel {...props} title="Actions rapides" className={`dashboard-quick-actions ${className}`.trim()}>
    <div className="grid gap-3 sm:grid-cols-2">
      {actions.map((action) => <QuickActionButton key={action.id} action={action} onAction={onAction} />)}
    </div>
  </Panel>
);
