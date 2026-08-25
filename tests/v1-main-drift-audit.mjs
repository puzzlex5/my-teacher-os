import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const EXACT_PARITY_FILES=[
  'app-v16.js',
  'app-v19.js',
  'core-v23.js',
  'app-v23.js',
  'core-v29.js',
  'core-v30.js',
  'core-v31.js',
  'app-v32.js',
  'scripts/sync-comcigan.mjs',
  '.github/workflows/sync-comcigan.yml'
];

function mainFile(path){
  try{return execFileSync('git',['show',`origin/main:${path}`],{encoding:'utf8'});}
  catch(err){throw new Error(`Cannot read origin/main:${path}. Fetch main before this audit. ${err?.message||err}`);}
}

for(const path of EXACT_PARITY_FILES){
  assert.ok(fs.existsSync(path),`v1 file missing: ${path}`);
  const local=fs.readFileSync(path,'utf8');
  const stable=mainFile(path);
  assert.equal(local,stable,`${path} drifted from stable main. Sync the validated main fix first, then re-apply only intentional v1 transformations in the prepare/build stage.`);
}

console.log(`v1 stable-main drift audit passed for ${EXACT_PARITY_FILES.length} critical files`);
