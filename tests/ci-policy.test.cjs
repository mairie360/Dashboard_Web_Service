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
  const [, version] = reusableWorkflows[0];
  assert.equal(version, 'v4.0.2', 'only the reviewed workflow version is accepted; another upgrade requires review');
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
  ]);
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
  assert.equal(manifest.dependencies['@mairie360/lib-components'], '0.6.11');
  assert.equal(lock.packages[''].dependencies['@mairie360/lib-components'], '0.6.11');
  assert.equal(dependency.version, '0.6.11');
  assert.match(dependency.resolved, /^https:\/\/npm\.pkg\.github\.com\/download\/@mairie360\/lib-components\/0\.6\.11\//);
  assert.equal(dependency.integrity, 'sha512-uvJ4ORpW65K5C2kS/LhfXyyuM74J+RlaRDnzrLodxzBirHflMdny3NxkJN8vBj/lvDKpj4pebgEl3/0ezn2ThA==');
});

test('CI and local toolchains support the npm release-age policy', () => {
  assert.match(read('.github/workflows/cicd.yml'), /node_version:\s*"24\.21\.0"/);
  assert.match(read('.github/workflows/contracts.yml'), /node-version:\s*'24\.21\.0'/);
  const version = execFileSync('npm', ['--version'], { cwd: root, encoding: 'utf8' }).trim();
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  assert.ok(match, 'npm must report a stable version');
  assert.ok(Number(match[1]) > 11 || (Number(match[1]) === 11 && Number(match[2]) >= 10),
    'npm >=11.10 is required for min-release-age');
});
