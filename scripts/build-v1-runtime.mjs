import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'v1-runtime-manifest.json'),'utf8'));
const outDir=path.join(root,'dist-v1');
fs.mkdirSync(outDir,{recursive:true});

function readRequired(file){
  const p=path.join(root,file);
  if(!fs.existsSync(p))throw new Error(`Missing runtime asset: ${file}`);
  return fs.readFileSync(p,'utf8');
}
function banner(file){return `\n/* ===== ${file} ===== */\n`;}

const jsFiles=[...manifest.coreJs,...manifest.appJs];
const cssFiles=[...manifest.css];
const js=jsFiles.map(f=>banner(f)+readRequired(f)).join('\n');
const css=cssFiles.map(f=>banner(f)+readRequired(f)).join('\n');

fs.writeFileSync(path.join(outDir,'teacher-os-v1.runtime.js'),js);
fs.writeFileSync(path.join(outDir,'teacher-os-v1.runtime.css'),css);
fs.writeFileSync(path.join(outDir,'asset-report.json'),JSON.stringify({
  baseline:manifest.baseline,
  generatedAt:new Date().toISOString(),
  jsFiles:jsFiles.length,
  cssFiles:cssFiles.length,
  jsBytes:Buffer.byteLength(js),
  cssBytes:Buffer.byteLength(css),
  order:{js:jsFiles,css:cssFiles}
},null,2));

console.log(`Teacher OS v1 baseline bundle built: ${jsFiles.length} JS layers -> 1, ${cssFiles.length} CSS layers -> 1`);
