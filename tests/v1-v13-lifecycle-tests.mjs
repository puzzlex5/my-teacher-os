import assert from 'node:assert';
import fs from 'node:fs';

const js=fs.readFileSync('app-v13.js','utf8');

for(const token of [
  'const lifecycle13=globalThis.TeacherOSLifecycle',
  'if(lifecycle13?.onRender)lifecycle13.onRender(renderV13)',
  'function searchIndex()',
  'function renderInbox(y)',
  'function renderRecent(y)'
])assert.ok(js.includes(token),`v13 lifecycle/search guard missing: ${token}`);

assert.equal((js.match(/lifecycle13\.onRender\(/g)||[]).length,1,'v13 must register exactly one shared render hook');
assert.equal((js.match(/render=function\(\)/g)||[]).length,1,'v13 may keep only one isolated-test fallback render wrapper');
assert.ok(js.indexOf('if(lifecycle13?.onRender)lifecycle13.onRender(renderV13)')<js.indexOf('else try{const prev=render'),'shared lifecycle must be the primary v13 runtime path before isolated-test fallback');

console.log('v13 search/inbox shared lifecycle regression tests passed');
