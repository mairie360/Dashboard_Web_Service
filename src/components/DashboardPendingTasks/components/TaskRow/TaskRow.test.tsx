import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TaskRow } from './TaskRow';
import { defaultDashboardTasks } from '@tests/component/dashboard-fixtures';

describe('TaskRow', () => {
  it('shows the title, deadline and priority pill and delegates selection', async () => {
    const user = userEvent.setup(); const onSelect = vi.fn();
    render(<TaskRow task={defaultDashboardTasks[0]} onSelect={onSelect} />);
    const row = screen.getByRole('button', { name: /Validation budget formation/ });
    expect(row).toHaveAttribute('data-task-priority', 'high'); expect(screen.getByText('Haute')).toHaveAttribute('data-priority', 'high');
    expect(screen.getByText("Échéance: Aujourd'hui")).toBeInTheDocument();
    await user.click(row); expect(onSelect).toHaveBeenCalledWith(defaultDashboardTasks[0]);
  });
});
