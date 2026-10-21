import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DashboardNotices, reloadLabel } from './DashboardNotices';

describe('DashboardNotices', () => {
  it('announces errors and degraded sources and offers the one recovery action named by severity', async () => {
    const user = userEvent.setup(); const onReload = vi.fn();
    expect(reloadLabel({ error: 'x', unusableEventCount: 2 })).toBe('Réessayer le chargement');
    expect(reloadLabel({ error: '', unusableEventCount: 2 })).toBe('Actualiser les dates illisibles');
    expect(reloadLabel({ error: '', unusableEventCount: 0 })).toBe('Actualiser les données indisponibles');
    const { rerender } = render(<DashboardNotices error="" logoutError="" loading={false} hasUnavailableSource={false} unusableEventCount={0} hasData onReload={onReload} />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<DashboardNotices error="" logoutError="" loading={false} hasUnavailableSource unusableEventCount={0} hasData onReload={onReload} />);
    expect(screen.getByRole('status')).toHaveTextContent('Certaines données sont temporairement indisponibles.');
    await user.click(screen.getByRole('button', { name: 'Actualiser les données indisponibles' })); expect(onReload).toHaveBeenCalledTimes(1);
    rerender(<DashboardNotices error="BFF injoignable" logoutError="La déconnexion est temporairement indisponible." loading hasUnavailableSource={false} unusableEventCount={0} hasData onReload={onReload} />);
    expect(screen.getAllByRole('alert').map((node) => node.textContent)).toEqual(['La déconnexion est temporairement indisponible.', 'BFF injoignable']);
    expect(screen.getByRole('button', { name: 'Réessayer le chargement' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Les dernières données reçues restent affichées.')).toBeInTheDocument();
  });
});
