import { it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { DashboardPerformancePanel } from './DashboardPerformancePanel';
import { defaultDashboardPerformance as metrics } from '@tests/component/dashboard-fixtures';
it('shows supplied values beside the correct metric labels', async () => { const { container } = render(<DashboardPerformancePanel metrics={metrics} />); for (const metric of metrics) { expect(screen.getByText(metric.label)).toBeVisible(); expect(screen.getByText(String(metric.value))).toBeVisible(); } expect((await axe(container)).violations).toEqual([]); });
