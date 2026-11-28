import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import userEvent from '@testing-library/user-event';

import DashboardPanel, { DashboardPanelAction, panelMessages } from './DashboardPanel';

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
    expect(screen.getByRole('region', { name: panelMessages.projects.unavailableTitle })).toHaveAttribute('data-state', 'unavailable');
    rerender(<DashboardPanel title="Projets récents" action="Voir les projets" kind="projects" empty={false} unavailable><p>Lignes</p></DashboardPanel>);
    expect(screen.getByRole('status')).toHaveTextContent(panelMessages.projects.unavailable); expect(screen.getByText('Lignes')).toBeInTheDocument();
  });
  it('MAIR-1255 shows the title alone, without any counter, loaded or loading', async () => {
    const { container, rerender } = render(<DashboardPanel title="Projets récents" action="Voir les projets" href="https://projects.example/" kind="projects" empty={false} unavailable={false}><p>Lignes</p></DashboardPanel>);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Projets récents');
    expect(container.querySelector('.dashboard-panel-indicator')).toBeNull();
    expect(container.textContent).not.toContain('·');
    expect((await axe(container)).violations).toEqual([]);
    rerender(<DashboardPanel title="Projets récents" loading action="Voir les projets" kind="projects" empty={false} unavailable={false}><p>Lignes</p></DashboardPanel>);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Projets récents');
  });
  it('MAIR-1255 keeps the module link of the header as an underlined text link', () => {
    render(<DashboardPanelAction label="Voir les projets" href="https://projects.example/" />);
    const link = screen.getByRole('link', { name: 'Voir les projets' });
    expect(link).toHaveClass('dashboard-panel-action');
    expect(link).toHaveAttribute('data-content', 'text');
  });
  it('renders the action as a disabled button with a reason when the destination is missing', () => {
    render(<DashboardPanelAction label="Ouvrir le calendrier" />);
    expect(screen.getByRole('button', { name: 'Ouvrir le calendrier' })).toHaveAttribute('title', 'Destination temporairement indisponible');
  });

  it('MAIR-1255 separates the panel header from its rows with a divider, as the artifact', () => {
    render(<DashboardPanel title="Mes formations" action="Voir les formations" kind="trainings" empty={false} unavailable={false}><p>Lignes</p></DashboardPanel>);
    const header = screen.getByRole('heading', { name: 'Mes formations' }).closest('header');
    expect(header).toHaveAttribute('data-divider', 'true');
  });
  // MAIR-1255 (design-match, artifact dataState): illustrated empty state with its hint, unavailable state with the
  // module that did not answer and « Réessayer ».
  it('MAIR-1255 shows the empty hint and retries an unavailable tile', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<DashboardPanel title="Mes formations" action="Voir les formations" kind="trainings" empty unavailable={false}><p>Lignes</p></DashboardPanel>);
    expect(screen.getByText('Les formations qui vous sont proposées apparaîtront ici.')).toBeInTheDocument();
    rerender(<DashboardPanel title="Événements à venir" action="Ouvrir le calendrier" kind="events" empty unavailable onRetry={onRetry}><p>Lignes</p></DashboardPanel>);
    expect(screen.getByRole('region', { name: 'Événements indisponibles.' })).toHaveTextContent('Le calendrier ne répond pas.');
    await userEvent.click(screen.getByRole('button', { name: /Réessayer/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
