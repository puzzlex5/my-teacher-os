import assert from 'node:assert/strict';
import fs from 'node:fs';

const src=fs.readFileSync('app-v30.js','utf8');
assert.ok(src.includes('const lifecycle30=globalThis.TeacherOSLifecycle'),'v30 uses shared lifecycle service');
assert.ok(src.includes('lifecycle30.onRender(()=>refresh(),{defer:true})'),'v30 refreshes document-version UI through shared render hook');
assert.ok(src.includes("lifecycle30.onSwitch(id=>{if(id==='importer'||id==='documents')refresh()},{defer:true})"),'v30 refreshes only importer/documents through shared switch hook');
assert.equal((src.match(/lifecycle30\.onRender\(/g)||[]).length,1,'v30 registers exactly one shared render hook');
assert.equal((src.match(/lifecycle30\.onSwitch\(/g)||[]).length,1,'v30 registers exactly one shared switch hook');
assert.ok(src.includes("if(lifecycle30?.onRender&&lifecycle30?.onSwitch)"),'v30 keeps isolated-test fallback when lifecycle service is unavailable');
assert.ok(src.includes('function prepareReplace('),'document replacement logic remains present');
assert.ok(src.includes('function undoReplace('),'document-version Undo logic remains present');
assert.ok(src.includes('if(!snapshotBeforeReplace(y,newImport,oldImports))'),'replacement still fails closed when Undo snapshot persistence fails');
console.log('v1 v30 shared lifecycle tests passed');
