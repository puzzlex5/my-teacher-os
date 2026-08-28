import assert from 'node:assert';
import fs from 'node:fs';

const src=fs.readFileSync('app-v06.js','utf8');
const src7=fs.readFileSync('app-v07.js','utf8');
const src9=fs.readFileSync('app-v09.js','utf8');
let n=0;
const ok=(v,m)=>{assert.ok(v,m);n++};

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

console.log(`v1 v06-v07-v09 migration persistence checks passed (${n} assertions)`);
