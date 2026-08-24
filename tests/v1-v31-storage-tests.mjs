import fs from 'node:fs';

const app=fs.readFileSync('app-v31.js','utf8');
if(!app.includes('TeacherOSStorage.writeJSON(KEY,state)'))throw new Error('v31 shared state storage boundary missing');
if(app.includes('localStorage.setItem(KEY,JSON.stringify(state))'))throw new Error('v31 direct Teacher OS state write remains');
for(const token of ['myTeacherOS.sourceVault','indexedDB.open','PERSIST_KEY']){
  if(!app.includes(token))throw new Error(`v31 local vault boundary missing: ${token}`);
}
console.log('v1 v31 storage boundary tests passed');
