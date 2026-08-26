import fs from 'node:fs';

const path='app-v27.js';
let src=fs.readFileSync(path,'utf8');

const helper="  function truth27(y,d){const T=globalThis.TeacherOSDataTruth;return T&&typeof T.nextLessonTruth==='function'?T.nextLessonTruth(y,d):null}\n";
if(!src.includes('function truth27(y,d)')){
  const anchor="  function currentDate(){return D.iso(new Date())}\n";
  if(!src.includes(anchor))throw new Error('v1 v27 truth preparation failed: helper anchor missing');
  src=src.replace(anchor,anchor+helper);
}

const old="const d=D.lessonContext(y,new Date());if(!d.slot){box.innerHTML=`<div class=\"desk-next-top27\"><span class=\"desk-status27\">${d.status==='done'?'오늘 수업 완료':'다음 수업 없음'}</span><span class=\"mini\">${esc(d.source)}</span></div><h3>${d.status==='done'?'오늘 예정된 수업이 끝났습니다.':'오늘 등록된 수업이 없습니다.'}</h3><div class=\"desk-next-foot27\"><button type=\"button\" class=\"btn secondary tiny\" data-go27=\"timetable\">시간표 확인</button></div>`;return}";
const replacement="const d=D.lessonContext(y,new Date()),truth=truth27(y,d);if(truth&&!truth.known){box.innerHTML=`<div class=\"desk-next-top27\"><span class=\"desk-status27\">${esc(truth.label||'시간표 미확인')}</span><span class=\"mini\">확정 가능한 시간표 없음</span></div><h3>오늘 수업 여부를 확정할 수 없습니다.</h3><div class=\"desk-progress27\"><span>${truth.reason==='collector-error'?'컴시간 수집기가 최신표를 가져오지 못했습니다. 이전 표를 현재표로 간주하지 않습니다.':truth.reason==='transport-unavailable'?'컴시간 동기화 경로가 구성되지 않았습니다. 이전 표를 현재표로 간주하지 않습니다.':'컴시간 실제표와 기본 시간표가 모두 확인되지 않았습니다. 0건으로 처리하지 않습니다.'}</span></div><div class=\"desk-next-foot27\"><button type=\"button\" class=\"btn secondary tiny\" data-go27=\"timetable\">시간표 확인</button></div>`;return}if(!d.slot){box.innerHTML=`<div class=\"desk-next-top27\"><span class=\"desk-status27\">${d.status==='done'?'오늘 수업 완료':'다음 수업 없음'}</span><span class=\"mini\">${esc(d.source)}</span></div><h3>${d.status==='done'?'오늘 예정된 수업이 끝났습니다.':'오늘 등록된 수업이 없습니다.'}</h3><div class=\"desk-next-foot27\"><button type=\"button\" class=\"btn secondary tiny\" data-go27=\"timetable\">시간표 확인</button></div>`;return}";

if(src.includes(old))src=src.replace(old,replacement);
else if(!src.includes("const d=D.lessonContext(y,new Date()),truth=truth27(y,d);"))throw new Error('v1 v27 truth preparation failed: renderNext anchor missing');

for(const token of [
  'function truth27(y,d)',
  "T.nextLessonTruth(y,d)",
  "truth&&!truth.known",
  '오늘 수업 여부를 확정할 수 없습니다.',
  "truth.reason==='transport-unavailable'",
  '이전 표를 현재표로 간주하지 않습니다.'
]){
  if(!src.includes(token))throw new Error(`v1 prepared v27 truth guard missing: ${token}`);
}

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 Teacher Desk to render unknown timetable truth before any later correction layer.');
