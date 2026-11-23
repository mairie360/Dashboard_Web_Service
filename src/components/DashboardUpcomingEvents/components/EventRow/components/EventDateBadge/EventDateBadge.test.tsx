import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import { EventDateBadge } from './EventDateBadge';
import { eventDateParts } from './event-date';

describe('EventDateBadge', () => {
  it('formats the start as day, short month and 24 h time', () => {
    expect(eventDateParts('2026-10-20T14:00:00')).toEqual({ day: '20', month: 'oct', time: '14:00' });
    render(<EventDateBadge startsAt="2026-10-20T14:00:00" />);
    // MAIR-907: bold day over the short month; the time moves to the row.
    expect(screen.getByText('20')).toBeInTheDocument(); expect(screen.getByText('oct')).toBeInTheDocument(); expect(screen.queryByText('14:00')).toBeNull();
    expect(document.querySelector('.dashboard-event-date')).not.toBeNull();
  });
});
