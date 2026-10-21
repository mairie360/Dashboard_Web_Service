import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import Home from '@/components/DashboardPage';

const getDashboardBootstrap = vi.hoisted(() => vi.fn());
vi.mock('@/lib/bff-client', () => ({ bffDashboard: { getDashboardBootstrap } }));
const bootstrap = (name = 'Confirmed') => ({ userFirstName: name, projects: [], tasks: [], events: [], metrics: { totalProjects: 0 }, sources: { projects: 'available', tasks: 'available', calendar: 'available' } });
beforeEach(() => { getDashboardBootstrap.mockReset().mockResolvedValue({ data: bootstrap() }); });

it('renders confirmed cards immediately without repeating the initial bootstrap in StrictMode', async () => {
  render(<StrictMode><Home initialData={bootstrap()} /></StrictMode>);
  expect(screen.getByText('Bienvenue Confirmed, voici un aperçu de vos activités')).toBeTruthy();
  expect(screen.getByText('Aucun projet récent.')).toBeTruthy();
  expect(getDashboardBootstrap).not.toHaveBeenCalled();
  getDashboardBootstrap.mockResolvedValueOnce({ data: bootstrap('Fresh') });
  await act(async () => fireEvent.focus(window));
  await screen.findByText('Bienvenue Fresh, voici un aperçu de vos activités');
  expect(getDashboardBootstrap).toHaveBeenCalledOnce();
});

it('retries through the existing same-origin transport when the server seed is missing', async () => {
  render(<Home initialData={null} />);
  await waitFor(() => expect(screen.getByText('Aucun projet récent.')).toBeTruthy());
  expect(getDashboardBootstrap).toHaveBeenCalledOnce();
});
