import assert from 'node:assert';
import fs from 'node:fs';

const src=fs.readFileSync('app-v10.js','utf8');

assert.ok(src.includes('function refreshSkills10()'),'v10 exposes one shared render refresh function');
assert.ok(src.includes('function activateSkillsView10(id)'),'v10 exposes one shared switch handler');
assert.ok(src.includes('globalThis.TeacherOSLifecycle'),'v10 uses TeacherOSLifecycle when available');
assert.equal((src.match(/lifecycle10\.onRender\(refreshSkills10\)/g)||[]).length,1,'v10 registers one shared render hook');
assert.equal((src.match(/lifecycle10\.onSwitch\(activateSkillsView10\)/g)||[]).length,1,'v10 registers one shared switch hook');
assert.ok(src.includes("if(id!=='skills')return"),'v10 switch hook only changes the Skills view');
assert.ok(src.includes('setTimeout(()=>runAutoSkills(false),0)'),'automatic skills still run after UI refresh');
assert.ok(src.includes('const oldSwitch=switchView;switchView=function(id){oldSwitch(id);activateSkillsView10(id)}'),'legacy switch wrapper exists only as fallback');
assert.ok(src.includes('const prevRender=render;render=function(){const result=prevRender.apply(this,arguments);refreshSkills10();return result}'),'legacy render wrapper exists only as fallback');

console.log('v10 Teacher Skills uses the shared lifecycle while preserving isolated-test fallbacks.');
