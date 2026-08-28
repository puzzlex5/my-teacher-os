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
  assert.equal(data.get('state'),original,'array JSON must remain untouched');
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
    {version:33,years:{2026:{token:Symbol('x')}}}
  ];
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
  const {storage,data}=serviceWith({});
  const shared={name:'same object may appear twice'};
  const valid={version:33,left:shared,right:shared,years:{2026:{scores:[0,1,2],note:null}}};
  storage.writeJSON('state',valid);
  assert.deepEqual(JSON.parse(data.get('state')),{version:33,left:{name:'same object may appear twice'},right:{name:'same object may appear twice'},years:{2026:{scores:[0,1,2],note:null}}});
}

console.log('v1 storage corruption, write-shape, and lossless JSON guard tests passed');
