import fs from 'node:fs';

const path='app-v28.js';
let src=fs.readFileSync(path,'utf8');

function replaceOnce(before,after,label){
  if(src.includes(after))return;
  if(!src.includes(before))throw new Error(`v1 v28 preparation failed: missing ${label}`);
  src=src.replace(before,after);
}

const legacy="  bind28();refresh28();\n  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);refresh28();return r};\n  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='studentrecords'||id==='calendar'||id==='dashboard')refresh28();return r};";
const prepared="  bind28();refresh28();\n  const lifecycle28=globalThis.TeacherOSLifecycle;if(lifecycle28?.onRender&&lifecycle28?.onSwitch){lifecycle28.onRender(()=>refresh28());lifecycle28.onSwitch(id=>{if(id==='studentrecords'||id==='calendar'||id==='dashboard')refresh28()})}else{const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);refresh28();return r};const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='studentrecords'||id==='calendar'||id==='dashboard')refresh28();return r}};";

if(src.includes(legacy))src=src.replace(legacy,prepared);
else if(!src.includes('const lifecycle28=globalThis.TeacherOSLifecycle'))throw new Error('v1 v28 lifecycle preparation failed: expected wrapper block not found');

replaceOnce(
  "  const COMCIGAN_KEY='myTeacherOS.comciganConfig';\n",
  "  const COMCIGAN_KEY='myTeacherOS.comciganConfig';\n  let calHistoryLoadFailed28=false;\n",
  'calendar history load-state declaration'
);

replaceOnce(
  "  function readCalHistory28(){try{const x=JSON.parse(localStorage.getItem(CAL_HISTORY_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}\n  function writeCalHistory28(a){localStorage.setItem(CAL_HISTORY_KEY,JSON.stringify((a||[]).slice(-20)))}",
  "  function readCalHistory28(){let raw;try{raw=localStorage.getItem(CAL_HISTORY_KEY)}catch{calHistoryLoadFailed28=true;return[]}if(raw===null){calHistoryLoadFailed28=false;return[]}try{const x=JSON.parse(raw);if(!Array.isArray(x))throw new Error('invalid-calendar-history-shape');calHistoryLoadFailed28=false;return x}catch{calHistoryLoadFailed28=true;return[]}}\n  function writeCalHistory28(a){if(calHistoryLoadFailed28)throw new Error('기존 일정 수정 이력을 불러오지 못해 덮어쓰기를 중단했습니다.');const next=Array.isArray(a)?a.slice(-20):[];localStorage.setItem(CAL_HISTORY_KEY,JSON.stringify(next))}\n  function resetCalHistory28(){localStorage.removeItem(CAL_HISTORY_KEY);calHistoryLoadFailed28=false}",
  'calendar history fail-closed storage helpers'
);

replaceOnce(
  "    pushCalendarHistory28({year:y.year,eventId:id,before:old,savedAt:new Date().toISOString()});",
  "    const historyEvent={year:y.year,eventId:id,before:old,savedAt:new Date().toISOString()};try{pushCalendarHistory28(historyEvent)}catch{const reset=confirm('저장된 일정 수정 이력을 불러오지 못했습니다. 손상된 이력을 삭제하고 이번 수정부터 새 Undo 이력을 시작할까요?');if(reset){try{resetCalHistory28();pushCalendarHistory28(historyEvent);return}catch{}}ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation?.();alert('일정 수정 이력을 보존할 수 없어 이번 저장을 중단했습니다. 브라우저 저장소를 복구한 뒤 다시 시도하세요.')}\n",
  'calendar edit fail-closed history capture'
);

replaceOnce(
  "  function renderCalendarUndo28(){ensureCalendarUndo28();const b=q('#calendarUndo28');if(!b)return;const a=historyForYear28();b.disabled=!a.length;b.title=a.length?`최근 수정 ${a.length}건을 로컬에 보관 중`:'되돌릴 일정 수정 이력이 없습니다.'}",
  "  function renderCalendarUndo28(){ensureCalendarUndo28();const b=q('#calendarUndo28');if(!b)return;const a=historyForYear28();b.disabled=calHistoryLoadFailed28||!a.length;b.textContent=calHistoryLoadFailed28?'일정 수정 이력 확인 필요':'최근 일정 수정 되돌리기';b.title=calHistoryLoadFailed28?'저장된 일정 수정 이력을 불러오지 못했습니다. 다음 일정 수정 시 복구 여부를 확인합니다.':a.length?`최근 수정 ${a.length}건을 로컬에 보관 중`:'되돌릴 일정 수정 이력이 없습니다.'}",
  'calendar undo explicit unreadable state'
);

replaceOnce(
  "  function undoCalendar28(){\n    const y=y28();if(!y)return;const all=readCalHistory28();let idx=-1;",
  "  function undoCalendar28(){\n    const y=y28();if(!y)return;const all=readCalHistory28();if(calHistoryLoadFailed28){alert('저장된 일정 수정 이력을 불러오지 못했습니다. 데이터가 손상됐을 수 있어 Undo를 실행하지 않았습니다.');return}let idx=-1;",
  'calendar undo fail-closed unreadable guard'
);

for(const token of [
  'const lifecycle28=globalThis.TeacherOSLifecycle',
  'lifecycle28.onRender(()=>refresh28())',
  "lifecycle28.onSwitch(id=>{if(id==='studentrecords'||id==='calendar'||id==='dashboard')refresh28()})",
  'if(lifecycle28?.onRender&&lifecycle28?.onSwitch)',
  'calHistoryLoadFailed28=false',
  "if(!Array.isArray(x))throw new Error('invalid-calendar-history-shape')",
  "if(calHistoryLoadFailed28)throw new Error('기존 일정 수정 이력을 불러오지 못해 덮어쓰기를 중단했습니다.')",
  'function resetCalHistory28(){localStorage.removeItem(CAL_HISTORY_KEY);calHistoryLoadFailed28=false}',
  "b.textContent=calHistoryLoadFailed28?'일정 수정 이력 확인 필요':'최근 일정 수정 되돌리기'",
  "if(calHistoryLoadFailed28){alert('저장된 일정 수정 이력을 불러오지 못했습니다. 데이터가 손상됐을 수 있어 Undo를 실행하지 않았습니다.');return}",
  "손상된 이력을 삭제하고 이번 수정부터 새 Undo 이력을 시작할까요?"
])if(!src.includes(token))throw new Error(`v1 prepared v28 missing token: ${token}`);

if(src.includes("JSON.parse(localStorage.getItem(CAL_HISTORY_KEY)||'[]')"))throw new Error('v1 prepared v28 still collapses unreadable calendar history into empty');

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v28 precision UI on shared lifecycle hooks with fail-closed calendar Undo history recovery.');
