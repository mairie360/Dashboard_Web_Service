import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { DashboardMetricCards } from './DashboardMetricCards';
import { defaultDashboardMetrics as metrics } from '@tests/component/dashboard-fixtures';
it('shows supplied values beside the correct metric labels', async () => { const { container } = render(<DashboardMetricCards metrics={metrics} />); for (const metric of metrics) { expect(screen.getByText(metric.label)).toBeVisible(); expect(screen.getByText(String(metric.value))).toBeVisible(); } expect((await axe(container)).violations).toEqual([]); });

import { CalendarDays } from 'lucide-react';
import { metricTrend } from './DashboardMetricCards';
it('derives the metric trend from the trend tone', () => {
  const base = { id: 'x', label: 'x', value: 1, tone: 'blue' as const, icon: CalendarDays };
  expect(metricTrend(base)).toBe('none');
  expect(metricTrend({ ...base, trend: '+1', trendTone: 'positive' })).toBe('up');
  expect(metricTrend({ ...base, trend: '-1', trendTone: 'negative' })).toBe('down');
  expect(metricTrend({ ...base, trend: '=', trendTone: 'neutral' })).toBe('none');
});
