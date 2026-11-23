import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/components/DashboardPage';
import { findPageAlert, pageAlert, pageAlerts, pageStatus } from './page-roles';

const getDashboardBootstrap = vi.hoisted(() => vi.fn());
vi.mock('@/lib/bff-client', () => ({ bffDashboard: { getDashboardBootstrap: async (options) => ({ data: await getDashboardBootstrap(options) }) } }));
vi.mock('@/lib/front-urls', () => ({ frontUrl: vi.fn(() => undefined) }));

const bootstrap = (overrides = {}) => ({
  userFirstName: 'Confirmé',
  projects: [{ id: 'project-qa', title: 'Projet confirmé', progress: 25, status: 'review', dueDate: '2026-10-06' }],
  tasks: [{ id: 'task-qa', projectId: 'project-qa', title: 'Tâche confirmée', priority: 'high', dueDate: '', completed: false }],
  events: [{ id: 9, title: 'Événement confirmé', date: '2026-10-07' }],
  metrics: { totalProjects: 1 },
  sources: { projects: 'available', tasks: 'available', calendar: 'unavailable' },
  ...overrides,
});
const readError = 'Les données reçues du tableau de bord sont incohérentes. Réessayez.';

beforeEach(() => { vi.mocked(getDashboardBootstrap).mockReset().mockResolvedValue(bootstrap()); });

describe('Dashboard unusable bootstrap recovery', () => {
  it.each([null, bootstrap({ events: {} })])('refuses an unusable initial success (%j) and deliberately recovers', async (body) => {
    const user = userEvent.setup();
    vi.mocked(getDashboardBootstrap).mockResolvedValueOnce(body);
    render(<Home />);
    // MAIR-915: fixed title, the front's own explanation below it.
    expect((await findPageAlert()).textContent).toBe(`Le tableau de bord est temporairement indisponible.${readError}`);
    expect(screen.getByText('Le tableau de bord est indisponible.')).toBeTruthy();
    expect(screen.getAllByRole('heading', { name: /^Bon(?:jour|soir)/, level: 1 })).toHaveLength(1);
    expect(getDashboardBootstrap).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Réessayer le chargement' }));
    await screen.findByRole('button', { name: /Projet confirmé/ });
    expect((pageAlerts()[0] ?? null)).toBeNull();
    expect(getDashboardBootstrap).toHaveBeenCalledTimes(2);
  });

  it('keeps confirmed identity/cards and an independent logout failure through malformed and valid reads', async () => {
    const user = userEvent.setup();
    render(<Home />);
    await screen.findByRole('button', { name: /Projet confirmé/ });
    await user.click(screen.getByRole('button', { name: /Confirmé/ }));
    await user.click(await screen.findByText('Déconnexion', { exact: true }));
    // MAIR-919: lib-components 2.x confirms the logout first (MAIR-834).
    await user.click(await screen.findByRole('button', { name: 'Se déconnecter' }));
    await screen.findByText('La déconnexion est temporairement indisponible.');
    vi.mocked(getDashboardBootstrap).mockResolvedValueOnce({ userFirstName: 'Non confirmé' });
    await user.click(screen.getByRole('button', { name: 'Actualiser les données indisponibles' }));
    await screen.findByText(readError);
    expect(screen.getByText(/^Bon(?:jour|soir) Confirmé$/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Projet confirmé/ })).toBeTruthy();
    expect(screen.queryByText(/Non confirmé/)).toBeNull();
    vi.mocked(getDashboardBootstrap).mockResolvedValueOnce(bootstrap({ userFirstName: 'Réponse reçue', projects: [], tasks: [], events: [],
      sources: { projects: 'available', tasks: 'available', calendar: 'available' } }));
    await user.click(screen.getByRole('button', { name: 'Réessayer le chargement' }));
    await screen.findByText(/^Bon(?:jour|soir) Réponse reçue$/);
    expect(screen.getByText('Aucun projet récent.')).toBeTruthy();
    expect(screen.getByText('Aucune tâche en attente.')).toBeTruthy();
    expect(screen.getByText('Aucun événement à venir.')).toBeTruthy();
    expect(screen.queryByText(readError)).toBeNull();
    expect(pageAlert().textContent).toBe('La déconnexion est temporairement indisponible.');
    expect(getDashboardBootstrap).toHaveBeenCalledTimes(3);
  });

  it('deduplicates a pending read and retains the cards when its eventual result is unusable', async () => {
    render(<Home />);
    await screen.findByRole('button', { name: /Projet confirmé/ });
    let finish;
    vi.mocked(getDashboardBootstrap).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const refresh = screen.getByRole('button', { name: 'Actualiser les données indisponibles' });
    act(() => { fireEvent.click(refresh); fireEvent.click(refresh); });
    expect(getDashboardBootstrap).toHaveBeenCalledTimes(2);
    expect(refresh.disabled).toBe(true);
    expect(refresh.getAttribute('aria-busy')).toBe('true');
    await act(async () => finish(bootstrap({ projects: null })));
    await screen.findByText(readError);
    expect(screen.getByRole('button', { name: /Projet confirmé/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Réessayer le chargement' }).disabled).toBe(false);
    expect(getDashboardBootstrap).toHaveBeenCalledTimes(2);
  });

  it('ignores an aborted unusable result instead of replacing a newer confirmed read', async () => {
    const reads = [];
    vi.mocked(getDashboardBootstrap).mockImplementation((init) => new Promise(resolve => reads.push({ signal: init.signal, resolve })));
    render(<StrictMode><Home /></StrictMode>);
    expect(reads).toHaveLength(2);
    expect(reads[0].signal.aborted).toBe(true);
    await act(async () => reads[1].resolve(bootstrap()));
    await screen.findByRole('button', { name: /Projet confirmé/ });
    await act(async () => reads[0].resolve(null));
    expect((pageAlerts()[0] ?? null)).toBeNull();
    expect(screen.getByRole('button', { name: /Projet confirmé/ })).toBeTruthy();
  });

  it('keeps optional event fields and the established invalid-date fallback separate from unusable shape', async () => {
    const value = bootstrap({ events: [{ id: 9, title: 'Date reçue illisible', date: '2026-02-31' },
      { id: 'valid', title: 'Événement facultatif', date: '2028-02-29' }] });
    value.projects[0].dueDate = '3';
    vi.mocked(getDashboardBootstrap).mockResolvedValue(value);
    render(<Home />);
    await screen.findByRole('button', { name: /Projet confirmé/ });
    expect((pageAlerts()[0] ?? null)).toBeNull();
    expect(screen.getByRole('button', { name: /Projet confirmé/ }).textContent).toContain('Échéance : 3');
    expect(screen.queryByRole('button', { name: /Date reçue illisible/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Événement facultatif/ })).toBeTruthy();
    expect(screen.getByText(/Certains événements reçus/)).toBeTruthy();
  });
});
