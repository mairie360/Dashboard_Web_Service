import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilePlus2,
  Files,
  Users,
} from 'lucide-react';

import type { DashboardEvent, DashboardMetric, DashboardPerformanceMetric, DashboardProject, DashboardQuickAction, DashboardTask } from '@/components/dashboard-types';

export const defaultDashboardMetrics: DashboardMetric[] = [
  { id: 'projects', label: 'Projets actifs', value: 12, trend: '+2 ce mois', trendTone: 'positive', tone: 'blue', icon: BarChart3 },
  { id: 'citizens', label: 'Citoyens servis', value: '1,247', trend: '+8% ce mois', trendTone: 'positive', tone: 'green', icon: Users },
  { id: 'documents', label: 'Documents traités', value: 856, trend: '-3% ce mois', trendTone: 'negative', tone: 'purple', icon: Files },
  { id: 'events', label: 'Événements ce mois', value: 24, trend: '+5 ce mois', trendTone: 'positive', tone: 'orange', icon: CalendarDays },
];

export const defaultDashboardProjects: DashboardProject[] = [
  { id: 'library', name: 'Rénovation bibliothèque', progress: 75, status: 'in-progress', dueDate: '15 Nov 2024' },
  { id: 'park', name: 'Aménagement parc central', progress: 30, status: 'in-progress', dueDate: '20 Mar 2025' },
  { id: 'archives', name: 'Digitalisation archives', progress: 100, status: 'completed', dueDate: '30 Sep 2024' },
];

export const defaultDashboardTasks: DashboardTask[] = [
  { id: 'training-budget', title: 'Validation budget formation', dueLabel: "Aujourd'hui", priority: 'high' },
  { id: 'urban-report', title: 'Rapport mensuel urbanisme', dueLabel: 'Demain', priority: 'medium' },
  { id: 'website', title: 'Mise à jour site web', dueLabel: '3 jours', priority: 'low' },
];

export const defaultDashboardQuickActions: DashboardQuickAction[] = [
  { id: 'new-document', label: 'Nouveau document', icon: FilePlus2 },
  { id: 'schedule-event', label: 'Planifier événement', icon: CalendarDays },
  { id: 'contact-team', label: 'Contacter équipe', icon: Users },
  { id: 'view-reports', label: 'Voir rapports', icon: BarChart3 },
];

export const defaultDashboardEvents: DashboardEvent[] = [
  { id: 'council', title: 'Conseil Municipal', location: 'Salle du conseil', startsAt: '2026-10-20T14:00:00' },
  { id: 'security-training', title: 'Formation sécurité', location: 'Salle formation', startsAt: '2026-10-22T09:00:00' },
  { id: 'citizen-hours', title: 'Permanence citoyens', location: 'Accueil', startsAt: '2026-10-23T08:30:00' },
];

export const defaultDashboardPerformance: DashboardPerformanceMetric[] = [
  { id: 'completed-projects', label: 'Projets terminés', value: 8, description: 'Ce trimestre', tone: 'green', icon: CheckCircle2 },
  { id: 'average-time', label: 'Délai moyen', value: '12j', description: 'Traitement dossiers', tone: 'blue', icon: Clock3 },
  { id: 'active-alerts', label: 'Alertes actives', value: 3, description: 'Nécessitent attention', tone: 'orange', icon: AlertTriangle },
];
