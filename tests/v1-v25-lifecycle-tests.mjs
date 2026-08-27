import assert from 'node:assert';
import fs from 'node:fs';

const src=fs.readFileSync('app-v25.js','utf8');

assert.ok(src.includes('const lifecycle25=globalThis.TeacherOSLifecycle'),'v25 quality UI should use shared lifecycle service when available');
assert.ok(src.includes('lifecycle25.onRender(()=>ensureUI(),{defer:true})'),'v25 quality panel should refresh after shared render lifecycle');
assert.ok(src.includes("lifecycle25.onSwitch(id=>{if(id==='studentrecords')ensureUI()},{defer:true})"),'v25 quality panel should refresh when entering student records');
assert.ok(src.includes("if(lifecycle25?.onRender&&lifecycle25?.onSwitch)"),'v25 shared lifecycle should be feature-detected');
assert.ok(src.includes("const prevRender=globalThis.render"),'isolated legacy tests should retain a render fallback when lifecycle service is unavailable');
assert.ok(src.includes("const prevSwitch=globalThis.switchView"),'isolated legacy tests should retain a switchView fallback when lifecycle service is unavailable');
assert.equal((src.match(/lifecycle25\.onRender\(/g)||[]).length,1,'v25 should register exactly one shared render hook');
assert.equal((src.match(/lifecycle25\.onSwitch\(/g)||[]).length,1,'v25 should register exactly one shared switch hook');

console.log('v25 quality UI shared lifecycle checks passed (8 assertions).');
