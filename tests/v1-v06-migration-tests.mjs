import assert from 'node:assert';
import fs from 'node:fs';

const src=fs.readFileSync('app-v06.js','utf8');
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

console.log(`v1 v06 migration persistence checks passed (${n} assertions)`);
