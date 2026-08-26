import fs from 'node:fs';
import vm from 'node:vm';

function ok(v,msg){if(!v)throw new Error(msg)}
const source=fs.readFileSync('v1-lifecycle-service.js','utf8');
const timers=[];
const calls=[];
const context={
  console,
  setTimeout(fn){timers.push(fn);return timers.length},
  render(){calls.push('base-render');return 17},
  switchView(id){calls.push(`base-switch:${id}`);return id}
};
context.globalThis=context;
vm.runInNewContext(source,context,{filename:'v1-lifecycle-service.js'});
const L=context.TeacherOSLifecycle;
ok(L&&typeof L.onRender==='function'&&typeof L.onSwitch==='function','lifecycle API missing');
let renderHook=0,switchHook=0;
L.onRender(()=>{renderHook++},{defer:true});
L.onSwitch(id=>{if(id==='studentrecords')switchHook++},{defer:true});
ok(context.render()===17,'render return value changed');
ok(context.switchView('studentrecords')==='studentrecords','switch return value changed');
ok(renderHook===0&&switchHook===0,'deferred hooks fired synchronously');
while(timers.length)timers.shift()();
ok(renderHook===1&&switchHook===1,'deferred lifecycle hooks did not run exactly once');
ok(L._counts().render===1&&L._counts().switch===1,'hook counts incorrect');

const app=fs.readFileSync('app-v21.js','utf8');
ok(app.includes('TeacherOSLifecycle'),'prepared v21 must use shared lifecycle');
ok(app.includes('lifecycle21.onRender')&&app.includes('lifecycle21.onSwitch'),'v21 lifecycle subscriptions missing');
ok(!app.includes('prevRender21=globalThis.render')&&!app.includes('prevSwitch21=globalThis.switchView'),'v21 still chains global lifecycle wrappers');
const build=fs.readFileSync('scripts/build-v1-runtime.mjs','utf8');
ok(build.includes("lifecycleServiceFile='v1-lifecycle-service.js'"),'build does not bootstrap lifecycle service');
ok(build.includes('bootstrapJs:[storageServiceFile,lifecycleServiceFile]'),'asset report does not declare lifecycle bootstrap');
console.log('v1 shared lifecycle service and v21 hook migration tests passed');
