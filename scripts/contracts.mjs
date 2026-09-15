import process from 'node:process';
import console from 'node:console';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

// Contrat unique du front : le paquet publié du BFF associé, épinglé en version X.X.X dans package.json.
// Le paquet ne contient que la sortie orval (endpoints/*.ts + model/*.ts) : le code importe ses types depuis
// `@mairie360/bff-dashboard-openapi/model`, et contracts/openapi.json (liste blanche du proxy, mock des tests)
// en est reconstruit par tests/support/orval-contract.ts, partagé avec les BFFs. Jamais copié d'un checkout.
//   --sync   (alias --generate) : reconstruit contracts/openapi.json depuis le paquet installé
//   --check  : échoue si la version n'est pas X.X.X, si le paquet installé diffère de package.json
//              ou si contracts/openapi.json n'est plus la reconstruction du paquet

const CONTRACT_PACKAGE = '@mairie360/bff-dashboard-openapi';
const mode = process.argv[2] ?? '--check';
const spec = resolve('contracts/openapi.json');
const require = createRequire(import.meta.url);

function pinnedVersion() {
  const { dependencies = {}, devDependencies = {} } = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
  const pinned = dependencies[CONTRACT_PACKAGE];
  if (!/^\d+\.\d+\.\d+$/.test(pinned ?? '')) {
    throw new Error(`${CONTRACT_PACKAGE} doit être une dépendance épinglée sur une version publiée X.X.X (trouvé : ${pinned ?? 'absent'}).`);
  }
  const openapiPackages = Object.keys({ ...dependencies, ...devDependencies }).filter((name) => /openapi/i.test(name));
  if (openapiPackages.length !== 1) throw new Error(`Un seul contrat de BFF est autorisé (trouvé : ${openapiPackages.join(', ')}).`);
  return pinned;
}

function publishedContract(pinned) {
  require('../tests/support/load-ts.cjs');
  const { loadOrvalContract, resolveOrvalPackage } = require('../tests/support/orval-contract.ts');
  const { version } = resolveOrvalPackage(CONTRACT_PACKAGE);
  if (version !== pinned) throw new Error(`${CONTRACT_PACKAGE}@${version} est installé mais package.json épingle ${pinned} : lancer npm ci.`);
  const { document } = loadOrvalContract(CONTRACT_PACKAGE);
  const contract = { openapi: '3.1.0', info: { title: document.info.title, version }, paths: document.paths, components: document.components };
  return `${JSON.stringify(contract, null, 2)}\n`;
}

const version = pinnedVersion();
const expected = publishedContract(version);

if (mode === '--sync' || mode === '--generate') {
  mkdirSync(resolve('contracts'), { recursive: true });
  writeFileSync(spec, expected);
  console.log(`contracts/openapi.json régénéré depuis ${CONTRACT_PACKAGE}@${version}.`);
} else if (mode === '--check') {
  if (!existsSync(spec) || readFileSync(spec, 'utf8') !== expected) {
    throw new Error(`contracts/openapi.json ne correspond pas à ${CONTRACT_PACKAGE}@${version}. Lancer npm run contracts:sync.`);
  }
  console.log(`contracts/openapi.json correspond à ${CONTRACT_PACKAGE}@${version}.`);
} else {
  throw new Error(`Mode inconnu : ${mode} (--sync, --generate ou --check).`);
}
