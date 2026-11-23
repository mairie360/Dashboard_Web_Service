import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

import { DashboardRowSkeleton, DashboardRowSkeletons } from './DashboardRowSkeleton';

describe('DashboardRowSkeleton (MAIR-899)', () => {
  it('draws the box of each compact row, hidden from assistive technology', () => {
    const { container } = render(<><DashboardRowSkeleton kind="project" /><DashboardRowSkeleton kind="task" /><DashboardRowSkeleton kind="event" /></>);
    const rows = [...container.querySelectorAll('[data-skeleton]')];
    expect(rows.map((row) => row.getAttribute('data-skeleton'))).toEqual(['project', 'task', 'event']);
    for (const row of rows) { expect(row.getAttribute('aria-hidden')).toBe('true'); expect(row.className).toContain('dashboard-row'); }
    expect(rows[2].querySelector('.dashboard-event-date')).not.toBeNull();
    expect(rows[0].querySelector('.dashboard-event-date')).toBeNull();
  });

  it('renders three rows by default', () => {
    const { container } = render(<DashboardRowSkeletons kind="task" />);
    expect(container.querySelectorAll('[data-skeleton="task"]')).toHaveLength(3);
  });
});
