(function(){
  const P=globalThis.TeacherOSPrecisionUX;if(!P)return;
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const CAL_HISTORY_KEY='myTeacherOS.calendarEditHistory.v1';
  const CONTACT_KEY='myTeacherOS.staffContacts.v1';
  const COMCIGAN_KEY='myTeacherOS.comciganConfig';

  function y28(){try{return typeof cur==='function'?cur():null}catch{return null}}
  function st28(){try{return state}catch{return null}}
  function contacts28(){try{const x=JSON.parse(localStorage.getItem(CONTACT_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
  function area28(){return q('#v21AreaTabs [data-v21-area].active')?.dataset.v21Area||''}

  // ── 학생부: 실제 NEIS UTF-8 Byte 기준 표시 + 2026 공식 한도 초과 저장 차단 ──
  function ensureByteMeters28(){
    qa('[data-v21-card]').forEach(card=>{
      const ta=card.querySelector('[data-v21-text]');if(!ta)return;
      let meter=card.querySelector('.v28-byte-meter');
      if(!meter){meter=document.createElement('div');meter.className='v28-byte-meter';ta.insertAdjacentElement('afterend',meter)}
    });
  }
  function updateByteMeters28(){
    ensureByteMeters28();const y=y28(),area=area28(),year=Number(y?.year)||0;
    qa('[data-v21-card]').forEach(card=>{
      const ta=card.querySelector('[data-v21-text]'),meter=card.querySelector('.v28-byte-meter');if(!ta||!meter)return;
      const s=P.byteState(ta.value,year,area),commonNote=year===2026&&y?.schoolLevel==='고등학교'&&area==='subject'?' · 공통과목 1·2는 합산 기준 확인':'';
      if(s.limit){meter.className='v28-byte-meter '+(s.over?'over':s.ratio>=.9?'near':'ok');meter.innerHTML=`<b>${s.bytes.toLocaleString()} / ${s.limit.bytes.toLocaleString()} Byte</b><span>${esc(s.limit.label)} · 2026 공식 한도${commonNote}</span>${s.over?'<strong>한도 초과 · 저장 차단</strong>':''}`}
      else{meter.className='v28-byte-meter unknown';meter.innerHTML=`<b>${s.bytes.toLocaleString()} Byte</b><span>${year?year+'학년도':'학년도 미설정'} · 해당 연도 공식 한도 확인 필요</span>`}
    });
  }
  function selectedDraftText28(){return q('[data-v21-card].selected [data-v21-text]')?.value||''}
  function blockOverLimit28(ev){
    const save=ev.target.closest?.('#v21SaveDraft');if(!save)return;
    const y=y28(),area=area28(),s=P.byteState(selectedDraftText28(),Number(y?.year)||0,area);
    if(s.limit&&s.over){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation?.();alert(`NEIS 입력 한도를 초과했습니다.\n현재 ${s.bytes.toLocaleString()} Byte / 최대 ${s.limit.bytes.toLocaleString()} Byte\n문장을 줄인 뒤 저장하세요.`);updateByteMeters28()}
  }

  // ── 통합검색: 초성 + 학생 + 로컬 교직원 내선까지 한 번에 ──
  function searchIndex28(){
    const st=st28(),rows=[];if(!st)return rows;
    const add=(year,type,title,sub,view,key,extra={})=>rows.push({year:String(year||''),type,title:String(title||''),sub:String(sub||''),view,text:[title,sub,type,year,key].filter(Boolean).join(' '),...extra});
    Object.entries(st.years||{}).forEach(([year,y])=>{
      (y.students||[]).forEach(s=>add(year,'학생',s.name||'이름 없음',`${s.grade||''}-${s.classNo||''} ${s.number?String(s.number)+'번':''}`.trim(),'studentrecords',`${s.name||''} ${s.grade||''} ${s.classNo||''} ${s.number||''}`,{studentId:s.id||''}));
      (y.calendarEvents||[]).forEach(x=>add(year,'학사일정',x.title,x.date,'calendar'));
      (y.assessments||[]).forEach(x=>add(year,'평가',x.name,`${x.target||''} ${x.due||''}`,'assessment'));
      (y.projects||[]).forEach(x=>add(year,'행정업무',x.name,`${x.due||''} ${x.note||''}`,'projects'));
      (y.clubs||[]).forEach(x=>add(year,'동아리',x.name,`${x.due||''} ${x.note||''}`,'clubs'));
      (y.lessonLogs||[]).forEach(x=>add(year,'수업기록',`${x.target||''} ${x.period?x.period+'교시':''}`,`${x.date||''} ${x.summary||''} ${(x.keywords||[]).join(' ')}`,'lessonlog'));
      (y.tasks||[]).forEach(x=>add(year,'할 일',x.text,x.done?'완료':'미완료','dashboard'));
      (y.imports||[]).forEach(x=>add(year,'자료',x.name,`${x.kind||x.docClass||''} ${x.when||''}`,'documents'));
      Object.entries(y.classProgress||{}).forEach(([target,p])=>add(year,'진도',target,`${p.lesson||0}차시 ${p.topic||''} ${p.note||''}`,'progress'));
    });
    const cy=String(st.currentYear||Object.keys(st.years||{}).sort().reverse()[0]||'');
    contacts28().forEach(r=>add(cy,'내선',r.name||'교직원',`${r.extension||'내선 없음'} ${[r.department,r.room].filter(Boolean).join(' · ')}`,'dashboard',`${r.name||''} ${r.extension||''} ${r.department||''} ${r.room||''}`,{extension:r.extension||'',contact:true}));
    return rows;
  }
  function renderSearch28(term){
    const box=q('#globalSearchResults');if(!box)return;const query=String(term||'').trim();let rows=searchIndex28();
    if(query)rows=rows.filter(x=>P.match(x.text,query));else rows=rows.sort((a,b)=>String(b.year).localeCompare(String(a.year))).slice(0,14);
    const order={'학생':0,'내선':1,'할 일':2,'학사일정':3,'평가':4,'수업기록':5,'진도':6,'행정업무':7,'동아리':8,'자료':9};
    if(query)rows.sort((a,b)=>(order[a.type]??99)-(order[b.type]??99)||String(b.year).localeCompare(String(a.year))||a.title.localeCompare(b.title,'ko'));
    rows=rows.slice(0,50);
    box.innerHTML=rows.length?rows.map((x,i)=>`<button type="button" class="search-result ${i===0?'active':''}" data-search-year="${esc(x.year)}" data-search-view="${esc(x.view)}" ${x.contact?`data-v28-contact="1" data-v28-ext="${esc(x.extension)}"`:''}><span class="search-result-type">${esc(x.type)}</span><span><span class="search-result-title">${esc(x.title)}</span><span class="search-result-sub">${esc(x.sub)}</span></span><span class="search-result-year">${x.contact?'로컬':esc(x.year)}</span></button>`).join(''):'<div class="teacher-empty">검색 결과가 없습니다.</div>';
  }
  async function copy28(v){try{await navigator.clipboard.writeText(v);return true}catch{return false}}

  // ── 학사일정: 가져온 일정 수정 전 로컬 이력 저장 + 되돌리기 ──
  function readCalHistory28(){try{const x=JSON.parse(localStorage.getItem(CAL_HISTORY_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
  function writeCalHistory28(a){localStorage.setItem(CAL_HISTORY_KEY,JSON.stringify((a||[]).slice(-20)))}
  function pushCalendarHistory28(ev){const a=readCalHistory28();a.push(ev);writeCalHistory28(a);renderCalendarUndo28()}
  function captureCalendarEdit28(ev){
    if(ev.target?.id!=='eventEditForm')return;const y=y28(),id=q('#eventEditId')?.value;if(!y||!id)return;const old=(y.calendarEvents||[]).find(x=>String(x.id)===String(id));if(!old)return;
    const next={...old,date:q('#eventEditDate')?.value||'',title:q('#eventEditTitle')?.value||'',type:q('#eventEditType')?.value||'학교',scope:q('#eventEditScope')?.value||'전체',impact:q('#eventEditImpact')?.value||'auto'};
    const keys=['date','title','type','scope','impact'];if(keys.every(k=>String(old[k]??'')===String(next[k]??'')))return;
    pushCalendarHistory28({year:y.year,eventId:id,before:old,savedAt:new Date().toISOString()});
  }
  function historyForYear28(){const y=y28();return readCalHistory28().filter(x=>String(x.year)===String(y?.year))}
  function ensureCalendarUndo28(){
    const intro=q('#calendar .section-intro');if(!intro||q('#calendarUndo28'))return;
    const actions=intro.querySelector('.section-actions')||intro;const b=document.createElement('button');b.type='button';b.className='btn secondary';b.id='calendarUndo28';b.textContent='최근 일정 수정 되돌리기';actions.appendChild(b)
  }
  function renderCalendarUndo28(){ensureCalendarUndo28();const b=q('#calendarUndo28');if(!b)return;const a=historyForYear28();b.disabled=!a.length;b.title=a.length?`최근 수정 ${a.length}건을 로컬에 보관 중`:'되돌릴 일정 수정 이력이 없습니다.'}
  function undoCalendar28(){
    const y=y28();if(!y)return;const all=readCalHistory28();let idx=-1;for(let i=all.length-1;i>=0;i--)if(String(all[i].year)===String(y.year)){idx=i;break}if(idx<0)return;
    const h=all[idx],pos=(y.calendarEvents||[]).findIndex(x=>String(x.id)===String(h.eventId));if(pos<0){all.splice(idx,1);writeCalHistory28(all);renderCalendarUndo28();return}
    y.calendarEvents[pos]={...h.before};all.splice(idx,1);writeCalHistory28(all);localStorage.setItem(KEY,JSON.stringify(state));if(typeof render==='function')render();if(typeof switchView==='function')switchView('calendar');renderCalendarUndo28()
  }

  // ── 정확도 원칙: 데이터가 없다는 것과 불러오지 못했다는 것을 구분 ──
  function comciganConfig28(){try{const x=JSON.parse(localStorage.getItem(COMCIGAN_KEY)||'null');return x&&typeof x==='object'?x:null}catch{return null}}
  function completeComcigan28(c){return!!(c&&Number(c.schoolCode)>0&&Number(c.teacherIndex)>0&&String(c.teacherName||'').trim())}
  function weekStart28(d=new Date()){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`}
  function syncTruth28(y){
    const cfg=comciganConfig28(),configured=completeComcigan28(cfg),sync=y?.comciganSync||{},basic=(y?.timetable||[]).length>0,week=y?.liveTimetableWeeks?.[weekStart28()];
    if(!configured)return{kind:'warn',title:'컴시간 미설정',detail:basic?'실제 변경표는 확인하지 못했습니다. 현재 카드는 기본 시간표 기준입니다.':'컴시간과 기본 시간표가 모두 없어 오늘 수업 여부를 확정할 수 없습니다.',uncertain:!basic};
    if(sync.status==='mismatch')return{kind:'danger',title:'컴시간 설정 불일치',detail:basic?'잘못된 실제표 적용을 차단했습니다. 현재 카드는 기본 시간표 기준입니다.':'잘못된 실제표 적용을 차단했습니다. 수업 정보 확인이 필요합니다.',uncertain:!basic};
    if(sync.status!=='ok')return{kind:'warn',title:'컴시간 최신표 미확인',detail:basic?'최신 변경표를 불러오지 못했거나 아직 준비되지 않았습니다. 현재 카드는 기본 시간표 기준입니다.':'최신 변경표를 확인하지 못했고 기본 시간표도 없습니다. 수업 정보 확인이 필요합니다.',uncertain:!basic};
    if(!week||!Array.isArray(week.slots))return{kind:'warn',title:'이번 주 실제표 없음',detail:basic?'동기화 상태는 정상이지만 이번 주 실제표가 없어 기본 시간표 기준으로 표시합니다.':'동기화 상태는 정상이지만 이번 주 수업표가 없어 수업 여부를 확정할 수 없습니다.',uncertain:!basic};
    const updated=week.updatedAt||sync.lastApplied||'',ts=updated?new Date(updated).getTime():NaN,age=Number.isFinite(ts)?Math.max(0,(Date.now()-ts)/3600000):null;
    if(age!==null&&age>30)return{kind:'warn',title:'컴시간 자료 오래됨',detail:`마지막 실제표 적용이 약 ${Math.floor(age)}시간 전입니다. 변경 수업이 있다면 최신표를 다시 확인하세요.`,uncertain:false};
    return{kind:'ok',title:'컴시간 실제표 확인됨',detail:updated?`마지막 적용 ${new Date(updated).toLocaleString('ko-KR')}`:'이번 주 실제표를 사용 중입니다.',uncertain:false};
  }
  function renderSyncTruth28(){
    const box=q('#deskNext27'),y=y28();if(!box||!y)return;box.querySelector('.v28-source-truth')?.remove();const t=syncTruth28(y);
    if(t.uncertain){box.innerHTML=`<div class="v28-source-truth ${t.kind}"><b>${esc(t.title)}</b><span>${esc(t.detail)}</span></div><div class="desk-next-top27"><span class="desk-status27">확인 필요</span><span class="mini">시간표 데이터 미확정</span></div><h3>오늘 수업 여부를 확정할 수 없습니다.</h3><div class="desk-next-foot27"><button type="button" class="btn secondary tiny" data-go27="timetable">시간표 상태 확인</button></div>`;return}
    const banner=document.createElement('div');banner.className=`v28-source-truth ${t.kind}`;banner.innerHTML=`<b>${esc(t.title)}</b><span>${esc(t.detail)}</span>`;box.prepend(banner)
  }

  function refresh28(){setTimeout(()=>{updateByteMeters28();renderCalendarUndo28();renderSyncTruth28();const foot=q('.side-foot');if(foot)foot.textContent='v0.28 · precision search + data truth + NEIS byte guard + undo'},0)}
  function bind28(){
    document.addEventListener('click',blockOverLimit28,true);
    document.addEventListener('submit',captureCalendarEdit28,true);
    document.body.addEventListener('input',e=>{if(e.target.matches('[data-v21-text]'))updateByteMeters28();if(e.target.id==='globalSearchInput')setTimeout(()=>renderSearch28(e.target.value),0)});
    document.body.addEventListener('click',async e=>{if(e.target.closest('#calendarUndo28')){undoCalendar28();return}const c=e.target.closest('[data-v28-contact]');if(c){e.preventDefault();e.stopPropagation();const ext=c.dataset.v28Ext;if(ext&&await copy28(ext)){const old=c.querySelector('.search-result-sub')?.textContent||'';const sub=c.querySelector('.search-result-sub');if(sub){sub.textContent='내선 복사됨 · '+ext;setTimeout(()=>{sub.textContent=old},1000)}}}} ,true);
    const dlg=q('#globalSearchDialog');dlg?.addEventListener('toggle',()=>{if(dlg.open)setTimeout(()=>renderSearch28(q('#globalSearchInput')?.value||''),0)});
  }

  bind28();refresh28();
  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);refresh28();return r};
  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='studentrecords'||id==='calendar'||id==='dashboard')refresh28();return r};
})();
