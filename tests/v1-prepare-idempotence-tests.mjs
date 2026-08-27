import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const PREPARE_SCRIPTS=[
  'scripts/prepare-v1-korean-text-encoding.mjs',
  'scripts/prepare-v1-v06-migration.mjs',
  'scripts/prepare-v1-v10-migration.mjs',
  'scripts/prepare-v1-v13-lifecycle.mjs',
  'scripts/prepare-v1-v14-lifecycle.mjs',
  'scripts/prepare-v1-v15-lifecycle.mjs',
  'scripts/prepare-v1-v16-lifecycle.mjs',
  'scripts/prepare-v1-v17-lifecycle.mjs',
  'scripts/prepare-v1-v19-lifecycle.mjs',
  'scripts/prepare-v1-v20-lifecycle.mjs',
  'scripts/prepare-v1-v21-direct-pii.mjs',
  'scripts/prepare-v1-v21-neis-generation.mjs',
  'scripts/prepare-v1-v21-lifecycle.mjs',
  'scripts/prepare-v1-v22-lifecycle.mjs',
  'scripts/prepare-v1-v23-storage.mjs',
  'scripts/prepare-v1-sources.mjs',
  'scripts/prepare-v1-v18-source-link.mjs',
  'scripts/prepare-v1-hwpx-structure.mjs',
  'scripts/prepare-v1-v23-multisheet.mjs',
  'scripts/prepare-v1-v23-pdf-layout.mjs',
  'scripts/prepare-v1-v23-materialized-count.mjs',
  'scripts/prepare-v1-v23-memory-hygiene.mjs',
  'scripts/prepare-v1-v23-ocr-recovery.mjs',
  'scripts/prepare-v1-v25-lifecycle.mjs',
  'scripts/prepare-v1-lazy-doc-deps.mjs',
  'scripts/prepare-v1-lazy-doc-shell.mjs',
  'scripts/prepare-v1-comcigan-status.mjs',
  'scripts/prepare-v1-v27-contact-cache.mjs',
  'scripts/prepare-v1-v27-truth.mjs',
  'scripts/prepare-v1-v28-lifecycle.mjs',
  'scripts/prepare-v1-v29-lifecycle.mjs',
  'scripts/prepare-v1-v30-lifecycle.mjs',
  'scripts/prepare-v1-v31-lifecycle.mjs',
  'scripts/prepare-v1-v32-lifecycle.mjs'
];

function changedPaths(){
  const out=execFileSync('git',['status','--porcelain=v1'],{encoding:'utf8'});
  return out.split('\n').filter(Boolean).map(line=>line.slice(3)).filter(Boolean).sort();
}

function digest(path){
  const data=fs.readFileSync(path);
  return crypto.createHash('sha256').update(data).digest('hex');
}

const beforePaths=changedPaths();
assert.ok(beforePaths.length>0,'v1 preparation idempotence test must run after the first preparation pass');
const before=new Map(beforePaths.map(path=>[path,digest(path)]));

for(const script of PREPARE_SCRIPTS){
  execFileSync(process.execPath,[script],{stdio:'inherit'});
}

const afterPaths=changedPaths();
assert.deepEqual(afterPaths,beforePaths,'second v1 preparation pass changed the set of prepared files');
for(const path of beforePaths){
  assert.equal(digest(path),before.get(path),`second v1 preparation pass changed ${path}`);
}

console.log(`v1 source preparation is deterministic and idempotent across ${PREPARE_SCRIPTS.length} preparation steps (${beforePaths.length} prepared files checked).`);
