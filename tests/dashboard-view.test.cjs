const assert = require('node:assert/strict');
const path = require('node:path');
const { test, describe } = require('node:test');
const { ROOT } = require('./support/load-ts.cjs');
const { bootstrapResponse } = require('./support/fixtures.cjs');
const { OpenApiContract } = require('./support/openapi-contract.ts');
const { toDashboardModuleData, formatDueDate, projectsIndicator, eventsIndicator } = require('../src/lib/dashboard-view.ts');

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
      trainingsUnavailable: false,
      trainings: [
        { id: 'training-4', title: 'Accueil du public', status: 'in-progress', completedModules: 2, totalModules: 5, progress: 40, dueLabel: '15/12/2026' },
        { id: 'training-9', title: 'Protection des données', status: 'done', completedModules: 3, totalModules: 3, progress: 100 },
      ],
      indicators: { projects: '17 projets', events: '2 en septembre' },
    });
  });

  test('MAIR-1110: a training due date becomes the « avant le » label, none without a date', () => {
    const base = { title: 'Formation', status: 'in-progress', completedModules: 1, totalModules: 4, progress: 25 };
    const view = toDashboardModuleData(valid({ trainings: [
      { id: 'training-1', ...base, dueDate: '2026-12-15' },
      { id: 'training-2', ...base, dueDate: null },
    ] }));
    assert.equal(view.trainings[0].dueLabel, formatDueDate('2026-12-15'));
    assert.equal('dueLabel' in view.trainings[1], false);
  });

  test('MAIR-1110: unavailable trainings get their own state, not the page banner', () => {
    const view = toDashboardModuleData(valid({ trainings: [], sources: { projects: 'available', tasks: 'available', calendar: 'available', trainings: 'unavailable' } }));
    assert.equal(view.trainingsUnavailable, true);
    assert.equal(view.hasUnavailableSource, false);
  });

  test('every contract project status maps to a status supported by the component', () => {
    const statuses = contract.schema('DashboardBootstrapProjectsItemStatus').enum;
    // One project per read: a tile shows 3 rows at most (MAIR-907).
    const mapped = statuses.map((status) => toDashboardModuleData(valid({ projects: [{ id: 'p', title: status, progress: 0, status, dueDate: '2026-01-01' }] })).projects[0].status);
    assert.deepEqual(mapped, statuses.map((status) => (status === 'done' ? 'completed' : 'in-progress')));
  });

  test('flags unavailable sources without inventing records', () => {
    const view = toDashboardModuleData(valid({
      projects: [], tasks: [], events: [],
      metrics: { totalProjects: null, eventsThisMonth: null, eventsPeriod: { from: '2026-09-01', to: '2026-09-30' } },
      sources: { projects: 'unavailable', tasks: 'available', calendar: 'available' },
    }));
    assert.equal(view.hasUnavailableSource, true);
    assert.deepEqual([view.projects, view.tasks, view.events], [[], [], []]);
    assert.deepEqual(view.indicators, { projects: null, events: null });
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

describe('MAIR-1177 tile indicators', () => {
  test('MAIR-1177 the projects indicator counts every visible project, singular up to one', () => {
    assert.equal(projectsIndicator({ totalProjects: 12 }), '12 projets');
    assert.equal(projectsIndicator({ totalProjects: 1 }), '1 projet');
    assert.equal(projectsIndicator({ totalProjects: 0 }), '0 projet');
  });

  test('MAIR-1177 the events indicator names the month of its period in French', () => {
    const month = (from, to, count = 7) => eventsIndicator({ totalProjects: 1, eventsThisMonth: count, eventsPeriod: { from, to } });
    assert.equal(month('2026-11-01', '2026-11-30'), '7 en novembre');
    assert.equal(month('2027-01-01', '2027-01-31', 0), '0 en janvier');
    assert.equal(month('2026-02-01', '2026-02-28', 1), '1 en février');
    assert.equal(month('2026-08-01', '2026-08-31', 31), '31 en août');
    assert.equal(month('2026-12-01', '2026-12-31'), '7 en décembre');
  });

  test('MAIR-1177 an unavailable or malformed count gives no indicator, so the title stays alone', () => {
    for (const metrics of [undefined, {}, { totalProjects: null }, { totalProjects: -1 }, { totalProjects: 1.5 }, { totalProjects: Infinity }]) {
      assert.equal(projectsIndicator(metrics), null);
    }
    for (const metrics of [undefined, { eventsThisMonth: null, eventsPeriod: { from: '2026-11-01', to: '2026-11-30' } },
      { eventsThisMonth: 3 }, { eventsThisMonth: 3, eventsPeriod: { from: '', to: '' } }, { eventsThisMonth: 3, eventsPeriod: { from: '2026-13-01', to: '2026-13-31' } },
      { eventsThisMonth: -2, eventsPeriod: { from: '2026-11-01', to: '2026-11-30' } }]) {
      assert.equal(eventsIndicator(metrics), null);
    }
  });
});

describe('formatDueDate', () => {
  test('does not invent deadlines from impossible civil dates or ambiguous free text', () => {
    for (const value of ['2026-02-31', '31-02-2026', '2025-02-29', '1900-02-29', '2026-04-31', '2026-00-01',
      '2026-02-31T09:00:00Z', '2026-02-31T09:00:00+02:00', '3', '2026', '02/03/2026', ' 3 ']) {
      assert.equal(formatDueDate(value), value, `Unusable value must remain verbatim: ${value}`);
    }
  });

  test('valid leap days and genuine ISO instants use the configured instance timezone', () => {
    for (const [value, expected] of [['2000-02-29', '29/02/2000'], ['2028-02-29', '29/02/2028'],
      ['29-02-2028', '29/02/2028'], ['2026-10-25T23:30:00+04:00', '25/10/2026']]) {
      assert.equal(formatDueDate(value), expected);
    }
  });
  test('formats contract dates with the numeric reference labels', t => {
    const previous = process.env.INSTANCE_TIMEZONE; process.env.INSTANCE_TIMEZONE = 'Europe/Paris';
    t.after(() => previous === undefined ? delete process.env.INSTANCE_TIMEZONE : process.env.INSTANCE_TIMEZONE = previous);
    assert.equal(formatDueDate('2026-12-01'), '01/12/2026');
    assert.equal(formatDueDate('05-10-2026'), '05/10/2026');
    // Instant ISO 8601 de BFF Project : jour de l'échéance à Paris.
    assert.equal(formatDueDate('2026-03-14T10:00:00.000Z'), '14/03/2026');
    assert.equal(formatDueDate('2024-12-31T23:59:59Z'), '01/01/2025');
  });

  test('retains calendar days and configured Paris instants across host timezones and DST boundaries', () => {
    const originalTimezone = process.env.TZ;
    const originalInstance = process.env.INSTANCE_TIMEZONE; process.env.INSTANCE_TIMEZONE = 'Europe/Paris';
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
      if (originalInstance === undefined) delete process.env.INSTANCE_TIMEZONE; else process.env.INSTANCE_TIMEZONE = originalInstance;
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
  // Soonest first (MAIR-907).
  assert.deepEqual(mapped.events, [
    { id: 'without-time', title: 'Existing midnight default', location: '', startsAt: '2026-12-31T00:00:00' },
    { id: 'valid-leap', title: 'Valid leap day', location: 'Returned location', startsAt: '2028-02-29T23:59:00' },
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

test('MAIR-907: a tile shows the first 3 projects and tasks and the 3 soonest events', () => {
  const projects = Array.from({ length: 6 }, (_, index) => ({ id: `project-${index}`, title: `P${index}`, progress: 10, status: 'todo', dueDate: '2026-01-01' }));
  const tasks = Array.from({ length: 8 }, (_, index) => ({ id: `task-${index}`, title: `T${index}`, dueDate: '', priority: 'low', completed: false, projectId: 'p' }));
  const events = ['2026-10-09', '2026-10-05', '2026-10-07', '2026-10-06', '2026-10-08'].map((date, index) => ({ id: index, title: date, date, startTime: '09:00' }));
  const view = toDashboardModuleData(valid({ projects, tasks, events }));
  assert.deepEqual(view.projects.map((project) => project.name), ['P0', 'P1', 'P2']);
  assert.deepEqual(view.tasks.map((task) => task.title), ['T0', 'T1', 'T2']);
  assert.deepEqual(view.events.map((event) => event.title), ['2026-10-05', '2026-10-06', '2026-10-07']);
  assert.equal(view.unusableEventCount, 0);
});
