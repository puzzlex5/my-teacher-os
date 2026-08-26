import fs from 'node:fs';

function replaceOnce(src,from,to,label){
  if(src.includes(from))return src.replace(from,to);
  if(src.includes(to))return src;
  throw new Error(`v1 lifecycle preparation failed (${label})`);
}

const appPath='app-v21.js';
let app=fs.readFileSync(appPath,'utf8');
const legacy="  const prevRender21=globalThis.render;if(typeof prevRender21==='function')globalThis.render=function(){const r=prevRender21.apply(this,arguments);setTimeout(renderStudio21,0);return r};\n  const prevSwitch21=globalThis.switchView;if(typeof prevSwitch21==='function')globalThis.switchView=function(id){const r=prevSwitch21.apply(this,arguments);if(id==='studentrecords')setTimeout(renderStudio21,0);return r};";
const shared="  const lifecycle21=globalThis.TeacherOSLifecycle;if(!lifecycle21)throw new Error('TeacherOSLifecycle is required by v21');\n  lifecycle21.onRender(renderStudio21,{defer:true});\n  lifecycle21.onSwitch(id=>{if(id==='studentrecords')renderStudio21()},{defer:true});";
app=replaceOnce(app,legacy,shared,'app-v21 render/switch hooks');
if(app.includes('prevRender21=globalThis.render')||app.includes('prevSwitch21=globalThis.switchView'))throw new Error('v21 still wraps global lifecycle functions directly');
for(const token of ['TeacherOSLifecycle','lifecycle21.onRender','lifecycle21.onSwitch'])if(!app.includes(token))throw new Error(`prepared v21 missing ${token}`);
fs.writeFileSync(appPath,app,'utf8');

const buildPath='scripts/build-v1-runtime.mjs';
let build=fs.readFileSync(buildPath,'utf8');
build=replaceOnce(build,
"const storageServiceFile='v1-storage-service.js';\nconst storageService=readRequired(storageServiceFile);",
"const storageServiceFile='v1-storage-service.js';\nconst lifecycleServiceFile='v1-lifecycle-service.js';\nconst storageService=readRequired(storageServiceFile);\nconst lifecycleService=readRequired(lifecycleServiceFile);",
'build service declarations');
build=replaceOnce(build,
"const js=banner(storageServiceFile)+storageService+'\\n'+jsFiles.map(f=>banner(f)+runtimeSource(f)).join('\\n');",
"const js=banner(storageServiceFile)+storageService+'\\n'+banner(lifecycleServiceFile)+lifecycleService+'\\n'+jsFiles.map(f=>banner(f)+runtimeSource(f)).join('\\n');",
'bundle lifecycle bootstrap');
build=replaceOnce(build,
"legacy=replaceExactly(legacy,'<script src=\"core-v05.js\"></script>',`<script src=\"${storageServiceFile}\"></script>\\n`+manifest.coreJs.map(f=>`<script src=\"${f}\"></script>`).join('\\n'),'legacy core script set');",
"legacy=replaceExactly(legacy,'<script src=\"core-v05.js\"></script>',`<script src=\"${storageServiceFile}\"></script>\\n<script src=\"${lifecycleServiceFile}\"></script>\\n`+manifest.coreJs.map(f=>`<script src=\"${f}\"></script>`).join('\\n'),'legacy core script set');",
'legacy lifecycle bootstrap');
build=replaceOnce(build,
"  bootstrapJs:[storageServiceFile],",
"  bootstrapJs:[storageServiceFile,lifecycleServiceFile],",
'asset report lifecycle bootstrap');
fs.writeFileSync(buildPath,build,'utf8');
console.log('Prepared v1 v21 to use the shared render/switch lifecycle service.');
