const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const sharp = require('sharp');
const semver = require('next/dist/compiled/semver');
const { SourceMapGenerator, SourceMapConsumer } = require('source-map-js');

const root = path.join(__dirname, '..');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test('Next and its matching lint config resolve the patched maintenance release', () => {
  const manifest = readJson('package.json');
  const lock = readJson('package-lock.json');
  for (const name of ['next', 'eslint-config-next']) {
    // eslint-config-next intentionally does not export its package.json.
    const installed = readJson(`node_modules/${name}/package.json`).version;
    assert.equal(semver.valid(installed), installed, 'keep a stable installed release');
    assert.equal(semver.prerelease(installed), null);
    assert.ok(semver.gte(installed, '16.3.8'), 'retain the reviewed maintenance floor');
    assert.equal(lock.packages[`node_modules/${name}`].version, installed);
    assert.equal(manifest.dependencies[name] ?? manifest.devDependencies[name], installed);
  }
  assert.equal(readJson('node_modules/next/package.json').version, readJson('node_modules/eslint-config-next/package.json').version, 'Next and its lint configuration must match');
});

test('the Next image runtime resolves the patched sharp release from the lock', () => {
  const manifest = readJson('package.json');
  const lock = readJson('package-lock.json');
  const selected = manifest.overrides.next?.sharp;
  assert.ok(semver.validRange(selected), 'keep a valid Next-scoped sharp selection');
  assert.ok(semver.gte(semver.minVersion(selected), '0.35.5'), 'the selection must exclude the earlier unpatched image runtime');
  assert.ok(semver.satisfies(sharp.versions.sharp, selected), 'the installed runtime must satisfy the reviewed selection');
  assert.equal(lock.packages['node_modules/sharp'].version, sharp.versions.sharp);
  const [major, minor, patch] = sharp.versions.sharp.split('.').map(Number);
  assert(major > 0 || minor > 35 || (minor === 35 && patch >= 5));
});

test('the prebuilt image runtime includes the corrected librsvg dependency', () => {
  const [major, minor, patch] = sharp.versions.rsvg.split('.').map(Number);
  assert(major > 2 || (major === 2 && (minor > 63 || (minor === 63 && patch >= 2))));
});

test('a small ordinary SVG remains renderable as a PNG', async () => {
  // Harmless image fixture only, not a reproduction of a vulnerability.
  const input = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><circle cx="6" cy="6" r="4" fill="#336699"/></svg>');
  const metadata = await sharp(await sharp(input).png().toBuffer()).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 12);
  assert.equal(metadata.height, 12);
  assert.equal(metadata.hasAlpha, true);
});

test('source-map-js resolves a patched compatible release without weakening PostCSS', () => {
  const manifest = readJson('package.json');
  const lock = readJson('package-lock.json');
  const installed = require('source-map-js/package.json').version;
  const postcss = readJson('node_modules/postcss/package.json').version;
  const selected = manifest.overrides.postcss;
  assert.ok(semver.validRange(selected), 'keep the global PostCSS override');
  assert.ok(semver.gte(semver.minVersion(selected), '8.5.28'), 'do not lower the reviewed PostCSS floor');
  assert.ok(semver.satisfies(postcss, selected));
  assert.equal(lock.packages['node_modules/postcss'].version, postcss);
  assert.equal(lock.packages['node_modules/source-map-js'].version, installed);
  const [major, minor, patch] = installed.split('.').map(Number);
  assert(major > 1 || (major === 1 && (minor > 2 || (minor === 2 && patch >= 2))));
});

test('an ordinary source map retains generated-to-original location mapping', () => {
  // A bounded valid map, not a denial-of-service reproduction.
  const map = new SourceMapGenerator({ file: 'generated.js' });
  map.addMapping({ generated: { line: 1, column: 0 }, original: { line: 2, column: 4 }, source: 'original.ts' });
  const consumer = new SourceMapConsumer(map.toJSON());
  assert.deepEqual(consumer.originalPositionFor({ line: 1, column: 0 }), {
    source: 'original.ts', line: 2, column: 4, name: null,
  });
});
