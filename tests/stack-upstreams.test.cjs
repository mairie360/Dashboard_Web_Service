const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const yaml = require('js-yaml');

// MAIR-553: since MAIR-525 BFF_Dashboard reads Core, Project and Calendar APIs directly and exits at startup
// when one of their URLs is missing. The stacks used to give it BFF URLs and run BFF User / Project / Calendar
// for it, without CALENDAR_API_URL: bff-dashboard never became ready.

const REQUIRED = { CORE_API_URL: 'core-api', PROJECT_API_URL: 'project-api', CALENDAR_API_URL: 'calendar-api' };

for (const file of ['docker-compose.yml', 'docker-compose-security.yml', 'docker-compose-performance.yml']) {
  test(`MAIR-553: ${file} runs BFF_Dashboard against the APIs it reads, and no other BFF`, () => {
    const { services } = yaml.load(readFileSync(join(__dirname, '..', file), 'utf8'));
    const dashboard = services['bff-dashboard'];
    assert.ok(dashboard, 'bff-dashboard service');
    for (const [variable, api] of Object.entries(REQUIRED)) {
      assert.equal(new URL(dashboard.environment[variable]).hostname, api, `${variable} points at ${api}`);
      assert.ok(services[api], `${api} runs in the stack`);
      assert.ok(Object.keys(dashboard.depends_on).includes(`${api}-ready`), `bff-dashboard waits for ${api}`);
    }
    assert.deepEqual(Object.keys(dashboard.environment).filter((name) => name.endsWith('_BFF_URL')), []);
    assert.deepEqual(Object.keys(services).filter((name) => /^bff-/.test(name) && !name.startsWith('bff-dashboard')), []);
  });
}
