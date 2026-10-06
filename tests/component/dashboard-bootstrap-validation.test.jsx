import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/app/page';
import { requestBff } from '@/lib/bff-client';

vi.mock('@/lib/bff-client', () => ({ requestBff: vi.fn() }));
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

beforeEach(() => { vi.mocked(requestBff).mockReset().mockResolvedValue(bootstrap()); });

describe('Dashboard unusable bootstrap recovery', () => {
  it.each([null, bootstrap({ events: {} })])('refuses an unusable initial success (%j) and deliberately recovers', async (body) => {
    const user = userEvent.setup();
    vi.mocked(requestBff).mockResolvedValueOnce(body);
    render(<Home />);
    expect((await screen.findByRole('alert')).textContent).toBe(readError);
    expect(screen.getByText('Le tableau de bord est indisponible.')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Tableau de Bord' })).toBeNull();
    expect(requestBff).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Réessayer le chargement' }));
    await screen.findByRole('button', { name: /Projet confirmé/ });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(requestBff).toHaveBeenCalledTimes(2);
  });

  it('keeps confirmed identity/cards and an independent logout failure through malformed and valid reads', async () => {
    const user = userEvent.setup();
    render(<Home />);
    await screen.findByRole('button', { name: /Projet confirmé/ });
    await user.click(screen.getByRole('button', { name: /Confirmé/ }));
    await user.click(await screen.findByText('Déconnexion', { exact: true }));
    await screen.findByText('La déconnexion est temporairement indisponible.');
    vi.mocked(requestBff).mockResolvedValueOnce({ userFirstName: 'Non confirmé' });
    await user.click(screen.getByRole('button', { name: 'Actualiser les données indisponibles' }));
    await screen.findByText(readError);
    expect(screen.getByText('Bienvenue Confirmé, voici un aperçu de vos activités')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Projet confirmé/ })).toBeTruthy();
    expect(screen.queryByText(/Non confirmé/)).toBeNull();
    vi.mocked(requestBff).mockResolvedValueOnce(bootstrap({ userFirstName: 'Réponse reçue', projects: [], tasks: [], events: [],
      sources: { projects: 'available', tasks: 'available', calendar: 'available' } }));
    await user.click(screen.getByRole('button', { name: 'Réessayer le chargement' }));
    await screen.findByText('Bienvenue Réponse reçue, voici un aperçu de vos activités');
    expect(screen.getByText('Aucun projet récent.')).toBeTruthy();
    expect(screen.getByText('Aucune tâche en attente.')).toBeTruthy();
    expect(screen.getByText('Aucun événement à venir.')).toBeTruthy();
    expect(screen.queryByText(readError)).toBeNull();
    expect(screen.getByRole('alert').textContent).toBe('La déconnexion est temporairement indisponible.');
    expect(requestBff).toHaveBeenCalledTimes(3);
  });

  it('deduplicates a pending read and retains the cards when its eventual result is unusable', async () => {
    render(<Home />);
    await screen.findByRole('button', { name: /Projet confirmé/ });
    let finish;
    vi.mocked(requestBff).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const refresh = screen.getByRole('button', { name: 'Actualiser les données indisponibles' });
    act(() => { fireEvent.click(refresh); fireEvent.click(refresh); });
    expect(requestBff).toHaveBeenCalledTimes(2);
    expect(refresh.disabled).toBe(true);
    expect(refresh.getAttribute('aria-busy')).toBe('true');
    await act(async () => finish(bootstrap({ projects: null })));
    await screen.findByText(readError);
    expect(screen.getByRole('button', { name: /Projet confirmé/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Réessayer le chargement' }).disabled).toBe(false);
    expect(requestBff).toHaveBeenCalledTimes(2);
  });

  it('ignores an aborted unusable result instead of replacing a newer confirmed read', async () => {
    const reads = [];
    vi.mocked(requestBff).mockImplementation((_path, init) => new Promise(resolve => reads.push({ signal: init.signal, resolve })));
    render(<StrictMode><Home /></StrictMode>);
    expect(reads).toHaveLength(2);
    expect(reads[0].signal.aborted).toBe(true);
    await act(async () => reads[1].resolve(bootstrap()));
    await screen.findByRole('button', { name: /Projet confirmé/ });
    await act(async () => reads[0].resolve(null));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: /Projet confirmé/ })).toBeTruthy();
  });

  it('keeps optional event fields and the established invalid-date fallback separate from unusable shape', async () => {
    const value = bootstrap({ events: [{ id: 9, title: 'Date reçue illisible', date: '2026-02-31' },
      { id: 'valid', title: 'Événement facultatif', date: '2028-02-29' }] });
    value.projects[0].dueDate = '3';
    vi.mocked(requestBff).mockResolvedValue(value);
    render(<Home />);
    await screen.findByRole('button', { name: /Projet confirmé/ });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: /Projet confirmé/ }).textContent).toContain('Échéance: 3');
    expect(screen.queryByRole('button', { name: /Date reçue illisible/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Événement facultatif/ })).toBeTruthy();
    expect(screen.getByText(/Certains événements reçus/)).toBeTruthy();
  });
});
