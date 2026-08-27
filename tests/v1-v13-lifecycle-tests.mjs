import assert from 'node:assert';
import fs from 'node:fs';

const js=fs.readFileSync('app-v13.js','utf8');

for(const token of [
  'const lifecycle13=globalThis.TeacherOSLifecycle',
  'lifecycle13.onRender(renderV13)',
  'function searchIndex()',
  'function renderInbox(y)',
  'function renderRecent(y)'
])assert.ok(js.includes(token),`v13 lifecycle/search guard missing: ${token}`);

assert.equal((js.match(/lifecycle13\.onRender\(/g)||[]).length,1,'v13 must register exactly one shared render hook');
assert.equal((js.match(/render=function\(\)/g)||[]).length,1,'v13 may keep only the isolated-test fallback render wrapper');
assert.ok(!js.includes("try{const prev=render;if(typeof prev==='function'){render=function(){const r=prev.apply(this,arguments);try{renderV13()}catch(err){console.warn('v13',err)}return r}}}catch{}\n  requestAnimationFrame"),'legacy direct v13 render wrapper must not remain as the primary runtime path');

console.log('v13 search/inbox shared lifecycle regression tests passed');
