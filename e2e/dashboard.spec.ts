import { generateKeyPairSync, sign } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { cookieHeader, mintAccessToken, signInAs, users } from './support/session';

// Critical journeys of the Dashboard front (MAIR-603), on the real stack of docker-compose-e2e.yml
// (BFF Dashboard, Core, Project and Calendar APIs, seeded database): a fresh agent goes through the
// welcome tour once, the widgets of an agent show their own project and task, an agent outside that
// project does not see them, and a forged session is refused. The texts asserted are the French ones displayed on screen.

const PROJECT_API = process.env.E2E_PROJECT_API_URL ?? 'http://localhost:3001';
const stamp = Date.now().toString(36);
const projectName = `Projet E2E ${stamp}`;
const taskName = `Tâche E2E ${stamp}`;

test.beforeAll(async ({ playwright }) => {
  // The dashboard only reads: its data is created in Project API, as the Projects front would.
  const api = await playwright.request.newContext({
    baseURL: PROJECT_API,
    extraHTTPHeaders: { Authorization: `Bearer ${mintAccessToken(users.manager)}`, Accept: 'application/json' },
  });
  const project = await api.post('/api/v1/projects/', { data: { name: projectName, description: 'Projet du parcours de bout en bout.', group_id: 1 } });
  expect(project.ok(), await project.text()).toBeTruthy();
  const { project_id: projectId } = await project.json();
  const due = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString();
  const task = await api.post(`/api/v1/projects/${projectId}/tasks/`, {
    data: { name: taskName, assigned_to: Number(users.manager.id), due_date: due, fields: [] },
  });
  expect(task.ok(), await task.text()).toBeTruthy();
  await api.dispose();
});

test('mair_1176 the first visit shows the welcome tour once, then never again', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL!, users.manager);
  await page.goto('/');

  // A fresh account has not done the tour: the five slides open over the dashboard.
  const tour = page.getByRole('dialog');
  await expect(tour.getByRole('heading', { name: 'Bienvenue dans Mairie360' })).toBeVisible();
  await expect(tour).toContainText('1 sur 5');
  for (const title of ['Tableau de bord', 'Projets et calendrier', 'Restez informé', 'Formez-vous à votre rythme']) {
    await tour.getByRole('button', { name: 'Suivant' }).click();
    await expect(tour.getByRole('heading', { name: title })).toBeVisible();
  }
  await expect(tour).toContainText('5 sur 5');
  const recorded = page.waitForResponse((response) => response.url().endsWith('/dashboard/onboarding') && response.request().method() === 'PUT');
  await tour.getByRole('button', { name: 'Commencer' }).click();
  expect((await recorded).status()).toBe(204);

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText(/Bon(?:jour|soir) Perf/)).toBeVisible();

  // Done is remembered by the server: the next visit opens the dashboard alone.
  await page.reload();
  await expect(page.getByText(/Bon(?:jour|soir) Perf/)).toBeVisible();
  await expect(page.getByText('Projets récents', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('the widgets show the agent’s own project and pending task', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL!, users.manager);
  await page.goto('/');

  await expect(page.getByText(/Bon(?:jour|soir) Perf/)).toBeVisible();
  for (const title of ['Projets récents', 'Tâches en attente', 'Événements à venir']) {
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByRole('button', { name: new RegExp(projectName) })).toBeVisible();
  await expect(page.getByText(taskName)).toBeVisible();
  await expect(page.getByText('Certaines données sont temporairement indisponibles.')).toHaveCount(0);
});

test('MAIR-1177 the tile headers show the projects count and the events of the current month', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL!, users.manager);
  await page.goto('/');

  // The month the BFF counts is the current one of the Europe/Paris calendar, named in French.
  const month = new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'Europe/Paris' }).format(new Date());
  // beforeAll created a project the agent sees: at least one, so the count is shown.
  const projects = page.getByRole('heading', { name: /^Projets récents\s*· \d+ projets?$/ });
  await expect(projects).toBeVisible();
  await expect(projects).toHaveText(/^Projets récents · \d+ projets?$/);
  const events = page.getByRole('heading', { name: new RegExp(`^Événements à venir\\s*· \\d+ en ${month}$`) });
  await expect(events).toBeVisible();
  await expect(events).toHaveText(new RegExp(`^Événements à venir · \\d+ en ${month}$`));
  await expect(page.getByRole('heading', { name: /^Tâches en attente$/ })).toBeVisible();
});

test('an agent outside the project does not see it in their widgets', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL!, users.member);
  await page.goto('/');

  await expect(page.getByText(/Bon(?:jour|soir) Membre/)).toBeVisible();
  await expect(page.getByText('Projets récents', { exact: true }).first()).toBeVisible();
  // The widgets must have loaded the member's data (none of their own: the empty states), or the
  // negative checks below would also pass on a page whose sources failed or are still loading.
  await expect(page.getByText('Aucun projet récent.', { exact: true })).toBeVisible();
  await expect(page.getByText('Aucune tâche en attente.', { exact: true })).toBeVisible();
  await expect(page.getByText('Certaines données sont temporairement indisponibles.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: new RegExp(projectName) })).toHaveCount(0);
  await expect(page.getByText(taskName)).toHaveCount(0);
});

test('a forged session is refused by the BFF', async ({ request }) => {
  // Core's `kid` and claims, but signed with another Ed25519 key: the front relays it, BFF Dashboard
  // must refuse it.
  const [header, payload] = mintAccessToken(users.manager).split('.');
  const { privateKey } = generateKeyPairSync('ed25519');
  const signature = sign(null, Buffer.from(`${header}.${payload}`), privateKey).toString('base64url');
  const response = await request.get('/dashboard/bootstrap', {
    headers: { Cookie: `accessToken=${header}.${payload}.${signature}`, Accept: 'application/json' },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(401);
  // The genuine session of the same agent is accepted.
  const genuine = await request.get('/dashboard/bootstrap', {
    headers: { Cookie: cookieHeader(users.manager), Accept: 'application/json' },
    maxRedirects: 0,
  });
  expect(genuine.status()).toBe(200);
});

test('without a session, the dashboard is not served', async ({ request }) => {
  const response = await request.get('/', { maxRedirects: 0 });
  expect(response.status()).toBe(307);
});
