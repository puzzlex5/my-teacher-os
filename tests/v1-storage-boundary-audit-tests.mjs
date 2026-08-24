import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtimePath='dist-v1/teacher-os-v1.runtime.js';
assert.ok(fs.existsSync(runtimePath),'consolidated runtime missing; build it before storage audit');
const src=fs.readFileSync(runtimePath,'utf8');

// Teacher OS main state historically lives at `myTeacherOS.v01` and is referenced by
// both KEY and DATA_KEY in older layers. Device-local settings, feedback, contacts,
// retention self-tests and IndexedDB vault data deliberately use separate keys and are
// not part of this state-storage consolidation.
const directMainStatePatterns=[
  /localStorage\.(?:getItem|setItem|removeItem)\(\s*KEY\s*(?:,|\))/g,
  /localStorage\.(?:getItem|setItem|removeItem)\(\s*DATA_KEY\s*(?:,|\))/g,
  /localStorage\.(?:getItem|setItem|removeItem)\(\s*['"]myTeacherOS\.v01['"]\s*(?:,|\))/g
];
const direct=directMainStatePatterns.flatMap(re=>[...src.matchAll(re)].map(m=>m[0]));
assert.deepEqual(direct,[],`consolidated runtime still bypasses TeacherOSStorage for main state: ${direct.join(', ')}`);

assert.ok(src.includes('TeacherOSStorage'),'shared storage service is not bundled');
assert.ok(src.includes('TeacherOSStorage.readJSON(KEY,fresh)'),'primary state read is not routed through shared storage');
assert.ok(src.includes('TeacherOSStorage.writeJSON(KEY,state)'),'shared state write path is missing');

// Recovery uses DATA_KEY as an alias for the same Teacher OS state key. It must route
// through TeacherOSStorage rather than becoming a second direct localStorage path.
const v22Start=src.indexOf('/* ===== app-v22.js ===== */');
const v23Start=src.indexOf('/* ===== app-v23.js ===== */');
assert.ok(v22Start>=0&&v23Start>v22Start,'app-v22/app-v23 segments missing from consolidated runtime');
const v22=src.slice(v22Start,v23Start);
assert.ok(v22.includes("DATA_KEY=globalThis.KEY||'myTeacherOS.v01'"),'v22 main-state alias changed unexpectedly');
assert.ok(v22.includes('TeacherOSStorage.readJSON(DATA_KEY,()=>null)'),'v22 recovery snapshot read must use shared storage');
assert.ok(v22.includes('TeacherOSStorage.writeJSON(DATA_KEY,obj)'),'v22 recovery restore must use shared storage');
for(const re of directMainStatePatterns){re.lastIndex=0;assert.equal(re.test(v22),false,'v22 recovery bypasses TeacherOSStorage for main state')}

// v32 is intentionally a device-local IndexedDB capability test. It must not start
// writing Teacher OS state merely because it is the latest layer.
const v32Start=src.indexOf('/* ===== app-v32.js ===== */');
assert.ok(v32Start>=0,'app-v32 segment missing from consolidated runtime');
const v32=src.slice(v32Start);
for(const re of directMainStatePatterns){re.lastIndex=0;assert.equal(re.test(v32),false,'v32 unexpectedly writes/reads Teacher OS main state directly')}
assert.ok(v32.includes("RESULT_KEY='myTeacherOS.deviceStorageSelfTest.v1'"),'v32 device-local self-test key boundary changed unexpectedly');
assert.ok(v32.includes('indexedDB.open(DB_NAME,1)'),'v32 IndexedDB device self-test missing');

// Sensitive/local-only subsystems must remain local boundaries rather than being folded
// into the main Teacher OS JSON state as part of consolidation.
for(const token of [
  "KEY26='myTeacherOS.feedbackReports.v1'",
  "WIDGET_KEY='myTeacherOS.teacherDeskWidgets.v1'",
  "CONTACT_KEY='myTeacherOS.staffContacts.v1'",
  "PERSIST_KEY='myTeacherOS.sourceVault.persistence.v1'",
  "RESULT_KEY='myTeacherOS.deviceStorageSelfTest.v1'"
])assert.ok(src.includes(token),`expected local-only storage boundary missing: ${token}`);

console.log('v1 storage boundary audit passed: consolidated runtime has no direct main-state localStorage access via KEY, DATA_KEY, or literal key; local-only/IndexedDB boundaries preserved through v0.32');
