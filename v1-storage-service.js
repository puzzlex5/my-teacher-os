(function(global){
  'use strict';

  function cloneFallback(factory){
    return typeof factory==='function'?factory():factory;
  }

  function readJSON(key,fallbackFactory){
    try{
      const raw=localStorage.getItem(key);
      if(raw===null||raw==='')return cloneFallback(fallbackFactory);
      const parsed=JSON.parse(raw);
      return parsed&&typeof parsed==='object'?parsed:cloneFallback(fallbackFactory);
    }catch{
      return cloneFallback(fallbackFactory);
    }
  }

  function writeJSON(key,value){
    localStorage.setItem(key,JSON.stringify(value));
    return value;
  }

  global.TeacherOSStorage=Object.freeze({readJSON,writeJSON});
})(globalThis);
