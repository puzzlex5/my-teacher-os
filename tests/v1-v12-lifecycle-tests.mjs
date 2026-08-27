import assert from 'node:assert';
import fs from 'node:fs';

const src=fs.readFileSync('app-v12.js','utf8');

assert.ok(src.includes('function refreshVisuals12()'),'v12 exposes one visual refresh hook');
assert.ok(src.includes('globalThis.TeacherOSLifecycle'),'v12 uses TeacherOSLifecycle when available');
assert.equal((src.match(/lifecycle12\.onRender\(refreshVisuals12\)/g)||[]).length,1,'v12 registers exactly one shared render hook');
assert.ok(src.includes("console.warn('visual dashboard',e)"),'v12 preserves visible diagnostic for render failures');
assert.ok(src.includes('else{const previousRender=globalThis.render'),'legacy render wrapper remains only as isolated-test fallback');
assert.ok(src.includes('renderVisuals();requestAnimationFrame(renderVisuals);'),'initial visual dashboard population is preserved');
assert.ok(src.includes("if(sync==='transport-unavailable')"),'Comcigan transport-unavailable truth guard is preserved');
assert.ok(src.includes("truth.known?'수업 없음':'시간표 미확인'"),'unknown timetable truth still cannot be rendered as no class');

console.log('v12 visual dashboard uses the shared render lifecycle without weakening timetable truth guards.');
