import fs from 'node:fs';

const path5='app-v05.js';
let src5=fs.readFileSync(path5,'utf8');
const old5=`function migrate(){
 state=state&&typeof state==='object'?state:fresh();state.version=5;state.years=state.years||{};
 Object.values(state.years).forEach(y=>{y.projects=arr(y.projects);y.assessments=arr(y.assessments);y.memories=arr(y.memories);y.tasks=arr(y.tasks);y.calendarEvents=arr(y.calendarEvents);y.timetable=arr(y.timetable);y.imports=arr(y.imports);y.clubs=arr(y.clubs);if(!y.clubs.length)y.clubs=defaultClubs();if(!y.educationOffice)y.educationOffice='경기도교육청';if(!arr(y.subjects).length)y.subjects=['음악'];if(y.lastBackupAt===undefined)y.lastBackupAt=null});
 localStorage.setItem(KEY,JSON.stringify(state));
}`;
const new5=`function migrate(){
 let changed=false;
 if(!(state&&typeof state==='object'&&!Array.isArray(state))){state=fresh();changed=true}
 const version=Math.max(Number(state.version)||0,5);if(state.version!==version){state.version=version;changed=true}
 if(!(state.years&&typeof state.years==='object'&&!Array.isArray(state.years))){state.years={};changed=true}
 Object.values(state.years).forEach(y=>{
  for(const k of ['projects','assessments','memories','tasks','calendarEvents','timetable','imports'])if(!Array.isArray(y[k])){y[k]=[];changed=true}
  if(!Array.isArray(y.clubs)){y.clubs=[];changed=true}if(!y.clubs.length){y.clubs=defaultClubs();changed=true}
  if(!y.educationOffice){y.educationOffice='경기도교육청';changed=true}
  if(!Array.isArray(y.subjects)||!y.subjects.length){y.subjects=['음악'];changed=true}
  if(y.lastBackupAt===undefined){y.lastBackupAt=null;changed=true}
 });
 if(changed)localStorage.setItem(KEY,JSON.stringify(state));
 return changed;
}`;
if(src5.includes(old5))src5=src5.replace(old5,new5);
else if(!src5.includes('const version=Math.max(Number(state.version)||0,5);'))throw new Error('v1 v05 preparation failed: bootstrap migrate block not found');
for(const token of [
  'const version=Math.max(Number(state.version)||0,5);',
  'if(state.version!==version){state.version=version;changed=true}',
  "if(!(state.years&&typeof state.years==='object'&&!Array.isArray(state.years))){state.years={};changed=true}",
  'if(changed)localStorage.setItem(KEY,JSON.stringify(state));',
  'return changed;'
])if(!src5.includes(token))throw new Error(`v1 prepared v05 missing: ${token}`);
if(src5.includes('state.version=5;'))throw new Error('v1 prepared v05 still downgrades the schema version during bootstrap');
fs.writeFileSync(path5,src5,'utf8');
console.log('Prepared v1 app-v05 with monotonic, change-only bootstrap schema migration.');

const path='app-v06.js';
let src=fs.readFileSync(path,'utf8');

const startMarker='  function migrateV6(){';
const endMarker='\n\n  switchView=function';
const preparedMarker='const version=Math.max(Number(state.version)||0,6);';

if(!src.includes(preparedMarker)){
  const start=src.indexOf(startMarker);
  const end=src.indexOf(endMarker,start);
  if(start<0||end<0)throw new Error('v1 v06 preparation failed: migrateV6 block not found');
  const replacement=`  function migrateV6(){
    let changed=false;
    const version=Math.max(Number(state.version)||0,6);
    if(state.version!==version){state.version=version;changed=true}
    Object.values(state.years||{}).forEach(y=>{
      if(!Array.isArray(y.timetable)){y.timetable=[];changed=true}
      if(!Array.isArray(y.calendarEvents)){y.calendarEvents=[];changed=true}
      if(!Array.isArray(y.timetableExceptions)){y.timetableExceptions=[];changed=true}
      if(!(y.classProgress&&typeof y.classProgress==='object'&&!Array.isArray(y.classProgress))){y.classProgress={};changed=true}
      if(!(y.paceStrategies&&typeof y.paceStrategies==='object'&&!Array.isArray(y.paceStrategies))){y.paceStrategies={};changed=true}
      y.calendarEvents.forEach(ev=>{if(!ev.scope){ev.scope='전체';changed=true}if(!ev.impact){ev.impact=V6.inferImpact(ev.title);changed=true}});
      y.timetable.forEach(s=>{if(!s.target){s.target=V6.targetFromLabel(s.label);changed=true}if(!s.subject){s.subject='음악';changed=true}if(s.time===undefined||s.time===null){s.time='';changed=true}});
      const grades=[...new Set(V6.classTargets(y.timetable).map(V6.gradeFromTarget))];
      grades.forEach(g=>{if(!y.paceStrategies[g]){y.paceStrategies[g]=V6.defaultPaceStrategy(y.schoolLevel,g);changed=true}});
    });
    if(changed)localStorage.setItem(KEY,JSON.stringify(state));
    return changed;
  }`;
  src=src.slice(0,start)+replacement+src.slice(end);
}

for(const token of [
  'const version=Math.max(Number(state.version)||0,6);',
  'if(state.version!==version){state.version=version;changed=true}',
  'if(changed)localStorage.setItem(KEY,JSON.stringify(state));',
  'return changed;'
])if(!src.includes(token))throw new Error(`v1 prepared v06 missing: ${token}`);
if(src.includes('state.version=6;'))throw new Error('v1 prepared v06 still downgrades the schema version on render');

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v06 with monotonic, change-only schema migration persistence.');

const path7='app-v07.js';
let src7=fs.readFileSync(path7,'utf8');
const old7="  function migrateV7(){state.version=7;Object.values(state.years||{}).forEach(y=>{y.liveTimetableWeeks=y.liveTimetableWeeks&&typeof y.liveTimetableWeeks==='object'&&!Array.isArray(y.liveTimetableWeeks)?y.liveTimetableWeeks:{};y.comciganSync=y.comciganSync&&typeof y.comciganSync==='object'?y.comciganSync:{lastChecked:null,lastApplied:null,status:'not-connected'}});localStorage.setItem(KEY,JSON.stringify(state))}";
const new7=`  function migrateV7(){
    let changed=false;
    const version=Math.max(Number(state.version)||0,7);
    if(state.version!==version){state.version=version;changed=true}
    Object.values(state.years||{}).forEach(y=>{
      if(!(y.liveTimetableWeeks&&typeof y.liveTimetableWeeks==='object'&&!Array.isArray(y.liveTimetableWeeks))){y.liveTimetableWeeks={};changed=true}
      if(!(y.comciganSync&&typeof y.comciganSync==='object'&&!Array.isArray(y.comciganSync))){y.comciganSync={lastChecked:null,lastApplied:null,status:'not-connected'};changed=true}
    });
    if(changed)localStorage.setItem(KEY,JSON.stringify(state));
    return changed;
  }`;
if(src7.includes(old7))src7=src7.replace(old7,new7);
else if(!src7.includes('const version=Math.max(Number(state.version)||0,7);'))throw new Error('v1 v07 preparation failed: migrateV7 block not found');
for(const token of [
  'const version=Math.max(Number(state.version)||0,7);',
  'if(state.version!==version){state.version=version;changed=true}',
  'if(changed)localStorage.setItem(KEY,JSON.stringify(state));',
  'return changed;'
])if(!src7.includes(token))throw new Error(`v1 prepared v07 missing: ${token}`);
if(src7.includes('state.version=7;'))throw new Error('v1 prepared v07 still downgrades the schema version on render');
fs.writeFileSync(path7,src7,'utf8');
console.log('Prepared v1 app-v07 with monotonic, change-only schema migration persistence.');

const path8='app-v08.js';
let src8=fs.readFileSync(path8,'utf8');
const old8=`  input.addEventListener('change',()=>{\n    if(input.files?.length)analyzeAndApply();\n  });\n  btn.onclick=analyzeAndApply;\n  btn.textContent='다시 분석';`;
const new8=`  function bindLegacyIntakeV8(){\n    if(input.dataset.v23)return;\n    input.addEventListener('change',()=>{\n      if(input.files?.length)analyzeAndApply();\n    });\n    btn.onclick=analyzeAndApply;\n  }\n  setTimeout(bindLegacyIntakeV8,0);\n  btn.textContent='다시 분석';`;
if(src8.includes(old8))src8=src8.replace(old8,new8);
else if(!src8.includes('function bindLegacyIntakeV8()')||!src8.includes('if(input.dataset.v23)return;'))throw new Error('v1 v08 preparation failed: intake binding block not found');
for(const token of ['function bindLegacyIntakeV8()','if(input.dataset.v23)return;',"input.addEventListener('change'",'setTimeout(bindLegacyIntakeV8,0)'])if(!src8.includes(token))throw new Error(`v1 prepared v08 missing: ${token}`);
fs.writeFileSync(path8,src8,'utf8');
console.log('Prepared v1 app-v08 to yield primary intake ownership to v23 while retaining a legacy fallback.');

const path9='app-v09.js';
let src9=fs.readFileSync(path9,'utf8');
const old9="  function migrate(){state.version=Math.max(Number(state.version)||0,9);Object.values(state.years||{}).forEach(y=>{y.lessonLogs=Array.isArray(y.lessonLogs)?y.lessonLogs:[];y.classProgress=y.classProgress&&typeof y.classProgress==='object'?y.classProgress:{}});localStorage.setItem(KEY,JSON.stringify(state))}";
const new9=`  function migrate(){
    let changed=false;
    const version=Math.max(Number(state.version)||0,9);
    if(state.version!==version){state.version=version;changed=true}
    Object.values(state.years||{}).forEach(y=>{
      if(!Array.isArray(y.lessonLogs)){y.lessonLogs=[];changed=true}
      if(!(y.classProgress&&typeof y.classProgress==='object'&&!Array.isArray(y.classProgress))){y.classProgress={};changed=true}
    });
    if(changed)localStorage.setItem(KEY,JSON.stringify(state));
    return changed;
  }`;
if(src9.includes(old9))src9=src9.replace(old9,new9);
else if(!src9.includes('const version=Math.max(Number(state.version)||0,9);'))throw new Error('v1 v09 preparation failed: migrate block not found');
for(const token of [
  'const version=Math.max(Number(state.version)||0,9);',
  'if(state.version!==version){state.version=version;changed=true}',
  'if(!Array.isArray(y.lessonLogs)){y.lessonLogs=[];changed=true}',
  "if(!(y.classProgress&&typeof y.classProgress==='object'&&!Array.isArray(y.classProgress))){y.classProgress={};changed=true}",
  'if(changed)localStorage.setItem(KEY,JSON.stringify(state));',
  'return changed;'
])if(!src9.includes(token))throw new Error(`v1 prepared v09 missing: ${token}`);
fs.writeFileSync(path9,src9,'utf8');
console.log('Prepared v1 app-v09 lesson-record schema migration to persist only real repairs.');
