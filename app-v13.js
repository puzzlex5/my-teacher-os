(function(){
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const pad=n=>String(n).padStart(2,'0');
  const localISO=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const today=()=>localISO(new Date());
  let inboxFilter='week';

  function getState(){try{return state}catch{return null}}
  function getYear(){try{return typeof cur==='function'?cur():null}catch{return null}}
  function dateDiff(date){if(!date)return null;const a=new Date(today()+'T00:00:00'),b=new Date(String(date).slice(0,10)+'T00:00:00');if(Number.isNaN(b.getTime()))return null;return Math.round((b-a)/86400000)}
  function taskDate(t){const m=String(t?.due||t?.text||'').match(/20\d{2}-\d{2}-\d{2}/);return t?.due||m?.[0]||''}
  function stamp(v){if(!v)return 0;const d=new Date(v);return Number.isNaN(d.getTime())?0:d.getTime()}
  function humanTime(v){if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);const diff=Date.now()-d.getTime();if(diff<60000)return'방금';if(diff<3600000)return`${Math.max(1,Math.floor(diff/60000))}분 전`;if(diff<86400000)return`${Math.floor(diff/3600000)}시간 전`;return `${d.getMonth()+1}.${d.getDate()}`}

  function ensureHeaderSearch(){
    const top=q('.top');if(!top||q('#teacherGlobalSearch'))return;
    const btn=document.createElement('button');btn.type='button';btn.id='teacherGlobalSearch';btn.innerHTML='<span class="search-mark">⌕</span><span class="search-placeholder">학사일정, 평가, 반, 행정업무, 수업기록을 한 번에 검색</span><kbd>Ctrl K</kbd>';
    const actions=top.querySelector('.top-actions');if(actions)top.insertBefore(btn,actions);else top.appendChild(btn);
  }
  function ensureSearchDialog(){
    if(q('#globalSearchDialog'))return;
    document.body.insertAdjacentHTML('beforeend',`<dialog id="globalSearchDialog"><div class="global-search-shell"><div class="global-search-top"><span class="search-mark">⌕</span><input id="globalSearchInput" autocomplete="off" placeholder="Teacher OS 전체 검색"><button type="button" id="globalSearchClose">ESC</button></div><div class="global-search-meta">모든 학년도 · 일정 · 평가 · 행정 · 동아리 · 수업기록 · 할 일 · 자료 출처</div><div id="globalSearchResults"></div></div></dialog>`);
  }
  function ensureDashboardPanels(){
    const body=q('#dashboardBody');if(!body||q('#teacherWorkGrid'))return;
    const visual=q('#visualGrid')||body.querySelector('.summary');
    const html=`<div id="teacherWorkGrid" class="teacher-work-grid"><article id="teacherInboxCard" class="card"><div class="teacher-panel-head"><div><span class="kicker">INBOX</span><h3>지금 처리할 일</h3></div><div class="inbox-tabs"><button type="button" class="inbox-tab" data-inbox="today">오늘</button><button type="button" class="inbox-tab active" data-inbox="week">7일</button><button type="button" class="inbox-tab" data-inbox="overdue">지남</button><button type="button" class="inbox-tab" data-inbox="all">전체</button></div></div><div id="teacherInboxList" class="teacher-inbox-list"></div></article><article id="teacherRecentCard" class="card"><div class="teacher-panel-head"><div><span class="kicker">HISTORY</span><h3>최근 활동</h3></div></div><div id="teacherRecentList" class="recent-activity"></div></article></div>`;
    if(visual)visual.insertAdjacentHTML('afterend',html);else body.insertAdjacentHTML('afterbegin',html);
  }

  function inboxItems(y){
    const out=[];
    (y?.tasks||[]).filter(t=>!t.done).forEach(t=>{const date=taskDate(t);out.push({type:'할 일',title:t.text||'할 일',date,date||today(),d:date?dateDiff(date):null,view:'dashboard',priority:date?1:3})});
    (y?.assessments||[]).forEach(x=>x.due&&out.push({type:'평가',title:x.name||'평가',date:x.due,d:dateDiff(x.due),view:'assessment',priority:0}));
    (y?.projects||[]).forEach(x=>x.due&&out.push({type:'행정',title:x.name||'행정업무',date:x.due,d:dateDiff(x.due),view:'projects',priority:1}));
    (y?.clubs||[]).forEach(x=>x.due&&out.push({type:'동아리',title:x.name||'동아리',date:x.due,d:dateDiff(x.due),view:'clubs',priority:2}));
    (y?.calendarEvents||[]).forEach(x=>x.date&&out.push({type:'학사',title:x.title||'학사일정',date:x.date,d:dateDiff(x.date),view:'calendar',priority:2}));
    return out.filter(x=>x.d===null||x.d>=-60).sort((a,b)=>((a.d??999)-(b.d??999))||a.priority-b.priority||String(a.title).localeCompare(String(b.title),'ko'));
  }
  function filterInbox(items){
    if(inboxFilter==='today')return items.filter(x=>x.d===0||x.type==='할 일'&&x.d===null);
    if(inboxFilter==='week')return items.filter(x=>x.d===null&&x.type==='할 일'||x.d>=0&&x.d<=7);
    if(inboxFilter==='overdue')return items.filter(x=>x.d!==null&&x.d<0);
    return items.slice(0,20);
  }
  function ddayClass(d){return d!==null&&d<=1?'hot':d!==null&&d<=7?'warm':''}
  function ddayText(d){if(d===null)return'미정';if(d<0)return`+${Math.abs(d)}`;if(d===0)return'TODAY';return`D-${d}`}
  function renderInbox(y){
    const box=q('#teacherInboxList');if(!box)return;const items=filterInbox(inboxItems(y)).slice(0,12);
    box.innerHTML=items.length?items.map((x,i)=>`<button type="button" class="teacher-inbox-item" data-inbox-view="${esc(x.view)}" data-inbox-index="${i}" style="border-left:0;border-right:0;border-top:0;background:transparent;width:100%;text-align:left"><span class="teacher-inbox-type">${esc(x.type)}</span><span class="teacher-inbox-main"><span class="teacher-inbox-title">${esc(x.title)}</span><span class="teacher-inbox-sub">${esc(x.date||'날짜 없음')}</span></span><span class="teacher-inbox-dday ${ddayClass(x.d)}">${esc(ddayText(x.d))}</span></button>`).join(''):'<div class="teacher-empty">현재 조건에 해당하는 업무가 없습니다.</div>';
    qa('.inbox-tab').forEach(b=>b.classList.toggle('active',b.dataset.inbox===inboxFilter));
  }
  function recentItems(y){
    const out=[];
    (y?.lessonLogs||[]).forEach(x=>out.push({kind:'lesson',time:x.createdAt||x.date,title:`${x.target||''} ${x.period?x.period+'교시 ':''}${x.summary||'수업 기록'}`.trim()}));
    (y?.imports||[]).forEach(x=>out.push({kind:'import',time:x.when,title:`자료 반영 · ${x.name||'업로드 자료'}`}));
    const st=getState();(st?.teacherSkills||[]).filter(x=>x.lastRunAt).forEach(x=>out.push({kind:'skill',time:x.lastRunAt,title:`자동화 실행 · ${x.lastResult||x.id}`}));
    return out.sort((a,b)=>stamp(b.time)-stamp(a.time)).slice(0,8);
  }
  function renderRecent(y){const box=q('#teacherRecentList');if(!box)return;const a=recentItems(y);box.innerHTML=a.length?a.map(x=>`<div class="recent-item ${esc(x.kind)}"><span class="recent-dot"></span><div class="recent-copy">${esc(x.title)}<span class="recent-time">${esc(humanTime(x.time))}</span></div></div>`).join(''):'<div class="teacher-empty">아직 최근 활동이 없습니다.</div>'}

  function searchIndex(){
    const st=getState(),rows=[];if(!st)return rows;
    Object.entries(st.years||{}).forEach(([year,y])=>{
      const add=(type,title,sub,view)=>{const text=[title,sub,type,year].filter(Boolean).join(' ');rows.push({year,type,title:String(title||''),sub:String(sub||''),view,text:text.toLowerCase()})};
      (y.calendarEvents||[]).forEach(x=>add('학사일정',x.title,x.date,'calendar'));
      (y.assessments||[]).forEach(x=>add('평가',x.name,`${x.target||''} ${x.due||''}`,'assessment'));
      (y.projects||[]).forEach(x=>add('행정업무',x.name,`${x.due||''} ${x.note||''}`,'projects'));
      (y.clubs||[]).forEach(x=>add('동아리',x.name,`${x.due||''} ${x.note||''}`,'clubs'));
      (y.lessonLogs||[]).forEach(x=>add('수업기록',`${x.target||''} ${x.period?x.period+'교시':''}`,`${x.date||''} ${x.summary||''} ${(x.keywords||[]).join(' ')}`,'lessonlog'));
      (y.tasks||[]).forEach(x=>add('할 일',x.text,x.done?'완료':'미완료','dashboard'));
      (y.imports||[]).forEach(x=>add('자료',x.name,`${x.kind||''} ${x.when||''}`,'documents'));
      Object.entries(y.classProgress||{}).forEach(([target,p])=>add('진도',target,`${p.lesson||0}차시 ${p.topic||''} ${p.note||''}`,'progress'));
      const mem=[...(Array.isArray(y.memories)?y.memories:[]),...(Array.isArray(y.memory)?y.memory:[]),...(Array.isArray(y.workMemory)?y.workMemory:[])];
      mem.forEach(x=>add('업무기억',x.title||x.name||x.text||'기억',x.note||x.content||x.text||'','memory'));
    });
    return rows;
  }
  function renderSearch(term=''){
    const box=q('#globalSearchResults');if(!box)return;const query=String(term).trim().toLowerCase();let rows=searchIndex();
    if(query)rows=rows.filter(x=>x.text.includes(query));else rows=rows.slice().sort((a,b)=>String(b.year).localeCompare(String(a.year))).slice(0,14);
    rows=rows.slice(0,40);
    box.innerHTML=rows.length?rows.map((x,i)=>`<button type="button" class="search-result ${i===0?'active':''}" data-search-year="${esc(x.year)}" data-search-view="${esc(x.view)}"><span class="search-result-type">${esc(x.type)}</span><span><span class="search-result-title">${esc(x.title)}</span><span class="search-result-sub">${esc(x.sub)}</span></span><span class="search-result-year">${esc(x.year)}</span></button>`).join(''):'<div class="teacher-empty">검색 결과가 없습니다.</div>';
  }
  function openSearch(){const dlg=q('#globalSearchDialog');if(!dlg)return;renderSearch('');dlg.showModal();setTimeout(()=>q('#globalSearchInput')?.focus(),20)}
  function closeSearch(){q('#globalSearchDialog')?.close()}
  function navigate(year,view){
    const ys=q('#yearSelect');if(ys&&String(ys.value)!==String(year)){ys.value=String(year);ys.dispatchEvent(new Event('change',{bubbles:true}))}
    setTimeout(()=>{try{if(typeof switchView==='function')switchView(view)}catch{}},20);closeSearch();
  }

  function bind(){
    q('#teacherGlobalSearch')?.addEventListener('click',openSearch);
    q('#globalSearchClose')?.addEventListener('click',closeSearch);
    q('#globalSearchInput')?.addEventListener('input',e=>renderSearch(e.target.value));
    q('#globalSearchResults')?.addEventListener('click',e=>{const b=e.target.closest('.search-result');if(b)navigate(b.dataset.searchYear,b.dataset.searchView)});
    q('#globalSearchDialog')?.addEventListener('click',e=>{if(e.target===q('#globalSearchDialog'))closeSearch()});
    q('#teacherWorkGrid')?.addEventListener('click',e=>{const tab=e.target.closest('[data-inbox]');if(tab){inboxFilter=tab.dataset.inbox;renderInbox(getYear());return}const item=e.target.closest('[data-inbox-view]');if(item){try{if(typeof switchView==='function')switchView(item.dataset.inboxView)}catch{}}});
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch()}else if(e.key==='Escape'&&q('#globalSearchDialog')?.open)closeSearch()});
  }
  function renderV13(){ensureHeaderSearch();ensureSearchDialog();ensureDashboardPanels();const y=getYear();if(y){renderInbox(y);renderRecent(y)}else{if(q('#teacherInboxList'))q('#teacherInboxList').innerHTML='<div class="teacher-empty">학년도를 먼저 만들어 주세요.</div>';if(q('#teacherRecentList'))q('#teacherRecentList').innerHTML='<div class="teacher-empty">학년도를 먼저 만들어 주세요.</div>'}const foot=q('.side-foot');if(foot)foot.textContent='v0.13 · Search + Inbox + History'}

  ensureHeaderSearch();ensureSearchDialog();ensureDashboardPanels();bind();renderV13();
  try{const prev=render;if(typeof prev==='function'){render=function(){const r=prev.apply(this,arguments);try{renderV13()}catch(err){console.warn('v13',err)}return r}}}catch{}
  requestAnimationFrame(renderV13);
})();
