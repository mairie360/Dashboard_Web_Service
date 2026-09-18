const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Chargement à la volée des sources TypeScript du front (et des utilitaires de test partagés avec les
// BFFs) : transpilation sans vérification de types et résolution de l'alias `@/*` de tsconfig.json.
// Chaque fichier de test tourne dans son propre processus (node --test) : le hook reste actif.

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const compilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2020,
  esModuleInterop: true,
  resolveJsonModule: true,
  // Source maps : la couverture (--enable-source-maps) est rapportée sur les lignes du fichier .ts.
  inlineSourceMap: true,
  inlineSources: true,
  jsx: ts.JsxEmit.ReactJSX,
};

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveAlias(request, ...rest) {
  return resolveFilename.call(this, request.startsWith('@/') ? path.join(SRC, request.slice(2)) : request, ...rest);
};

const compile = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions, fileName: filename }).outputText, filename);
require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;

module.exports = { ROOT, SRC };
