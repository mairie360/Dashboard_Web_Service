import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import { ProjectRow } from './ProjectRow';
import { clampProgress, projectStatusBadge } from './project-status';
import { defaultDashboardProjects } from '@tests/component/dashboard-fixtures';

describe('ProjectRow (MAIR-608)', () => {
  it('shows the name, the shared status pill, the deadline and a clamped progress meter, and delegates selection', async () => {
    const user = userEvent.setup(); const onSelect = vi.fn();
    const { container, rerender } = render(<ProjectRow project={{ ...defaultDashboardProjects[0], progress: 140 }} onSelect={onSelect} />);
    const row = screen.getByRole('button', { name: /Rénovation bibliothèque/ });
    expect(row).toHaveAttribute('data-project-status', 'in-progress');
    expect(screen.getByText('En cours')).toHaveAttribute('data-status', 'inprogress');
    expect(screen.getByText('Échéance: 15 Nov 2024')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Progression' })).toHaveAttribute('aria-valuenow', '100');
    await user.click(row); expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'library' }));
    expect((await axe(container)).violations).toEqual([]);
    rerender(<ProjectRow project={defaultDashboardProjects[2]} />);
    expect(screen.getByRole('button')).toBeDisabled(); expect(screen.getByText('Terminé')).toHaveAttribute('data-status', 'done');
    expect(screen.getByRole('progressbar').parentElement).toHaveAttribute('data-tone', 'success');
  });
  it('maps every dashboard status to a shared status and clamps progress', () => {
    expect(projectStatusBadge).toEqual({ 'in-progress': 'inprogress', completed: 'done', paused: 'draft' });
    expect([clampProgress(-5), clampProgress(42.4), clampProgress(Number.NaN)]).toEqual([0, 42.4, 0]);
  });
});
