// Réponses simulées des BFFs. Leur conformité aux contrats est vérifiée par les mocks à chaque réponse
// (et explicitement dans tests/dashboard-view.test.cjs pour le bootstrap).

function bootstrapResponse(overrides = {}) {
  return {
    userFirstName: 'Alice',
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
    metrics: { totalProjects: 17 },
    sources: { projects: 'available', tasks: 'available', calendar: 'available' },
    ...overrides,
  };
}

function sessionResponse() {
  return {
    user: { id: 2, first_name: 'Alice', last_name: 'Martin', email: 'alice.martin@mairie.test', phone: null, status: 'active', role: 'User' },
    groups: [{ id: 1, name: 'Service urbanisme', owner_id: 1, description: null }],
    roles: [{ id: 3, name: 'User' }],
  };
}

module.exports = { bootstrapResponse, sessionResponse };
