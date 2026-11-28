const assert = require('node:assert/strict');
const path = require('node:path');
const { test, describe } = require('node:test');
const { ROOT } = require('./support/load-ts.cjs');
const { bootstrapResponse } = require('./support/fixtures.cjs');
const { OpenApiContract } = require('./support/openapi-contract.ts');
const dashboardView = require('../src/lib/dashboard-view.ts');
const { toDashboardModuleData, formatDueDate, formatTaskDue } = dashboardView;

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
    // A fixed day a month before the task deadlines keeps their absolute date.
    assert.deepEqual(toDashboardModuleData(valid(), new Date('2026-10-01T10:00:00Z')), {
      hasUnavailableSource: false,
      unusableEventCount: 0,
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
      trainingsUnavailable: false,
      trainings: [
        { id: 'training-4', title: 'Accueil du public', status: 'in-progress', completedModules: 2, totalModules: 5, progress: 40, dueLabel: '15 déc. 2026' },
        { id: 'training-9', title: 'Protection des données', status: 'done', completedModules: 3, totalModules: 3, progress: 100 },
      ],
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

describe('MAIR-1255 no counter after the tile titles', () => {
  test('MAIR-1255 the view carries no tile indicator and the indicator helpers are gone', () => {
    const view = toDashboardModuleData(valid());
    assert.equal('indicators' in view, false);
    assert.equal(dashboardView.projectsIndicator, undefined);
    assert.equal(dashboardView.eventsIndicator, undefined);
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
    for (const [value, expected] of [['2000-02-29', '29 févr. 2000'], ['2028-02-29', '29 févr. 2028'],
      ['29-02-2028', '29 févr. 2028'], ['2026-10-25T23:30:00+04:00', '25 oct. 2026']]) {
      assert.equal(formatDueDate(value), expected);
    }
  });
  test('MAIR-1255 formats contract dates as « 15 déc. 2026 », like the reference screen', t => {
    const previous = process.env.INSTANCE_TIMEZONE; process.env.INSTANCE_TIMEZONE = 'Europe/Paris';
    t.after(() => previous === undefined ? delete process.env.INSTANCE_TIMEZONE : process.env.INSTANCE_TIMEZONE = previous);
    assert.equal(formatDueDate('2026-12-15'), '15 déc. 2026');
    assert.equal(formatDueDate('2026-12-01'), '1 déc. 2026');
    assert.equal(formatDueDate('2026-09-01'), '1 sept. 2026');
    assert.equal(formatDueDate('05-10-2026'), '5 oct. 2026');
    // BFF Project ISO 8601 instant: day of the deadline in Paris.
    assert.equal(formatDueDate('2026-03-14T10:00:00.000Z'), '14 mars 2026');
    assert.equal(formatDueDate('2024-12-31T23:59:59Z'), '1 janv. 2025');
    // No numeric « 27/11/2026 » form any more.
    assert.doesNotMatch(formatDueDate('2026-11-27'), /\d{2}\/\d{2}\/\d{4}/);
  });

  test('retains calendar days and configured Paris instants across host timezones and DST boundaries', () => {
    const originalTimezone = process.env.TZ;
    const originalInstance = process.env.INSTANCE_TIMEZONE; process.env.INSTANCE_TIMEZONE = 'Europe/Paris';
    try {
      for (const timezone of ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
        process.env.TZ = timezone;
        for (const [value, expected] of [
          ['2026-09-09', '9 sept. 2026'],
          ['09-09-2026', '9 sept. 2026'],
          ['2026-03-28T23:30:00Z', '29 mars 2026'],
          ['2026-03-29T22:30:00Z', '30 mars 2026'],
          ['2026-10-24T22:30:00Z', '25 oct. 2026'],
          ['2026-10-25T22:30:00Z', '25 oct. 2026'],
          ['2026-10-25T23:30:00Z', '26 oct. 2026'],
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

describe('MAIR-1255 relative task deadlines', () => {
  const now = new Date('2026-11-28T09:00:00Z');
  test('reads today, tomorrow and the next six days relatively, then the date', () => {
    assert.equal(formatTaskDue('2026-11-28', now), 'Aujourd’hui');
    assert.equal(formatTaskDue('2026-11-29', now), 'Demain');
    assert.equal(formatTaskDue('2026-12-01', now), 'Dans 3 jours');
    assert.equal(formatTaskDue('2026-12-04', now), 'Dans 6 jours');
    assert.equal(formatTaskDue('2026-12-05', now), formatDueDate('2026-12-05'));
    assert.equal(formatTaskDue('28-11-2026', now), 'Aujourd’hui');
  });
  test('marks a past deadline late, with its date', () => {
    assert.equal(formatTaskDue('2026-11-20', now), `En retard · ${formatDueDate('2026-11-20')}`);
  });
  test('reads an instant on its day in the instance time zone', () => {
    assert.equal(formatTaskDue('2026-11-29T10:00:00.000Z', now), 'Demain');
  });
  test('keeps the absolute date without a clock, so the server render and the hydration agree', () => {
    assert.equal(formatTaskDue('2026-11-29', null), formatDueDate('2026-11-29'));
    const view = toDashboardModuleData(valid({ tasks: [{ id: 't1', projectId: 'p', title: 'Valider', dueDate: '2026-11-28', priority: 'high', completed: false }] }), null);
    assert.equal(view.tasks[0].dueLabel, formatDueDate('2026-11-28'));
  });
  test('shows an unreadable value as is', () => {
    assert.equal(formatTaskDue('bientôt', now), 'bientôt');
    assert.equal(formatTaskDue('2026-02-30', now), '2026-02-30');
  });
  test('the tasks tile uses the relative label, « Sans échéance » without a deadline', () => {
    const view = toDashboardModuleData(valid({ tasks: [
      { id: 't1', projectId: 'p', title: 'Valider le budget', dueDate: '2026-11-28', priority: 'high', completed: false },
      { id: 't2', projectId: 'p', title: 'Relire', dueDate: '', priority: 'low', completed: false },
    ] }), now);
    assert.deepEqual(view.tasks.map((task) => task.dueLabel), ['Aujourd’hui', 'Sans échéance']);
  });
});
