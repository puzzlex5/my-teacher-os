import assert from 'node:assert/strict';
import fs from 'node:fs';

const src=fs.readFileSync('app-v29.js','utf8');
assert.ok(src.includes('const lifecycle29=globalThis.TeacherOSLifecycle'),'v29 uses shared lifecycle service');
assert.ok(src.includes('lifecycle29.onRender(()=>refresh29())'),'v29 refreshes verified-data UI through shared render hook');
assert.ok(src.includes("lifecycle29.onSwitch(id=>{if(id==='dashboard'||id==='timetable')refresh29()})"),'v29 refreshes dashboard/timetable through shared switch hook');
assert.equal((src.match(/lifecycle29\.onRender\(/g)||[]).length,1,'v29 registers exactly one shared render hook');
assert.equal((src.match(/lifecycle29\.onSwitch\(/g)||[]).length,1,'v29 registers exactly one shared switch hook');
assert.ok(src.includes('if(lifecycle29?.onRender&&lifecycle29?.onSwitch)'),'v29 keeps isolated-test fallback when lifecycle service is unavailable');
assert.ok(src.includes("y.comciganSync.status='collector-error'"),'collector failure truth state remains present');
assert.ok(src.includes('correctNextLessonTruth()'),'Teacher Desk truth correction remains present');
assert.ok(src.includes('correctTodayTimetableTruth()'),'today timetable truth correction remains present');
assert.ok(src.includes('COLLECTOR_STATE_PERSIST_MS29=60000'),'collector-state write throttling remains present');
console.log('v1 v29 shared lifecycle tests passed');
