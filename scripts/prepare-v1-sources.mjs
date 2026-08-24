import fs from 'node:fs';

const path='app-v23.js';
let src=fs.readFileSync(path,'utf8');

function replaceOnce(label,from,to){
  if(!src.includes(from)){
    if(src.includes(to))return;
    throw new Error(`v1 source preparation failed (${label}): expected source pattern not found`);
  }
  src=src.replace(from,to);
}

replaceOnce(
  'retry only after applied data',
  "  function isDuplicate23(hash,y){return !!hash&&(y?.imports||[]).some(x=>x.hash===hash)}",
  "  function derivedSourceCount23(y,source){if(!y||!source)return 0;return['calendarEvents','timetable','assessments','projects'].reduce((n,k)=>n+(Array.isArray(y[k])?y[k].filter(x=>x?.source===source).length:0),0)}\n  function duplicateImport23(hash,y){return !!hash?(y?.imports||[]).find(x=>x.hash===hash&&x.status!=='ignored'&&x.status!=='superseded')||null:null}\n  function isDuplicate23(hash,y){const prev=duplicateImport23(hash,y);if(!prev)return false;return derivedSourceCount23(y,prev.name)>0||Number(prev.appliedCount||0)>0}"
);

replaceOnce(
  'duplicate status wording',
  '이미 같은 내용의 파일을 분석했습니다.',
  '이미 반영된 같은 내용의 파일입니다.'
);
replaceOnce(
  'empty extraction warning',
  "const conf=Math.round((r.doc?.confidence||0)*100),quality=Math.round((r.quality||0)*100),warn=r.doc?.classId==='student'?' · 학생자료는 자동 적용 차단':'';",
  "const conf=Math.round((r.doc?.confidence||0)*100),quality=Math.round((r.quality||0)*100),warn=r.doc?.classId==='student'?' · 학생자료는 자동 적용 차단':!r.count?' · 자동세팅 항목 미검출':'';"
);
replaceOnce(
  'empty extraction badge',
  "<span class=\"pill ${conf<82?'warn':''}\">",
  "<span class=\"pill ${conf<82||!r.count?'warn':''}\">"
);
replaceOnce(
  'legacy HWP extraction guard',
  "    const ext=ext23(file);if(['jpg','jpeg','png','webp','bmp'].includes(ext)){",
  "    const ext=ext23(file);if(ext==='hwp')throw new Error('구형 HWP는 아직 직접 분석하지 않습니다. 한글에서 HWPX 또는 PDF로 저장한 뒤 다시 올려 주세요.');if(['jpg','jpeg','png','webp','bmp'].includes(ext)){"
);
replaceOnce(
  'legacy HWP accept list',
  "if(input)input.accept='.hwp,.hwpx,.pdf,.xlsx,.xls,.csv,.txt,.docx,.pptx,.ics,.jpg,.jpeg,.png,.webp,.bmp';",
  "if(input)input.accept='.hwpx,.pdf,.xlsx,.xls,.csv,.txt,.docx,.pptx,.ics,.jpg,.jpeg,.png,.webp,.bmp';"
);
replaceOnce(
  'legacy HWP support wording',
  "if(small)small.textContent='HWP · HWPX · PDF(스캔 포함) · Excel · DOCX · PPTX · ICS · 이미지';",
  "if(small)small.textContent='HWPX · PDF(스캔 포함) · Excel · DOCX · PPTX · ICS · 이미지 · 구형 HWP는 HWPX/PDF로 변환';"
);

replaceOnce(
  'analysis metadata',
  "if(!y.imports.some(x=>x.hash===hash))y.imports.push({id:id23(),name:file.name,hash,kind:'지능형 자동분류',docClass:doc.classId,docLabel:doc.label,confidence:doc.confidence,extractMethod:extracted.method,when:new Date().toLocaleString('ko-KR')});return report",
  "let imp=(y.imports||[]).find(x=>x.hash===hash);if(!imp){imp={id:id23(),name:file.name,hash,kind:'지능형 자동분류',when:new Date().toLocaleString('ko-KR')};y.imports.push(imp)}Object.assign(imp,{name:file.name,docClass:doc.classId,docLabel:doc.label,confidence:doc.confidence,extractMethod:extracted.method,analysisStatus:got.length?'candidates':'no-candidates',candidateCount:got.length,autoCandidateCount:report.autoCount,extractionQuality:quality,lastAnalyzedAt:new Date().toISOString(),lastBatchId:batchId});return report"
);

replaceOnce(
  'truthful auto apply accounting',
  "  function applyCurrentAuto23(batchId){const preserve=new Map();let auto=0;(suggestions||[]).forEach(s=>{if(s.v23BatchId===batchId){s.checked=!!s.v23Auto;if(s.checked)auto++}else{preserve.set(s.id,!!s.checked);s.checked=false}});if(auto)applySuggestions();(suggestions||[]).forEach(s=>{if(preserve.has(s.id))s.checked=preserve.get(s.id)});renderSuggestions();return auto}",
  "  function applyCurrentAuto23(batchId){const preserve=new Map(),attempted=[];(suggestions||[]).forEach(s=>{if(s.v23BatchId===batchId){s.checked=!!s.v23Auto;if(s.checked)attempted.push(s)}else{preserve.set(s.id,!!s.checked);s.checked=false}});if(attempted.length)applySuggestions();const remainingIds=new Set((suggestions||[]).map(s=>s.id)),applied=attempted.filter(s=>!remainingIds.has(s.id)),blocked=attempted.length-applied.length,y=cur();const bySource=new Map();applied.forEach(s=>bySource.set(s.source,(bySource.get(s.source)||0)+1));for(const [source,n] of bySource){const imp=[...(y?.imports||[])].reverse().find(x=>x.name===source&&x.lastBatchId===batchId);if(imp){imp.appliedCount=Number(imp.appliedCount||0)+n;imp.lastAppliedAt=new Date().toISOString();imp.analysisStatus='applied'}}(suggestions||[]).forEach(s=>{if(preserve.has(s.id))s.checked=preserve.get(s.id)});renderSuggestions();return{attempted:attempted.length,applied:applied.length,blocked}}"
);

const batchStart="const auto=applyCurrentAuto23(batchId),review=(suggestions||[]).filter(s=>s.v23BatchId===batchId).length;";
if(src.includes(batchStart)){
  const start=src.indexOf(batchStart);
  const end=src.indexOf("const pn=q('#privacyNotice');",start);
  if(end<0)throw new Error('v1 source preparation failed (batch status): privacy notice marker missing');
  const replacement="const auto=applyCurrentAuto23(batchId),review=(suggestions||[]).filter(s=>s.v23BatchId===batchId).length;const fails=batch.filter(r=>r.error).length,dups=batch.filter(r=>r.duplicate).length,empty=batch.filter(r=>!r.error&&!r.duplicate&&!r.count).length;globalThis.TeacherOSStorage.writeJSON(KEY,state);setStatus23(`<b>${files.length}개 파일 처리 완료</b> · ${auto.applied}개 자동 반영 · ${review}개 확인 필요${auto.blocked?` · 자동 보류 ${auto.blocked}개`:''}${empty?` · 항목 미검출 ${empty}개`:''}${dups?` · 이미 반영된 중복 ${dups}개`:''}${fails?` · 실패 ${fails}개`:''}`);";
  src=src.slice(0,start)+replacement+src.slice(end);
}else if(!src.includes('${auto.applied}개 자동 반영')){
  throw new Error('v1 source preparation failed (batch status): expected source pattern not found');
}

const required=[
  'derivedSourceCount23',
  'duplicateImport23',
  'Number(prev.appliedCount||0)>0',
  "analysisStatus:got.length?'candidates':'no-candidates'",
  'auto.applied}개 자동 반영',
  'auto.blocked',
  '항목 미검출',
  'TeacherOSStorage.writeJSON(KEY,state)',
  "if(ext==='hwp')throw new Error('구형 HWP는 아직 직접 분석하지 않습니다.",
  "input.accept='.hwpx,.pdf,.xlsx,.xls,.csv,.txt,.docx,.pptx,.ics,.jpg,.jpeg,.png,.webp,.bmp'",
  '구형 HWP는 HWPX/PDF로 변환'
];
for(const token of required)if(!src.includes(token))throw new Error(`v1 prepared v23 missing: ${token}`);
if(src.includes("input.accept='.hwp,"))throw new Error('v1 prepared v23 still advertises unsupported legacy HWP');
if(src.includes('localStorage.setItem(KEY')||src.includes('localStorage.getItem(KEY'))throw new Error('v1 prepared v23 bypasses shared storage');

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v23 with main accuracy fixes, truthful HWP intake, and shared storage.');

const path28='app-v28.js';
let src28=fs.readFileSync(path28,'utf8');
const directStateWrite28='localStorage.setItem(KEY,JSON.stringify(state))';
const sharedStateWrite28='globalThis.TeacherOSStorage.writeJSON(KEY,state)';
if(src28.includes(directStateWrite28)){
  const count=src28.split(directStateWrite28).length-1;
  if(count!==1)throw new Error(`v1 source preparation failed (v28 calendar Undo storage): expected 1 direct state write, found ${count}`);
  src28=src28.replace(directStateWrite28,sharedStateWrite28);
}else if(!src28.includes(sharedStateWrite28)){
  throw new Error('v1 source preparation failed (v28 calendar Undo storage): expected source pattern not found');
}
if(src28.includes('localStorage.setItem(KEY,JSON.stringify(state))'))throw new Error('v1 prepared v28 bypasses shared storage');
for(const token of ['CAL_HISTORY_KEY','CONTACT_KEY','COMCIGAN_KEY','globalThis.TeacherOSStorage.writeJSON(KEY,state)']){
  if(!src28.includes(token))throw new Error(`v1 prepared v28 missing: ${token}`);
}
fs.writeFileSync(path28,src28,'utf8');
console.log('Prepared v1 app-v28 calendar Undo restore through shared storage while preserving local-only keys.');

const path30='app-v30.js';
let src30=fs.readFileSync(path30,'utf8');
const directSave30="function saveState30(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}";
const sharedSave30="function saveState30(){try{globalThis.TeacherOSStorage.writeJSON(KEY,state);return true}catch(e){console.error('Teacher OS v30 state save failed',e);return false}}";
if(src30.includes(directSave30))src30=src30.replace(directSave30,sharedSave30);
else if(!src30.includes(sharedSave30))throw new Error('v1 source preparation failed (v30 document state storage): expected source pattern not found');
if(src30.includes('localStorage.setItem(KEY,JSON.stringify(state))')||src30.includes('localStorage.getItem(KEY)'))throw new Error('v1 prepared v30 bypasses shared state storage');
for(const token of ['HISTORY_KEY','writeHistory','snapshotBeforeReplace','globalThis.TeacherOSStorage.writeJSON(KEY,state)']){
  if(!src30.includes(token))throw new Error(`v1 prepared v30 missing: ${token}`);
}
fs.writeFileSync(path30,src30,'utf8');
console.log('Prepared v1 app-v30 document-version state through shared storage while preserving local Undo history.');

const path31='app-v31.js';
let src31=fs.readFileSync(path31,'utf8');
const directSave31="function save31(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){console.error('v31 state save',e);return false}}";
const sharedSave31="function save31(){try{globalThis.TeacherOSStorage.writeJSON(KEY,state);return true}catch(e){console.error('v31 state save',e);return false}}";
if(src31.includes(directSave31))src31=src31.replace(directSave31,sharedSave31);
else if(!src31.includes(sharedSave31))throw new Error('v1 source preparation failed (v31 retention state storage): expected source pattern not found');
if(src31.includes('localStorage.setItem(KEY,JSON.stringify(state))')||src31.includes('localStorage.getItem(KEY)'))throw new Error('v1 prepared v31 bypasses shared state storage');
for(const token of ['DB_NAME','PERSIST_KEY','indexedDB.open(DB_NAME,1)','globalThis.TeacherOSStorage.writeJSON(KEY,state)']){
  if(!src31.includes(token))throw new Error(`v1 prepared v31 missing: ${token}`);
}
fs.writeFileSync(path31,src31,'utf8');
console.log('Prepared v1 app-v31 retention metadata through shared storage while preserving IndexedDB original vault and device-local persistence state.');
