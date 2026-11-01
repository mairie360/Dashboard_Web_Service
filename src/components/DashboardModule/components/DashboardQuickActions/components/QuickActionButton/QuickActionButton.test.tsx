import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarDays } from 'lucide-react';

import { QuickActionButton } from './QuickActionButton';
import { defaultDashboardQuickActions } from '@tests/component/dashboard-fixtures';

describe('QuickActionButton', () => {
  it('dispatches its action id and stays disabled without a handler or when disabled', async () => {
    const user = userEvent.setup(); const onAction = vi.fn();
    const { rerender } = render(<QuickActionButton action={defaultDashboardQuickActions[0]} onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Nouveau document' })); expect(onAction).toHaveBeenCalledWith('new-document');
    rerender(<QuickActionButton action={{ ...defaultDashboardQuickActions[0], disabled: true }} onAction={onAction} />);
    expect(screen.getByRole('button')).toBeDisabled();
    rerender(<QuickActionButton action={{ id: 'view-reports', label: 'Voir rapports', icon: CalendarDays }} />);
    expect(screen.getByRole('button', { name: 'Voir rapports' })).toBeDisabled();
  });
});
