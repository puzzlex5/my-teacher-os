import assert from 'node:assert/strict';
import fs from 'node:fs';

const src=fs.readFileSync('app-v20.js','utf8');
assert.ok(src.includes('const lifecycle20=globalThis.TeacherOSLifecycle'),'v20 uses shared lifecycle service');
assert.ok(src.includes('lifecycle20.onRender(()=>render20(),{defer:true})'),'v20 refreshes student records through shared render hook');
assert.ok(src.includes("lifecycle20.onSwitch(id=>{if(id==='studentrecords')"),'v20 activates student records through shared switch hook');
assert.equal((src.match(/lifecycle20\.onRender\(/g)||[]).length,1,'v20 registers exactly one shared render hook');
assert.equal((src.match(/lifecycle20\.onSwitch\(/g)||[]).length,1,'v20 registers exactly one shared switch hook');
assert.ok(src.includes('if(lifecycle20?.onRender&&lifecycle20?.onSwitch)'),'v20 keeps isolated-test fallback when lifecycle service is unavailable');
assert.ok(src.includes("const EVIDENCE_KINDS=new Set(['담임관찰','교과관찰','자율자치활동','진로활동','동아리·창체','수업·평가관찰'])"),'student evidence-kind boundary remains present');
assert.ok(src.includes("const SENSITIVE_RE=/(질병|진단|약물|정신|우울|자해|가정폭력|이혼|경제사정|기초생활|성폭력|성적지향|종교|장애|주민등록|전화번호)/"),'student sensitive-record guard remains present');
assert.ok(src.includes("if(area==='subject')return hasRole('subject',y)"),'subject-draft role guard remains present');
assert.ok(src.includes("if(['behavior','autonomy','career'].includes(area))return hasRole('homeroom',y)"),'homeroom draft role guard remains present');
console.log('v1 v20 shared lifecycle tests passed');
