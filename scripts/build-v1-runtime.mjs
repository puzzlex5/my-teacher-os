import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'v1-runtime-manifest.json'),'utf8'));
const outDir=path.join(root,'dist-v1');
fs.mkdirSync(outDir,{recursive:true});

function readRequired(file){
  const p=path.join(root,file);
  if(!fs.existsSync(p))throw new Error(`Missing runtime asset: ${file}`);
  return fs.readFileSync(p,'utf8');
}
function banner(file){return `\n/* ===== ${file} ===== */\n`;}
function replaceExactly(source,needle,replacement,label){
  const first=source.indexOf(needle);
  if(first<0)throw new Error(`Preview build marker missing: ${label}`);
  if(source.indexOf(needle,first+needle.length)>=0)throw new Error(`Preview build marker duplicated: ${label}`);
  return source.replace(needle,replacement);
}
function replaceAllCounted(source,needle,replacement,label,minCount=1){
  const count=source.split(needle).length-1;
  if(count<minCount)throw new Error(`Preview build marker count too low for ${label}: ${count}`);
  return {source:source.split(needle).join(replacement),count};
}
function withRootBase(source){
  return replaceExactly(source,'<title>MY TEACHER OS</title>','<title>MY TEACHER OS</title>\n<base href="../">','document base');
}

const storageServiceFile='v1-storage-service.js';
const storageService=readRequired(storageServiceFile);
let baseStorageWrites=0;
let v6StorageWrites=0;
let v7StorageWrites=0;
let v9StorageWrites=0;
let v10StorageWrites=0;

// Known baseline correctness fix discovered by the first real Chromium run:
// app-v05 auto-runs self tests on a brand-new profile, then called renderHealth(null).
// Separate script tags reported the exception but continued to later layers; a single
// bundle correctly exposed that this would abort the rest of the runtime. Keep this
// fix explicit and exact until app-v05 itself is safely rewritten during consolidation.
//
// Phase 2 routes historical state persistence through one v1 storage boundary in small
// verified steps. app-v05 owns the primary state read/write path; app-v06 and app-v07
// add schema migration writes. app-v08 has no state persistence. app-v09 adds both its
// schema migration write and lesson-progress/log persistence. app-v10 adds its schema
// migration plus Teacher Skills state/task persistence. Later layers remain untouched
// until parity proves each migration safe. Non-state local keys such as lessonAutoMinutes
// and Comcigan sync settings intentionally stay outside this migration because they have
// different privacy/lifecycle semantics.
function runtimeSource(file){
  let source=readRequired(file);
  if(file==='app-v05.js'){
    source=replaceExactly(
      source,
      "renderHealth(cur())}",
      "const currentYearState=cur();if(currentYearState)renderHealth(currentYearState)}",
      'app-v05 null-year self-test health guard'
    );
    source=replaceExactly(
      source,
      "let state=(()=>{try{return JSON.parse(localStorage.getItem(KEY))||fresh()}catch{return fresh()}})();",
      "let state=globalThis.TeacherOSStorage.readJSON(KEY,fresh);",
      'app-v05 primary state read'
    );
    const migrated=replaceAllCounted(
      source,
      'localStorage.setItem(KEY,JSON.stringify(state));',
      'globalThis.TeacherOSStorage.writeJSON(KEY,state);',
      'app-v05 primary state writes',
      2
    );
    source=migrated.source;
    baseStorageWrites=migrated.count;
  }
  if(file==='app-v06.js'){
    const migrated=replaceAllCounted(
      source,
      'localStorage.setItem(KEY,JSON.stringify(state));',
      'globalThis.TeacherOSStorage.writeJSON(KEY,state);',
      'app-v06 schema migration write',
      1
    );
    source=migrated.source;
    v6StorageWrites=migrated.count;
  }
  if(file==='app-v07.js'){
    const migrated=replaceAllCounted(
      source,
      'localStorage.setItem(KEY,JSON.stringify(state))',
      'globalThis.TeacherOSStorage.writeJSON(KEY,state)',
      'app-v07 schema migration write',
      1
    );
    source=migrated.source;
    v7StorageWrites=migrated.count;
  }
  if(file==='app-v09.js'){
    const migrated=replaceAllCounted(
      source,
      'localStorage.setItem(KEY,JSON.stringify(state))',
      'globalThis.TeacherOSStorage.writeJSON(KEY,state)',
      'app-v09 state writes',
      2
    );
    source=migrated.source;
    v9StorageWrites=migrated.count;
  }
  if(file==='app-v10.js'){
    const migrated=replaceAllCounted(
      source,
      'localStorage.setItem(KEY,JSON.stringify(state))',
      'globalThis.TeacherOSStorage.writeJSON(KEY,state)',
      'app-v10 Teacher Skills state writes',
      4
    );
    source=migrated.source;
    v10StorageWrites=migrated.count;
  }
  return source;
}

const jsFiles=[...manifest.coreJs,...manifest.appJs];
const cssFiles=[...manifest.css];
const js=banner(storageServiceFile)+storageService+'\n'+jsFiles.map(f=>banner(f)+runtimeSource(f)).join('\n');
const css=cssFiles.map(f=>banner(f)+readRequired(f)).join('\n');

fs.writeFileSync(path.join(outDir,'teacher-os-v1.runtime.js'),js);
fs.writeFileSync(path.join(outDir,'teacher-os-v1.runtime.css'),css);
fs.writeFileSync(path.join(outDir,'legacy-app-v05.js'),runtimeSource('app-v05.js'));
fs.writeFileSync(path.join(outDir,'legacy-app-v06.js'),runtimeSource('app-v06.js'));
fs.writeFileSync(path.join(outDir,'legacy-app-v07.js'),runtimeSource('app-v07.js'));
fs.writeFileSync(path.join(outDir,'legacy-app-v09.js'),runtimeSource('app-v09.js'));
fs.writeFileSync(path.join(outDir,'legacy-app-v10.js'),runtimeSource('app-v10.js'));

const shell=readRequired('app-v05.html');

// Deterministic separate-layer reference. It uses the same ordered asset set as the
// live loader, with only explicit v1 baseline transforms substituted for migrated files.
// The shared storage service is loaded before historical code in both reference and
// bundled preview so browser parity remains a meaningful semantic comparison.
let legacy=withRootBase(shell);
legacy=replaceExactly(
  legacy,
  '<link rel="stylesheet" href="app-v05.css">',
  cssFiles.map(f=>`<link rel="stylesheet" href="${f}">`).join('\n'),
  'legacy stylesheet set'
);
legacy=replaceExactly(
  legacy,
  '<script src="core-v05.js"></script>',
  `<script src="${storageServiceFile}"></script>\n`+manifest.coreJs.map(f=>`<script src="${f}"></script>`).join('\n'),
  'legacy core script set'
);
legacy=replaceExactly(
  legacy,
  '<script src="app-v05.js"></script>',
  manifest.appJs.map(f=>{
    if(f==='app-v05.js')return '<script src="dist-v1/legacy-app-v05.js"></script>';
    if(f==='app-v06.js')return '<script src="dist-v1/legacy-app-v06.js"></script>';
    if(f==='app-v07.js')return '<script src="dist-v1/legacy-app-v07.js"></script>';
    if(f==='app-v09.js')return '<script src="dist-v1/legacy-app-v09.js"></script>';
    if(f==='app-v10.js')return '<script src="dist-v1/legacy-app-v10.js"></script>';
    return `<script src="${f}"></script>`;
  }).join('\n'),
  'legacy app script set'
);
fs.writeFileSync(path.join(outDir,'legacy.html'),legacy);

// Consolidated preview: identical shell/resources, replacing historical assets with
// one ordered CSS bundle and one ordered JS bundle.
let preview=withRootBase(shell);
preview=replaceExactly(
  preview,
  '<link rel="stylesheet" href="app-v05.css">',
  '<link rel="stylesheet" href="dist-v1/teacher-os-v1.runtime.css">',
  'bundle stylesheet'
);
preview=replaceExactly(
  preview,
  '<script src="core-v05.js"></script>',
  '<script src="dist-v1/teacher-os-v1.runtime.js"></script>',
  'bundle runtime script'
);
preview=replaceExactly(preview,'<script src="app-v05.js"></script>','','bundled base app script');
fs.writeFileSync(path.join(outDir,'index.html'),preview);

fs.writeFileSync(path.join(outDir,'asset-report.json'),JSON.stringify({
  baseline:manifest.baseline,
  generatedAt:new Date().toISOString(),
  baselineFixes:['app-v05 null-year self-test health guard'],
  consolidationSteps:[
    'v1 shared storage service loaded before historical runtime',
    'app-v05 primary state read routed through TeacherOSStorage',
    `app-v05 primary state writes routed through TeacherOSStorage (${baseStorageWrites})`,
    `app-v06 schema migration writes routed through TeacherOSStorage (${v6StorageWrites})`,
    `app-v07 schema migration writes routed through TeacherOSStorage (${v7StorageWrites})`,
    'app-v08 has no Teacher OS state writes',
    `app-v09 schema and lesson state writes routed through TeacherOSStorage (${v9StorageWrites})`,
    `app-v10 Teacher Skills state writes routed through TeacherOSStorage (${v10StorageWrites})`
  ],
  jsFiles:jsFiles.length,
  cssFiles:cssFiles.length,
  bootstrapJs:[storageServiceFile],
  jsBytes:Buffer.byteLength(js),
  cssBytes:Buffer.byteLength(css),
  legacyHtmlBytes:Buffer.byteLength(legacy),
  previewHtmlBytes:Buffer.byteLength(preview),
  order:{js:jsFiles,css:cssFiles}
},null,2));

console.log(`Teacher OS v1 baseline built: ${jsFiles.length} historical JS + ${cssFiles.length} CSS layers, shared state storage boundary active through v0.10, deterministic parity previews generated`);
