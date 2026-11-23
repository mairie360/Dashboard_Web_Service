import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render } from '@testing-library/react';

import DashboardPage, { dashboardSidebarItems, unreadBadge } from './DashboardPage';
import { pageStatus } from '../../../tests/component/page-roles';

vi.mock('@/lib/front-urls', () => ({ frontUrl: vi.fn(() => undefined) }));
vi.mock('@/lib/bff-client', () => ({ bffDashboard: { getDashboardBootstrap: vi.fn(() => new Promise(() => {})) } }));

describe('DashboardPage', () => {
  it('renders the loading page while the bootstrap is pending', () => {
    render(<DashboardPage />);
    expect(pageStatus()).toHaveTextContent('Chargement du tableau de bord…');
  });

  it('MAIR-1106: shows the unread count on « Messagerie », « 99+ » beyond, nothing at 0 or without Message API', () => {
    expect([12, 0, null, undefined, 100, -1, 1.5].map(unreadBadge)).toEqual(['12', undefined, undefined, undefined, '99+', undefined, undefined]);
    const items = dashboardSidebarItems(5);
    expect(items.find((item) => item.id === 'messages')?.badge).toBe('5');
    expect(items.find((item) => item.id === 'training')?.label).toBe('E-learning');
    expect(dashboardSidebarItems(0).find((item) => item.id === 'messages')).not.toHaveProperty('badge');
  });
});
