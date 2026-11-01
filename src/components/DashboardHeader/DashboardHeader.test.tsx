import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import { DashboardHeader, dashboardGreeting } from './DashboardHeader';

describe('DashboardHeader', () => {
  it('greets the agent by first name and shows the date', () => {
    expect(dashboardGreeting('  Alice ')).toBe('Bienvenue Alice, voici un aperçu de vos activités'); expect(dashboardGreeting('  ')).toBe('Voici un aperçu de vos activités');
    render(<DashboardHeader userFirstName="Alice" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Tableau de Bord' })).toBeInTheDocument();
    expect(screen.getByText('Bienvenue Alice, voici un aperçu de vos activités')).toBeInTheDocument(); expect(document.querySelector('.page-current-date')).not.toBeNull();
  });
});
