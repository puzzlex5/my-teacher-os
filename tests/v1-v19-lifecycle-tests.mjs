import assert from 'node:assert/strict';
import fs from 'node:fs';

const src=fs.readFileSync('app-v19.js','utf8');
assert.ok(src.includes('const lifecycle19=globalThis.TeacherOSLifecycle'),'v19 uses shared lifecycle service');
assert.ok(src.includes('lifecycle19.onRender(()=>{ensure19();ensureUI();renderLibrary()},{defer:true})'),'v19 refreshes work library through shared render hook');
assert.ok(src.includes("lifecycle19.onSwitch(id=>{if(id==='worklibrary')"),'v19 activates work library through shared switch hook');
assert.equal((src.match(/lifecycle19\.onRender\(/g)||[]).length,1,'v19 registers exactly one shared render hook');
assert.equal((src.match(/lifecycle19\.onSwitch\(/g)||[]).length,1,'v19 registers exactly one shared switch hook');
assert.ok(src.includes('if(lifecycle19?.onRender&&lifecycle19?.onSwitch)'),'v19 keeps isolated-test fallback when lifecycle service is unavailable');
assert.ok(src.includes("if(p.source==='Teacher OS 업무 라이브러리')return false"),'removing a pack still deletes only library-created projects');
assert.ok(src.includes('delete p.workPackId;delete p.libraryLinked;return true'),'removing a pack still preserves pre-existing user projects');
assert.ok(src.includes("if(project){project.workPackId=pack.id;project.category=project.category||pack.category;project.libraryLinked=true}"),'pack installation still links existing projects instead of duplicating them');
console.log('v1 v19 shared lifecycle tests passed');
