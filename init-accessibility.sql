-- Data of the RGAA states of rgaa.yaml (MAIR-316), run by the seeder-a11y service of
-- docker-compose-accessibility.yml only, after init-test.sql (user 2). The ZAP / k6 stacks keep
-- the minimal seed. Schema: ghcr.io/mairie360/liquibase-migrations:1.3.0 (projects, tasks,
-- task_assignees, project_members, events). Ids start at 9100 so that they never clash with
-- init-test.sql nor with rows the APIs create through their sequences.
\set ON_ERROR_STOP on

-- User 3: same role as user 2 but no project, task or event (empty dashboard state).
INSERT INTO users (id, first_name, last_name, email, password, status)
VALUES (3, 'Rgaa', 'Empty', 'rgaa-empty@mairie360.fr', 'dummy', 'active')
ON CONFLICT (id) DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT 3, r.id FROM roles r WHERE lower(r.name) = 'user'
ON CONFLICT DO NOTHING;

-- Projects owned by user 2 (Project API shows a "User" its own projects and the ones it is a
-- member of). Fixed due dates: the dashboard only formats them.
INSERT INTO projects (id, title, description, status, owner_id, responsible_id, priority, due_date, created_at)
VALUES
  (9101, 'Rénovation de la salle des fêtes', 'Travaux de mise aux normes de la salle des fêtes.', 'active', 2, 2, 'high', DATE '2026-06-30', TIMESTAMP '2026-01-05 09:00:00'),
  (9102, 'Fleurissement du centre-bourg', 'Plantations du printemps dans le centre-bourg.', 'active', 2, 2, 'medium', DATE '2026-04-15', TIMESTAMP '2026-01-04 09:00:00'),
  (9103, 'Bulletin municipal de janvier', 'Rédaction et diffusion du bulletin municipal.', 'completed', 2, 2, 'low', DATE '2026-01-10', TIMESTAMP '2026-01-03 09:00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO project_members (project_id, user_id)
VALUES (9101, 2), (9102, 2), (9103, 2)
ON CONFLICT DO NOTHING;

-- Tasks: the dashboard lists the open ones (status other than completed) of the recent projects.
INSERT INTO tasks (id, project_id, title, status, priority, due_date, assigned_to)
VALUES
  (9201, 9101, 'Demander les devis d''électricité', 'todo', 'high', TIMESTAMP '2026-02-10 12:00:00', 2),
  (9202, 9101, 'Planifier la visite de sécurité', 'in_progress', 'medium', TIMESTAMP '2026-03-02 12:00:00', 2),
  (9203, 9101, 'Valider le cahier des charges', 'completed', 'medium', TIMESTAMP '2026-01-12 12:00:00', 2),
  (9204, 9102, 'Commander les plants', 'todo', 'low', NULL, 2),
  (9205, 9103, 'Relire le bulletin', 'completed', 'low', TIMESTAMP '2026-01-08 12:00:00', 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO task_assignees (task_id, user_id)
VALUES (9201, 2), (9202, 2), (9203, 2), (9204, 2), (9205, 2)
ON CONFLICT DO NOTHING;

-- Events of user 2. BFF_Dashboard asks BFF Calendar for the events between today and today + 30
-- days with the real server clock, so these dates are relative to the day of the run (a fixed date
-- would leave the card empty once passed). Times are fixed.
INSERT INTO events (id, name, description, start_date, end_date, created_by, owner_id, visibility, category, location)
VALUES
  (9301, 'Conseil municipal', 'Séance ordinaire du conseil municipal.',
   (CURRENT_DATE + 3) + TIME '18:00', (CURRENT_DATE + 3) + TIME '20:00', 2, 2, 'public', 'meeting', 'Salle du conseil'),
  (9302, 'Marché de producteurs', 'Marché mensuel des producteurs locaux.',
   (CURRENT_DATE + 10) + TIME '08:00', (CURRENT_DATE + 10) + TIME '13:00', 2, 2, 'public', 'activity', 'Place de la mairie'),
  (9303, 'Cérémonie des vœux', 'Vœux du maire aux habitants.',
   (CURRENT_DATE + 20) + TIME '11:00', (CURRENT_DATE + 20) + TIME '12:30', 2, 2, 'public', 'ceremony', 'Salle des fêtes')
ON CONFLICT (id) DO NOTHING;
-- BFF Calendar only keeps the events the caller is a member of (is_member of Calendar API).
INSERT INTO event_members (event_id, user_id, validation_status)
VALUES (9301, 2, 'validated'), (9302, 2, 'validated'), (9303, 2, 'validated')
ON CONFLICT DO NOTHING;
