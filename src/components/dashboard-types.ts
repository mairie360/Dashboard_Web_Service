import type React from 'react';
import type { LucideIcon } from 'lucide-react';

export type DashboardTone = 'blue' | 'green' | 'purple' | 'orange' | 'red';
export type DashboardTrendTone = 'positive' | 'negative' | 'neutral';
export type DashboardProjectStatus = 'in-progress' | 'completed' | 'paused';
export type DashboardTaskPriority = 'high' | 'medium' | 'low';
export type DashboardQuickActionId = 'new-document' | 'schedule-event' | 'contact-team' | 'view-reports';

export interface DashboardMetric {
  id: string;
  label: string;
  value: React.ReactNode;
  trend?: string;
  trendTone?: DashboardTrendTone;
  tone: DashboardTone;
  icon: LucideIcon;
}

export interface DashboardProject {
  id: string;
  name: string;
  progress: number;
  status: DashboardProjectStatus;
  dueDate: string;
}

export interface DashboardTask {
  id: string;
  title: string;
  dueLabel: string;
  priority: DashboardTaskPriority;
}

export interface DashboardQuickAction {
  id: DashboardQuickActionId;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export interface DashboardEvent {
  id: string;
  title: string;
  location: string;
  startsAt: string;
}

export interface DashboardPerformanceMetric {
  id: string;
  label: string;
  value: React.ReactNode;
  description: string;
  tone: 'green' | 'blue' | 'orange';
  icon: LucideIcon;
}
