import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@mairie360/lib-components/primitives';

import { DashboardNotices, NOTICE_TEXTS, reloadLabel, reloadToast } from '.';

const ready = { userFirstName: 'Alice', projects: [], tasks: [], events: [], metrics: { totalProjects: 0 }, sources: { projects: 'available', tasks: 'available', calendar: 'available' } } as never;
const withSources = (sources: Record<string, string>) => ({ ...(ready as object), sources }) as never;
const inPage = (node: React.ReactNode) => <ToastProvider regionLabel="Notifications">{node}</ToastProvider>;
const outsideToasts = (role: string) => screen.queryAllByRole(role).filter((node) => !node.closest('[data-m360-component~="ToastProvider"]'));

describe('DashboardNotices (MAIR-915)', () => {
  it('shows the lib alerts with fixed texts and offers the one recovery action named by severity', async () => {
    const user = userEvent.setup(); const onReload = vi.fn(async () => null);
    expect(reloadLabel({ error: 'x', unusableEventCount: 2 })).toBe('Réessayer le chargement');
    expect(reloadLabel({ error: '', unusableEventCount: 2 })).toBe('Actualiser les dates illisibles');
    expect(reloadLabel({ error: '', unusableEventCount: 0 })).toBe('Actualiser les données indisponibles');
    const { rerender } = render(inPage(<DashboardNotices error="" logoutError="" loading={false} hasUnavailableSource={false} unusableEventCount={0} hasData onReload={onReload} />));
    expect(screen.queryByRole('button')).toBeNull();
    rerender(inPage(<DashboardNotices error="" logoutError="" loading={false} hasUnavailableSource unusableEventCount={0} hasData onReload={onReload} />));
    expect(outsideToasts('status').map((node) => node.textContent)).toEqual([NOTICE_TEXTS.unavailableSource]);
    expect(outsideToasts('status')[0]).toHaveAttribute('data-size', 'm');
    expect(screen.queryByRole('button', { name: /Fermer/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Actualiser les données indisponibles' })); expect(onReload).toHaveBeenCalledTimes(1);
    rerender(inPage(<DashboardNotices error={NOTICE_TEXTS.readFailed} logoutError="La déconnexion est temporairement indisponible." loading hasUnavailableSource={false} unusableEventCount={0} hasData onReload={onReload} />));
    expect(outsideToasts('alert').map((node) => node.textContent)).toEqual([NOTICE_TEXTS.logoutFailed, NOTICE_TEXTS.readFailed]);
    expect(screen.getByRole('button', { name: 'Réessayer le chargement' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Les dernières données reçues restent affichées.')).toBeInTheDocument();
  });

  it('announces the result of a recovery in a toast', async () => {
    const user = userEvent.setup();
    const onReload = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, data: ready });
    render(inPage(<DashboardNotices error="" logoutError="" loading={false} hasUnavailableSource unusableEventCount={0} hasData onReload={onReload} />));
    await user.click(screen.getByRole('button', { name: 'Actualiser les données indisponibles' }));
    await waitFor(() => expect(screen.getAllByText('Le tableau de bord est toujours indisponible').length).toBeGreaterThan(0));
    await user.click(screen.getByRole('button', { name: 'Actualiser les données indisponibles' }));
    await waitFor(() => expect(screen.getAllByText('Tableau de bord à jour').length).toBeGreaterThan(0));
  });

  it('maps every outcome of a recovery to its toast (F2, F3)', () => {
    expect(reloadToast(null, true)).toBeNull();
    expect(reloadToast({ ok: true, data: ready }, true)).toEqual({ tone: 'success', title: 'Tableau de bord à jour', message: 'Toutes les données ont été récupérées.' });
    expect(reloadToast({ ok: true, data: ready }, false)).toEqual({ tone: 'success', title: 'Tableau de bord chargé', message: 'Toutes les données ont été récupérées.' });
    expect(reloadToast({ ok: true, data: withSources({ projects: 'available', tasks: 'available', calendar: 'unavailable' }) }, true))
      .toEqual({ tone: 'error', title: 'Le calendrier est toujours indisponible', message: 'Les autres données restent affichées.' });
    expect(reloadToast({ ok: true, data: withSources({ projects: 'unavailable', tasks: 'available', calendar: 'available' }) }, true)?.title).toBe('Les projets sont toujours indisponibles');
    expect(reloadToast({ ok: true, data: withSources({ projects: 'available', tasks: 'unavailable', calendar: 'available' }) }, true)?.title).toBe('Les tâches sont toujours indisponibles');
    expect(reloadToast({ ok: true, data: withSources({ projects: 'unavailable', tasks: 'unavailable', calendar: 'available' }) }, true)?.title).toBe('Certaines données sont toujours indisponibles');
    expect(reloadToast({ ok: false }, false)).toEqual({ tone: 'error', title: 'Le service ne répond toujours pas', message: 'Réessayez dans quelques instants.' });
    expect(reloadToast({ ok: false }, true)?.title).toBe('Le tableau de bord est toujours indisponible');
  });
});
