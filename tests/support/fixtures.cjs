// Réponses simulées de BFF_Dashboard. Leur conformité au contrat est vérifiée par le mock à chaque réponse
// (et explicitement dans tests/dashboard-view.test.cjs pour le bootstrap).

// MAIR-825: the contract adds the last name, role, commune and trainings; a `sources` override without
// `trainings` keeps the trainings source available (deliberately malformed sources stay as given).
const withTrainingsSource = (sources) => sources && typeof sources === 'object' && !Array.isArray(sources) && !('trainings' in sources)
  ? { ...sources, trainings: 'available' } : sources;

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
      { id: 'training-4', title: 'Accueil du public', status: 'in-progress', completedModules: 2, totalModules: 5, progress: 40 },
      { id: 'training-9', title: 'Protection des données', status: 'done', completedModules: 3, totalModules: 3, progress: 100 },
    ],
    metrics: { totalProjects: 17 },
    sources: { projects: 'available', tasks: 'available', calendar: 'available', trainings: 'available' },
    ...overrides,
  };
  if ('sources' in overrides) body.sources = withTrainingsSource(overrides.sources);
  return body;
}

module.exports = { bootstrapResponse };
