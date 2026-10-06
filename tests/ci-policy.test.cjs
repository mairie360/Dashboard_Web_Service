const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const root = join(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

test('Dashboard calls the shared frontend workflow version with Semgrep', () => {
  const workflow = read('.github/workflows/cicd.yml');
  const reusableWorkflows = [...workflow.matchAll(/^\s+uses:\s+mairie360\/CICD\/\.github\/workflows\/frontend-cicd\.yml@(v(\d+)\.(\d+)\.(\d+))\s*$/gm)];
  assert.equal(reusableWorkflows.length, 1, 'Dashboard must call the shared frontend workflow once');
  const [, version, major, minor, patch] = reusableWorkflows[0];
  assert.equal(Number(major), 3, 'a new major workflow version requires review');
  assert.ok(Number(minor) > 1 || (Number(minor) === 1 && Number(patch) >= 1),
    'the shared workflow must include the Semgrep security audit');
  assert.equal(workflow.match(/cicd_version:\s*"([^"]+)"/)?.[1], version,
    'the reusable workflow ref and input must use the same version');
  assert.doesNotMatch(workflow, /semgrep_fail_on_findings:\s*false|semgrep_config:|continue-on-error:/);
});

test('third-party workflow actions use immutable commits', () => {
  const actions = ['contracts.yml', 'auto-approve.yml'].flatMap((file) => [...read(`.github/workflows/${file}`)
    .matchAll(/uses:\s*([^\s@]+)@([^\s#]+)/g)]);
  assert.deepEqual(actions.map((match) => match[1]).sort(), [
    'actions/checkout', 'actions/setup-node', 'hmarr/auto-approve-action',
  ]);
  for (const [, name, ref] of actions) {
    assert.match(ref, /^[a-f0-9]{40}$/, `${name} must use a full commit SHA`);
  }
});

test('the reusable workflow receives only its declared named secrets', () => {
  const workflow = read('.github/workflows/cicd.yml');
  assert.doesNotMatch(workflow, /secrets:\s*inherit/);
  const mappings = [...workflow.matchAll(/^ {6}([A-Z0-9_]+):[ \t]*\$\{\{[ \t]*secrets\.([A-Z0-9_]+)[ \t]*\}\}[ \t]*$/gm)];
  assert.deepEqual(mappings.map(([, name, source]) => [name, source]), [
    ['CODECOV_TOKEN', 'CODECOV_TOKEN'],
    ['N8N_WEBHOOK_SECRET', 'N8N_WEBHOOK_SECRET'],
    // AI pre-audit of the RGAA check (release-prod), MAIR-320.
    ['ANTHROPIC_API_KEY', 'ANTHROPIC_API_KEY'],
  ]);
});

test('isolated test stacks run the published image, the scripts build it with a secret only', () => {
  const stacks = {
    'docker-compose-security.yml': 'security_test.sh',
    'docker-compose-performance.yml': 'performance_test.sh',
    'docker-compose-accessibility.yml': 'accessibility_test.sh',
  };
  for (const [file, script] of Object.entries(stacks)) {
    const compose = read(file);
    const frontend = compose.split('  dashboard-front:\n')[1]?.split('\n  security-scan:')[0]?.split('\n  k6-perf-test:')[0]?.split('\n  a11y:')[0];
    assert.ok(frontend, `${file} must keep the isolated frontend service`);
    // The CI exports IMAGE_REF (dev-<sha> for ZAP / k6, staging-<sha> for RGAA): never rebuilt.
    assert.match(frontend, /image: \$\{IMAGE_REF:\?/);
    assert.doesNotMatch(frontend, /build:|args:|NODE_AUTH_TOKEN|\/run\/secrets/);
    const code = compose.split('\n').filter((line) => !line.trimStart().startsWith('#')).join('\n');
    assert.doesNotMatch(code, /NODE_AUTH_TOKEN|\bbuild-arg\b/);
    const shell = read(script);
    assert.match(shell, /docker build -t dashboard-front:local --secret id=node_auth_token,env=NODE_AUTH_TOKEN \./);
    assert.doesNotMatch(shell, /--build-arg|up -d --build/);
  }
});

test('the Dockerfile reads the npm token from a BuildKit secret, never from a build arg', () => {
  const dockerfile = read('Dockerfile');
  assert.match(dockerfile, /--mount=type=secret,id=node_auth_token,env=NODE_AUTH_TOKEN,required=true/);
  assert.doesNotMatch(dockerfile, /^\s*ARG NODE_AUTH_TOKEN/m);
  assert.doesNotMatch(dockerfile, /_authToken=\$\{NODE_AUTH_TOKEN\}/);
});

test('Docker excludes the local RGAA files', () => {
  const ignored = read('.dockerignore').split(/\r?\n/).map((line) => line.trim());
  for (const pattern of ['cicd-repo', 'rgaa-report', '.rgaa-ai-cache', 'rgaa.yaml', 'accessibility_test.sh', 'init-accessibility.sql']) {
    assert.ok(ignored.includes(pattern), `${pattern} must be excluded from the build context`);
  }
});

test('npm release-age exception applies only to the internal shared component package', () => {
  const config = read('.npmrc');
  assert.match(config, /^min-release-age\s*=\s*7\s*$/m);
  const exclusions = [...config.matchAll(/^\s*min-release-age-exclude(?:\[\])?\s*=\s*(.+?)\s*$/gm)];
  assert.deepEqual(exclusions.map((match) => match[1]), ['@mairie360/lib-components']);
  assert.doesNotMatch(config, /^\s*before\b/m);
});

test('Dashboard pins the published shared UI release in its lockfile', () => {
  const manifest = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  const dependency = lock.packages['node_modules/@mairie360/lib-components'];
  assert.equal(manifest.dependencies['@mairie360/lib-components'], '0.6.8');
  assert.equal(lock.packages[''].dependencies['@mairie360/lib-components'], '0.6.8');
  assert.equal(dependency.version, '0.6.8');
  assert.match(dependency.resolved, /^https:\/\/npm\.pkg\.github\.com\/download\/@mairie360\/lib-components\/0\.6\.8\//);
  assert.equal(dependency.integrity, 'sha512-Z+AEfIXKdIMEe7eMd8OBG7l6vdLbzISlN66ahGZ1xhqKdBtBmMswcw6pmR7SbD1IBc94d1TaWR+VHJmDEtsutw==');
});

test('CI and local toolchains support the npm release-age policy', () => {
  assert.match(read('.github/workflows/cicd.yml'), /node_version:\s*"24"/);
  assert.match(read('.github/workflows/contracts.yml'), /node-version:\s*'24'/);
  const version = execFileSync('npm', ['--version'], { cwd: root, encoding: 'utf8' }).trim();
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  assert.ok(match, 'npm must report a stable version');
  assert.ok(Number(match[1]) > 11 || (Number(match[1]) === 11 && Number(match[2]) >= 10),
    'npm >=11.10 is required for min-release-age');
});
