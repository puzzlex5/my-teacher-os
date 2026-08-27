import assert from 'node:assert/strict';
import fs from 'node:fs';

const src=fs.readFileSync('app-v31.js','utf8');
assert.ok(src.includes('const lifecycle31=globalThis.TeacherOSLifecycle'),'v31 uses shared lifecycle service');
assert.ok(src.includes('lifecycle31.onRender(()=>refresh31(),{defer:true})'),'v31 refreshes retention UI through shared render hook');
assert.ok(src.includes("lifecycle31.onSwitch(id=>{if(id==='importer'||id==='documents'){refresh31();if(id==='documents')renderVault31()}},{defer:true})"),'v31 refreshes importer/documents through shared switch hook');
assert.equal((src.match(/lifecycle31\.onRender\(/g)||[]).length,1,'v31 registers exactly one shared render hook');
assert.equal((src.match(/lifecycle31\.onSwitch\(/g)||[]).length,1,'v31 registers exactly one shared switch hook');
assert.ok(src.includes('if(lifecycle31?.onRender&&lifecycle31?.onSwitch)'),'v31 keeps isolated-test fallback when lifecycle service is unavailable');
assert.ok(src.includes('async function finalizeBatch31()'),'source-retention batch finalization remains present');
assert.ok(src.includes('async function vaultPut31(record)'),'IndexedDB local-original storage remains present');
assert.ok(src.includes('function applyRetentionMeta31('),'retention metadata application remains present');
assert.ok(src.includes("if(level==='local')"),'local-original retention path remains present');
console.log('v1 v31 shared lifecycle tests passed');
