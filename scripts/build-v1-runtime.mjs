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
function withRootBase(source){
  return replaceExactly(source,'<title>MY TEACHER OS</title>','<title>MY TEACHER OS</title>\n<base href="../">','document base');
}

// Known baseline correctness fix discovered by the first real Chromium run:
// app-v05 auto-runs self tests on a brand-new profile, then called renderHealth(null).
// Separate script tags reported the exception but continued to later layers; a single
// bundle correctly exposed that this would abort the rest of the runtime. Keep this
// fix explicit and exact until app-v05 itself is safely rewritten during consolidation.
function runtimeSource(file){
  let source=readRequired(file);
  if(file==='app-v05.js'){
    source=replaceExactly(
      source,
      "renderHealth(cur())}",
      "const currentYearState=cur();if(currentYearState)renderHealth(currentYearState)}",
      'app-v05 null-year self-test health guard'
    );
  }
  return source;
}

const jsFiles=[...manifest.coreJs,...manifest.appJs];
const cssFiles=[...manifest.css];
const js=jsFiles.map(f=>banner(f)+runtimeSource(f)).join('\n');
const css=cssFiles.map(f=>banner(f)+readRequired(f)).join('\n');

fs.writeFileSync(path.join(outDir,'teacher-os-v1.runtime.js'),js);
fs.writeFileSync(path.join(outDir,'teacher-os-v1.runtime.css'),css);
fs.writeFileSync(path.join(outDir,'legacy-app-v05.js'),runtimeSource('app-v05.js'));

const shell=readRequired('app-v05.html');

// Deterministic separate-layer reference. It uses the same ordered asset set as the
// live loader, with only the explicit null-year baseline fix above substituted for
// app-v05.js. This makes script-boundary semantics testable without index.html's
// async fetch/document.write bootstrap.
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
  manifest.coreJs.map(f=>`<script src="${f}"></script>`).join('\n'),
  'legacy core script set'
);
legacy=replaceExactly(
  legacy,
  '<script src="app-v05.js"></script>',
  manifest.appJs.map(f=>`<script src="${f==='app-v05.js'?'dist-v1/legacy-app-v05.js':f}"></script>`).join('\n'),
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
  jsFiles:jsFiles.length,
  cssFiles:cssFiles.length,
  jsBytes:Buffer.byteLength(js),
  cssBytes:Buffer.byteLength(css),
  legacyHtmlBytes:Buffer.byteLength(legacy),
  previewHtmlBytes:Buffer.byteLength(preview),
  order:{js:jsFiles,css:cssFiles}
},null,2));

console.log(`Teacher OS v1 baseline built: ${jsFiles.length} JS + ${cssFiles.length} CSS layers, explicit startup guard applied, deterministic parity previews generated`);
