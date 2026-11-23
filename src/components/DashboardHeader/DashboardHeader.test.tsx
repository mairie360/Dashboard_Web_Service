import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import { DashboardHeader, DASHBOARD_WELCOME_SUBTITLE, dashboardGreeting, instanceHour, salutation } from './DashboardHeader';

describe('DashboardHeader (MAIR-924)', () => {
  it('greets the agent by first name, « Bonsoir » from 18:00 on the instance clock', () => {
    const morning = new Date('2026-11-20T08:00:00Z');
    const evening = new Date('2026-11-20T17:00:00Z'); // 18:00 in Paris
    expect(instanceHour(evening, 'Europe/Paris')).toBe(18);
    expect(salutation(morning, 'Europe/Paris')).toBe('Bonjour');
    expect(salutation(evening, 'Europe/Paris')).toBe('Bonsoir');
    expect(salutation(new Date('2026-11-20T16:59:00Z'), 'Europe/Paris')).toBe('Bonjour');
    expect(dashboardGreeting('  Alice ', morning, 'Europe/Paris')).toBe('Bonjour Alice');
    expect(dashboardGreeting('  ', evening, 'Europe/Paris')).toBe('Bonsoir');
    expect(instanceHour(evening, 'Not/AZone')).toBe(evening.getHours());
  });

  it('renders the greeting as the only h1, its subtitle and no date', () => {
    render(<DashboardHeader userFirstName="Alice" />);
    expect(screen.getByRole('heading', { level: 1, name: /^Bon(?:jour|soir) Alice$/ })).toBeInTheDocument();
    expect(screen.getByText(DASHBOARD_WELCOME_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(/Tableau de bord/i)).toBeNull();
    expect(document.querySelector('.page-current-date')).toBeNull();
    // MAIR-1113: the lib PageHeader « Accueil » variant.
    expect(document.querySelector('header')).toHaveAttribute('data-variant', 'welcome');
  });
});
