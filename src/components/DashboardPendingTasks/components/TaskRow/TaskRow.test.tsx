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
    expect(screen.getByText("Échéance : Aujourd'hui")).toBeInTheDocument();
    await user.click(row); expect(onSelect).toHaveBeenCalledWith(defaultDashboardTasks[0]);
  });

  it('MAIR-1255 shows the priority pill with its leading dot and the relative deadline, as the artifact', () => {
    render(<TaskRow task={{ id: 'p:t', title: 'Répondre à la préfecture', dueLabel: 'Demain', priority: 'medium' }} />);
    const pill = screen.getByText('Moyenne');
    expect(pill).toHaveAttribute('data-priority', 'medium');
    expect(pill.querySelector(':scope > span[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByText('Échéance : Demain')).toBeInTheDocument();
  });
});
