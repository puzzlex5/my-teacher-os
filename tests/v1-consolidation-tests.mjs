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
for(const version of ['06','07','09','10','14','18','19','20']){
  assert.ok(buildScript.includes(`if(file==='app-v${version}.js')`),`v0.${Number(version)} storage path is not explicitly routed through shared storage`);
}
assert.ok(buildScript.includes("if(changed)globalThis.TeacherOSStorage.writeJSON(KEY,state)"),'schema guards still lack change-sensitive persistence');
assert.ok(buildScript.includes("function save19(){globalThis.TeacherOSStorage.writeJSON(KEY,state)}"),'v0.19 user-driven work-pack writes are not routed through shared storage');
assert.ok(buildScript.includes("function save20(renderNow=true){globalThis.TeacherOSStorage.writeJSON(KEY,state)"),'v0.20 user-driven student/role writes are not routed through shared storage');
assert.ok(buildScript.includes("legacy-app-v20.js"),'legacy parity reference does not use the migrated v0.20 runtime');
assert.ok(buildScript.includes('app-v08 has no Teacher OS state writes'),'v0.8 no-state-write boundary is not documented');
assert.ok(buildScript.includes('app-v11 through app-v13 have no Teacher OS state writes'),'v0.11-v0.13 no-state-write boundary is not documented');
assert.ok(buildScript.includes('app-v15 through app-v17 have no Teacher OS state writes'),'v0.15-v0.17 no-state-write boundary is not documented');
assert.ok(buildScript.includes('per-browser Comcigan config remains a separate local setting'),'Comcigan privacy/lifecycle boundary is not documented');
assert.ok(buildScript.includes('shared state storage boundary active through v0.20'),'build report no longer states the verified storage migration boundary');
assert.ok(buildScript.includes('schema initialization skips redundant writes on unchanged renders'),'render-time redundant-write guard is not reported');

console.log(`v1 consolidation baseline verified: ${allJs.length} JS + ${allCss.length} CSS historical layers, exact live-loader order preserved, shared state storage boundary active through v0.20 with redundant v0.19/v0.20 render writes removed`);
