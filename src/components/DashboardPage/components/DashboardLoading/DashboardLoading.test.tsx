import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import { DashboardLoading } from './DashboardLoading';

describe('DashboardLoading', () => {
  it('announces the loading to screen readers only (MAIR-899), then the error DataState after a failure (MAIR-915)', () => {
    const { rerender } = render(<DashboardLoading loading failed={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du tableau de bord…'); expect(screen.getByRole('status')).toHaveClass('sr-only');
    rerender(<DashboardLoading loading={false} failed />);
    expect(screen.queryByRole('status')).toBeNull();
    const state = screen.getByRole('region', { name: 'Le tableau de bord est indisponible.' });
    expect(state).toHaveAttribute('data-state', 'error');
    expect(state).toHaveTextContent('Le tableau de bord est indisponible.');
    expect(state).toHaveTextContent("Vos projets, tâches et événements s'afficheront dès que le service répondra.");
    expect(state.parentElement?.closest('section')).toHaveClass('dashboard-failure');
  });
});
