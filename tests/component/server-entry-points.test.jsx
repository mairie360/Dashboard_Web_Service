import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useInstanceRole, useInstanceTimeZone } from '@mairie360/lib-components/react';

const request = vi.hoisted(() => ({ cookies: {} }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: name => request.cookies[name] === undefined ? undefined : { value: request.cookies[name] } }) }));
vi.mock('next/font/google', () => ({ Geist: options => ({ variable: options.variable }), Geist_Mono: options => ({ variable: options.variable }) }));
vi.mock('@/app/globals.css', () => ({}));
vi.mock('@mairie360/lib-components/styles.css', () => ({}));
import RootLayout from '@/app/layout';
import DashboardPanel from '@/components/dashboard-panel';
import { frontUrl, setBrowserFrontUrls } from '@/lib/front-urls';

function InstanceContent() {
  return <p>{useInstanceRole()} {useInstanceTimeZone()} <a href={frontUrl('PROJECT_FRONT_URL')}>Projects</a></p>;
}
beforeEach(() => { request.cookies = {}; vi.stubEnv('PROJECT_FRONT_URL', 'https://projects.mairie.test/work/'); vi.stubEnv('INSTANCE_TIMEZONE', 'Indian/Reunion'); });
afterEach(() => { vi.unstubAllEnvs(); setBrowserFrontUrls({}); });
it('the server layout derives the initial display role and runtime URLs without a network request', async () => {
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('display role must not use a network request'); }));
  let html = renderToStaticMarkup(await RootLayout({ children: <InstanceContent /> }));
  expect(html).toContain('Guest Indian/Reunion');
  expect(html).toContain('href="https://projects.mairie.test/work/"');
  expect(html).toContain('data-theme="system"');
  request.cookies.accessToken = 'e30.' + Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + 600, role: 'Admin' })).toString('base64url') + '.signature';
  request.cookies.mairie360_appearance = encodeURIComponent(JSON.stringify({ v: 1, theme: 'dark', density: 'compact', font_family: 'Arial' }));
  html = renderToStaticMarkup(await RootLayout({ children: <InstanceContent /> }));
  expect(html).toContain('Admin Indian/Reunion');
  expect(html).toContain('data-theme="dark"');
  expect(html).toContain('data-density="compact"');
  expect(html).not.toContain(request.cookies.accessToken);
  expect(fetch).not.toHaveBeenCalled();
});
it.each([
  ['projects', 'Aucun projet récent.', 'Les projets sont temporairement indisponibles.'],
  ['tasks', 'Aucune tâche en attente.', 'Les tâches sont temporairement indisponibles.'],
  ['events', 'Aucun événement à venir.', 'Les événements sont temporairement indisponibles.'],
])('a %s panel distinguishes confirmed empty data, unavailable data and retained records', (kind, emptyMessage, unavailableMessage) => {
  const { rerender } = render(<DashboardPanel title="Source" action="Ouvrir" kind={kind} empty unavailable={false}>Retained record</DashboardPanel>);
  expect(screen.getByText(emptyMessage)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Ouvrir' }).disabled).toBe(true);
  expect(screen.queryByText('Retained record')).toBeNull();
  rerender(<DashboardPanel title="Source" action="Ouvrir" kind={kind} empty unavailable>Retained record</DashboardPanel>);
  expect(screen.getByText(unavailableMessage)).toBeTruthy();
  rerender(<DashboardPanel title="Source" action="Ouvrir" href="/confirmed" kind={kind} empty={false} unavailable>Retained record</DashboardPanel>);
  expect(screen.getByText(unavailableMessage)).toBeTruthy();
  expect(screen.getByText('Retained record')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Ouvrir' }).getAttribute('href')).toBe('/confirmed');
});
