(function(){
  const R=globalThis.TeacherOSRetentionPolicy;if(!R)return;
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const DB_NAME='myTeacherOS.sourceVault',STORE='files',PERSIST_KEY='myTeacherOS.sourceVault.persistence.v1';
  let activeBatch=null,finalizing=false;

  function y31(){try{return typeof cur==='function'?cur():null}catch{return null}}
  function save31(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){console.error('v31 state save',e);return false}}
  function id31(){return crypto.randomUUID?crypto.randomUUID():'r31-'+Date.now()+'-'+Math.random().toString(16).slice(2)}
  function imports31(y=y31()){return Array.isArray(y?.imports)?y.imports:[]}
  function importKey31(x){return String(x?.id||x?.hash||`${x?.name||''}:${x?.when||''}`)}

  function openDB31(){return new Promise((resolve,reject)=>{if(!globalThis.indexedDB)return reject(new Error('이 브라우저는 로컬 원본 보관소를 지원하지 않습니다.'));const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'key'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('로컬 원본 보관소를 열지 못했습니다.'))})}
  async function vaultPut31(record){const db=await openDB31();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{const e=tx.error;db.close();reject(e||new Error('원본 저장 실패'))};tx.onabort=tx.onerror})}
  async function vaultGet31(key){const db=await openDB31();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(key);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close()})}
  async function vaultDelete31(key){const db=await openDB31();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{const e=tx.error;db.close();reject(e)}})}
  async function vaultClear31(){const db=await openDB31();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{const e=tx.error;db.close();reject(e)}})}
  async function vaultMeta31(){const db=await openDB31();return new Promise((resolve,reject)=>{const out=[];const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).openCursor();req.onsuccess=()=>{const c=req.result;if(!c)return;const v=c.value||{};out.push({key:v.key,name:v.name||'',size:Number(v.size)||0,type:v.type||'',storedAt:v.storedAt||'',year:v.year||''});c.continue()};req.onerror=()=>reject(req.error);tx.oncomplete=()=>{db.close();resolve(out)};tx.onerror=()=>{const e=tx.error;db.close();reject(e)}})}
  async function storageEstimate31(){try{return navigator.storage?.estimate?await navigator.storage.estimate():{}}catch{return{}}}
  async function requestPersistence31(){if(!navigator.storage?.persist)return null;try{const granted=await navigator.storage.persist();localStorage.setItem(PERSIST_KEY,granted?'granted':'not-granted');return granted}catch{return null}}
  function persistence31(){return localStorage.getItem(PERSIST_KEY)||'unknown'}

  function ensureUploadPolicy31(){
    const input=q('#importFiles');if(!input||q('#retentionPolicy31'))return;
    const card=input.closest('article');if(!card)return;
    const quick=card.querySelector('.quick');if(!quick)return;
    quick.insertAdjacentHTML('beforebegin',`<div id="retentionPolicy31" class="retention-policy31"><div class="retention-policy-head31"><b>업로드 원본 보존</b><span class="pill">기본 · 자동 권장</span></div><select id="retentionMode31" class="field"><option value="auto">자동 권장 · 중요문서는 출처/버전만, 나머지는 원본 미보관</option><option value="transient">원본 미보관 · 분석 후 해제</option><option value="reference">출처·해시·버전만 보관</option><option value="local">이 기기에 원본도 보관</option></select><input id="retentionLocation31" class="field" placeholder="원본 위치 메모 (선택) · 예: 교무공유폴더 > 2026 > 평가"><div id="retentionHelp31" class="mini"></div></div>`);
    q('#retentionMode31')?.addEventListener('change',renderPolicyHelp31);renderPolicyHelp31()
  }
  function renderPolicyHelp31(){const mode=q('#retentionMode31')?.value||'auto',box=q('#retentionHelp31');if(!box)return;const msg=mode==='local'?'원본을 이 브라우저의 IndexedDB에만 저장합니다. GitHub·외부 서버로 보내지 않으며 브라우저 데이터 삭제 시 사라질 수 있습니다.':mode==='reference'?'원본 파일은 남기지 않고 원본 위치 메모·해시·문서계열·버전 이력을 남깁니다.':mode==='transient'?'분석이 끝나면 원본 선택을 놓고 최소 처리·버전 이력만 남깁니다.':'평가계획·학사일정·시간표·업무분장 등은 출처·버전 보관, 그 외는 원본 미보관으로 자동 선택합니다.';box.textContent=msg}

  function captureBatch31(e){
    const input=e.target;if(input?.id!=='importFiles'||!input.files?.length)return;
    const mode=q('#retentionMode31')?.value||'auto',sourceLocation=q('#retentionLocation31')?.value?.trim()||'';
    activeBatch={id:id31(),mode,sourceLocation,files:[...input.files].map(file=>({file,name:file.name,size:Number(file.size)||0,lastModified:Number(file.lastModified)||null})),capturedAt:Date.now(),finalized:false};
  }
  async function hash31(file){const dig=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());return[...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  async function matchImport31(f,y){try{const h=await hash31(f.file);return imports31(y).find(x=>x.hash===h)||null}catch{return null}}

  async function storeLocalOriginal31(f,imp,sourceLocation){
    const estimate=await storageEstimate31(),space=R.canStoreOriginal(f.size,estimate);if(!space.ok)throw new Error(`기기 저장공간이 부족합니다. 사용 가능 약 ${R.formatBytes(space.available||0)}`);
    const key=String(imp.hash||await hash31(f.file));
    await vaultPut31({key,name:f.name,type:f.file.type||'',size:f.size,lastModified:f.lastModified,storedAt:new Date().toISOString(),year:y31()?.year||'',sourceLocation:String(sourceLocation||''),blob:f.file});
    requestPersistence31();return key
  }
  function applyRetentionMeta31(imp,level,extra={}){Object.assign(imp,R.retentionRecord(level,extra));imp.retentionReason=extra.reason||'';if(extra.size&&!imp.size)imp.size=extra.size;if(extra.lastModified&&!imp.fileLastModified)imp.fileLastModified=extra.lastModified}

  async function finalizeBatch31(){
    if(finalizing||!activeBatch||activeBatch.finalized)return;const status=q('#importStatus'),text=status?.textContent||'';if(!/처리 완료/.test(text))return;
    finalizing=true;activeBatch.finalized=true;const batch=activeBatch,y=y31();let stored=0,reference=0,transient=0,failed=0,unmatched=0;
    try{
      for(const f of batch.files){const imp=await matchImport31(f,y);if(!imp){unmatched++;continue}const level=R.resolveLevel(batch.mode,imp.docClass);const common={sourceLocation:batch.sourceLocation,size:f.size,lastModified:f.lastModified,reason:batch.mode==='auto'?`auto:${imp.docClass||'unknown'}`:`user:${batch.mode}`};
        if(level==='local'){
          try{const key=await storeLocalOriginal31(f,imp,batch.sourceLocation);applyRetentionMeta31(imp,'local',{...common,originalStored:true,vaultKey:key});stored++}
          catch(err){applyRetentionMeta31(imp,'reference',{...common,originalStored:false});imp.originalStoreError=String(err?.message||err);failed++}
        }else if(level==='reference'){applyRetentionMeta31(imp,'reference',common);reference++}
        else{applyRetentionMeta31(imp,'transient',common);transient++}
      }
      save31();
      if(status){const notes=[];if(stored)notes.push(`로컬 원본 ${stored}개`);if(reference)notes.push(`출처·버전 ${reference}개`);if(transient)notes.push(`원본 미보관 ${transient}개`);if(failed)notes.push(`원본 저장 실패 ${failed}개`);if(unmatched)notes.push(`분석 미완료/일치 실패 ${unmatched}개는 보존 처리 안 함`);if(notes.length)status.insertAdjacentHTML('beforeend',` <span class="v31-retention-note">· 보존정책: ${esc(notes.join(' · '))}</span>`)}
    }finally{activeBatch=null;finalizing=false;renderVault31()}
  }

  function ensureRetentionMetadata31(){const y=y31();if(!y)return false;let changed=false;imports31(y).forEach(x=>{if(!x.retentionLevel){const level=R.defaultLevel(x.docClass);applyRetentionMeta31(x,level,{reason:'migration:v31'});changed=true}});if(changed)save31();return changed}
  function retentionBadge31(x){const level=R.validLevel(x.retentionLevel),info=R.levelInfo(level);return`<span class="retention-badge31 ${esc(level)}">${esc(info.label)}</span>`}
  function statusText31(x){if(x.originalStoreError)return`원본 저장 실패 · ${x.originalStoreError}`;if(x.retentionLevel==='local'&&x.originalStored)return'브라우저 로컬 보관 중';if(x.retentionLevel==='reference')return x.sourceLocation?`원본 위치: ${x.sourceLocation}`:'해시·버전관계 보관';return'원본 파일은 사이트에 보관하지 않음'}
  async function renderVault31(){
    ensureVaultUI31();const box=q('#retentionList31'),summary=q('#retentionSummary31');if(!box||!summary)return;const y=y31();if(!y){box.innerHTML='<div class="empty">학년도를 먼저 만들어 주세요.</div>';return}
    ensureRetentionMetadata31();let vault=[];try{vault=await vaultMeta31()}catch{}const vaultMap=new Map(vault.map(v=>[v.key,v])),used=vault.reduce((s,v)=>s+v.size,0),estimate=await storageEstimate31(),quota=Number(estimate.quota)||0,usage=Number(estimate.usage)||0,persist=persistence31();
    const cur=imports31(y).filter(x=>x.status!=='ignored').slice().reverse().slice(0,40),counts={transient:0,reference:0,local:0};cur.forEach(x=>counts[R.validLevel(x.retentionLevel)]++);
    summary.innerHTML=`<div><b>원본 미보관 ${counts.transient}</b><span>최소 처리·버전 이력</span></div><div><b>출처·버전 ${counts.reference}</b><span>원본 없이 추적정보 보관</span></div><div><b>로컬 원본 ${vault.length}</b><span>${R.formatBytes(used)} · ${persist==='granted'?'지속 저장 허용':persist==='not-granted'?'브라우저가 지속 저장 미허용':'지속 저장 상태 미확인'}</span></div><div><b>브라우저 저장공간</b><span>${quota?`${R.formatBytes(usage)} / ${R.formatBytes(quota)} 사용`:'용량 정보를 제공하지 않는 브라우저'}</span></div>`;
    box.innerHTML=cur.length?cur.map(x=>{const local=x.originalStored&&x.vaultKey&&vaultMap.has(x.vaultKey);return`<div class="retention-row31"><div class="retention-main31"><div class="retention-title31"><b>${esc(x.name||'문서')}</b>${retentionBadge31(x)}${x.status==='superseded'?'<span class="pill">이전 버전</span>':''}</div><div class="mini">${esc(statusText31(x))}${x.hash?` · 해시 ${esc(String(x.hash).slice(0,10))}…`:''}${x.docLabel?` · ${esc(x.docLabel)}`:''}</div></div><div class="retention-actions31">${local?`<button class="btn secondary tiny" type="button" data-v31-open="${esc(x.vaultKey)}">원본 다시 받기</button><button class="btn secondary tiny" type="button" data-v31-delete="${esc(x.vaultKey)}" data-v31-import="${esc(importKey31(x))}">로컬 원본 삭제</button>`:''}</div></div>`}).join(''):'<div class="empty">아직 가져온 문서가 없습니다.</div>';
    const purge=q('#purgeVault31');if(purge)purge.disabled=!vault.length
  }
  function ensureVaultUI31(){
    ensureUploadPolicy31();const docs=q('#documents');if(!docs||q('#retentionVault31'))return;
    const intro=docs.querySelector('.section-intro');intro?.insertAdjacentHTML('afterend',`<article id="retentionVault31" class="card retention-vault31"><div class="retention-vault-head31"><div><span class="kicker">SOURCE RETENTION</span><h3>문서 보존 상태</h3><p class="muted">원본은 기본적으로 남기지 않습니다. 필요한 문서만 출처·버전정보를 유지하고, 직접 선택한 경우에만 이 기기의 IndexedDB에 원본을 보관합니다.</p></div><button type="button" class="btn secondary tiny" id="purgeVault31">로컬 원본 전체 삭제</button></div><div id="retentionSummary31" class="retention-summary31"></div><div class="notice warning"><b>로컬 원본은 정식 백업이 아닙니다.</b> 브라우저 데이터 삭제·기기 고장 시 사라질 수 있으며 JSON 백업에도 원본 Blob은 포함하지 않습니다. 학교의 공식 원본은 PC·학교 저장소에 별도로 유지하세요.</div><div id="retentionList31" class="retention-list31"></div></article>`)
  }
  async function redownload31(key){try{const r=await vaultGet31(key);if(!r?.blob)return alert('로컬 원본을 찾지 못했습니다.');const u=URL.createObjectURL(r.blob),a=document.createElement('a');a.href=u;a.download=r.name||'document';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}catch(e){alert('원본을 불러오지 못했습니다: '+(e?.message||e))}}
  function findImportByKey31(k){for(const y of Object.values(state?.years||{})){const x=(y.imports||[]).find(i=>importKey31(i)===String(k));if(x)return x}return null}
  async function deleteOriginal31(key,importKey){if(!confirm('이 브라우저에 보관된 원본 사본만 삭제합니다. 출처·해시·버전 이력은 유지됩니다.'))return;try{await vaultDelete31(key);const imp=findImportByKey31(importKey);if(imp){applyRetentionMeta31(imp,'reference',{sourceLocation:imp.sourceLocation||'',reason:'local-original-deleted'});delete imp.originalStoreError;save31()}renderVault31()}catch(e){alert('로컬 원본을 삭제하지 못했습니다: '+(e?.message||e))}}
  async function purgeVault31(){if(!confirm('이 기기의 Teacher OS에 보관된 모든 원본 사본을 삭제할까요? 구조화 데이터와 출처·버전 이력은 남습니다.'))return;try{await vaultClear31();Object.values(state?.years||{}).forEach(y=>(y.imports||[]).forEach(x=>{if(x.retentionLevel==='local'){applyRetentionMeta31(x,'reference',{sourceLocation:x.sourceLocation||'',reason:'local-vault-purged'});delete x.originalStoreError}}));save31();renderVault31()}catch(e){alert('로컬 원본 전체 삭제에 실패했습니다: '+(e?.message||e))}}

  function observeStatus31(){const box=q('#importStatus');if(!box||box.dataset.v31Observed)return;box.dataset.v31Observed='1';new MutationObserver(()=>finalizeBatch31()).observe(box,{childList:true,subtree:true,characterData:true})}
  function bind31(){document.addEventListener('change',captureBatch31,true);document.body.addEventListener('click',e=>{const o=e.target.closest('[data-v31-open]');if(o){redownload31(o.dataset.v31Open);return}const d=e.target.closest('[data-v31-delete]');if(d){deleteOriginal31(d.dataset.v31Delete,d.dataset.v31Import);return}if(e.target.closest('#purgeVault31'))purgeVault31()})}
  function refresh31(){ensureUploadPolicy31();ensureVaultUI31();observeStatus31();ensureRetentionMetadata31();if(q('#documents')?.classList.contains('active'))renderVault31();const foot=q('.side-foot');if(foot)foot.textContent='v0.31 · three-tier source retention'}

  bind31();setTimeout(refresh31,0);
  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(refresh31,0);return r};
  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='importer'||id==='documents')setTimeout(()=>{refresh31();if(id==='documents')renderVault31()},0);return r};
})();