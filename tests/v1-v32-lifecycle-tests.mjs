import assert from 'node:assert';
import fs from 'node:fs';

const app=fs.readFileSync('app-v32.js','utf8');
assert.ok(app.includes('const lifecycle32=globalThis.TeacherOSLifecycle;'),'v32 should use shared lifecycle service when available');
assert.ok(app.includes('lifecycle32.onRender(refresh,{defer:true})'),'v32 refresh should register through shared render lifecycle');
assert.ok(app.includes("lifecycle32.onSwitch(id=>{if(id==='documents'||id==='settings'||id==='importer')refresh()},{defer:true})"),'v32 view-specific refresh should register through shared switch lifecycle');
assert.ok(app.includes('fallbackRender32'),'isolated tests should retain a render fallback when lifecycle service is unavailable');
assert.ok(app.includes('fallbackSwitch32'),'isolated tests should retain a switchView fallback when lifecycle service is unavailable');
assert.ok(!app.includes('const prevRender=globalThis.render'),'historical direct render wrapper must be removed from prepared v32');
assert.ok(!app.includes('const prevSwitch=globalThis.switchView'),'historical direct switchView wrapper must be removed from prepared v32');
assert.ok(app.includes('setTimeout(()=>{refresh();maybeAutoTest()},0)'),'initial device-storage refresh and auto-test behavior must remain');
assert.ok(app.includes("document.addEventListener('change'"),'mixed HWP and retention change guards must remain independent of lifecycle migration');
console.log('v32 shared lifecycle migration checks passed (9 assertions).');
