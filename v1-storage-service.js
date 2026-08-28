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
    if(raw===null){
      clearReadError(k);
      return cloneFallback(fallbackFactory);
    }
    if(raw===''){
      markReadError(k,'invalid-json',raw);
      return cloneFallback(fallbackFactory);
    }
    try{
      const parsed=JSON.parse(raw);
      if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)){
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

  function writeError(code,message){
    const err=new Error(message);
    err.code=code;
    return err;
  }

  function encodeJSONObject(value){
    if(!value||typeof value!=='object'||Array.isArray(value)){
      throw writeError('STORAGE_WRITE_INVALID_SHAPE','Teacher OS state must be a JSON object. Refusing to write an unreadable top-level value.');
    }
    let raw;
    try{
      raw=JSON.stringify(value);
    }catch{
      throw writeError('STORAGE_SERIALIZE_FAILED','Teacher OS state could not be serialized. Existing stored data was left unchanged.');
    }
    if(typeof raw!=='string'){
      throw writeError('STORAGE_WRITE_INVALID_SHAPE','Teacher OS state did not serialize to JSON. Existing stored data was left unchanged.');
    }
    try{
      const roundTrip=JSON.parse(raw);
      if(!roundTrip||typeof roundTrip!=='object'||Array.isArray(roundTrip)){
        throw writeError('STORAGE_WRITE_INVALID_SHAPE','Teacher OS state serialized to an unreadable top-level JSON shape. Existing stored data was left unchanged.');
      }
    }catch(err){
      if(err&&err.code==='STORAGE_WRITE_INVALID_SHAPE')throw err;
      throw writeError('STORAGE_SERIALIZE_FAILED','Teacher OS state could not be validated after serialization. Existing stored data was left unchanged.');
    }
    return raw;
  }

  function writeJSON(key,value){
    const k=keyOf(key);
    if(readErrors.has(k)){
      throw writeError('STORAGE_READ_GUARD','Teacher OS stored data could not be read. Refusing to overwrite it until recovery is completed.');
    }
    const raw=encodeJSONObject(value);
    localStorage.setItem(k,raw);
    return value;
  }

  function hasReadError(key){return readErrors.has(keyOf(key))}
  function getReadError(key){
    const x=readErrors.get(keyOf(key));
    return x?{code:x.code,rawLength:x.rawLength}:null;
  }

  global.TeacherOSStorage=Object.freeze({readJSON,writeJSON,hasReadError,getReadError});
})(globalThis);
