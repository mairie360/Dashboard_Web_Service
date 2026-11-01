import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PanelViewAll } from './PanelViewAll';

describe('PanelViewAll', () => {
  it('offers the "Voir tout" action and delegates it', async () => {
    const user = userEvent.setup(); const onViewAll = vi.fn();
    render(<PanelViewAll onClick={onViewAll} />);
    await user.click(screen.getByRole('button', { name: 'Voir tout' }));
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });
});
