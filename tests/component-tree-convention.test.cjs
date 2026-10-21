const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

// MAIR-608 component tree convention: a component is a folder `Name/` holding `index.ts`,
// `Name.tsx`, `Name.test.tsx` and a `components/` folder with one such folder per direct
// sub-component. A component reaches its sub-components only through their `index.ts`.
const root = path.resolve(__dirname, '..');
const componentsRoot = path.join(root, 'src/components');
const rel = file => path.relative(root, file).split(path.sep).join('/');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const isTest = file => /\.test\.(tsx|jsx)$/.test(file);
const componentFolders = () => walk(componentsRoot).filter(file => file.endsWith('.tsx') && !isTest(file) && path.basename(file, '.tsx') === path.basename(path.dirname(file))).map(path.dirname);

test('every component is a folder with its index, its file and its co-located test', () => {
  const folders = componentFolders();
  assert.ok(folders.length > 0, 'src/components holds component folders');
  for (const folder of folders) {
    const name = path.basename(folder);
    const index = path.join(folder, 'index.ts');
    assert.ok(fs.existsSync(index), `${rel(folder)} has an index.ts`);
    assert.match(fs.readFileSync(index, 'utf8'), new RegExp(`from '\\./${name}'`), `${rel(index)} exports ${name}`);
    assert.ok(fs.existsSync(path.join(folder, `${name}.test.tsx`)) || fs.existsSync(path.join(folder, `${name}.test.jsx`)), `${rel(folder)} has a co-located ${name}.test.tsx`);
    const sub = path.join(folder, 'components');
    if (fs.existsSync(sub)) for (const entry of fs.readdirSync(sub, { withFileTypes: true })) {
      assert.ok(entry.isDirectory() && fs.existsSync(path.join(sub, entry.name, `${entry.name}.tsx`)), `${rel(sub)}/${entry.name} is a component folder`);
    }
  }
});

test('every .tsx under src/components is a component file or its test, never a loose file', () => {
  for (const file of walk(componentsRoot).filter(file => file.endsWith('.tsx') && !isTest(file))) {
    assert.equal(path.basename(file, '.tsx'), path.basename(path.dirname(file)), `${rel(file)} is named after its folder`);
  }
});

test('a component imports its sub-components through their index.ts only', () => {
  for (const file of walk(componentsRoot).filter(file => /\.tsx?$/.test(file) && !isTest(file))) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const spec = match[1];
      if (!spec.startsWith('.') && !spec.startsWith('@/components/')) continue;
      assert.doesNotMatch(spec, /components\/[^/]+\/./, `${rel(file)} must import a component through its folder, not ${spec}`);
      assert.doesNotMatch(spec, /\/index$/, `${rel(file)} must import the folder, not ${spec}`);
    }
  }
});
