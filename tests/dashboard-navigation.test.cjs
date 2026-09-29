const assert = require('node:assert/strict');
const { test } = require('node:test');
require('./support/load-ts.cjs');
const { setBrowserFrontUrls } = require('../src/lib/front-urls.ts');
const { getActiveFrontHrefs } = require('../src/lib/navigation.ts');

test('shared shell includes only valid, configured active front destinations', () => {
  global.window = {};
  try {
    setBrowserFrontUrls({
      PROJECT_FRONT_URL: 'https://projects.example.test/',
      CALENDAR_FRONT_URL: 'javascript:alert(1)',
      MESSAGE_FRONT_URL: 'https://name:secret@messages.example.test/',
      SETTINGS_FRONT_URL: 'https://settings.example.test/',
      EMAIL_FRONT_URL: 'https://archived.example.test/',
    });

    assert.deepEqual(getActiveFrontHrefs(), {
      dashboard: '/',
      projects: 'https://projects.example.test/',
      messages: undefined,
      training: undefined,
      calendar: undefined,
      admin: undefined,
      settings: 'https://settings.example.test/',
      profile: 'https://settings.example.test/',
    });
  } finally {
    setBrowserFrontUrls({});
    delete global.window;
  }
});
