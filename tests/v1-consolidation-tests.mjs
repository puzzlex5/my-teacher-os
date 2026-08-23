import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'v1-runtime-manifest.json'),'utf8'));
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const buildScript=fs.readFileSync(path.join(root,'scripts/build-v1-runtime.mjs'),'utf8');
const storageServicePath=path.join(root,'v1-storage-service.js');

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

assert.ok(fs.existsSync(storageServicePath),'v1 shared storage service missing');
const storageService=fs.readFileSync(storageServicePath,'utf8');
assert.ok(storageService.includes('TeacherOSStorage'),'shared storage global missing');
assert.ok(storageService.includes('readJSON')&&storageService.includes('writeJSON'),'shared storage read/write API missing');
assert.ok(buildScript.includes('TeacherOSStorage.readJSON(KEY,fresh)'),'base state read is not routed through shared storage');
assert.ok(buildScript.includes('TeacherOSStorage.writeJSON(KEY,state)'),'base state writes are not routed through shared storage');
assert.ok(buildScript.includes("storageServiceFile='v1-storage-service.js'"),'shared storage service is not part of the v1 build');
assert.ok(buildScript.includes("if(file==='app-v06.js')"),'v0.6 migration is not explicitly routed through shared storage');
assert.ok(buildScript.includes("if(file==='app-v07.js')"),'v0.7 migration is not explicitly routed through shared storage');
assert.ok(buildScript.includes("if(file==='app-v09.js')"),'v0.9 state writes are not explicitly routed through shared storage');
assert.ok(buildScript.includes("if(file==='app-v10.js')"),'v0.10 state writes are not explicitly routed through shared storage');
assert.ok(buildScript.includes("if(file==='app-v14.js')"),'v0.14 Comcigan main-state writes are not explicitly routed through shared storage');
assert.ok(buildScript.includes("if(file==='app-v18.js')"),'v0.18 enriched import state write is not explicitly routed through shared storage');
assert.ok(buildScript.includes("if(file==='app-v19.js')"),'v0.19 work-pack state writes are not explicitly routed through shared storage');
assert.ok(buildScript.includes("if(changed)globalThis.TeacherOSStorage.writeJSON(KEY,state)"),'v0.19 schema guard still performs redundant state writes on unchanged renders');
assert.ok(buildScript.includes("function save19(){globalThis.TeacherOSStorage.writeJSON(KEY,state)}"),'v0.19 user-driven work-pack writes are not routed through shared storage');
assert.ok(buildScript.includes("legacy-app-v09.js"),'legacy parity reference does not use the migrated v0.9 runtime');
assert.ok(buildScript.includes("legacy-app-v10.js"),'legacy parity reference does not use the migrated v0.10 runtime');
assert.ok(buildScript.includes("legacy-app-v14.js"),'legacy parity reference does not use the migrated v0.14 runtime');
assert.ok(buildScript.includes("legacy-app-v18.js"),'legacy parity reference does not use the migrated v0.18 runtime');
assert.ok(buildScript.includes("legacy-app-v19.js"),'legacy parity reference does not use the migrated v0.19 runtime');
assert.ok(buildScript.includes('app-v08 has no Teacher OS state writes'),'v0.8 no-state-write boundary is not documented');
assert.ok(buildScript.includes('app-v11 through app-v13 have no Teacher OS state writes'),'v0.11-v0.13 no-state-write boundary is not documented');
assert.ok(buildScript.includes('app-v15 through app-v17 have no Teacher OS state writes'),'v0.15-v0.17 no-state-write boundary is not documented');
assert.ok(buildScript.includes('per-browser Comcigan config remains a separate local setting'),'Comcigan privacy/lifecycle boundary is not documented');
assert.ok(buildScript.includes('shared state storage boundary active through v0.19'),'build report no longer states the verified storage migration boundary');

console.log(`v1 consolidation baseline verified: ${allJs.length} JS + ${allCss.length} CSS historical layers, exact live-loader order preserved, shared state storage boundary active through v0.19 with redundant work-pack render writes removed`);
