const assert = require('node:assert/strict');
const path = require('node:path');
const { test, describe } = require('node:test');
const { ROOT } = require('./support/load-ts.cjs');
const { bootstrapResponse } = require('./support/fixtures.cjs');
const { OpenApiContract } = require('./support/openapi-contract.ts');
const { toDashboardModuleData, formatDueDate } = require('../src/lib/dashboard-view.ts');

// Mapping de la réponse /dashboard/bootstrap vers DashboardModule, alimenté par des charges valides
// selon contracts/openapi.json (reconstruit du paquet publié @mairie360/bff-dashboard-openapi).

const contract = OpenApiContract.load(path.join(ROOT, 'contracts', 'openapi.json'));
const bootstrapSchema = contract.responseSchema(contract.match('get', '/dashboard/bootstrap'), 200).schema;
const valid = (overrides) => {
  const data = bootstrapResponse(overrides);
  assert.deepEqual(contract.validate(bootstrapSchema, data), [], 'fixture hors contrat');
  return data;
};

describe('toDashboardModuleData', () => {
  test('maps contract fields onto DashboardModule props', () => {
    assert.deepEqual(toDashboardModuleData(valid()), {
      hasUnavailableSource: false,
      projects: [
        { id: 'project-42', name: 'Budget participatif', progress: 50, status: 'in-progress', dueDate: '1 déc. 2026' },
        { id: 'project-7', name: 'Rénovation de la médiathèque', progress: 100, status: 'completed', dueDate: '30 juin 2026' },
      ],
      tasks: [
        { id: 'project-42:task-2', title: 'Validation', dueLabel: '1 nov. 2026', priority: 'high' },
        { id: 'project-7:task-5', title: 'Relecture', dueLabel: 'Sans échéance', priority: 'low' },
      ],
      events: [
        { id: '9', title: 'Conseil municipal', location: 'Mairie', startsAt: '2026-09-18T09:00:00' },
        { id: 'evt-2', title: 'Permanence', location: '', startsAt: '2026-09-20T00:00:00' },
      ],
    });
  });

  test('every contract project status maps to a status supported by the component', () => {
    const statuses = contract.schema('DashboardBootstrapProjectsItemStatus').enum;
    const projects = statuses.map((status, index) => ({ id: `p-${index}`, title: status, progress: 0, status, dueDate: '2026-01-01' }));
    const mapped = toDashboardModuleData(valid({ projects })).projects.map((project) => project.status);
    assert.deepEqual(mapped, statuses.map((status) => (status === 'done' ? 'completed' : 'in-progress')));
  });

  test('flags unavailable sources without inventing records', () => {
    const view = toDashboardModuleData(valid({
      projects: [], tasks: [], events: [],
      metrics: { totalProjects: null },
      sources: { projects: 'unavailable', tasks: 'available', calendar: 'available' },
    }));
    assert.equal(view.hasUnavailableSource, true);
    assert.deepEqual([view.projects, view.tasks, view.events], [[], [], []]);
  });

  test('normalizes DD-MM-YYYY event dates and skips events whose date cannot be displayed', () => {
    const events = [
      { id: 1, title: 'Format BFF Calendar', date: '05-10-2026', startTime: '14:30' },
      { id: 2, title: 'Date illisible', date: 'bientôt' },
      { id: 3, title: 'Heure illisible', date: '2026-10-06', startTime: 'midi' },
    ];
    assert.deepEqual(toDashboardModuleData(valid({ events })).events, [
      { id: '1', title: 'Format BFF Calendar', location: '', startsAt: '2026-10-05T14:30:00' },
    ]);
  });

});

describe('formatDueDate', () => {
  test('formats contract dates in French', () => {
    assert.equal(formatDueDate('2026-12-01'), '1 déc. 2026');
    assert.equal(formatDueDate('05-10-2026'), '5 oct. 2026');
    // Instant ISO 8601 de BFF Project : jour de l'échéance à Paris.
    assert.equal(formatDueDate('2026-03-14T10:00:00.000Z'), '14 mars 2026');
    assert.equal(formatDueDate('2024-12-31T23:59:59Z'), '1 janv. 2025');
  });

  test('keeps a value that is not a date', () => {
    assert.equal(formatDueDate('fin du trimestre'), 'fin du trimestre');
    assert.equal(formatDueDate(''), '');
  });

  test('a blank task due date is shown as having no deadline', () => {
    const tasks = [{ id: 't', title: 'Sans date', dueDate: '  ', priority: 'medium', completed: false, projectId: 'p' }];
    assert.equal(toDashboardModuleData(valid({ tasks })).tasks[0].dueLabel, 'Sans échéance');
  });
});
