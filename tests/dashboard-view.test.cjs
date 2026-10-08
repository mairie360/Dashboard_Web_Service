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
      unusableEventCount: 0,
      projects: [
        { id: 'project-42', name: 'Budget participatif', progress: 50, status: 'in-progress', dueDate: '01/12/2026' },
        { id: 'project-7', name: 'Rénovation de la médiathèque', progress: 100, status: 'completed', dueDate: '30/06/2026' },
      ],
      tasks: [
        { id: 'project-42:task-2', title: 'Validation', dueLabel: '01/11/2026', priority: 'high' },
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
  test('does not invent deadlines from impossible civil dates or ambiguous free text', () => {
    for (const value of ['2026-02-31', '31-02-2026', '2025-02-29', '1900-02-29', '2026-04-31', '2026-00-01',
      '2026-02-31T09:00:00Z', '2026-02-31T09:00:00+02:00', '3', '2026', '02/03/2026', ' 3 ']) {
      assert.equal(formatDueDate(value), value, `Unusable value must remain verbatim: ${value}`);
    }
  });

  test('valid leap days and genuine ISO instants retain the existing UTC and Paris policy', () => {
    for (const [value, expected] of [['2000-02-29', '29/02/2000'], ['2028-02-29', '29/02/2028'],
      ['29-02-2028', '29/02/2028'], ['2026-10-25T23:30:00+04:00', '25/10/2026']]) {
      assert.equal(formatDueDate(value), expected);
    }
  });
  test('formats contract dates with the numeric reference labels', () => {
    assert.equal(formatDueDate('2026-12-01'), '01/12/2026');
    assert.equal(formatDueDate('05-10-2026'), '05/10/2026');
    // Instant ISO 8601 de BFF Project : jour de l'échéance à Paris.
    assert.equal(formatDueDate('2026-03-14T10:00:00.000Z'), '14/03/2026');
    assert.equal(formatDueDate('2024-12-31T23:59:59Z'), '01/01/2025');
  });

  test('retains calendar days across host timezones, Paris midnight and DST boundaries', () => {
    const originalTimezone = process.env.TZ;
    try {
      for (const timezone of ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
        process.env.TZ = timezone;
        for (const [value, expected] of [
          ['2026-09-09', '09/09/2026'],
          ['09-09-2026', '09/09/2026'],
          ['2026-03-28T23:30:00Z', '29/03/2026'],
          ['2026-03-29T22:30:00Z', '30/03/2026'],
          ['2026-10-24T22:30:00Z', '25/10/2026'],
          ['2026-10-25T22:30:00Z', '25/10/2026'],
          ['2026-10-25T23:30:00Z', '26/10/2026'],
        ]) assert.equal(formatDueDate(value), expected, `${timezone}: ${value}`);
      }
    } finally {
      if (originalTimezone === undefined) delete process.env.TZ;
      else process.env.TZ = originalTimezone;
    }
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

test('impossible event days and clock rollovers are excluded without discarding valid events or their IDs', () => {
  const events = [
    { id: 'bad-day', title: 'Impossible day', date: '2026-02-31', startTime: '09:00' },
    { id: 'bad-leap', title: 'Impossible leap day', date: '2100-02-29', startTime: '09:00' },
    { id: 'bad-clock', title: 'Next-day rollover', date: '2026-10-06', startTime: '24:00' },
    { id: 'valid-leap', title: 'Valid leap day', date: '29-02-2028', startTime: '23:59', location: 'Returned location' },
    { id: 'without-time', title: 'Existing midnight default', date: '2026-12-31' },
  ];
  const mapped = toDashboardModuleData(valid({ events }));
  assert.deepEqual(mapped.events, [
    { id: 'valid-leap', title: 'Valid leap day', location: 'Returned location', startsAt: '2028-02-29T23:59:00' },
    { id: 'without-time', title: 'Existing midnight default', location: '', startsAt: '2026-12-31T00:00:00' },
  ]);
  assert.equal(mapped.unusableEventCount, 3);
});

test('unusable event values are distinguished from a confirmed empty event collection', () => {
  assert.equal(toDashboardModuleData(valid({ events: [] })).unusableEventCount, 0);
  for (const event of [
    { id: 'd', title: 'Unreadable day', date: 'bientôt' },
    { id: 't', title: 'Unreadable time', date: '2026-10-06', startTime: 'midi' },
    { id: 'm', title: 'Invalid minute', date: '2026-10-06', startTime: '23:60' },
  ]) {
    const view = toDashboardModuleData(valid({ events: [event] }));
    assert.equal(view.unusableEventCount, 1);
    assert.deepEqual(view.events, []);
    assert.equal(view.hasUnavailableSource, false, 'Do not rewrite the returned source status');
  }
});
