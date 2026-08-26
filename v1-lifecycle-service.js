(function(root){
  const renderHooks=[],switchHooks=[];
  let renderInstalled=false,switchInstalled=false;

  function invoke(hook,args){
    const run=()=>{try{hook.fn.apply(null,args)}catch(e){console.error('Teacher OS lifecycle hook failed',e)}};
    if(hook.defer)setTimeout(run,0);else run();
  }
  function installRender(){
    if(renderInstalled)return;
    const previous=root.render;if(typeof previous!=='function')throw new Error('TeacherOSLifecycle requires render before registration');
    if(previous.__teacherOSLifecycleRender){renderInstalled=true;return}
    const wrapped=function(){const args=[...arguments],result=previous.apply(this,args);renderHooks.slice().forEach(h=>invoke(h,args));return result};
    wrapped.__teacherOSLifecycleRender=true;wrapped.__teacherOSLifecyclePrevious=previous;root.render=wrapped;renderInstalled=true;
  }
  function installSwitch(){
    if(switchInstalled)return;
    const previous=root.switchView;if(typeof previous!=='function')throw new Error('TeacherOSLifecycle requires switchView before registration');
    if(previous.__teacherOSLifecycleSwitch){switchInstalled=true;return}
    const wrapped=function(){const args=[...arguments],result=previous.apply(this,args);switchHooks.slice().forEach(h=>invoke(h,args));return result};
    wrapped.__teacherOSLifecycleSwitch=true;wrapped.__teacherOSLifecyclePrevious=previous;root.switchView=wrapped;switchInstalled=true;
  }
  function add(list,fn,opts={}){
    if(typeof fn!=='function')throw new TypeError('TeacherOSLifecycle hook must be a function');
    const hook={fn,defer:opts.defer===true};list.push(hook);return()=>{const i=list.indexOf(hook);if(i>=0)list.splice(i,1)};
  }
  function onRender(fn,opts){installRender();return add(renderHooks,fn,opts)}
  function onSwitch(fn,opts){installSwitch();return add(switchHooks,fn,opts)}
  root.TeacherOSLifecycle={onRender,onSwitch,_counts:()=>({render:renderHooks.length,switch:switchHooks.length})};
})(globalThis);
