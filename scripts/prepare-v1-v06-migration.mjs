import fs from 'node:fs';

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
