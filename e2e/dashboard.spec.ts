import { expect, test } from '@playwright/test';
import { cookieHeader, mintAccessToken, signInAs, users } from './support/session';

// Critical journeys of the Dashboard front (MAIR-603), on the real stack of docker-compose-e2e.yml
// (BFF Dashboard, Core, Project and Calendar APIs, seeded database): the widgets of an agent show
// their own project and task, an agent outside that project does not see them, and a forged
// session is refused. The texts asserted are the French ones displayed on screen.

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
  const project = await api.post('/api/v1/projects/', { data: { name: projectName, description: 'Projet du parcours de bout en bout.' } });
  expect(project.ok(), await project.text()).toBeTruthy();
  const { project_id: projectId } = await project.json();
  const due = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString();
  const task = await api.post(`/api/v1/projects/${projectId}/tasks/`, {
    data: { name: taskName, assigned_to: Number(users.manager.id), due_date: due, fields: [] },
  });
  expect(task.ok(), await task.text()).toBeTruthy();
  await api.dispose();
});

test('the widgets show the agent’s own project and pending task', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL!, users.manager);
  await page.goto('/');

  await expect(page.getByText(/Bienvenue Perf, voici un aperçu de vos activités/)).toBeVisible();
  for (const title of ['Projets récents', 'Tâches en attente', 'Événements à venir']) {
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByRole('button', { name: new RegExp(projectName) })).toBeVisible();
  await expect(page.getByText(taskName)).toBeVisible();
  await expect(page.getByText('Certaines données sont temporairement indisponibles.')).toHaveCount(0);
});

test('an agent outside the project does not see it in their widgets', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL!, users.member);
  await page.goto('/');

  await expect(page.getByText(/Bienvenue Membre, voici un aperçu de vos activités/)).toBeVisible();
  await expect(page.getByText('Projets récents', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(projectName) })).toHaveCount(0);
  await expect(page.getByText(taskName)).toHaveCount(0);
});

test('a forged session is refused by the BFF', async ({ request }) => {
  // Signed with another secret: the front relays it, BFF Dashboard must refuse it.
  const [header, payload] = mintAccessToken(users.manager).split('.');
  const response = await request.get('/dashboard/bootstrap', {
    headers: { Cookie: `accessToken=${header}.${payload}.c2lnbmF0dXJlLWZvcmdlZQ`, Accept: 'application/json' },
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
