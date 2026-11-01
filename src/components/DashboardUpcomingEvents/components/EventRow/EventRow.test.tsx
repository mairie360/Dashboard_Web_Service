import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EventRow } from './EventRow';
import { byStart } from '../../event-order';
import { eventDateParts } from './components/EventDateBadge';
import { defaultDashboardEvents } from '@tests/component/dashboard-fixtures';

describe('EventRow', () => {
  it('renders the title and location and delegates selection', async () => {
    const user = userEvent.setup(); const onSelect = vi.fn();
    render(<EventRow event={defaultDashboardEvents[0]} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /Conseil Municipal/ }));
    expect(onSelect).toHaveBeenCalledWith(defaultDashboardEvents[0]); expect(screen.getByText('Salle du conseil')).toBeInTheDocument();
  });
  it('sorts events by start and splits a start into its parts', () => {
    expect(byStart([{ startsAt: '2026-11-02T10:00:00' }, { startsAt: '2026-10-02T10:00:00' }]).map((event) => event.startsAt)).toEqual(['2026-10-02T10:00:00', '2026-11-02T10:00:00']);
    expect(eventDateParts('not a date')).toEqual({ day: '--', month: '---', time: '--:--' });
  });
});
