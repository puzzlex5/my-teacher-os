(function(){
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const esc19=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const id19=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(16).slice(2);
  let library=null,query='',category='전체';

  function ensure19(){
    state.version=Math.max(Number(state.version)||0,19);
    Object.values(state.years||{}).forEach(y=>{y.workPacks=Array.isArray(y.workPacks)?y.workPacks:[]});
    localStorage.setItem(KEY,JSON.stringify(state));
  }
  function save19(){localStorage.setItem(KEY,JSON.stringify(state))}
  function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,'')}
  function aliasesText(pack){return [pack.name,pack.category,pack.summary,...(pack.aliases||[])].join(' ')}
  function matchesPack(pack,text){const n=norm(text);return (pack.aliases||[]).some(a=>n.includes(norm(a)))||n.includes(norm(pack.name))}
  function levelPacks(y){return (library?.packs||[]).filter(p=>!p.levels?.length||p.levels.includes(y.schoolLevel))}
  function installed(y,packId){return (y.workPacks||[]).some(x=>x.packId===packId&&x.active!==false)}
  function findExistingProject(y,pack){return (y.projects||[]).find(p=>p.workPackId===pack.id||matchesPack(pack,`${p.name||''} ${p.desc||''}`))}
  function recommended(y){
    const projectText=(y.projects||[]).map(p=>`${p.name||''} ${p.desc||''}`).join('\n');
    return levelPacks(y).filter(p=>!installed(y,p.id)&&projectText&&matchesPack(p,projectText));
  }
  function linkedCalendar(y,pack){return (y.calendarEvents||[]).filter(ev=>matchesPack(pack,`${ev.title||''} ${ev.subtype||''}`)).slice(0,8)}
  function sourceMap(){return Object.fromEntries((library?.sources||[]).map(s=>[s.id,s]))}

  function installPack(packId,silent=false){
    const y=typeof cur==='function'?cur():null,pack=(library?.packs||[]).find(p=>p.id===packId);if(!y||!pack||installed(y,pack.id))return false;
    const wp={id:id19(),packId:pack.id,name:pack.name,category:pack.category,installedAt:new Date().toISOString(),active:true,checklist:(pack.checklist||[]).map((text,i)=>({id:`${pack.id}-${i+1}`,text,done:false})),sourceRefs:[...(pack.sourceRefs||[])]};
    y.workPacks.push(wp);
    const project=findExistingProject(y,pack);
    if(project){project.workPackId=pack.id;project.category=project.category||pack.category;project.libraryLinked=true}
    else y.projects.push({id:id19(),name:pack.name,desc:`업무팩에서 가져옴 · ${pack.summary||''}`,due:'',source:'Teacher OS 업무 라이브러리',category:pack.category,workPackId:pack.id,libraryLinked:true});
    save19();
    if(!silent&&typeof render==='function')render();
    return true;
  }
  function removePack(packId){
    const y=cur();if(!y)return;
    y.workPacks=(y.workPacks||[]).filter(x=>x.packId!==packId);
    (y.projects||[]).forEach(p=>{if(p.workPackId===packId){delete p.workPackId;delete p.libraryLinked}});
    save19();if(typeof render==='function')render();
  }

  function filteredPacks(y){
    let list=levelPacks(y);
    if(category!=='전체')list=list.filter(p=>p.category===category);
    const nq=norm(query);if(nq)list=list.filter(p=>norm(aliasesText(p)).includes(nq));
    return list;
  }
  function sourceLinks(pack){const sm=sourceMap(),refs=(pack.sourceRefs||[]).map(id=>sm[id]).filter(Boolean);if(!refs.length)return'';return `<div class="wp-sources">${refs.map(s=>`<a href="${esc19(s.url)}" target="_blank" rel="noopener">${esc19(s.title)}</a>`).join('')}</div>`}
  function packCard(y,p){
    const on=installed(y,p.id),events=linkedCalendar(y,p),proj=findExistingProject(y,p),isRec=!on&&recommended(y).some(x=>x.id===p.id);
    return `<article class="card wp-card ${on?'is-installed':''}"><div class="wp-card-head"><div><span class="pill">${esc19(p.category)}</span>${isRec?'<span class="pill wp-rec">업무분장표 추천</span>':''}<h3>${esc19(p.name)}</h3></div>${on?'<span class="wp-installed-mark">설치됨</span>':`<button class="btn primary tiny" data-pack-install="${esc19(p.id)}">가져오기</button>`}</div><p class="muted">${esc19(p.summary)}</p><div class="wp-aliases">학교별 명칭: ${(p.aliases||[]).slice(0,5).map(esc19).join(' · ')}</div><div class="wp-mini-grid"><span>기본 절차 <b>${(p.checklist||[]).length}</b></span><span>연결 일정 <b>${events.length}</b></span><span>${proj?'내 업무와 연결됨':'기본 업무팩'}</span></div><details><summary>업무 흐름 보기</summary><ol class="wp-preview">${(p.checklist||[]).map(x=>`<li>${esc19(x)}</li>`).join('')}</ol>${sourceLinks(p)}</details></article>`;
  }
  function installedCard(y,w){
    const p=(library?.packs||[]).find(x=>x.id===w.packId);if(!p)return'';const events=linkedCalendar(y,p),done=(w.checklist||[]).filter(x=>x.done).length,total=(w.checklist||[]).length;
    return `<article class="card wp-installed-card"><div class="wp-card-head"><div><span class="pill">${esc19(p.category)}</span><h3>${esc19(p.name)}</h3><div class="mini">가져온 날짜 ${new Date(w.installedAt).toLocaleDateString('ko-KR')} · 기본 절차 ${done}/${total}</div></div><button class="linkbtn danger-text" data-pack-remove="${esc19(p.id)}">제거</button></div><div class="wp-progress"><i style="width:${total?Math.round(done/total*100):0}%"></i></div><div class="wp-checklist">${(w.checklist||[]).map(c=>`<label><input type="checkbox" data-pack-check="${esc19(w.id)}" data-check-id="${esc19(c.id)}" ${c.done?'checked':''}><span>${esc19(c.text)}</span></label>`).join('')}</div>${events.length?`<div class="wp-linked"><b>내 학사일정과 자동 연결</b>${events.map(e=>`<span>${esc19(e.date||'')} · ${esc19(e.title||'')}</span>`).join('')}</div>`:''}${sourceLinks(p)}</article>`;
  }

  function ensureUI(){
    const nav=q('#nav');if(nav&&!nav.querySelector('[data-view="worklibrary"]'))nav.querySelector('[data-view="projects"]')?.insertAdjacentHTML('afterend','<button data-view="worklibrary">⌘ <span>업무 가져오기</span></button>');
    if(!q('#worklibrary'))q('#projects')?.insertAdjacentHTML('afterend',`<section id="worklibrary" class="view"><div class="section-intro"><div><span class="kicker">WORK PACK LIBRARY</span><h2>업무 가져오기</h2><p class="muted">학교마다 이름이 달라도 같은 업무를 찾아, 기본 절차와 공식 자료를 한 번에 가져옵니다.</p></div><button class="btn primary" id="installRecommended" hidden>추천 업무 모두 가져오기</button></div><div class="notice wp-principle"><b>기본 지식 + 내 학교 우선.</b> 인터넷의 공식 교육부·교육청 자료를 업무팩의 기본값으로 사용하고, 내가 올린 업무분장표·학사일정·해당 연도 공문이 있으면 그것을 더 우선합니다.</div><div id="wpRecommend" class="wp-recommend spaced" hidden></div><div class="wp-toolbar spaced"><div class="wp-search-wrap"><span>⌕</span><input id="wpSearch" class="field" placeholder="예: 학교폭력, 평가, 생기부, 축제, 국제교류"></div><div id="wpCategories" class="wp-categories"></div></div><div class="wp-layout"><div><div class="wp-section-head"><div><span class="kicker">LIBRARY</span><h3>업무 라이브러리</h3></div><span id="wpLibraryCount" class="pill"></span></div><div id="wpGrid" class="wp-grid"></div></div><aside><div class="wp-section-head"><div><span class="kicker">MY WORK</span><h3>가져온 업무</h3></div><span id="wpInstalledCount" class="pill"></span></div><div id="wpInstalled" class="wp-installed-list"></div></aside></div><article class="card spaced wp-source-card"><div class="wp-section-head"><div><span class="kicker">OFFICIAL SOURCES</span><h3>업무팩 기준 자료</h3><p class="muted">업무팩은 절대 기준이 아니라 시작점입니다. 최신 법령·공문·학교 규정이 우선합니다.</p></div><span id="wpUpdated" class="pill"></span></div><div id="wpSourceList" class="wp-source-list"></div></article></section>`);
    const importer=q('#importer');if(importer&&!q('#workLibraryCTA')){const anchor=q('#bulkInboxBanner')||importer.querySelector('.section-intro');anchor?.insertAdjacentHTML('afterend',`<button id="workLibraryCTA" class="wp-cta" type="button"><span class="wp-cta-icon">⌘</span><span><b>업무분장표가 없어도 업무를 가져올 수 있습니다.</b><small>평가 · 생기부 · 학교폭력 · 축제 · 국제교류 등 업무팩 1클릭 설치</small></span><span class="wp-cta-arrow">→</span></button>`)}
    const chip=q('#v17Chip');if(chip)chip.textContent='v0.19 · 업무팩 라이브러리';
  }

  function renderLibrary(){
    const y=typeof cur==='function'?cur():null;if(!q('#worklibrary')||!y||!library)return;
    const cats=['전체',...new Set(levelPacks(y).map(p=>p.category))];
    q('#wpCategories').innerHTML=cats.map(c=>`<button type="button" data-wp-category="${esc19(c)}" class="${category===c?'active':''}">${esc19(c)}</button>`).join('');
    const list=filteredPacks(y);q('#wpGrid').innerHTML=list.length?list.map(p=>packCard(y,p)).join(''):'<div class="empty">조건에 맞는 업무팩이 없습니다.</div>';q('#wpLibraryCount').textContent=`${list.length}개`;
    const own=(y.workPacks||[]).filter(x=>x.active!==false);q('#wpInstalled').innerHTML=own.length?own.map(w=>installedCard(y,w)).join(''):'<div class="empty">맡은 업무를 ‘가져오기’ 하면 여기에 기본 절차가 설치됩니다.</div>';q('#wpInstalledCount').textContent=`${own.length}개`;
    const rec=recommended(y),recBox=q('#wpRecommend'),recBtn=q('#installRecommended');
    if(rec.length){recBox.hidden=false;recBtn.hidden=false;recBox.innerHTML=`<div><b>내 업무분장표에서 ${rec.length}개 업무팩을 찾았습니다.</b><span>${rec.slice(0,5).map(x=>esc19(x.name)).join(' · ')}</span></div>`}else{recBox.hidden=true;recBtn.hidden=true}
    q('#wpUpdated').textContent=`기준 ${library.updatedAt||''}`;q('#wpSourceList').innerHTML=(library.sources||[]).map(s=>`<a href="${esc19(s.url)}" target="_blank" rel="noopener"><b>${esc19(s.title)}</b><span>${esc19(s.scope||'')} · ${esc19(s.asOf||'')}</span></a>`).join('');
    const search=q('#wpSearch');if(search&&search.value!==query)search.value=query;
  }

  function bind(){
    q('#workLibraryCTA')?.addEventListener('click',()=>switchView('worklibrary'));
    q('#worklibrary')?.addEventListener('click',e=>{
      const install=e.target.closest('[data-pack-install]');if(install){installPack(install.dataset.packInstall);return}
      const remove=e.target.closest('[data-pack-remove]');if(remove){removePack(remove.dataset.packRemove);return}
      const cat=e.target.closest('[data-wp-category]');if(cat){category=cat.dataset.wpCategory;renderLibrary();return}
    });
    q('#worklibrary')?.addEventListener('change',e=>{const c=e.target.closest('[data-pack-check]');if(!c)return;const y=cur(),w=(y.workPacks||[]).find(x=>x.id===c.dataset.packCheck),item=w?.checklist?.find(x=>x.id===c.dataset.checkId);if(item){item.done=c.checked;save19();renderLibrary()}});
    q('#wpSearch')?.addEventListener('input',e=>{query=e.target.value;renderLibrary()});
    q('#installRecommended')?.addEventListener('click',()=>{const y=cur();recommended(y).forEach(p=>installPack(p.id,true));save19();if(typeof render==='function')render()});
  }

  async function loadLibrary(){
    try{const r=await fetch('./work-library.json?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('업무 라이브러리를 불러오지 못했습니다.');library=await r.json();renderLibrary()}catch(err){const box=q('#wpGrid');if(box)box.innerHTML=`<div class="empty">${esc19(err.message||err)}</div>`}
  }

  ensure19();ensureUI();bind();loadLibrary();
  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='worklibrary'){qa('.view').forEach(x=>x.classList.toggle('active',x.id==='worklibrary'));qa('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='worklibrary'));if(q('#title'))q('#title').textContent='업무 가져오기';renderLibrary()}return r};
  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){ensure19();const r=prevRender.apply(this,arguments);setTimeout(()=>{ensureUI();renderLibrary()},0);return r};
})();
