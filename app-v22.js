(function(){
  const DB_NAME='myTeacherOS.recovery';
  const DB_VERSION=1;
  const STORE='snapshots';
  const MAX_SNAPSHOTS=5;
  const SNAPSHOT_INTERVAL_MS=24*60*60*1000;
  const DATA_KEY=globalThis.KEY||'myTeacherOS.v01';
  const q=s=>document.querySelector(s);
  let dbPromise=null;

  function openDB(){
    if(!('indexedDB' in globalThis))return Promise.reject(new Error('이 브라우저는 기기 내 복구 저장소를 지원하지 않습니다.'));
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE)){
          const store=db.createObjectStore(STORE,{keyPath:'id'});
          store.createIndex('createdAt','createdAt',{unique:false});
        }
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('복구 저장소를 열지 못했습니다.'));
    });
    return dbPromise;
  }
  function txPromise(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('복구 저장소 작업에 실패했습니다.'));tx.onabort=()=>reject(tx.error||new Error('복구 저장소 작업이 취소되었습니다.'))})}
  async function listSnapshots(){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).getAll();
      req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))));
      req.onerror=()=>reject(req.error||new Error('복구지점을 읽지 못했습니다.'));
    });
  }
  function currentStateJSON(){const raw=localStorage.getItem(DATA_KEY);if(!raw)throw new Error('저장된 Teacher OS 데이터가 없습니다.');const obj=JSON.parse(raw);if(!obj||typeof obj!=='object'||!obj.years||typeof obj.years!=='object')throw new Error('현재 Teacher OS 데이터 형식이 올바르지 않습니다.');return JSON.stringify(obj)}
  async function pruneSnapshots(){
    const all=await listSnapshots();if(all.length<=MAX_SNAPSHOTS)return;
    const db=await openDB(),tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
    all.slice(MAX_SNAPSHOTS).forEach(x=>store.delete(x.id));
    await txPromise(tx);
  }
  async function createSnapshot(reason='manual'){
    const stateJson=currentStateJSON(),createdAt=new Date().toISOString(),id=createdAt+'-'+Math.random().toString(36).slice(2,8);
    const db=await openDB(),tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).put({id,createdAt,reason,stateJson,bytes:new Blob([stateJson]).size});
    await txPromise(tx);await pruneSnapshots();return id;
  }
  function reasonLabel(reason){return({daily:'자동 일일',preImport:'JSON 복구 직전',preRestore:'복구 실행 직전',manual:'수동'})[reason]||reason}
  function fmtBytes(n){if(!Number.isFinite(Number(n)))return'';if(n<1024)return n+' B';if(n<1048576)return Math.round(n/1024)+' KB';return (n/1048576).toFixed(1)+' MB'}
  function ensureUI(){
    const settings=q('#settings');if(!settings||q('#localRecoveryCard'))return;
    const grids=settings.querySelectorAll('.grid2');const anchor=grids[0]||q('#healthGrid');
    const html=`<article class="card local-recovery-card" id="localRecoveryCard"><div class="head"><div><span class="kicker">LOCAL RECOVERY</span><h3>기기 내 복구지점</h3><p class="muted">하루 한 번과 JSON 복구 직전에 현재 데이터를 이 브라우저의 별도 저장소에 최대 ${MAX_SNAPSHOTS}개 보관합니다.</p></div><button class="btn secondary tiny" id="createRecoveryNow" type="button">지금 복구지점 만들기</button></div><div class="notice warning spaced"><b>외부 백업이 아닙니다.</b> 브라우저 사이트 데이터 삭제·기기 분실·초기화 시 이 복구지점도 함께 사라집니다. 중요한 데이터는 JSON 백업 파일도 별도로 보관하세요.</div><div id="localRecoveryStatus" class="mini spaced"></div><div id="localRecoveryList" class="local-recovery-list"></div></article>`;
    if(anchor)anchor.insertAdjacentHTML('afterend',html);else settings.insertAdjacentHTML('beforeend',html);
    q('#createRecoveryNow').onclick=async()=>{const b=q('#createRecoveryNow');b.disabled=true;try{await createSnapshot('manual');await renderRecovery();}catch(e){q('#localRecoveryStatus').textContent='복구지점 생성 실패: '+(e?.message||e)}finally{b.disabled=false}};
  }
  async function renderRecovery(){
    ensureUI();const box=q('#localRecoveryList'),status=q('#localRecoveryStatus');if(!box)return;
    try{
      const all=await listSnapshots();status.textContent=all.length?`최근 ${all.length}개 복구지점을 이 기기에 보관 중입니다.`:'아직 기기 내 복구지점이 없습니다.';
      box.innerHTML=all.length?all.map(x=>`<div class="local-recovery-row"><div class="grow"><b>${new Date(x.createdAt).toLocaleString('ko-KR')}</b><div class="mini">${reasonLabel(x.reason)}${x.bytes?' · '+fmtBytes(x.bytes):''}</div></div><button class="btn secondary tiny" type="button" data-recovery-id="${x.id}">이 시점으로 복구</button></div>`).join(''):'<div class="empty">복구지점이 만들어지면 여기에 표시됩니다.</div>';
    }catch(e){status.textContent='기기 내 복구 기능을 사용할 수 없습니다: '+(e?.message||e);box.innerHTML=''}
  }
  async function restoreSnapshot(id){
    const db=await openDB();
    const snap=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('복구지점을 읽지 못했습니다.'))});
    if(!snap?.stateJson)throw new Error('복구지점 데이터가 없습니다.');
    const obj=JSON.parse(snap.stateJson);if(!obj||typeof obj!=='object'||!obj.years||typeof obj.years!=='object')throw new Error('복구지점 형식이 올바르지 않습니다.');
    if(!confirm(`${new Date(snap.createdAt).toLocaleString('ko-KR')} 상태로 되돌릴까요? 현재 상태는 먼저 별도 복구지점으로 보관합니다.`))return;
    await createSnapshot('preRestore');
    localStorage.setItem(DATA_KEY,JSON.stringify(obj));
    location.reload();
  }
  async function maybeDailySnapshot(){
    try{const all=await listSnapshots(),latest=all[0];if(!latest||Date.now()-new Date(latest.createdAt).getTime()>=SNAPSHOT_INTERVAL_MS)await createSnapshot('daily')}catch(e){console.warn('Teacher OS local recovery snapshot skipped:',e)}
  }
  function wrapJSONImport(){
    const input=q('#importJSON');if(!input||input.dataset.recoveryWrapped)return;
    const legacy=input.onchange;input.dataset.recoveryWrapped='1';
    input.onchange=async function(ev){
      const file=ev.target.files?.[0];if(!file)return legacy?.call(this,ev);
      try{await createSnapshot('preImport')}catch(e){if(!confirm('현재 상태의 기기 내 복구지점을 만들지 못했습니다. 그래도 JSON 복구를 계속할까요?')){ev.target.value='';return}}
      return legacy?.call(this,ev);
    };
  }
  function bindRestore(){document.body.addEventListener('click',async e=>{const b=e.target.closest('[data-recovery-id]');if(!b)return;b.disabled=true;try{await restoreSnapshot(b.dataset.recoveryId)}catch(err){alert('기기 내 복구 실패: '+(err?.message||err));b.disabled=false}})}
  function boot(){ensureUI();wrapJSONImport();bindRestore();renderRecovery();maybeDailySnapshot().then(renderRecovery);const foot=q('.side-foot');if(foot)foot.textContent='v0.22 · local recovery snapshots'}
  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(()=>{ensureUI();wrapJSONImport();renderRecovery()},0);return r};
  boot();
})();
