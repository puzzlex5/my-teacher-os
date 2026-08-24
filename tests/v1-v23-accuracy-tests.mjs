import fs from 'node:fs';

const app=fs.readFileSync('app-v23.js','utf8');
const required=[
  'derivedSourceCount23',
  'duplicateImport23',
  "return derivedSourceCount23(y,prev.name)>0||Number(prev.appliedCount||0)>0",
  "analysisStatus:got.length?'candidates':'no-candidates'",
  'appliedCount',
  '${auto.applied}개 자동 반영',
  '${auto.blocked?` · 자동 보류 ${auto.blocked}개`',
  '${empty?` · 항목 미검출 ${empty}개`',
  'TeacherOSStorage.writeJSON(KEY,state)'
];
for(const token of required){
  if(!app.includes(token))throw new Error(`v1 v23 accuracy guard missing: ${token}`);
}
if(app.includes('localStorage.setItem(KEY')||app.includes('localStorage.getItem(KEY')){
  throw new Error('v1 v23 accuracy fix must preserve shared-storage boundary');
}
console.log('v1 v23 retry, truthful apply count, empty-result and shared-storage guards passed');
