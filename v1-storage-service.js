(function(global){
  'use strict';

  const readErrors=new Map();

  function cloneFallback(factory){
    return typeof factory==='function'?factory():factory;
  }

  function keyOf(key){return String(key??'')}

  function markReadError(key,code,raw){
    readErrors.set(keyOf(key),Object.freeze({
      code:String(code||'read-failed'),
      rawLength:typeof raw==='string'?raw.length:null
    }));
  }

  function clearReadError(key){readErrors.delete(keyOf(key))}

  function readJSON(key,fallbackFactory){
    const k=keyOf(key);
    let raw;
    try{
      raw=localStorage.getItem(k);
    }catch{
      markReadError(k,'storage-read-failed',null);
      return cloneFallback(fallbackFactory);
    }
    if(raw===null||raw===''){
      clearReadError(k);
      return cloneFallback(fallbackFactory);
    }
    try{
      const parsed=JSON.parse(raw);
      if(parsed&&typeof parsed==='object'){
        clearReadError(k);
        return parsed;
      }
      markReadError(k,'invalid-json-shape',raw);
      return cloneFallback(fallbackFactory);
    }catch{
      markReadError(k,'invalid-json',raw);
      return cloneFallback(fallbackFactory);
    }
  }

  function writeJSON(key,value){
    const k=keyOf(key);
    if(readErrors.has(k)){
      const err=new Error('Teacher OS stored data could not be read. Refusing to overwrite it until recovery is completed.');
      err.code='STORAGE_READ_GUARD';
      throw err;
    }
    localStorage.setItem(k,JSON.stringify(value));
    return value;
  }

  function hasReadError(key){return readErrors.has(keyOf(key))}
  function getReadError(key){
    const x=readErrors.get(keyOf(key));
    return x?{code:x.code,rawLength:x.rawLength}:null;
  }

  global.TeacherOSStorage=Object.freeze({readJSON,writeJSON,hasReadError,getReadError});
})(globalThis);
