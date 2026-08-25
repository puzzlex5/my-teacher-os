import fs from 'node:fs';

const path='app-v14.js';
let src=fs.readFileSync(path,'utf8');

function replaceOnce(label,from,to){
  if(src.includes(to))return;
  if(!src.includes(from))throw new Error(`v1 Comcigan source preparation failed (${label})`);
  src=src.replace(from,to);
}

replaceOnce(
  'collector status helpers',
  "  function sameConfig(p,c){if(!p||!completeConfig(c))return false;return Number(p.schoolCode)===Number(c.schoolCode)&&Number(p.teacherIndex)===Number(c.teacherIndex)}",
  "  function sameConfig(p,c){if(!p||!completeConfig(c))return false;return Number(p.schoolCode)===Number(c.schoolCode)&&Number(p.teacherIndex)===Number(c.teacherIndex)}\n  const SHARED_COLLECTOR_AVAILABLE_14=false;\n  async function collectorStatus14(){try{const r=await fetch('./live/comcigan-status.json?v='+Date.now(),{cache:'no-store'});if(!r.ok)return null;const s=await r.json();return s&&typeof s==='object'?s:null}catch{return null}}\n  function collectorMessage14(s){const d=String(s?.detail||''),c=String(s?.category||'');if(d==='teacher-name-multiple')return'컴시간에서 같은 이름의 교사가 여러 명 확인되어 자동 적용을 중단했습니다.';if(d==='teacher-index-name-mismatch')return'저장한 교사번호와 교사명이 현재 컴시간 정보와 일치하지 않아 자동 적용을 중단했습니다.';if(d==='teacher-not-resolved'||d==='teacher-data-missing'||c==='teacher-resolution')return'저장한 교사를 현재 컴시간 정보에서 확인하지 못했습니다.';if(d==='collector-init'||d==='collector-fetch'||c==='network')return'컴시간 수집 연결 단계에서 최신표를 확인하지 못했습니다.';if(d==='timetable-empty'||c==='empty')return'컴시간에서 적용 가능한 시간표 항목을 확인하지 못했습니다.';if(d==='parser-import'||d==='parser-export'||c==='parser')return'컴시간 데이터 해석 모듈을 준비하지 못해 최신표를 적용하지 않았습니다.';if(d==='config-invalid'||c==='config')return'자동수집 설정이 완전하지 않아 최신표를 가져오지 못했습니다.';return'컴시간 자동수집이 실패해 최신표를 확인하지 못했습니다.'}\n  function transportUnavailableMessage14(){return'개인정보 보호를 위해 1.0 미리보기는 공개 저장소 기반 개인 컴시간 수집을 사용하지 않습니다. 현재 시간표는 자동세팅에서 시간표 파일을 올려 적용하세요.'}"
);

replaceOnce(
  'missing feed reads sanitized status',
  "      const r=await fetch('./live/comcigan.json?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('아직 자동동기화 결과가 없습니다.');",
  "      const r=await fetch('./live/comcigan.json?v='+Date.now(),{cache:'no-store'});if(!r.ok){const s=await collectorStatus14(),transportUnavailable=!SHARED_COLLECTOR_AVAILABLE_14&&!s;const e=new Error(transportUnavailable?transportUnavailableMessage14():s?.status==='error'?collectorMessage14(s):'아직 자동동기화 결과가 없습니다.');e.code=transportUnavailable?'TRANSPORT_UNAVAILABLE':s?.status==='error'?'COLLECTOR_ERROR':'WAITING';e.collector=s;throw e}"
);

replaceOnce(
  'truthful collector failure state',
  "      y.comciganSync.lastChecked=new Date().toISOString();y.comciganSync.status=err?.code==='CONFIG_MISMATCH'?'mismatch':'waiting';localStorage.setItem(KEY,JSON.stringify(state));",
  "      const collectorError=err?.code==='COLLECTOR_ERROR',transportUnavailable=err?.code==='TRANSPORT_UNAVAILABLE';y.comciganSync.lastChecked=new Date().toISOString();y.comciganSync.status=err?.code==='CONFIG_MISMATCH'?'mismatch':collectorError?'collector-error':transportUnavailable?'transport-unavailable':'waiting';y.comciganSync.collectorCategory=collectorError?String(err.collector?.category||'runtime'):'';y.comciganSync.collectorDetail=collectorError?String(err.collector?.detail||'runtime'):'';localStorage.setItem(KEY,JSON.stringify(state));"
);

replaceOnce(
  'collector error render flags',
  "    const c=config||blankConfig(),configured=completeConfig(c),status=y.comciganSync.status||'unconfigured',ok=configured&&status==='ok',mismatch=configured&&status==='mismatch';",
  "    const c=config||blankConfig(),configured=completeConfig(c),status=y.comciganSync.status||'unconfigured',ok=configured&&status==='ok',mismatch=configured&&status==='mismatch',collectorError=configured&&status==='collector-error',transportUnavailable=configured&&status==='transport-unavailable',collectorInfo=collectorError?collectorMessage14({category:y.comciganSync.collectorCategory,detail:y.comciganSync.collectorDetail}):'';"
);

replaceOnce(
  'collector error visible copy',
  "${ok?'자동 적용 중':mismatch?'설정 불일치':configured?'수집 결과 확인 중':'개인 설정 필요'}</span><span class=\"live-source\">${!configured?'처음 사용하는 브라우저입니다. 내 학교·교사 설정을 먼저 저장하세요.':mismatch?'현재 수집 결과가 내 설정과 달라 적용하지 않았습니다.':'설정과 수집 결과가 일치할 때만 시간표를 적용합니다.'}",
  "${ok?'자동 적용 중':mismatch?'설정 불일치':collectorError?'수집 오류':transportUnavailable?'동기화 경로 미구성':configured?'수집 결과 확인 중':'개인 설정 필요'}</span><span class=\"live-source\">${!configured?'처음 사용하는 브라우저입니다. 내 학교·교사 설정을 먼저 저장하세요.':mismatch?'현재 수집 결과가 내 설정과 달라 적용하지 않았습니다.':collectorError?esc(collectorInfo):transportUnavailable?esc(transportUnavailableMessage14()):'설정과 수집 결과가 일치할 때만 시간표를 적용합니다.'}"
);

replaceOnce(
  'disable impossible refresh action',
  "<button class=\"btn secondary tiny\" id=\"plainSyncNow\" type=\"button\" ${configured?'':'disabled'}>최신표 다시 불러오기</button>",
  "<button class=\"btn secondary tiny\" id=\"plainSyncNow\" type=\"button\" ${configured&&!transportUnavailable?'':'disabled'}>${transportUnavailable?'동기화 경로 필요':'최신표 다시 불러오기'}</button>"
);

for(const token of ['./live/comcigan-status.json','SHARED_COLLECTOR_AVAILABLE_14=false','TRANSPORT_UNAVAILABLE','transport-unavailable','동기화 경로 미구성','transportUnavailableMessage14','COLLECTOR_ERROR','collector-error','수집 오류','collectorMessage14','collector-fetch','parser-export','timetable-empty','config-invalid']){
  if(!src.includes(token))throw new Error(`prepared v1 Comcigan truth state missing: ${token}`);
}
fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 Comcigan UI to distinguish pending sync, sanitized collector failures, and intentionally unavailable shared transport.');
