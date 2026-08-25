import fs from 'node:fs';
import assert from 'node:assert/strict';

const app=fs.readFileSync('app-v23.js','utf8');
function extract(name,next){
  const start=app.indexOf(`  function ${name}`);
  const end=app.indexOf(`  function ${next}`,start+1);
  if(start<0||end<0)throw new Error(`cannot extract ${name}`);
  return app.slice(start,end).trim();
}
const materializedSrc=extract('suggestionMaterialized23(y,s)','suggestionEquivalent23(y,s)');
const equivalentSrc=extract('suggestionEquivalent23(y,s)','applyCurrentAuto23(batchId)');
const helpers=new Function(`${materializedSrc}\n${equivalentSrc}\nreturn {suggestionMaterialized23,suggestionEquivalent23};`)();
const {suggestionMaterialized23,suggestionEquivalent23}=helpers;

const suggestion={kind:'calendar',source:'2026학사일정_수정본.pdf',date:'2026-09-03',title:'학교축제'};
const oldSourceState={calendarEvents:[{source:'2026학사일정.pdf',date:'2026-09-03',title:'학교축제'}]};
assert.equal(suggestionMaterialized23(oldSourceState,suggestion),false,'different provenance must not count as newly materialized source data');
assert.equal(suggestionEquivalent23(oldSourceState,suggestion),true,'same semantic event from another source must count as already present, not blocked');

const replacedState={calendarEvents:[{source:suggestion.source,date:suggestion.date,title:suggestion.title}]};
assert.equal(suggestionMaterialized23(replacedState,suggestion),true,'version replacement that creates the new provenance must count as applied');
assert.equal(suggestionEquivalent23(replacedState,suggestion),true);

const missingState={calendarEvents:[]};
assert.equal(suggestionMaterialized23(missingState,suggestion),false);
assert.equal(suggestionEquivalent23(missingState,suggestion),false,'missing semantic data must remain blocked when apply does not materialize it');

const timetable={kind:'timetable',source:'교사시간표_수정.xlsx',day:'월',period:2,title:'2-3 음악'};
const timetableExisting={timetable:[{source:'교사시간표.xlsx',day:'월',period:2,label:'2-3 음악'}]};
assert.equal(suggestionMaterialized23(timetableExisting,timetable),false);
assert.equal(suggestionEquivalent23(timetableExisting,timetable),true,'equivalent timetable slot from another source must be recognized');

const assessment={kind:'assessment',source:'평가계획_수정.hwpx',title:'합주 수행평가',date:'2026-10-15'};
const assessmentExisting={assessments:[{source:'평가계획.hwpx',name:'합주 수행평가',due:'2026-10-15'}]};
assert.equal(suggestionMaterialized23(assessmentExisting,assessment),false);
assert.equal(suggestionEquivalent23(assessmentExisting,assessment),true,'equivalent assessment from another source must be recognized');

for(const token of [
  'const sourceBefore=new Map',
  '!sourceBefore.get(s.id)&&suggestionMaterialized23(y,s)',
  '!suggestionMaterialized23(y,s)&&suggestionEquivalent23(y,s)',
  '!suggestionMaterialized23(y,s)&&!suggestionEquivalent23(y,s)'
])assert.ok(app.includes(token),`apply outcome classifier missing ${token}`);

console.log('v1 v23 applied/equivalent/blocked outcome behavior passed');
