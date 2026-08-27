import assert from 'node:assert/strict';
import fs from 'node:fs';

const js=fs.readFileSync('app-v14.js','utf8');

for(const token of [
  'const lifecycle14=globalThis.TeacherOSLifecycle',
  'lifecycle14.onRender(refreshLifecycle14,{defer:true})',
  'renderPlainSyncCard()',
  'lockTimetableReadOnly()',
  "LOCAL_CFG_KEY='myTeacherOS.comciganConfig'"
])assert.ok(js.includes(token),`v14 lifecycle/Comcigan guard missing: ${token}`);

assert.equal((js.match(/lifecycle14\.onRender\(/g)||[]).length,1,'v14 must register exactly one shared render hook');
assert.equal((js.match(/globalThis\.render=function/g)||[]).length,1,'v14 may keep only the isolated-test fallback render wrapper');
assert.ok(!js.includes("const previousRender=globalThis.render;if(typeof previousRender==='function'){globalThis.render=function(){const r=previousRender.apply(this,arguments);setTimeout(()=>{renderPlainSyncCard();lockTimetableReadOnly()},0);return r}}\n  boot();"),'legacy direct v14 render wrapper must be removed from prepared runtime');

console.log('v14 Comcigan shared lifecycle regression tests passed');
