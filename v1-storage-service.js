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

  function readJSONShape(key,fallbackFactory,acceptShape){
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
      if(acceptShape(parsed)){
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

  function readJSON(key,fallbackFactory){
    return readJSONShape(key,fallbackFactory,parsed=>!!parsed&&typeof parsed==='object'&&!Array.isArray(parsed));
  }

  function readJSONArray(key,fallbackFactory=()=>[]){
    return readJSONShape(key,fallbackFactory,Array.isArray);
  }

  function writeError(code,message){
    const err=new Error(message);
    err.code=code;
    return err;
  }

  function isPlainRecord(value){
    const proto=Object.getPrototypeOf(value);
    if(proto===null)return true;
    const parent=Object.getPrototypeOf(proto);
    const ctor=Object.prototype.hasOwnProperty.call(proto,'constructor')?proto.constructor:null;
    return parent===null&&typeof ctor==='function'&&ctor.name==='Object';
  }

  function lossyShape(message){
    throw writeError('STORAGE_WRITE_LOSSY_VALUE',message+' Existing stored data was left unchanged.');
  }

  function validateArray(value,seen){
    for(const key of Object.getOwnPropertyNames(value)){
      if(key==='length')continue;
      if(!/^(0|[1-9]\d*)$/.test(key)){
        lossyShape('Teacher OS state contains an array property that JSON would silently omit.');
      }
      const index=Number(key);
      if(!Number.isSafeInteger(index)||index<0||index>=value.length){
        lossyShape('Teacher OS state contains an array property that JSON cannot preserve as an array element.');
      }
      const descriptor=Object.getOwnPropertyDescriptor(value,key);
      if(!descriptor||!Object.prototype.hasOwnProperty.call(descriptor,'value')){
        lossyShape('Teacher OS state contains an accessor-backed array element that cannot be verified for lossless JSON storage.');
      }
    }
    for(let i=0;i<value.length;i++){
      const descriptor=Object.getOwnPropertyDescriptor(value,String(i));
      if(!descriptor){
        lossyShape('Teacher OS state contains a sparse array hole that JSON would silently convert to null.');
      }
      validateJSONSafeValue(descriptor.value,seen);
    }
  }

  function validatePlainRecord(value,seen){
    if(!isPlainRecord(value)){
      lossyShape('Teacher OS state contains a non-plain object whose JSON representation may change type or lose data.');
    }
    for(const key of Object.getOwnPropertyNames(value)){
      const descriptor=Object.getOwnPropertyDescriptor(value,key);
      if(!descriptor?.enumerable){
        lossyShape('Teacher OS state contains a non-enumerable property that JSON would silently omit.');
      }
      if(!Object.prototype.hasOwnProperty.call(descriptor,'value')){
        lossyShape('Teacher OS state contains an accessor property that cannot be verified for lossless JSON storage.');
      }
      validateJSONSafeValue(descriptor.value,seen);
    }
  }

  function validateJSONSafeValue(value,seen){
    if(value===null)return;
    const type=typeof value;
    if(type==='number'){
      if(!Number.isFinite(value)){
        throw writeError('STORAGE_WRITE_LOSSY_VALUE','Teacher OS state contains a non-finite number that JSON would silently convert to null. Existing stored data was left unchanged.');
      }
      return;
    }
    if(type==='string'||type==='boolean')return;
    if(type==='undefined'||type==='function'||type==='symbol'||type==='bigint'){
      throw writeError('STORAGE_WRITE_LOSSY_VALUE','Teacher OS state contains a value that JSON would omit or cannot preserve. Existing stored data was left unchanged.');
    }
    if(type!=='object')return;
    if(Object.getOwnPropertySymbols(value).length){
      throw writeError('STORAGE_WRITE_LOSSY_VALUE','Teacher OS state contains symbol-keyed data that JSON would silently omit. Existing stored data was left unchanged.');
    }
    if(seen.has(value)){
      throw writeError('STORAGE_SERIALIZE_FAILED','Teacher OS state contains a circular reference. Existing stored data was left unchanged.');
    }
    seen.add(value);
    try{
      if(Array.isArray(value))validateArray(value,seen);
      else validatePlainRecord(value,seen);
    }finally{
      seen.delete(value);
    }
  }

  function encodeJSONShape(value,topLevelArray){
    const validTop=topLevelArray?Array.isArray(value):!!value&&typeof value==='object'&&!Array.isArray(value);
    if(!validTop){
      throw writeError('STORAGE_WRITE_INVALID_SHAPE',`Teacher OS state must be a JSON ${topLevelArray?'array':'object'}. Refusing to write an unreadable top-level value.`);
    }
    try{
      validateJSONSafeValue(value,new WeakSet());
    }catch(err){
      if(err&&err.code)throw err;
      throw writeError('STORAGE_SERIALIZE_FAILED','Teacher OS state could not be validated for lossless JSON storage. Existing stored data was left unchanged.');
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
      const roundTripValid=topLevelArray?Array.isArray(roundTrip):!!roundTrip&&typeof roundTrip==='object'&&!Array.isArray(roundTrip);
      if(!roundTripValid){
        throw writeError('STORAGE_WRITE_INVALID_SHAPE','Teacher OS state serialized to an unreadable top-level JSON shape. Existing stored data was left unchanged.');
      }
    }catch(err){
      if(err&&err.code==='STORAGE_WRITE_INVALID_SHAPE')throw err;
      throw writeError('STORAGE_SERIALIZE_FAILED','Teacher OS state could not be validated after serialization. Existing stored data was left unchanged.');
    }
    return raw;
  }

  function writeShape(key,value,topLevelArray){
    const k=keyOf(key);
    if(readErrors.has(k)){
      throw writeError('STORAGE_READ_GUARD','Teacher OS stored data could not be read. Refusing to overwrite it until recovery is completed.');
    }
    const raw=encodeJSONShape(value,topLevelArray);
    localStorage.setItem(k,raw);
    return value;
  }

  function writeJSON(key,value){return writeShape(key,value,false)}
  function writeJSONArray(key,value){return writeShape(key,value,true)}

  function removeJSON(key){
    const k=keyOf(key);
    localStorage.removeItem(k);
    clearReadError(k);
  }

  function hasReadError(key){return readErrors.has(keyOf(key))}
  function getReadError(key){
    const x=readErrors.get(keyOf(key));
    return x?{code:x.code,rawLength:x.rawLength}:null;
  }

  global.TeacherOSStorage=Object.freeze({readJSON,writeJSON,readJSONArray,writeJSONArray,removeJSON,hasReadError,getReadError});
})(globalThis);
