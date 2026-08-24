import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('app-v28.js','utf8');
assert.ok(app.includes('globalThis.TeacherOSStorage.writeJSON(KEY,state)'), 'v1 v28 calendar Undo restore must use shared Teacher OS storage');
assert.ok(!app.includes('localStorage.setItem(KEY,JSON.stringify(state))'), 'v1 v28 must not bypass shared storage for main Teacher OS state');
assert.ok(app.includes("const CAL_HISTORY_KEY='myTeacherOS.calendarEditHistory.v1'"), 'calendar Undo history must remain a separate local-only key');
assert.ok(app.includes('localStorage.setItem(CAL_HISTORY_KEY'), 'calendar Undo history should remain local and separate from main state');
assert.ok(app.includes("const CONTACT_KEY='myTeacherOS.staffContacts.v1'"), 'staff contacts must remain a separate local-only key');
assert.ok(app.includes("const COMCIGAN_KEY='myTeacherOS.comciganConfig'"), 'Comcigan per-browser config must remain separate from main state');
console.log('v1 v28 shared-storage boundary verified without merging local-only privacy domains');
