import fs from 'node:fs';

const path='app-v10.js';
let src=fs.readFileSync(path,'utf8');

const before=`  function ensureState(){
    state.version=Math.max(Number(state.version)||0,10);
    state.teacherSkills=Array.isArray(state.teacherSkills)?state.teacherSkills:BUILTINS.map(x=>({id:x.id,enabled:true,lastRunAt:null,runCount:0,lastResult:''}));
    BUILTINS.forEach(b=>{if(!state.teacherSkills.some(s=>s.id===b.id))state.teacherSkills.push({id:b.id,enabled:true,lastRunAt:null,runCount:0,lastResult:''})});
    Object.values(state.years||{}).forEach(y=>{y.skillBrief=Array.isArray(y.skillBrief)?y.skillBrief:[];y.tasks=Array.isArray(y.tasks)?y.tasks:[]});
    localStorage.setItem(KEY,JSON.stringify(state));
  }`;

const after=`  function ensureState(){
    let changed=false;
    const version=Math.max(Number(state.version)||0,10);
    if(state.version!==version){state.version=version;changed=true}
    if(!Array.isArray(state.teacherSkills)){state.teacherSkills=BUILTINS.map(x=>({id:x.id,enabled:true,lastRunAt:null,runCount:0,lastResult:''}));changed=true}
    BUILTINS.forEach(b=>{if(!state.teacherSkills.some(s=>s.id===b.id)){state.teacherSkills.push({id:b.id,enabled:true,lastRunAt:null,runCount:0,lastResult:''});changed=true}});
    Object.values(state.years||{}).forEach(y=>{if(!Array.isArray(y.skillBrief)){y.skillBrief=[];changed=true}if(!Array.isArray(y.tasks)){y.tasks=[];changed=true}});
    if(changed)localStorage.setItem(KEY,JSON.stringify(state));
  }`;

if(src.includes(before))src=src.replace(before,after);
else if(!src.includes(after))throw new Error('v10 preparation failed: expected ensureState migration block not found');

for(const token of [
  'let changed=false',
  'if(state.version!==version){state.version=version;changed=true}',
  'if(!Array.isArray(state.teacherSkills))',
  'if(!Array.isArray(y.skillBrief))',
  'if(!Array.isArray(y.tasks))',
  'if(changed)localStorage.setItem(KEY,JSON.stringify(state))'
])if(!src.includes(token))throw new Error(`v10 preparation missing: ${token}`);

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v10 Teacher Skills schema repair to persist only real changes.');
