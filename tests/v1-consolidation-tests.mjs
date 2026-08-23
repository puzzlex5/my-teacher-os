import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'v1-runtime-manifest.json'),'utf8'));
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

const allJs=[...manifest.coreJs,...manifest.appJs];
const allCss=[...manifest.css];
assert.equal(new Set(allJs).size,allJs.length,'JS manifest contains duplicates');
assert.equal(new Set(allCss).size,allCss.length,'CSS manifest contains duplicates');
assert.equal(manifest.coreJs.length,10,'baseline core layer count changed: review manifest intentionally');
assert.equal(manifest.appJs.length,30,'baseline app layer count changed: review manifest intentionally');
assert.equal(manifest.css.length,26,'baseline CSS layer count changed: review manifest intentionally');

for(const file of [...allJs,...allCss]){
  assert.ok(fs.existsSync(path.join(root,file)),`missing ${file}`);
  assert.ok(index.includes(file),`current live loader no longer references ${file}; reconcile v1 baseline before consolidation`);
}

function assertLoaderOrder(files,label){
  let previous=-1;
  for(const file of files){
    const pos=index.indexOf(file);
    assert.ok(pos>=0,`${label}: ${file} missing from live loader`);
    assert.ok(pos>previous,`${label}: live loader order diverged before ${file}; update the v1 manifest intentionally before bundling`);
    previous=pos;
  }
}

assertLoaderOrder(manifest.coreJs,'core JS');
assertLoaderOrder(manifest.appJs,'app JS');
assertLoaderOrder(manifest.css,'CSS');

assert.equal(allJs[0],'core-v05.js');
assert.equal(manifest.appJs[0],'app-v05.js');
assert.equal(manifest.appJs.at(-1),'app-v32.js');
assert.equal(manifest.css[0],'app-v05.css');
assert.equal(manifest.css.at(-1),'app-v32.css');

console.log(`v1 consolidation baseline verified: ${allJs.length} JS + ${allCss.length} CSS historical layers, exact live-loader order preserved`);
