import fs from 'node:fs';

const src=fs.readFileSync('app-v23.js','utf8');
const required=[
  'derivedSourceCount23',
  'duplicateImport23',
  'Number(prev.appliedCount||0)>0',
  "analysisStatus:got.length?'candidates':'no-candidates'",
  '${auto.applied}개 자동 반영',
  'auto.blocked',
  '항목 미검출',
  '이미 반영된 같은 내용의 파일입니다.'
];
for(const token of required){
  if(!src.includes(token))throw new Error(`v1 raw v23 source is behind stable accuracy baseline: ${token}`);
}
const forbidden=[
  "function isDuplicate23(hash,y){return !!hash&&(y?.imports||[]).some(x=>x.hash===hash)}",
  '${auto}개 자동 적용 · ${review}개 검토',
  '이미 같은 내용의 파일을 분석했습니다.'
];
for(const token of forbidden){
  if(src.includes(token))throw new Error(`v1 raw v23 source regressed to pre-fix intake behavior: ${token}`);
}
console.log('v1 raw v23 source carries stable-main intake accuracy baseline');
