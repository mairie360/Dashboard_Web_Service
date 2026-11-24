import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';

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
    expect(screen.getByRole('region', { name: panelMessages.projects.unavailable })).toHaveAttribute('data-state', 'unavailable');
    rerender(<DashboardPanel title="Projets récents" action="Voir les projets" kind="projects" empty={false} unavailable><p>Lignes</p></DashboardPanel>);
    expect(screen.getByRole('status')).toHaveTextContent(panelMessages.projects.unavailable); expect(screen.getByText('Lignes')).toBeInTheDocument();
  });
  it('MAIR-1177 shows the indicator after the title in a caption, and the title alone without it or while loading', async () => {
    const { container, rerender } = render(<DashboardPanel title="Projets récents" indicator="12 projets" action="Voir les projets" kind="projects" empty={false} unavailable={false}><p>Lignes</p></DashboardPanel>);
    // jsdom has no layout: its accessible name joins the title and the caption without the space a browser keeps.
    const heading = screen.getByRole('heading', { name: /^Projets récents ?· 12 projets$/ });
    expect(heading.textContent).toBe('Projets récents · 12 projets');
    expect(screen.getByRole('region', { name: /^Projets récents ?· 12 projets$/ })).toBeInTheDocument();
    expect(within(heading).getByText('Projets récents', { exact: true })).toHaveClass('dashboard-panel-title');
    expect(heading.querySelector('.dashboard-panel-indicator')).toHaveTextContent('· 12 projets');
    expect((await axe(container)).violations).toEqual([]);
    for (const indicator of [null, undefined, '']) {
      rerender(<DashboardPanel title="Projets récents" indicator={indicator} action="Voir les projets" kind="projects" empty={false} unavailable={false}><p>Lignes</p></DashboardPanel>);
      expect(screen.getByRole('heading').textContent).toBe('Projets récents');
    }
    rerender(<DashboardPanel title="Projets récents" indicator="12 projets" loading action="Voir les projets" kind="projects" empty={false} unavailable={false}><p>Lignes</p></DashboardPanel>);
    expect(screen.getByRole('heading').textContent).toBe('Projets récents');
  });
  it('renders the action as a disabled button with a reason when the destination is missing', () => {
    render(<DashboardPanelAction label="Ouvrir le calendrier" />);
    expect(screen.getByRole('button', { name: 'Ouvrir le calendrier' })).toHaveAttribute('title', 'Destination temporairement indisponible');
  });
});
