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
    expect(screen.getByText('20 oct')).toBeInTheDocument(); expect(screen.getByText('14:00')).toBeInTheDocument();
  });
});
