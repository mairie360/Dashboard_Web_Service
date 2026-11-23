import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TrainingRow, trainingModuleLabel, trainingStatusBadge } from '.';

const training = { id: 'training-4', title: 'Accueil du public', status: 'in-progress' as const, completedModules: 2, totalModules: 5, progress: 40 };

describe('TrainingRow (MAIR-1110)', () => {
  it('shows the title, the status pill, the current module and the progress, and delegates selection', async () => {
    const onSelect = vi.fn();
    render(<TrainingRow training={training} onSelect={onSelect} />);
    expect(screen.getByText('Accueil du public')).toBeInTheDocument();
    expect(screen.getByText('En cours')).toBeInTheDocument();
    expect(screen.getByText('Module 3 sur 5')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
    expect(document.querySelector('.dashboard-training-progress')).not.toBeNull();
    await userEvent.setup().click(screen.getByRole('button', { name: /Accueil du public/ }));
    expect(onSelect).toHaveBeenCalledWith(training);
  });

  it('labels the module and status of every case', () => {
    expect(trainingModuleLabel({ completedModules: 0, totalModules: 3 })).toBe('Module 1 sur 3');
    expect(trainingModuleLabel({ completedModules: 3, totalModules: 3 })).toBe('Module 3 sur 3');
    expect(trainingModuleLabel({ completedModules: 0, totalModules: 0 })).toBe('Aucun module');
    // MAIR-1110: the due date follows the module when the training has one.
    expect(trainingModuleLabel({ completedModules: 1, totalModules: 4, dueLabel: '15 déc. 2026' })).toBe('Module 2 sur 4 · avant le 15 déc. 2026');
    expect(trainingModuleLabel({ completedModules: 0, totalModules: 0, dueLabel: '15 déc. 2026' })).toBe('Aucun module · avant le 15 déc. 2026');
    expect(trainingStatusBadge).toEqual({ todo: 'todo', 'in-progress': 'inprogress', done: 'done' });
    render(<TrainingRow training={{ ...training, status: 'done', progress: 140 }} />);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});
