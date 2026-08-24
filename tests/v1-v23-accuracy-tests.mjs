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
  'TeacherOSStorage.writeJSON(KEY,state)',
  "if(ext==='hwp')throw new Error('구형 HWP는 아직 직접 분석하지 않습니다.",
  "input.accept='.hwpx,.pdf,.xlsx,.xls,.csv,.txt,.docx,.pptx,.ics,.jpg,.jpeg,.png,.webp,.bmp'",
  '구형 HWP는 HWPX/PDF로 변환'
];
for(const token of required){
  if(!app.includes(token))throw new Error(`v1 v23 accuracy guard missing: ${token}`);
}
if(app.includes("input.accept='.hwp,"))throw new Error('v1 v23 must not advertise unsupported legacy HWP');
if(app.includes('localStorage.setItem(KEY')||app.includes('localStorage.getItem(KEY')){
  throw new Error('v1 v23 accuracy fix must preserve shared-storage boundary');
}
console.log('v1 v23 retry, truthful apply count, empty-result, legacy-HWP and shared-storage guards passed');
