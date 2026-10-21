import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { DashboardUpcomingEvents } from './DashboardUpcomingEvents';
import { defaultDashboardEvents as entries } from '@tests/component/dashboard-fixtures';
it('delegates selection of a received entry and its view-all action', async () => { const onSelect = vi.fn(); const onAll = vi.fn(); const { container, rerender } = render(<DashboardUpcomingEvents events={[entries[0]]} onSelect={onSelect} onOpenCalendar={onAll} />); const user = userEvent.setup(); await user.click(screen.getByRole('button', { name: new RegExp(String(entries[0].title)) })); expect(onSelect).toHaveBeenCalledWith(entries[0]); await user.click(screen.getByRole('button', { name: 'Voir tout' })); expect(onAll).toHaveBeenCalledTimes(1); expect((await axe(container)).violations).toEqual([]); rerender(<DashboardUpcomingEvents events={[]} />); expect(screen.queryByRole('button')).not.toBeInTheDocument(); });
