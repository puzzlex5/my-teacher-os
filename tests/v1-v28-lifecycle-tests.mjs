import assert from 'node:assert';
import fs from 'node:fs';

const src=fs.readFileSync('app-v28.js','utf8');

assert.ok(src.includes('const lifecycle28=globalThis.TeacherOSLifecycle'),'v28 precision UI should use shared lifecycle service when available');
assert.ok(src.includes('lifecycle28.onRender(()=>refresh28())'),'v28 precision UI should refresh after shared render lifecycle');
assert.ok(src.includes("lifecycle28.onSwitch(id=>{if(id==='studentrecords'||id==='calendar'||id==='dashboard')refresh28()})"),'v28 precision UI should refresh on relevant view changes');
assert.ok(src.includes('if(lifecycle28?.onRender&&lifecycle28?.onSwitch)'),'v28 shared lifecycle should be feature-detected');
assert.ok(src.includes('const prevRender=globalThis.render'),'isolated legacy tests should retain a render fallback when lifecycle service is unavailable');
assert.ok(src.includes('const prevSwitch=globalThis.switchView'),'isolated legacy tests should retain a switchView fallback when lifecycle service is unavailable');
assert.equal((src.match(/lifecycle28\.onRender\(/g)||[]).length,1,'v28 should register exactly one shared render hook');
assert.equal((src.match(/lifecycle28\.onSwitch\(/g)||[]).length,1,'v28 should register exactly one shared switch hook');
assert.ok(src.includes("id==='studentrecords'||id==='calendar'||id==='dashboard'"),'v28 should preserve its original view refresh scope');

console.log('v28 precision UI shared lifecycle checks passed (9 assertions).');
