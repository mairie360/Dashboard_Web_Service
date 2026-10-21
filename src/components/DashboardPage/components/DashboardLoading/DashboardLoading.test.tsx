import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import { DashboardLoading } from './DashboardLoading';

describe('DashboardLoading', () => {
  it('renders the loading page with skeleton panels, then the unavailable wording after a failure', () => {
    const { rerender } = render(<DashboardLoading loading failed={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du tableau de bord…'); expect(document.querySelectorAll('.mairie-skeleton').length).toBeGreaterThan(0);
    rerender(<DashboardLoading loading={false} failed />);
    expect(screen.getByRole('status')).toHaveTextContent('Le tableau de bord est indisponible.'); expect(document.querySelectorAll('.mairie-skeleton')).toHaveLength(0);
  });
});
