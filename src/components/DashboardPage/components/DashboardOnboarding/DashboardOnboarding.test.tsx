import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DashboardOnboarding } from '.';

const putDashboardOnboarding = vi.fn(async () => ({ data: undefined }));
vi.mock('@/lib/bff-client', () => ({ bffDashboard: { putDashboardOnboarding: () => putDashboardOnboarding() } }));

const SLIDES = ['Bienvenue dans Mairie360', 'Tableau de bord', 'Projets et calendrier', 'Restez informé', 'Formez-vous à votre rythme'];

describe('DashboardOnboarding (MAIR-1176)', () => {
  beforeEach(() => { putDashboardOnboarding.mockClear(); });

  it.each([[true], [null], [undefined]])('mair_1176 shows no tour when the state is %s', (state) => {
    render(<DashboardOnboarding onboardingCompleted={state} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(putDashboardOnboarding).not.toHaveBeenCalled();
  });

  it('mair_1176 walks the five slides with the step counter, then « Commencer » records the tour and closes it', async () => {
    const user = userEvent.setup();
    render(<DashboardOnboarding onboardingCompleted={false} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // Each slide is checked, then « Suivant » leads to the next one; the clicks run one after the other.
    const expectSlide = (index: number) => {
      expect(screen.getByRole('heading', { name: SLIDES[index] })).toBeInTheDocument();
      expect(dialog).toHaveTextContent(`${index + 1} sur 5`);
    };
    await SLIDES.slice(1).reduce(async (previous, _title, index) => {
      await previous;
      expectSlide(index);
      await user.click(screen.getByRole('button', { name: 'Suivant' }));
    }, Promise.resolve());
    expectSlide(SLIDES.length - 1);
    expect(putDashboardOnboarding).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Commencer' }));

    expect(putDashboardOnboarding).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('mair_1176 « Passer » records the tour as done and closes it', async () => {
    const user = userEvent.setup();
    render(<DashboardOnboarding onboardingCompleted={false} />);

    await user.click(screen.getByRole('button', { name: 'Passer' }));

    expect(putDashboardOnboarding).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('mair_1176 Escape skips the tour like « Passer »', async () => {
    const user = userEvent.setup();
    render(<DashboardOnboarding onboardingCompleted={false} />);

    await user.keyboard('{Escape}');

    expect(putDashboardOnboarding).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('mair_1176 a failed recording still closes the tour (it shows again next time)', async () => {
    putDashboardOnboarding.mockRejectedValueOnce(new Error('Le service est momentanément indisponible.'));
    const user = userEvent.setup();
    render(<DashboardOnboarding onboardingCompleted={false} />);

    await user.click(screen.getByRole('button', { name: 'Passer' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(putDashboardOnboarding).toHaveBeenCalledTimes(1);
  });
});
