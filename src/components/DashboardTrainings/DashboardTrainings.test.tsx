import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DashboardTrainings } from './DashboardTrainings';

const trainings = [
  { id: 'training-1', title: 'Accueil du public', status: 'in-progress' as const, completedModules: 1, totalModules: 4, progress: 25 },
  { id: 'training-2', title: 'RGPD', status: 'todo' as const, completedModules: 0, totalModules: 2, progress: 0 },
];

describe('DashboardTrainings (MAIR-1110)', () => {
  it('lists the trainings, delegates selection and the view-all action', async () => {
    const onSelect = vi.fn(); const onViewAll = vi.fn(); const user = userEvent.setup();
    render(<DashboardTrainings trainings={trainings} onSelect={onSelect} onViewAll={onViewAll} />);
    expect(screen.getByRole('heading', { name: 'Mes formations' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /RGPD/ }));
    expect(onSelect).toHaveBeenCalledWith(trainings[1]);
    await user.click(screen.getByRole('button', { name: 'Voir tout' }));
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state, and three skeleton rows while loading', () => {
    const { rerender, container } = render(<DashboardTrainings trainings={[]} />);
    expect(screen.getByText('Aucune formation en cours.')).toBeInTheDocument();
    rerender(<DashboardTrainings bare loading />);
    expect(container.querySelectorAll('[data-skeleton]')).toHaveLength(3);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });
});
