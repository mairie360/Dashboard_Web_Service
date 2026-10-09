const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const yaml = require('js-yaml');

const root = join(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

test('Dashboard calls the shared frontend workflow version with Semgrep', () => {
  const workflow = read('.github/workflows/cicd.yml');
  const reusableWorkflows = [...workflow.matchAll(/^\s+uses:\s+mairie360\/CICD\/\.github\/workflows\/frontend-cicd\.yml@([a-f0-9]{40})\s*$/gm)];
  assert.equal(reusableWorkflows.length, 1, 'Dashboard must call the shared frontend workflow once');
  const [, version] = reusableWorkflows[0];
  assert.equal(version, 'f5ea4257ac51aa2969f9ddb84730fbebce8f42a7', 'only the reviewed workflow version is accepted; another upgrade requires review');
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

test('CI and local toolchains support the npm release-age policy', () => {
  assert.match(read('.github/workflows/cicd.yml'), /node_version:\s*"24\.21\.0"/);
  assert.match(read('.github/workflows/contracts.yml'), /node-version:\s*'24\.21\.0'/);
  const version = execFileSync('npm', ['--version'], { cwd: root, encoding: 'utf8' }).trim();
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  assert.ok(match, 'npm must report a stable version');
  assert.ok(Number(match[1]) > 11 || (Number(match[1]) === 11 && Number(match[2]) >= 10),
    'npm >=11.10 is required for min-release-age');
});

const workflow = () => yaml.load(read('.github/workflows/cicd.yml'));
const digest = '0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6';

test('production and development install the lock with a required ephemeral secret and readonly npm policy', () => {
  for (const file of ['Dockerfile', 'development.Dockerfile']) {
    const dockerfile = read(file);
    assert.match(dockerfile, /^# syntax=docker\/dockerfile:1$/m);
    assert.doesNotMatch(dockerfile, /^(ARG|ENV)\s+NODE_AUTH_TOKEN\b/m);
    assert.doesNotMatch(dockerfile, /echo.*(_authToken|NODE_AUTH_TOKEN)|npm config set|\bnpm install\b|\/run\/secrets/);
    const target = file === 'Dockerfile' ? '/app/.npmrc' : '/usr/src/projects/.npmrc';
    assert.ok(dockerfile.includes('RUN --mount=type=secret,id=node_auth_token,env=NODE_AUTH_TOKEN,required=true \\\n    --mount=type=bind,source=.npmrc,target=' + target + ' \\\n    npm ci\n'));
    assert.equal([...dockerfile.matchAll(/\bnpm ci\b/g)].length, 1);
  }
  assert.match(read('.npmrc'), /^\/\/npm\.pkg\.github\.com\/:_authToken=\$\{NODE_AUTH_TOKEN\}$/m);
  assert.match(read('.npmrc'), /^min-release-age=7$/m);
  assert.match(read('.npmrc'), /^min-release-age-exclude\[\]=@mairie360\/lib-components$/m);
});

test('production, development and both consumer workflows pin the same exact official Node LTS', () => {
  for (const file of ['Dockerfile', 'development.Dockerfile']) {
    const dockerfile = read(file);
    assert.match(dockerfile, /^ARG NODE_VERSION=24\.21\.0$/m);
    const images = [...dockerfile.matchAll(/^FROM node:\$\{NODE_VERSION\}-bookworm-slim@sha256:([a-f0-9]{64}) AS ([\w-]+)$/gm)];
    assert.deepEqual(images.map(([, sha]) => sha), file === 'Dockerfile' ? [digest, digest] : [digest]);
  }
  assert.equal(workflow().jobs.CICD.with.node_version, '24.21.0');
  assert.match(read('.github/workflows/contracts.yml'), /node-version: '24\.21\.0'/);
});

test('production keeps the non-root standalone Node and curl runtime without unused package managers', () => {
  const dockerfile = read('Dockerfile');
  const runner = dockerfile.split('FROM runtime-base AS runner\n')[1];
  assert.ok(runner);
  assert.match(runner, /^USER nextjs$/m);
  assert.match(runner, /^ENV PORT=5000$/m);
  assert.match(runner, /^CMD \["node", "server\.js"\]$/m);
  assert.doesNotMatch(runner, /NODE_AUTH_TOKEN|\.npmrc|npm|yarn|corepack|COPY \. \./);
  assert.match(dockerfile, /rm -rf \/usr\/local\/lib\/node_modules\/npm \/usr\/local\/lib\/node_modules\/corepack \/opt\/yarn-v1\.22\.22/);
  assert.match(dockerfile, /rm -f \/usr\/local\/bin\/npm \/usr\/local\/bin\/npx \/usr\/local\/bin\/corepack \/usr\/local\/bin\/yarn \/usr\/local\/bin\/yarnpkg/);
  const dev = read('development.Dockerfile');
  assert.match(dev, /^USER projects$/m);
  assert.match(dev, /^WORKDIR \/usr\/src\/projects$/m);
  assert.match(dev, /^ENV PORT=3000$/m);
  assert.match(dev, /^ENV NODE_ENV=development$/m);
  assert.match(dev, /^CMD \["npm", "run", "dev"\]$/m);
});

test('Docker excludes local environments and artifacts while retaining tracked npm policy', () => {
  const patterns = read('.dockerignore').split(/\r?\n/).map(line => line.trim());
  for (const item of ['node_modules', '.next', '.git', '.env*', '.npmrc.*', 'cicd-repo', 'coverage', 'test-results', 'playwright-report']) assert.ok(patterns.includes(item), item);
  assert.ok(!patterns.includes('.npmrc') && !patterns.includes('.npmrc*'));
});

test('all three Compose frontend builds use the required secret without runtime credentials', () => {
  for (const file of ['docker-compose.yml', 'docker-compose-security.yml', 'docker-compose-performance.yml']) {
    const compose = yaml.load(read(file));
    assert.deepEqual(compose.secrets, { node_auth_token: { environment: 'NODE_AUTH_TOKEN' } });
    assert.deepEqual(compose.services['dashboard-front'].build, {
      context: '.', dockerfile: 'Dockerfile', secrets: ['node_auth_token'],
    });
    for (const [name, service] of Object.entries(compose.services)) {
      assert.ok(!service.secrets, `${name}: no runtime secret`);
      assert.ok(!service.environment || !Object.hasOwn(service.environment, 'NODE_AUTH_TOKEN'), `${name}: no runtime token`);
      if (name !== 'dashboard-front') assert.ok(!service.build, `${name}: unchanged existing image`);
    }
  }
});

test('the exact required legacy status executes both real blocking scanners without extra access', () => {
  const checkout = 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1';
  assert.deepEqual(workflow().jobs.required_security_scan, {
    name: 'CICD / Code Security Audit (Semgrep)',
    'runs-on': 'ubuntu-latest', 'timeout-minutes': 20, permissions: { contents: 'read' },
    steps: [
      { name: 'Checkout frontend history', uses: checkout, with: { 'fetch-depth': 0, 'persist-credentials': false } },
      { name: 'Checkout reviewed scanner actions', uses: checkout, with: {
        repository: 'mairie360/CICD', ref: 'f5ea4257ac51aa2969f9ddb84730fbebce8f42a7', path: 'cicd-repo', 'persist-credentials': false,
      } },
      { name: 'Run blocking Semgrep scan', uses: './cicd-repo/actions/frontend-semgrep-pypi', with: {
        config: 'p/typescript p/react p/owasp-top-ten p/secrets p/dockerfile p/github-actions', fail_on_findings: 'true', artifact_name: 'semgrep-required-check-sarif',
      } },
      { name: 'Run blocking redacted Gitleaks scan', uses: './cicd-repo/actions/frontend-gitleaks', with: { fail_on_findings: 'true' } },
    ],
  });
});

test('the reusable frontend workflow retains blocking defaults and only declared secrets', () => {
  assert.deepEqual(workflow().jobs.CICD, {
    needs: 'dev_approval',
    if: "${{ !cancelled() && (github.ref != 'refs/heads/main' || needs.dev_approval.result == 'success') }}",
    uses: 'mairie360/CICD/.github/workflows/frontend-cicd.yml@f5ea4257ac51aa2969f9ddb84730fbebce8f42a7',
    with: { package_name: 'dashboard-front', node_version: '24.21.0', cicd_version: 'f5ea4257ac51aa2969f9ddb84730fbebce8f42a7' },
    secrets: { CODECOV_TOKEN: '${{ secrets.CODECOV_TOKEN }}', N8N_WEBHOOK_SECRET: '${{ secrets.N8N_WEBHOOK_SECRET }}' },
  });
  assert.doesNotMatch(read('.github/workflows/cicd.yml'), /secrets:\s*inherit|continue-on-error:|image_scan_fail_on_findings:|semgrep_fail_on_findings:\s*false/);
});

test('the required scan runs for every existing event without changing global permissions', () => {
  const ci = workflow();
  assert.deepEqual(ci.on, { push: null, pull_request: null, workflow_dispatch: null });
  assert.deepEqual(ci.permissions, { contents: 'write', packages: 'write', 'id-token': 'write' });
  assert.deepEqual(Object.keys(ci.jobs).sort(), ['CICD', 'dev_approval', 'required_security_scan']);
});

test('the existing Dev approval gates main but never prevents PR or branch checks', () => {
  assert.deepEqual(workflow().jobs.dev_approval, {
    name: 'Preserve Dev approval',
    if: "github.ref == 'refs/heads/main'",
    'runs-on': 'ubuntu-latest',
    environment: 'Dev',
    'timeout-minutes': 5,
    permissions: {},
    steps: [{ name: 'Record existing Dev approval', run: 'echo "Existing Dev environment approval granted for this workflow run."' }],
  });
  // !cancelled() is an explicit status function: a skipped dependency on PRs
  // does not get GitHub's implicit success() guard. Main requires real approval.
  const condition = workflow().jobs.CICD.if;
  assert.equal(condition, "${{ !cancelled() && (github.ref != 'refs/heads/main' || needs.dev_approval.result == 'success') }}");
  const allows = (ref, result, cancelled) => !cancelled && (ref !== 'refs/heads/main' || result === 'success');
  for (const result of ['success', 'failure', 'skipped', 'cancelled']) {
    assert.equal(allows('refs/heads/main', result, false), result === 'success');
    assert.equal(allows('refs/pull/83/merge', result, false), true);
    assert.equal(allows('refs/heads/fix/example', result, false), true);
    assert.equal(allows('refs/heads/main', result, true), false);
    assert.equal(allows('refs/pull/83/merge', result, true), false);
  }
});
