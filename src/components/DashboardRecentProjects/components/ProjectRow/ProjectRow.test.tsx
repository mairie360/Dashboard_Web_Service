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
    expect(screen.getByText('15 nov. 2024', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Progression' })).toHaveAttribute('aria-valuenow', '100');
    await user.click(row); expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'library' }));
    expect((await axe(container)).violations).toEqual([]);
    rerender(<ProjectRow project={defaultDashboardProjects[2]} />);
    expect(screen.getByRole('button')).toBeDisabled(); expect(screen.getByText('Terminé')).toHaveAttribute('data-status', 'done');
    expect(screen.getByRole('progressbar').parentElement).toHaveAttribute('data-tone', 'success');
  });
  it('MAIR-1255 lays the row out like the reference: name and status pill, then the dated deadline, the full-width track and the percentage on its right', () => {
    const { container } = render(<ProjectRow project={{ ...defaultDashboardProjects[0], dueDate: '15 déc. 2026', progress: 65 }} onSelect={() => undefined} />);
    const [top, bottom] = Array.from(container.querySelectorAll('button > .dashboard-row-line'));
    expect(top.textContent).toContain('Rénovation bibliothèque'); expect(top.textContent).toContain('En cours');
    expect(bottom).toHaveClass('dashboard-row-progress-line');
    const meta = bottom.querySelector('.dashboard-row-meta') as HTMLElement;
    // The deadline: a calendar icon then « 15 déc. 2026 »; « Échéance : » is only read by screen readers.
    expect(meta.querySelector('svg')).not.toBeNull();
    expect(meta.querySelector('.sr-only')).toHaveTextContent('Échéance :');
    expect(meta.textContent).toBe('Échéance : 15 déc. 2026');
    expect(meta.textContent).not.toMatch(/\d{2}\/\d{2}\/\d{4}/);
    // The progress meter follows the deadline, takes the rest of the line and shows « 65 % ».
    const meter = bottom.querySelector('.dashboard-row-progress') as HTMLElement;
    expect(meta.nextElementSibling).toBe(meter);
    expect(meter.querySelector('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '65');
    expect(meter.textContent).toContain('65 %');
  });
  it('maps every dashboard status to a shared status and clamps progress', () => {
    expect(projectStatusBadge).toEqual({ 'in-progress': 'inprogress', completed: 'done', paused: 'draft' });
    expect([clampProgress(-5), clampProgress(42.4), clampProgress(Number.NaN)]).toEqual([0, 42.4, 0]);
  });

  it('MAIR-1255 draws the status pill with its leading dot', () => {
    render(<ProjectRow project={defaultDashboardProjects[0]} />);
    const pill = document.querySelector('[data-m360-component~="StatusPill"]') as HTMLElement;
    expect(pill).not.toBeNull();
    expect(pill.querySelector(':scope > span[aria-hidden="true"]')).not.toBeNull();
  });
});
