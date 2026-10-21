import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { DashboardMetricCards } from '@/components/dashboard';
import { defaultDashboardMetrics as metrics } from './dashboard-fixtures';
it('shows supplied values beside the correct metric labels', async () => { const { container } = render(<DashboardMetricCards metrics={metrics} />); for (const metric of metrics) { expect(screen.getByText(metric.label)).toBeVisible(); expect(screen.getByText(String(metric.value))).toBeVisible(); } expect((await axe(container)).violations).toEqual([]); });
