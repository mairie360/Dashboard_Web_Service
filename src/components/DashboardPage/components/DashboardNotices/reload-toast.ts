import type { DashboardBootstrap } from '@/lib/dashboard-view';

/** Toast announcing the result of « Réessayer le chargement » / « Actualiser les données indisponibles » (MAIR-915, F2/F3). */
export interface ReloadToast {
  tone: 'success' | 'error';
  title: string;
  message: string;
}

const STILL_UNAVAILABLE: Record<string, string> = {
  projects: 'Les projets sont toujours indisponibles',
  tasks: 'Les tâches sont toujours indisponibles',
  calendar: 'Le calendrier est toujours indisponible',
  trainings: 'Les formations sont toujours indisponibles',
};

/**
 * The toast of one explicit recovery. `hadData`: confirmed cards were already shown before the read
 * (a refresh of unavailable data), otherwise it was the retry of a failed first load. A read the
 * guard ignored (`outcome` null) announces nothing.
 */
export function reloadToast(outcome: { ok: true; data: DashboardBootstrap } | { ok: false } | null, hadData: boolean): ReloadToast | null {
  if (!outcome) return null;
  if (!outcome.ok) {
    return hadData
      ? { tone: 'error', title: 'Le tableau de bord est toujours indisponible', message: 'Réessayez dans quelques instants.' }
      : { tone: 'error', title: 'Le service ne répond toujours pas', message: 'Réessayez dans quelques instants.' };
  }
  const missing = Object.entries(outcome.data.sources as Record<string, string>).filter(([, state]) => state === 'unavailable').map(([source]) => source);
  if (missing.length === 0) {
    return hadData
      ? { tone: 'success', title: 'Tableau de bord à jour', message: 'Toutes les données ont été récupérées.' }
      : { tone: 'success', title: 'Tableau de bord chargé', message: 'Toutes les données ont été récupérées.' };
  }
  const title = missing.length === 1 ? STILL_UNAVAILABLE[missing[0]] ?? 'Certaines données sont toujours indisponibles' : 'Certaines données sont toujours indisponibles';
  return { tone: 'error', title, message: 'Les autres données restent affichées.' };
}
