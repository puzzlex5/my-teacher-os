import assert from 'node:assert/strict';
import fs from 'node:fs';

const src=fs.readFileSync('app-v30.js','utf8');
assert.ok(src.includes("globalThis.TeacherOSStorage.writeJSON(KEY,state)"),'v30 state writes must use shared storage');
assert.ok(!src.includes('localStorage.setItem(KEY,JSON.stringify(state))'),'v30 must not write Teacher OS state directly');
assert.ok(!src.includes('localStorage.getItem(KEY)'),'v30 must not read Teacher OS state directly');
assert.ok(src.includes("const HISTORY_KEY='myTeacherOS.importVersionHistory.v1'"),'document-version Undo history remains a separate local key');
assert.ok(src.includes('localStorage.setItem(HISTORY_KEY'),'Undo history remains local-only and separate from Teacher OS state');
assert.ok(src.includes('return writeHistory(h)'),'Undo snapshot persistence result remains propagated');
assert.ok(src.includes('if(!snapshotBeforeReplace(y,newImport,oldImports))'),'replacement still fails closed when Undo history cannot be saved');
console.log('v1 v30 shared-storage boundary tests passed');
