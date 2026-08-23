(function(){
  const q=s=>document.querySelector(s);
  const DB_NAME='myTeacherOS.sourceVault',STORE='files',RESULT_KEY='myTeacherOS.deviceStorageSelfTest.v1';
  const DAY=24*60*60*1000;
  let running=false;

  function readResult(){try{const x=JSON.parse(localStorage.getItem(RESULT_KEY)||'null');return x&&typeof x==='object'?x:null}catch{return null}}
  function writeResult(x){try{localStorage.setItem(RESULT_KEY,JSON.stringify(x));return true}catch{return false}}
  function browserLabel(){const ua=navigator.userAgent||'';if(/Edg\//.test(ua))return'Edge';if(/Chrome\//.test(ua)&&!/Edg\//.test(ua))return'Chrome';if(/Firefox\//.test(ua))return'Firefox';if(/Safari\//.test(ua)&&!/Chrome\//.test(ua))return'Safari';return'브라우저'}
  function deviceLabel(){return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'')?'모바일':'PC/태블릿'}
  function openDB(){return new Promise((resolve,reject)=>{if(!globalThis.indexedDB)return reject(new Error('IndexedDB 미지원'));const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'key'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('IndexedDB 열기 실패'))})}
  function putRecord(db,record){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error('쓰기 실패'));tx.onabort=tx.onerror})}
  function getRecord(db,key){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(key);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error||new Error('읽기 실패'))})}
  function deleteRecord(db,key){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error('삭제 실패'));tx.onabort=tx.onerror})}
  async function sha256(text){const bytes=new TextEncoder().encode(text),dig=await crypto.subtle.digest('SHA-256',bytes);return[...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('')}

  async function runSelfTest(manual=false){
    if(running)return readResult();running=true;render();const started=performance.now(),checkedAt=new Date().toISOString(),key='__teacher_os_selftest__:'+Date.now()+':'+Math.random().toString(16).slice(2);let db=null,stage='start';
    try{
      stage='open';db=await openDB();
      const payload=`Teacher OS local vault self-test\n${checkedAt}\n${key}\n한글 저장 검증`;
      const blob=new Blob([payload],{type:'text/plain;charset=utf-8'}),digest=await sha256(payload);
      stage='write';await putRecord(db,{key,name:'teacher-os-storage-selftest.txt',size:blob.size,type:blob.type,storedAt:checkedAt,selfTest:true,digest,blob});
      stage='read';const saved=await getRecord(db,key);if(!saved?.blob)throw new Error('저장한 Blob을 다시 읽지 못했습니다.');
      const restored=await saved.blob.text(),restoredDigest=await sha256(restored);if(restored!==payload||restoredDigest!==digest||Number(saved.size)!==blob.size)throw new Error('다시 읽은 파일 내용이 원본과 일치하지 않습니다.');
      stage='object-url';if(globalThis.URL?.createObjectURL){const u=URL.createObjectURL(saved.blob);URL.revokeObjectURL(u)}
      stage='delete';await deleteRecord(db,key);const after=await getRecord(db,key);if(after)throw new Error('자가검사 파일 삭제 확인에 실패했습니다.');
      const result={ok:true,checkedAt,durationMs:Math.round(performance.now()-started),browser:browserLabel(),device:deviceLabel(),stages:['open','write','read','integrity','delete'],message:'IndexedDB 쓰기·읽기·무결성·삭제 통과'};writeResult(result);return result;
    }catch(err){
      try{if(db)await deleteRecord(db,key)}catch{}
      const result={ok:false,checkedAt,durationMs:Math.round(performance.now()-started),browser:browserLabel(),device:deviceLabel(),stage,message:String(err?.message||err)};writeResult(result);if(manual)console.warn('Teacher OS device storage self-test failed',err);return result;
    }finally{try{db?.close()}catch{}running=false;applyLocalModeGuard();render()}
  }

  function applyLocalModeGuard(){
    const select=q('#retentionMode31');if(!select)return;const opt=select.querySelector('option[value="local"]'),r=readResult();if(!opt)return;
    const passed=r?.ok===true;opt.disabled=!passed;opt.textContent=passed?'이 기기에 원본도 보관 · 실기기 검사 통과':'이 기기에 원본도 보관 · 실기기 검사 필요';
    if(!passed&&select.value==='local'){select.value='reference';select.dispatchEvent(new Event('change',{bubbles:true}))}
  }
  function ensureUI(){
    const vault=q('#retentionVault31');if(!vault||q('#deviceStorageTest32'))return;
    const warning=vault.querySelector('.notice.warning');const html=`<div id="deviceStorageTest32" class="device-test32"><div class="device-test-main32"><span class="kicker">DEVICE STORAGE TEST</span><b>이 기기 로컬 원본 보관 검사</b><span id="deviceStorageStatus32" class="mini">검사 준비 중</span></div><button type="button" class="btn secondary tiny" id="runDeviceStorageTest32">지금 다시 검사</button></div>`;
    if(warning)warning.insertAdjacentHTML('afterend',html);else vault.insertAdjacentHTML('afterbegin',html);
    q('#runDeviceStorageTest32')?.addEventListener('click',()=>runSelfTest(true));
  }
  function render(){
    ensureUI();applyLocalModeGuard();const box=q('#deviceStorageStatus32'),btn=q('#runDeviceStorageTest32');if(!box)return;if(btn)btn.disabled=running;
    if(running){box.className='mini testing';box.textContent='IndexedDB에 시험 파일을 쓰고 다시 읽는 중…';return}
    const r=readResult();if(!r){box.className='mini pending';box.textContent='아직 이 기기에서 검증하지 않았습니다. 로컬 원본 보관은 검사 통과 후 활성화됩니다.';return}
    const when=new Date(r.checkedAt).toLocaleString('ko-KR');if(r.ok){box.className='mini pass';box.textContent=`통과 · ${r.browser} · ${r.device} · 쓰기→읽기→무결성→삭제 ${r.durationMs}ms · ${when}`}
    else{box.className='mini fail';box.textContent=`실패(${r.stage||'unknown'}) · ${r.message} · 안전하게 출처·버전 보관으로 사용합니다. · ${when}`}
  }
  function maybeAutoTest(){const r=readResult(),age=r?.checkedAt?Date.now()-new Date(r.checkedAt).getTime():Infinity;if(!r||!r.ok||age>DAY)setTimeout(()=>runSelfTest(false),700)}
  function refresh(){ensureUI();render();const foot=q('.side-foot');if(foot)foot.textContent='v0.32 · real-device local vault self-test'}

  document.addEventListener('change',e=>{if(e.target?.id==='retentionMode31')applyLocalModeGuard()},true);
  setTimeout(()=>{refresh();maybeAutoTest()},0);
  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(refresh,0);return r};
  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='documents'||id==='settings'||id==='importer')setTimeout(refresh,0);return r};
})();
