import assert from 'node:assert';
import fs from 'node:fs';

const src5=fs.readFileSync('app-v05.js','utf8');
const src=fs.readFileSync('app-v06.js','utf8');
const src7=fs.readFileSync('app-v07.js','utf8');
const src9=fs.readFileSync('app-v09.js','utf8');
let n=0;
const ok=(v,m)=>{assert.ok(v,m);n++};

ok(src5.includes('const version=Math.max(Number(state.version)||0,5);'),'v5 bootstrap migration must never downgrade a later schema version');
ok(src5.includes('if(state.version!==version){state.version=version;changed=true}'),'v5 bootstrap version repair is change-tracked');
ok(src5.includes("if(!(state.years&&typeof state.years==='object'&&!Array.isArray(state.years))){state.years={};changed=true}"),'v5 rejects array-shaped years instead of treating it as a valid map');
ok(src5.includes("for(const k of ['projects','assessments','memories','tasks','calendarEvents','timetable','imports'])if(!Array.isArray(y[k])){y[k]=[];changed=true}"),'v5 base collection repairs are change-tracked');
ok(src5.includes("if(!Array.isArray(y.subjects)||!y.subjects.length){y.subjects=['음악'];changed=true}"),'v5 subject repair preserves existing non-empty subject arrays');
ok(src5.includes('if(changed)localStorage.setItem(KEY,JSON.stringify(state));'),'v5 bootstrap skips whole-state persistence when nothing changed');
ok(!src5.includes('state.version=5;'),'v5 bootstrap no longer resets later schema versions to 5');
ok(src5.includes('return changed;'),'v5 exposes whether bootstrap repair changed persisted state');

const migrate5Start=src5.indexOf('function migrate(){');
const migrate5End=src5.indexOf('\nfunction cur()',migrate5Start);
ok(migrate5Start>=0&&migrate5End>migrate5Start,'v5 migration function can be isolated for behavior testing');
const migrate5Source=src5.slice(migrate5Start,migrate5End);
function runV5(initial){
  let state=structuredClone(initial),writes=0,result=null;
  const KEY='test',fresh=()=>({version:5,currentYear:null,profile:{major:'음악',minutes:45},years:{}});
  const defaultClubs=()=>[{id:'synthetic-club',name:'합성 동아리',type:'테스트',goal:'',due:'',activities:[]}];
  const localStorage={setItem(){writes++}};
  eval(`${migrate5Source}\nresult=migrate();`);
  return {state,writes,result};
}
const validYear={projects:[],assessments:[],memories:[],tasks:[],calendarEvents:[],timetable:[],imports:[],clubs:[{id:'existing'}],educationOffice:'경기도교육청',subjects:['음악'],lastBackupAt:null,keepMe:'preserved'};
const validRun=runV5({version:32,currentYear:2026,profile:{major:'음악'},years:{2026:validYear},futureField:{enabled:true}});
ok(validRun.result===false,'v5 reports no repair for already-valid later-version state');
ok(validRun.writes===0,'v5 performs zero persistence writes for already-valid state');
ok(validRun.state.version===32,'v5 behavior preserves a later schema version');
ok(validRun.state.years[2026].keepMe==='preserved'&&validRun.state.futureField?.enabled===true,'v5 behavior preserves fields owned by later schemas');
const repairRun=runV5({version:4,currentYear:null,profile:{major:'음악'},years:[]});
ok(repairRun.result===true&&repairRun.writes===1,'v5 persists exactly once when bootstrap repair is required');
ok(repairRun.state.version===5&&!Array.isArray(repairRun.state.years),'v5 repairs an old invalid years container without version regression');

ok(src.includes('const version=Math.max(Number(state.version)||0,6);'),'v6 migration must never downgrade a later schema version');
ok(src.includes('if(state.version!==version){state.version=version;changed=true}'),'v6 version migration writes only when version actually changes');
ok(src.includes('if(!Array.isArray(y.timetable)){y.timetable=[];changed=true}'),'v6 timetable repair is change-tracked');
ok(src.includes('if(!Array.isArray(y.calendarEvents)){y.calendarEvents=[];changed=true}'),'v6 calendar repair is change-tracked');
ok(src.includes("if(!ev.scope){ev.scope='전체';changed=true}"),'v6 event scope repair is change-tracked');
ok(src.includes("if(s.time===undefined||s.time===null){s.time='';changed=true}"),'v6 slot time repair does not rewrite existing empty values');
ok(src.includes('if(changed)localStorage.setItem(KEY,JSON.stringify(state));'),'v6 migration skips whole-state persistence when nothing changed');
ok(!src.includes('state.version=6;'),'v6 migration no longer resets version 6 on every render');
ok(src.includes('render=function(){migrateV6();oldRender();'),'existing pre-render migration ordering remains intact for restored older backups');

ok(src7.includes('const version=Math.max(Number(state.version)||0,7);'),'v7 migration must never downgrade a later schema version');
ok(src7.includes('if(state.version!==version){state.version=version;changed=true}'),'v7 version migration writes only when version actually changes');
ok(src7.includes("if(!(y.liveTimetableWeeks&&typeof y.liveTimetableWeeks==='object'&&!Array.isArray(y.liveTimetableWeeks))){y.liveTimetableWeeks={};changed=true}"),'v7 live timetable repair is change-tracked');
ok(src7.includes("if(!(y.comciganSync&&typeof y.comciganSync==='object'&&!Array.isArray(y.comciganSync))){y.comciganSync={lastChecked:null,lastApplied:null,status:'not-connected'};changed=true}"),'v7 Comcigan sync repair is change-tracked');
ok(src7.includes('if(changed)localStorage.setItem(KEY,JSON.stringify(state));'),'v7 migration skips whole-state persistence when nothing changed');
ok(!src7.includes('state.version=7;'),'v7 migration no longer resets version 7 on every render');
ok(src7.includes('render=function(){migrateV7();previousRender();'),'existing v7 pre-render migration ordering remains intact for restored older backups');

ok(src9.includes('const version=Math.max(Number(state.version)||0,9);'),'v9 lesson migration keeps schema version monotonic');
ok(src9.includes('if(state.version!==version){state.version=version;changed=true}'),'v9 version repair is change-tracked');
ok(src9.includes('if(!Array.isArray(y.lessonLogs)){y.lessonLogs=[];changed=true}'),'v9 lesson log repair is change-tracked');
ok(src9.includes("if(!(y.classProgress&&typeof y.classProgress==='object'&&!Array.isArray(y.classProgress))){y.classProgress={};changed=true}"),'v9 rejects array-shaped class progress instead of treating it as a valid map');
ok(src9.includes('if(changed)localStorage.setItem(KEY,JSON.stringify(state));'),'v9 skips whole-state persistence when schema is already valid');
ok(src9.includes('return changed;'),'v9 exposes whether a repair was actually materialized');

console.log(`v1 v05-v06-v07-v09 migration persistence checks passed (${n} assertions)`);
