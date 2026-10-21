import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import { DashboardPanel, DashboardPanelAction, panelMessages, DashboardHeader, dashboardGreeting, DashboardNotices, reloadLabel, DashboardLoading, DashboardGrid } from '@/components/dashboard';

vi.mock('@/lib/front-urls', () => ({ frontUrl: vi.fn((key: string) => key === 'PROJECT_FRONT_URL' ? 'https://project.example/' : undefined) }));

describe('DashboardPanel (lib Panel, MAIR-608)', () => {
  it('names the region, links the module action and shows rows, or the empty / unavailable DataState', async () => {
    const { container, rerender } = render(<DashboardPanel title="Projets récents" action="Voir les projets" href="https://projects.example/" kind="projects" empty={false} unavailable={false}><p>Lignes</p></DashboardPanel>);
    const panel = screen.getByRole('region', { name: 'Projets récents' });
    expect(within(panel).getByRole('link', { name: 'Voir les projets' })).toHaveAttribute('href', 'https://projects.example/');
    expect(within(panel).getByText('Lignes')).toBeInTheDocument();
    expect((await axe(container)).violations).toEqual([]);
    rerender(<DashboardPanel title="Projets récents" action="Voir les projets" kind="projects" empty unavailable={false}><p>Lignes</p></DashboardPanel>);
    expect(screen.getByRole('button', { name: 'Voir les projets' })).toBeDisabled();
    expect(screen.getByRole('region', { name: panelMessages.projects.empty })).toBeInTheDocument(); expect(screen.queryByText('Lignes')).toBeNull();
    rerender(<DashboardPanel title="Projets récents" action="Voir les projets" kind="projects" empty unavailable><p>Lignes</p></DashboardPanel>);
    expect(screen.getByRole('region', { name: panelMessages.projects.unavailable })).toHaveAttribute('data-state', 'unavailable');
    rerender(<DashboardPanel title="Projets récents" action="Voir les projets" kind="projects" empty={false} unavailable><p>Lignes</p></DashboardPanel>);
    expect(screen.getByRole('status')).toHaveTextContent(panelMessages.projects.unavailable); expect(screen.getByText('Lignes')).toBeInTheDocument();
  });
  it('renders the action as a disabled button with a reason when the destination is missing', () => {
    render(<DashboardPanelAction label="Ouvrir le calendrier" />);
    expect(screen.getByRole('button', { name: 'Ouvrir le calendrier' })).toHaveAttribute('title', 'Destination temporairement indisponible');
  });
});

describe('DashboardHeader and DashboardNotices', () => {
  it('greets the agent by first name and shows the date', () => {
    expect(dashboardGreeting('  Alice ')).toBe('Bienvenue Alice, voici un aperçu de vos activités'); expect(dashboardGreeting('  ')).toBe('Voici un aperçu de vos activités');
    render(<DashboardHeader userFirstName="Alice" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Tableau de Bord' })).toBeInTheDocument();
    expect(screen.getByText('Bienvenue Alice, voici un aperçu de vos activités')).toBeInTheDocument(); expect(document.querySelector('.page-current-date')).not.toBeNull();
  });
  it('announces errors and degraded sources and offers the one recovery action named by severity', async () => {
    const user = userEvent.setup(); const onReload = vi.fn();
    expect(reloadLabel({ error: 'x', unusableEventCount: 2 })).toBe('Réessayer le chargement');
    expect(reloadLabel({ error: '', unusableEventCount: 2 })).toBe('Actualiser les dates illisibles');
    expect(reloadLabel({ error: '', unusableEventCount: 0 })).toBe('Actualiser les données indisponibles');
    const { rerender } = render(<DashboardNotices error="" logoutError="" loading={false} hasUnavailableSource={false} unusableEventCount={0} hasData onReload={onReload} />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<DashboardNotices error="" logoutError="" loading={false} hasUnavailableSource unusableEventCount={0} hasData onReload={onReload} />);
    expect(screen.getByRole('status')).toHaveTextContent('Certaines données sont temporairement indisponibles.');
    await user.click(screen.getByRole('button', { name: 'Actualiser les données indisponibles' })); expect(onReload).toHaveBeenCalledTimes(1);
    rerender(<DashboardNotices error="BFF injoignable" logoutError="La déconnexion est temporairement indisponible." loading hasUnavailableSource={false} unusableEventCount={0} hasData onReload={onReload} />);
    expect(screen.getAllByRole('alert').map((node) => node.textContent)).toEqual(['La déconnexion est temporairement indisponible.', 'BFF injoignable']);
    expect(screen.getByRole('button', { name: 'Réessayer le chargement' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Les dernières données reçues restent affichées.')).toBeInTheDocument();
  });
  it('renders the loading page with skeleton panels, then the unavailable wording after a failure', () => {
    const { rerender } = render(<DashboardLoading loading failed={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du tableau de bord…'); expect(document.querySelectorAll('.mairie-skeleton').length).toBeGreaterThan(0);
    rerender(<DashboardLoading loading={false} failed />);
    expect(screen.getByRole('status')).toHaveTextContent('Le tableau de bord est indisponible.'); expect(document.querySelectorAll('.mairie-skeleton')).toHaveLength(0);
  });
});

describe('DashboardGrid', () => {
  const data = {
    userFirstName: 'Alice',
    projects: [{ id: 'p1', title: 'Projet', progress: 10, status: 'review', dueDate: '2026-09-20' }],
    tasks: [{ id: 't1', title: 'Tâche', dueDate: '2026-09-21', priority: 'high', completed: false, projectId: 'p1' }],
    events: [{ id: 1, title: 'Événement', date: '2026-09-22', startTime: '10:00', location: 'Salle' }],
    metrics: { totalProjects: 1 }, sources: { projects: 'available', tasks: 'available', calendar: 'unavailable' },
  } as never;
  it('wires the three panels to the configured fronts and falls back to disabled actions', async () => {
    const user = userEvent.setup(); const { toDashboardModuleData } = await import('@/lib/dashboard-view');
    const hrefs: string[] = []; Object.defineProperty(window, 'location', { value: { set href(value: string) { hrefs.push(value); } }, writable: true });
    render(<DashboardGrid data={data} view={toDashboardModuleData(data)} />);
    expect(screen.getByRole('link', { name: 'Voir les projets' })).toHaveAttribute('href', 'https://project.example/');
    expect(screen.getByRole('button', { name: 'Ouvrir le calendrier' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Tâche/ })); expect(hrefs).toEqual(['https://project.example/?project=p1&task=t1']);
    await user.click(screen.getByRole('button', { name: /^Projet/ })); expect(hrefs[1]).toBe('https://project.example/?project=p1');
    expect(screen.getByRole('status')).toHaveTextContent('Les événements sont temporairement indisponibles.');
  });
});
