import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import { PerformanceMetric } from './PerformanceMetric';
import { defaultDashboardPerformance } from '@tests/component/dashboard-fixtures';

describe('PerformanceMetric', () => {
  it('renders a performance indicator with its tone', () => {
    render(<PerformanceMetric metric={defaultDashboardPerformance[2]} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Alertes actives' })).toBeInTheDocument();
    expect(screen.getByText('3')).toHaveAttribute('data-tone', 'warning'); expect(screen.getByText('Nécessitent attention')).toBeInTheDocument();
  });
});
