import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('v1-storage-service.js','utf8');

function serviceWith(initial={}){
  const data=new Map(Object.entries(initial));
  const localStorage={
    getItem(k){return data.has(String(k))?data.get(String(k)):null},
    setItem(k,v){data.set(String(k),String(v))},
    removeItem(k){data.delete(String(k))}
  };
  const context={globalThis:null,localStorage,Map,Object,String,JSON,Error,Array,Number,WeakSet};
  context.globalThis=context;
  vm.runInNewContext(source,context,{filename:'v1-storage-service.js'});
  return{storage:context.TeacherOSStorage,data};
}

{
  const {storage,data}=serviceWith({state:'{"version":32,"currentYear":"2026"}'});
  const got=storage.readJSON('state',()=>({version:0}));
  assert.equal(got.version,32);
  assert.equal(storage.hasReadError('state'),false);
  storage.writeJSON('state',{version:33});
  assert.equal(data.get('state'),'{"version":33}');
}

{
  const corrupt='{"version":32,"years":';
  const {storage,data}=serviceWith({state:corrupt});
  const fallback=storage.readJSON('state',()=>({version:0,years:{}}));
  assert.equal(fallback.version,0);
  assert.equal(storage.hasReadError('state'),true);
  assert.equal(storage.getReadError('state').code,'invalid-json');
  assert.equal(storage.getReadError('state').rawLength,corrupt.length);
  assert.throws(()=>storage.writeJSON('state',{version:33}),e=>e?.code==='STORAGE_READ_GUARD');
  assert.equal(data.get('state'),corrupt,'corrupt original must remain byte-for-byte untouched');
}

{
  const raw='42';
  const {storage,data}=serviceWith({state:raw});
  const fallback=storage.readJSON('state',()=>({version:0}));
  assert.equal(fallback.version,0);
  assert.equal(storage.getReadError('state').code,'invalid-json-shape');
  assert.throws(()=>storage.writeJSON('state',{version:1}),/Refusing to overwrite/);
  assert.equal(data.get('state'),raw);
}

{
  const raw='[]';
  const {storage,data}=serviceWith({state:raw});
  const fallback=storage.readJSON('state',()=>({version:0,years:{}}));
  assert.equal(fallback.version,0);
  assert.equal(storage.hasReadError('state'),true,'top-level arrays are corrupted Teacher OS state, not valid object state');
  assert.equal(storage.getReadError('state').code,'invalid-json-shape');
  assert.equal(storage.getReadError('state').rawLength,raw.length);
  assert.throws(()=>storage.writeJSON('state',{version:1,years:{}}),e=>e?.code==='STORAGE_READ_GUARD');
  assert.equal(data.get('state'),raw,'array-shaped original must remain byte-for-byte untouched');
}

{
  const raw='';
  const {storage,data}=serviceWith({state:raw});
  const fallback=storage.readJSON('state',()=>({version:0,years:{}}));
  assert.equal(fallback.version,0);
  assert.equal(storage.hasReadError('state'),true,'blank stored state is corruption, not a clean first-run condition');
  assert.equal(storage.getReadError('state').code,'invalid-json');
  assert.equal(storage.getReadError('state').rawLength,0);
  assert.throws(()=>storage.writeJSON('state',{version:1,years:{}}),e=>e?.code==='STORAGE_READ_GUARD');
  assert.equal(data.get('state'),raw,'blank corrupt original must remain byte-for-byte untouched');
}

{
  const {storage}=serviceWith({});
  const fallback=storage.readJSON('state',()=>({version:5}));
  assert.equal(fallback.version,5);
  assert.equal(storage.hasReadError('state'),false,'missing state is a clean first-run condition, not corruption');
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
  assert.throws(()=>storage.writeJSON('state',misleading),e=>e?.code==='STORAGE_WRITE_INVALID_SHAPE');
  assert.equal(data.get('state'),original,'toJSON must not be able to turn main state into a shape readJSON rejects');
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
  assert.deepEqual(JSON.parse(data.get('state')),{
    version:33,
    left:{name:'same object may appear twice'},
    right:{name:'same object may appear twice'},
    years:{2026:{scores:[0,1,2],note:null}}
  });
}

console.log('v1 storage corruption, write-shape, and lossless JSON guard tests passed');
