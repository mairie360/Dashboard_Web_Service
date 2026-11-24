// Réponses simulées de BFF_Dashboard. Leur conformité au contrat est vérifiée par le mock à chaque réponse
// (et explicitement dans tests/dashboard-view.test.cjs pour le bootstrap).

// MAIR-825: the contract adds the last name, role, commune and trainings; MAIR-1106 the unread count and its
// `messages` source. A `sources` override without `trainings` / `messages` keeps them available (deliberately
// malformed sources stay as given).
const withTrainingsSource = (sources) => sources && typeof sources === 'object' && !Array.isArray(sources)
  ? { trainings: 'available', messages: 'available', ...sources } : sources;
// MAIR-1110: a training override without `dueDate` gets none, as the contract requires the field.
const withDueDates = (trainings) => Array.isArray(trainings)
  ? trainings.map((training) => (training && typeof training === 'object' && !('dueDate' in training) ? { ...training, dueDate: null } : training))
  : trainings;

function bootstrapResponse(overrides = {}) {
  const body = {
    userFirstName: 'Alice',
    userLastName: 'Martin',
    userRole: 'Agent',
    communeName: 'Saint-Pierre',
    projects: [
      { id: 'project-42', title: 'Budget participatif', progress: 50, status: 'review', dueDate: '2026-12-01' },
      { id: 'project-7', title: 'Rénovation de la médiathèque', progress: 100, status: 'done', dueDate: '2026-06-30' },
    ],
    tasks: [
      { id: 'task-2', title: 'Validation', dueDate: '2026-11-01', priority: 'high', completed: false, projectId: 'project-42' },
      { id: 'task-5', title: 'Relecture', dueDate: '', priority: 'low', completed: false, projectId: 'project-7' },
    ],
    events: [
      { id: 9, title: 'Conseil municipal', date: '2026-09-18', startTime: '09:00', location: 'Mairie' },
      // Date au format DD-MM-YYYY, accepté par BFF Calendar et relayé tel quel par BFF_Dashboard.
      { id: 'evt-2', title: 'Permanence', date: '20-09-2026' },
    ],
    trainings: [
      { id: 'training-4', title: 'Accueil du public', status: 'in-progress', completedModules: 2, totalModules: 5, progress: 40, dueDate: '2026-12-15' },
      { id: 'training-9', title: 'Protection des données', status: 'done', completedModules: 3, totalModules: 3, progress: 100, dueDate: null },
    ],
    unreadMessages: 3,
    metrics: { totalProjects: 17, eventsThisMonth: 2, eventsPeriod: { from: '2026-09-01', to: '2026-09-30' } },
    sources: { projects: 'available', tasks: 'available', calendar: 'available', trainings: 'available', messages: 'available' },
    ...overrides,
  };
  if ('sources' in overrides) body.sources = withTrainingsSource(overrides.sources);
  if ('trainings' in overrides) body.trainings = withDueDates(overrides.trainings);
  return body;
}

module.exports = { bootstrapResponse };
