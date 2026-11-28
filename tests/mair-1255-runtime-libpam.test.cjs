// The release-dev Trivy gate refuses the image for libpam (CVE-2025-6020, HIGH, fixed in
// 1.5.2-6+deb12u3), still shipped by the node bookworm-slim base. The runtime stage must upgrade the libpam
// packages through the signed Debian repositories and fail the build when libpam-modules is older than the fix.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const runtimeBase = () => {
  const dockerfile = readFileSync(join(__dirname, '..', 'Dockerfile'), 'utf8');
  const stage = dockerfile.split(/ AS runtime-base\n/)[1];
  assert.ok(stage, 'Dockerfile has a runtime-base stage');
  return stage.split(/\nFROM /)[0];
};

test('MAIR-1255 the runtime image upgrades libpam past CVE-2025-6020', () => {
  const stage = runtimeBase();
  const install = stage.match(/apt-get -o Acquire::Retries=0 install -y --no-install-recommends ([^]*?)\n\s*&&/);
  assert.ok(install, 'the runtime stage installs its packages in one apt-get call');
  for (const name of ['libpam0g', 'libpam-modules', 'libpam-modules-bin', 'libpam-runtime']) {
    assert.match(install[1], new RegExp(`(^|\\s)${name}(\\s|\\\\|$)`), `${name} is upgraded`);
  }
  assert.match(stage, /dpkg-query -W -f='\$\{Version\}' libpam-modules\)" ge '1\.5\.2-6\+deb12u3'/);
});
