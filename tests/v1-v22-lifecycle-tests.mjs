import fs from 'node:fs';

function ok(v,msg){if(!v)throw new Error(msg)}
const app=fs.readFileSync('app-v22.js','utf8');
ok(app.includes('TeacherOSLifecycle'),'prepared v22 must use shared lifecycle');
ok(app.includes('lifecycle22.onRender'),'v22 lifecycle render subscription missing');
ok(!app.includes('const prevRender=globalThis.render'),'v22 still chains the historical global render wrapper');
ok(app.includes('fallbackRender22'),'v22 isolated-test fallback missing');
ok(app.includes('ensureUI();wrapJSONImport();renderRecovery()'),'v22 recovery refresh behavior missing');
ok(app.includes("indexedDB.open(DB_NAME,DB_VERSION)"),'v22 recovery IndexedDB boundary changed');
ok(app.includes("createSnapshot('preRestore')"),'v22 pre-restore snapshot guard changed');
ok(app.includes('TeacherOSStorage.writeJSON(DATA_KEY,obj)'),'v22 restore no longer uses shared storage');
console.log('v1 v22 local recovery shared lifecycle migration tests passed');
