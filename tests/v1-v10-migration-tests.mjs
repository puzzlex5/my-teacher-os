import assert from 'node:assert';
import fs from 'node:fs';

const src=fs.readFileSync('app-v10.js','utf8');
const m=src.match(/  function ensureState\(\)\{\n([\s\S]*?)\n  \}\n  function skillState/);
assert.ok(m,'prepared v10 ensureState body is available');
assert.ok(src.includes('if(changed)localStorage.setItem(KEY,JSON.stringify(state))'),'v10 only persists schema repair when state changes');
assert.ok(!src.includes('state.version=10'),'v10 never forces the schema version backwards');

const runEnsure=new Function('state','BUILTINS','localStorage','KEY',`${m[1]}\nreturn state;`);
const BUILTINS=[{id:'a'},{id:'b'}];

let writes=0;
const storage={setItem(){writes++}};
const unchanged={
  version:32,
  teacherSkills:[
    {id:'a',enabled:false,lastRunAt:'old',runCount:7,lastResult:'keep'},
    {id:'b',enabled:true,lastRunAt:null,runCount:0,lastResult:''}
  ],
  years:{2026:{skillBrief:[],tasks:[]}}
};
runEnsure(unchanged,BUILTINS,storage,'myTeacherOS.v01');
assert.equal(writes,0,'unchanged v32 state does not trigger a full persistence write');
assert.equal(unchanged.version,32,'later schema version is preserved');
assert.equal(unchanged.teacherSkills[0].enabled,false,'existing skill configuration is preserved');
assert.equal(unchanged.teacherSkills[0].runCount,7,'existing skill history is preserved');

writes=0;
const repair={
  version:9,
  teacherSkills:[{id:'a',enabled:false,lastRunAt:'old',runCount:3,lastResult:'keep'}],
  years:{2026:{skillBrief:null,tasks:{bad:true}}}
};
runEnsure(repair,BUILTINS,storage,'myTeacherOS.v01');
assert.equal(writes,1,'multiple schema repairs are persisted in one write');
assert.equal(repair.version,10,'older schema advances to v10');
assert.equal(repair.teacherSkills.length,2,'missing built-in skill is added');
assert.equal(repair.teacherSkills[0].enabled,false,'existing skill toggle is not reset during repair');
assert.equal(repair.teacherSkills[0].runCount,3,'existing run history is not reset during repair');
assert.deepEqual(repair.years[2026].skillBrief,[],'malformed skill brief is repaired');
assert.deepEqual(repair.years[2026].tasks,[],'malformed task collection is repaired');

console.log('v10 Teacher Skills migration is change-only, monotonic, and preserves existing user state.');
