import fs from 'node:fs';

const path='app-v23.js';
let src=fs.readFileSync(path,'utf8');

const oldFn="  function applyCurrentAuto23(batchId){const preserve=new Map(),attempted=[];(suggestions||[]).forEach(s=>{if(s.v23BatchId===batchId){s.checked=!!s.v23Auto;if(s.checked)attempted.push(s)}else{preserve.set(s.id,!!s.checked);s.checked=false}});if(attempted.length)applySuggestions();const remainingIds=new Set((suggestions||[]).map(s=>s.id)),applied=attempted.filter(s=>!remainingIds.has(s.id)),blocked=attempted.length-applied.length,y=cur();const bySource=new Map();applied.forEach(s=>bySource.set(s.source,(bySource.get(s.source)||0)+1));for(const [source,n] of bySource){const imp=[...(y?.imports||[])].reverse().find(x=>x.name===source&&x.lastBatchId===batchId);if(imp){imp.appliedCount=Number(imp.appliedCount||0)+n;imp.lastAppliedAt=new Date().toISOString();imp.analysisStatus='applied'}}(suggestions||[]).forEach(s=>{if(preserve.has(s.id))s.checked=preserve.get(s.id)});renderSuggestions();return{attempted:attempted.length,applied:applied.length,blocked}}";

const oldPreparedStart='  function suggestionMaterialized23(y,s)';
const newFn="  function suggestionMaterialized23(y,s){if(!y||!s)return false;if(s.kind==='profile'){if(s.profileType==='office')return y.educationOffice===s.title;if(s.profileType==='school')return y.schoolName===s.title;return false}if(s.kind==='calendar')return !!s.date&&(y.calendarEvents||[]).some(x=>x.source===s.source&&x.date===s.date&&x.title===s.title);if(s.kind==='timetable')return(y.timetable||[]).some(x=>x.source===s.source&&x.day===s.day&&Number(x.period)===Number(s.period)&&x.label===(s.title||s.label));if(s.kind==='assessment')return(y.assessments||[]).some(x=>x.source===s.source&&x.name===s.title&&x.due===(s.date||''));if(s.kind==='admin')return(y.projects||[]).some(x=>x.source===s.source&&x.name===s.title&&x.due===(s.date||''));return false}\n  function suggestionEquivalent23(y,s){if(!y||!s)return false;if(s.kind==='profile')return suggestionMaterialized23(y,s);if(s.kind==='calendar')return !!s.date&&(y.calendarEvents||[]).some(x=>x.date===s.date&&x.title===s.title);if(s.kind==='timetable')return(y.timetable||[]).some(x=>x.day===s.day&&Number(x.period)===Number(s.period)&&x.label===(s.title||s.label));if(s.kind==='assessment')return(y.assessments||[]).some(x=>x.name===s.title&&x.due===(s.date||''));if(s.kind==='admin')return(y.projects||[]).some(x=>x.name===s.title&&x.due===(s.date||''));return false}\n  function applyCurrentAuto23(batchId){const preserve=new Map(),attempted=[],y=cur();(suggestions||[]).forEach(s=>{if(s.v23BatchId===batchId){s.checked=!!s.v23Auto;if(s.checked)attempted.push(s)}else{preserve.set(s.id,!!s.checked);s.checked=false}});const sourceBefore=new Map(attempted.map(s=>[s.id,suggestionMaterialized23(y,s)]));if(attempted.length)applySuggestions();const applied=attempted.filter(s=>!sourceBefore.get(s.id)&&suggestionMaterialized23(y,s)),unchanged=attempted.filter(s=>sourceBefore.get(s.id)||(!suggestionMaterialized23(y,s)&&suggestionEquivalent23(y,s))),blocked=attempted.filter(s=>!suggestionMaterialized23(y,s)&&!suggestionEquivalent23(y,s)),appliedIds=new Set(applied.map(s=>s.id)),unchangedIds=new Set(unchanged.map(s=>s.id)),sourceStats=new Map();attempted.forEach(s=>{const k=s.source||'',st=sourceStats.get(k)||{attempted:0,applied:0,unchanged:0,blocked:0};st.attempted++;if(appliedIds.has(s.id))st.applied++;else if(unchangedIds.has(s.id))st.unchanged++;else st.blocked++;sourceStats.set(k,st)});for(const [source,st] of sourceStats){const imp=[...(y?.imports||[])].reverse().find(x=>x.name===source&&x.lastBatchId===batchId);if(!imp)continue;imp.lastAutoAttemptedCount=st.attempted;imp.lastAppliedCount=st.applied;imp.lastUnchangedCount=st.unchanged;imp.lastBlockedCount=st.blocked;if(st.applied){imp.appliedCount=Number(imp.appliedCount||0)+st.applied;imp.lastAppliedAt=new Date().toISOString()}imp.analysisStatus=st.applied?(st.blocked?'applied-partial':'applied'):st.blocked?'blocked':st.unchanged?'already-present':imp.analysisStatus}(suggestions||[]).forEach(s=>{if(preserve.has(s.id))s.checked=preserve.get(s.id)});renderSuggestions();return{attempted:attempted.length,applied:applied.length,unchanged:unchanged.length,blocked:blocked.length}}";

if(src.includes(oldFn)){
  src=src.replace(oldFn,newFn);
}else if(src.includes(oldPreparedStart)){
  const start=src.indexOf(oldPreparedStart);
  const end=src.indexOf('  async function analyzeBatch23(){',start);
  if(start<0||end<0)throw new Error('v1 v23 materialized-count preparation failed: prepared function boundaries not found');
  const prepared=src.slice(start,end);
  const alreadyCurrent=prepared.includes('function suggestionEquivalent23(y,s)')&&prepared.includes('const sourceBefore=new Map')&&prepared.includes('suggestionEquivalent23(y,s)');
  if(!alreadyCurrent)src=src.slice(0,start)+newFn+'\n'+src.slice(end);
}else{
  throw new Error('v1 v23 materialized-count preparation failed: expected applyCurrentAuto23 source not found');
}

const oldStatus="${auto.applied}개 자동 반영 · ${review}개 확인 필요${auto.blocked?` · 자동 보류 ${auto.blocked}개`:''}";
const newStatus="${auto.applied}개 자동 반영 · ${review}개 확인 필요${auto.unchanged?` · 이미 존재 ${auto.unchanged}개`:''}${auto.blocked?` · 자동 보류 ${auto.blocked}개`:''}";
if(src.includes(oldStatus))src=src.replace(oldStatus,newStatus);
else if(!src.includes('auto.unchanged'))throw new Error('v1 v23 materialized-count preparation failed: expected status source not found');

for(const token of [
  'function suggestionMaterialized23(y,s)',
  'function suggestionEquivalent23(y,s)',
  "x.source===s.source&&x.date===s.date&&x.title===s.title",
  "x.source===s.source&&x.day===s.day",
  "x.source===s.source&&x.name===s.title&&x.due===(s.date||'')",
  "x.date===s.date&&x.title===s.title",
  "x.day===s.day&&Number(x.period)===Number(s.period)",
  "x.name===s.title&&x.due===(s.date||'')",
  'const sourceBefore=new Map',
  '!suggestionMaterialized23(y,s)&&suggestionEquivalent23(y,s)',
  '!suggestionMaterialized23(y,s)&&!suggestionEquivalent23(y,s)',
  'appliedIds=new Set',
  'sourceStats=new Map()',
  'lastAutoAttemptedCount=st.attempted',
  'lastAppliedCount=st.applied',
  'lastUnchangedCount=st.unchanged',
  'lastBlockedCount=st.blocked',
  "st.blocked?'applied-partial':'applied'",
  "st.blocked?'blocked':st.unchanged?'already-present'",
  'unchanged:unchanged.length',
  'blocked:blocked.length',
  '이미 존재 ${auto.unchanged}개'
])if(!src.includes(token))throw new Error(`v1 prepared v23 materialized-count missing: ${token}`);

if(src.includes('const remainingIds=new Set((suggestions||[]).map(s=>s.id))'))throw new Error('v1 prepared v23 still infers application from suggestion disappearance');

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v23 to distinguish newly materialized source data, equivalent existing data, and genuinely blocked auto-apply outcomes.');
