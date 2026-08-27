import assert from 'node:assert';
import fs from 'node:fs';

const js=fs.readFileSync('app-v15.js','utf8');

for(const token of [
  'const lifecycle15=globalThis.TeacherOSLifecycle',
  'lifecycle15.onRender(scheduleLock)',
  "section.classList.add('timetable-auto-only')",
  "baseTable.classList.add('readonly-timetable')",
  "ev.stopImmediatePropagation()"
])assert.ok(js.includes(token),`v15 lifecycle/read-only guard missing: ${token}`);

assert.equal((js.match(/lifecycle15\.onRender\(/g)||[]).length,1,'v15 must register exactly one shared render hook');
assert.equal((js.match(/globalThis\.render=function/g)||[]).length,1,'v15 may keep only the isolated-test fallback render wrapper');
assert.ok(!js.includes("const previousRender=globalThis.render;\n  if(typeof previousRender==='function'){\n    globalThis.render=function(){\n      const result=previousRender.apply(this,arguments);\n      scheduleLock();\n      return result;\n    };\n  }"),'legacy direct v15 render wrapper must be removed from prepared runtime');

console.log('v15 timetable auto-only shared lifecycle regression tests passed');
