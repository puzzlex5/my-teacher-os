import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../v1-storage-service.js',import.meta.url),'utf8');

function serviceWith(initial={}){
  const data=new Map(Object.entries(initial));
  const context={
    globalThis:null,
    structuredClone:global.structuredClone,
    localStorage:{
      getItem:key=>data.has(key)?data.get(key):null,
      setItem:(key,value)=>data.set(key,String(value)),
      removeItem:key=>data.delete(key)
    }
  };
  context.globalThis=context;
  vm.runInNewContext(source,context,{filename:'v1-storage-service.js'});
  return {storage:context.TeacherOSStorage,data};
}

{
  const original='{"version":32,"years":{"2026":{}}}';
  const {storage,data}=serviceWith({state:original});
  const value=storage.readJSON('state',()=>({version:0}));
  assert.equal(value.version,32);
  storage.writeJSON('state',{version:33,years:{'2026':{}}});
  assert.equal(JSON.parse(data.get('state')).version,33);
}

{
  const original='{broken';
  const {storage,data}=serviceWith({state:original});
  const fallback=storage.readJSON('state',()=>({version:0,years:{}}));
  assert.equal(fallback.version,0);
  assert.equal(storage.hasReadError('state'),true);
  assert.equal(storage.getReadError('state')?.code,'invalid-json');
  assert.throws(()=>storage.writeJSON('state',{version:33,years:{}}),e=>e?.code==='STORAGE_READ_GUARD');
  assert.equal(data.get('state'),original,'malformed JSON must remain untouched');
}

{
  const original='42';
  const {storage,data}=serviceWith({state:original});
  storage.readJSON('state',()=>({version:0,years:{}}));
  assert.equal(storage.getReadError('state')?.code,'invalid-json-shape');
  assert.throws(()=>storage.writeJSON('state',{version:33,years:{}}),e=>e?.code==='STORAGE_READ_GUARD');
  assert.equal(data.get('state'),original,'scalar JSON must remain untouched');
}

{
  const original='[]';
  const {storage,data}=serviceWith({state:original});
  storage.readJSON('state',()=>({version:0,years:{}}));
  assert.equal(storage.getReadError('state')?.code,'invalid-json-shape');
  assert.throws(()=>storage.writeJSON('state',{version:33,years:{}}),e=>e?.code==='STORAGE_READ_GUARD');
  assert.equal(data.get('state'),original,'array JSON must remain untouched by object storage');
}

{
  const original='';
  const {storage,data}=serviceWith({state:original});
  storage.readJSON('state',()=>({version:0,years:{}}));
  assert.equal(storage.getReadError('state')?.code,'invalid-json');
  assert.equal(storage.getReadError('state')?.rawLength,0);
  assert.throws(()=>storage.writeJSON('state',{version:33,years:{}}),e=>e?.code==='STORAGE_READ_GUARD');
  assert.equal(data.get('state'),original,'blank-but-present JSON must remain untouched');
}

{
  const {storage}=serviceWith({});
  assert.deepEqual(storage.readJSON('state',()=>({version:0,years:{}})),{version:0,years:{}});
  assert.equal(storage.hasReadError('state'),false,'missing key is a valid first-run state');
  storage.writeJSON('state',{version:6});
}

{
  const original='{"version":32,"years":{}}';
  const {storage,data}=serviceWith({state:original});
  storage.readJSON('state',()=>({}));
  for(const bad of [undefined,null,42,'bad',[]]){
    assert.throws(()=>storage.writeJSON('state',bad),e=>e?.code==='STORAGE_WRITE_INVALID_SHAPE');
    assert.equal(data.get('state'),original,'invalid top-level write must not alter the existing state');
  }
}

{
  const original='{"version":32,"years":{}}';
  const {storage,data}=serviceWith({state:original});
  storage.readJSON('state',()=>({}));
  const circular={version:33};
  circular.self=circular;
  assert.throws(()=>storage.writeJSON('state',circular),e=>e?.code==='STORAGE_SERIALIZE_FAILED');
  assert.equal(data.get('state'),original,'serialization failure must preserve the existing state');
}

{
  const original='{"version":32,"years":{}}';
  const {storage,data}=serviceWith({state:original});
  storage.readJSON('state',()=>({}));
  const misleading={version:33,toJSON(){return[]}};
  assert.throws(()=>storage.writeJSON('state',misleading),e=>e?.code==='STORAGE_WRITE_LOSSY_VALUE');
  assert.equal(data.get('state'),original,'toJSON must not be able to alter or replace the persisted state representation');
}

{
  const original='{"version":32,"years":{}}';
  const {storage,data}=serviceWith({state:original});
  storage.readJSON('state',()=>({}));
  const lossy=[
    {version:33,years:{2026:{memo:undefined}}},
    {version:33,years:{2026:{scores:[1,undefined,3]}}},
    {version:33,years:{2026:{score:NaN}}},
    {version:33,years:{2026:{score:Infinity}}},
    {version:33,years:{2026:{score:-Infinity}}},
    {version:33,years:{2026:{handler(){}}}},
    {version:33,years:{2026:{token:Symbol('x')}}},
    {version:33,years:{2026:{when:new Date('2026-08-28T00:00:00Z')}}},
    {version:33,years:{2026:{lookup:new Map([['a',1]])}}},
    {version:33,years:{2026:{members:new Set(['a'])}}},
    {version:33,years:{2026:{pattern:/school/}}}
  ];
  class DraftRecord{constructor(){this.memo='class-backed'}}
  lossy.push({version:33,years:{2026:{draft:new DraftRecord()}}});
  for(const bad of lossy){
    assert.throws(()=>storage.writeJSON('state',bad),e=>e?.code==='STORAGE_WRITE_LOSSY_VALUE');
    assert.equal(data.get('state'),original,'lossy nested JSON values must not alter the existing state');
  }
}

{
  const original='{"version":32,"years":{}}';
  const {storage,data}=serviceWith({state:original});
  storage.readJSON('state',()=>({}));
  const symbolKey=Symbol('private');
  const next={version:33,years:{2026:{memo:'safe'}}};
  next.years['2026'][symbolKey]='would-be-lost';
  assert.throws(()=>storage.writeJSON('state',next),e=>e?.code==='STORAGE_WRITE_LOSSY_VALUE');
  assert.equal(data.get('state'),original,'symbol-keyed data must not be silently omitted');
}

{
  const original='{"version":32,"years":{}}';
  const {storage,data}=serviceWith({state:original});
  storage.readJSON('state',()=>({}));

  const hidden={version:33,years:{2026:{memo:'safe'}}};
  Object.defineProperty(hidden.years['2026'],'secret',{value:'would-be-lost',enumerable:false});
  assert.throws(()=>storage.writeJSON('state',hidden),e=>e?.code==='STORAGE_WRITE_LOSSY_VALUE');
  assert.equal(data.get('state'),original,'non-enumerable data must not be silently omitted');

  const accessor={version:33,years:{2026:{}}};
  Object.defineProperty(accessor.years['2026'],'memo',{enumerable:true,get(){return 'computed'}});
  assert.throws(()=>storage.writeJSON('state',accessor),e=>e?.code==='STORAGE_WRITE_LOSSY_VALUE');
  assert.equal(data.get('state'),original,'accessor-backed data must not be serialized as if it were stable state');

  const extraArrayProp={version:33,years:{2026:{scores:[1,2]}}};
  extraArrayProp.years['2026'].scores.note='would-be-lost';
  assert.throws(()=>storage.writeJSON('state',extraArrayProp),e=>e?.code==='STORAGE_WRITE_LOSSY_VALUE');
  assert.equal(data.get('state'),original,'named array properties must not be silently omitted');

  const sparse={version:33,years:{2026:{scores:[1,,3]}}};
  assert.throws(()=>storage.writeJSON('state',sparse),e=>e?.code==='STORAGE_WRITE_LOSSY_VALUE');
  assert.equal(data.get('state'),original,'sparse array holes must not be silently converted to null');
}

{
  const {storage,data}=serviceWith({});
  const shared={name:'same object may appear twice'};
  const nullProto=Object.create(null);
  nullProto.memo='plain null-prototype record';
  const valid={version:33,left:shared,right:shared,meta:nullProto,years:{2026:{scores:[0,1,2],note:null}}};
  storage.writeJSON('state',valid);
  assert.deepEqual(JSON.parse(data.get('state')),{version:33,left:{name:'same object may appear twice'},right:{name:'same object may appear twice'},meta:{memo:'plain null-prototype record'},years:{2026:{scores:[0,1,2],note:null}}});
}

{
  const original='[{"year":2026,"eventId":"e1"}]';
  const {storage,data}=serviceWith({history:original});
  assert.equal(storage.readJSONArray('history',()=>[]).length,1);
  storage.writeJSONArray('history',[{year:2026,eventId:'e2'}]);
  assert.equal(JSON.parse(data.get('history'))[0].eventId,'e2','valid array storage must round-trip');
}

{
  const original='{"not":"an-array"}';
  const {storage,data}=serviceWith({history:original});
  assert.deepEqual(storage.readJSONArray('history',()=>[]),[]);
  assert.equal(storage.getReadError('history')?.code,'invalid-json-shape');
  assert.throws(()=>storage.writeJSONArray('history',[]),e=>e?.code==='STORAGE_READ_GUARD');
  assert.equal(data.get('history'),original,'wrong-shaped array storage must remain untouched');
  storage.removeJSON('history');
  assert.equal(storage.hasReadError('history'),false,'explicit removal must clear the read guard only after deletion');
  storage.writeJSONArray('history',[]);
  assert.equal(data.get('history'),'[]');
}

{
  const original='[{"memo":"safe"}]';
  const {storage,data}=serviceWith({history:original});
  storage.readJSONArray('history',()=>[]);
  assert.throws(()=>storage.writeJSONArray('history',[{memo:undefined}]),e=>e?.code==='STORAGE_WRITE_LOSSY_VALUE');
  assert.equal(data.get('history'),original,'array storage must share the same lossless JSON contract');
  assert.throws(()=>storage.writeJSONArray('history',{memo:'wrong top level'}),e=>e?.code==='STORAGE_WRITE_INVALID_SHAPE');
  assert.equal(data.get('history'),original);
}

console.log('v1 storage corruption, typed-array, write-shape, and lossless JSON guard tests passed');
