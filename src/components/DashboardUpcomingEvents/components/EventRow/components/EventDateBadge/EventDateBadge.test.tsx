import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import { EventDateBadge } from './EventDateBadge';
import { eventDateParts } from './event-date';

describe('EventDateBadge', () => {
  it('MAIR-1255 formats the start as the day without leading zero, the lowercase abbreviated month and the 24 h time', () => {
    expect(eventDateParts('2026-10-20T14:00:00')).toEqual({ day: '20', month: 'oct.', time: '14:00' });
    expect(eventDateParts('2026-12-04T09:30:00')).toEqual({ day: '4', month: 'déc.', time: '09:30' });
    expect(eventDateParts('2027-01-09T18:30:00')).toEqual({ day: '9', month: 'janv.', time: '18:30' });
    render(<EventDateBadge startsAt="2026-12-04T09:30:00" />);
    // Day over the month; the time moves to the row.
    expect(screen.getByText('4')).toBeInTheDocument(); expect(screen.queryByText('04')).toBeNull();
    const month = screen.getByText('déc.');
    expect(month).toHaveClass('dashboard-event-month'); expect(month).not.toHaveClass('uppercase');
    expect(screen.queryByText('09:30')).toBeNull();
    expect(document.querySelector('.dashboard-event-date')).not.toBeNull();
  });
});
