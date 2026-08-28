import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../v1-storage-service.js',import.meta.url),'utf8');

function serviceWith(initial={},failures=1,removeFailures=0){
  const data=new Map(Object.entries(initial));
  let remainingFailures=failures;
  let remainingRemoveFailures=removeFailures;
  const localStorage={
    getItem:key=>data.has(key)?data.get(key):null,
    setItem:(key,value)=>{
      if(remainingFailures>0){
        remainingFailures--;
        const error=new Error('synthetic quota failure');
        error.name='QuotaExceededError';
        throw error;
      }
      data.set(key,String(value));
    },
    removeItem:key=>{
      if(remainingRemoveFailures>0){
        remainingRemoveFailures--;
        const error=new Error('synthetic removal failure');
        error.name='SecurityError';
        throw error;
      }
      data.delete(key);
    }
  };
  const context={globalThis:null,structuredClone:global.structuredClone,localStorage};
  context.globalThis=context;
  vm.runInNewContext(source,context,{filename:'v1-storage-service.js'});
  return {storage:context.TeacherOSStorage,data};
}

{
  const original='{"version":32,"years":{"2026":{}}}';
  const {storage,data}=serviceWith({state:original});
  assert.equal(storage.readJSON('state',()=>({version:0})).version,32);
  assert.throws(
    ()=>storage.writeJSON('state',{version:33,years:{'2026':{}}}),
    error=>error?.code==='STORAGE_WRITE_FAILED'
  );
  assert.equal(data.get('state'),original,'failed object write must preserve the previous browser value');
  assert.equal(storage.hasReadError('state'),false,'write failure must not be misclassified as a read corruption');
  storage.writeJSON('state',{version:33,years:{'2026':{}}});
  assert.equal(JSON.parse(data.get('state')).version,33,'a later successful retry must remain possible');
}

{
  const original='[{"eventId":"e1"}]';
  const {storage,data}=serviceWith({history:original});
  assert.equal(storage.readJSONArray('history',()=>[]).length,1);
  assert.throws(
    ()=>storage.writeJSONArray('history',[{eventId:'e2'}]),
    error=>error?.code==='STORAGE_WRITE_FAILED'
  );
  assert.equal(data.get('history'),original,'failed array write must preserve the previous browser value');
  assert.equal(storage.hasReadError('history'),false);
  storage.writeJSONArray('history',[{eventId:'e2'}]);
  assert.equal(JSON.parse(data.get('history'))[0].eventId,'e2');
}

{
  const {storage,data}=serviceWith({});
  assert.deepEqual(storage.readJSON('new-state',()=>({version:0})),{version:0});
  assert.throws(
    ()=>storage.writeJSON('new-state',{version:1}),
    error=>error?.code==='STORAGE_WRITE_FAILED'
  );
  assert.equal(data.has('new-state'),false,'failed first write must not create a phantom persisted state');
}

{
  const original='{bad json';
  const {storage,data}=serviceWith({recovery:original},0,1);
  assert.deepEqual(storage.readJSON('recovery',()=>({safe:true})),{safe:true});
  assert.equal(storage.hasReadError('recovery'),true,'malformed recovery state must set the read guard before removal');
  assert.throws(
    ()=>storage.removeJSON('recovery'),
    error=>error?.code==='STORAGE_REMOVE_FAILED'
  );
  assert.equal(data.get('recovery'),original,'failed removal must preserve the browser value');
  assert.equal(storage.hasReadError('recovery'),true,'failed removal must preserve the recovery guard');
  storage.removeJSON('recovery');
  assert.equal(data.has('recovery'),false,'a later successful removal retry must delete the browser value');
  assert.equal(storage.hasReadError('recovery'),false,'the recovery guard must clear only after successful removal');
}

console.log('v1 browser storage write/remove failure normalization tests passed');
