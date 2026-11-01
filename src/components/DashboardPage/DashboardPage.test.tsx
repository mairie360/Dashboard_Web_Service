import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import DashboardPage from './DashboardPage';

vi.mock('@/lib/front-urls', () => ({ frontUrl: vi.fn(() => undefined) }));
vi.mock('@/lib/bff-client', () => ({ bffDashboard: { getDashboardBootstrap: vi.fn(() => new Promise(() => {})) } }));

describe('DashboardPage', () => {
  it('renders the loading page while the bootstrap is pending', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du tableau de bord…');
  });
});
