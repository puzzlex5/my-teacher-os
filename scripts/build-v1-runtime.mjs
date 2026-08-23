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

const jsFiles=[...manifest.coreJs,...manifest.appJs];
const cssFiles=[...manifest.css];
const js=jsFiles.map(f=>banner(f)+readRequired(f)).join('\n');
const css=cssFiles.map(f=>banner(f)+readRequired(f)).join('\n');

fs.writeFileSync(path.join(outDir,'teacher-os-v1.runtime.js'),js);
fs.writeFileSync(path.join(outDir,'teacher-os-v1.runtime.css'),css);

// Build a local preview from the same HTML shell used by the live loader. Only the
// historical CSS/JS layer references are replaced; third-party libraries and all
// DOM markup stay untouched. This gives browser parity tests a real bundled target.
let preview=readRequired('app-v05.html');
preview=replaceExactly(
  preview,
  '<link rel="stylesheet" href="app-v05.css">',
  '<link rel="stylesheet" href="teacher-os-v1.runtime.css">',
  'base stylesheet'
);
preview=replaceExactly(
  preview,
  '<script src="core-v05.js"></script>',
  '<script src="teacher-os-v1.runtime.js"></script>',
  'base core script'
);
preview=replaceExactly(
  preview,
  '<script src="app-v05.js"></script>',
  '',
  'base app script'
);
fs.writeFileSync(path.join(outDir,'index.html'),preview);

fs.writeFileSync(path.join(outDir,'asset-report.json'),JSON.stringify({
  baseline:manifest.baseline,
  generatedAt:new Date().toISOString(),
  jsFiles:jsFiles.length,
  cssFiles:cssFiles.length,
  jsBytes:Buffer.byteLength(js),
  cssBytes:Buffer.byteLength(css),
  previewHtmlBytes:Buffer.byteLength(preview),
  order:{js:jsFiles,css:cssFiles}
},null,2));

console.log(`Teacher OS v1 baseline bundle built: ${jsFiles.length} JS layers -> 1, ${cssFiles.length} CSS layers -> 1, preview generated`);
