import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import { DashboardLoading } from './DashboardLoading';

describe('DashboardLoading', () => {
  it('announces the loading to screen readers only, then the unavailable wording after a failure (MAIR-899)', () => {
    const { rerender } = render(<DashboardLoading loading failed={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du tableau de bord…'); expect(screen.getByRole('status')).toHaveClass('sr-only');
    rerender(<DashboardLoading loading={false} failed />);
    expect(screen.getByRole('status')).toHaveTextContent('Le tableau de bord est indisponible.'); expect(screen.getByRole('status')).not.toHaveClass('sr-only');
  });
});
