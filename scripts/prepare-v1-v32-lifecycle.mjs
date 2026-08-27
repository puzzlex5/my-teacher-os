import fs from 'node:fs';

function replaceOnce(src,from,to,label){
  if(src.includes(from))return src.replace(from,to);
  if(src.includes(to))return src;
  throw new Error(`v1 v32 lifecycle preparation failed (${label})`);
}

const appPath='app-v32.js';
let app=fs.readFileSync(appPath,'utf8');

const legacyRender="  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(refresh,0);return r};";
const sharedRender="  const lifecycle32=globalThis.TeacherOSLifecycle;\n  if(lifecycle32){\n    lifecycle32.onRender(refresh,{defer:true});\n  }else{\n    const fallbackRender32=globalThis.render;if(typeof fallbackRender32==='function')globalThis.render=function(){const r=fallbackRender32.apply(this,arguments);setTimeout(refresh,0);return r};\n  }";
app=replaceOnce(app,legacyRender,sharedRender,'render hook');

const legacySwitch="  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='documents'||id==='settings'||id==='importer')setTimeout(refresh,0);return r};";
const sharedSwitch="  if(lifecycle32){\n    lifecycle32.onSwitch(id=>{if(id==='documents'||id==='settings'||id==='importer')refresh()},{defer:true});\n  }else{\n    const fallbackSwitch32=globalThis.switchView;if(typeof fallbackSwitch32==='function')globalThis.switchView=function(id){const r=fallbackSwitch32.apply(this,arguments);if(id==='documents'||id==='settings'||id==='importer')setTimeout(refresh,0);return r};\n  }";
app=replaceOnce(app,legacySwitch,sharedSwitch,'switch hook');

if(app.includes('const prevRender=globalThis.render'))throw new Error('v32 still carries historical direct render wrapper');
if(app.includes('const prevSwitch=globalThis.switchView'))throw new Error('v32 still carries historical direct switchView wrapper');
for(const token of ['TeacherOSLifecycle','lifecycle32.onRender','lifecycle32.onSwitch','fallbackRender32','fallbackSwitch32',"id==='documents'||id==='settings'||id==='importer'"]){
  if(!app.includes(token))throw new Error(`prepared v32 missing ${token}`);
}

fs.writeFileSync(appPath,app,'utf8');
console.log('Prepared v1 v32 device-storage and intake guard UI to use shared render/switch lifecycle hooks with isolated-test fallback.');
