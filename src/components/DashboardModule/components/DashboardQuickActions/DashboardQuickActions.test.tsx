import { it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { DashboardQuickActions } from './DashboardQuickActions';
import { defaultDashboardQuickActions as actions } from '@tests/component/dashboard-fixtures';
it('delegates available actions and keeps disabled actions unavailable', async () => {
  const onAction = vi.fn(); const { container } = render(<DashboardQuickActions actions={[actions[0], { ...actions[1], disabled: true }]} onAction={onAction} />);
  await userEvent.click(screen.getByRole('button', { name: actions[0].label })); expect(onAction).toHaveBeenCalledWith(actions[0].id); expect(screen.getByRole('button', { name: actions[1].label })).toBeDisabled(); expect((await axe(container)).violations).toEqual([]);
});
