(function(){
  const V6=globalThis.TeacherOSCoreV6,Truth=globalThis.TeacherOSDataTruth;if(!V6)return;
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const mins=s=>{const m=String(s||'').match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null};
  const ws=d=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return iso(x)};
  const day=()=>['일','월','화','수','목','금','토'][new Date().getDay()];
  const MIDDLE={1:['09:00','09:45'],2:['09:55','10:40'],3:['10:50','11:35'],4:['11:45','12:30'],5:['13:30','14:15'],6:['14:25','15:10'],7:['15:20','16:05']};
  const HIGH={1:['09:00','09:50'],2:['10:00','10:50'],3:['11:00','11:50'],4:['12:00','12:50'],5:['13:50','14:40'],6:['14:50','15:40'],7:['15:50','16:40']};
  let locked=null,guarding=false;

  function truth17(y,context){try{return Truth?.nextLessonTruth?Truth.nextLessonTruth(y,context):{known:true,reason:'legacy-fallback'}}catch{return{known:false,reason:'truth-error',label:'시간표 상태 확인 실패'}}}
  function periodRangeMap17(y){
    const out=new Map();for(const s of y.timetable||[]){const p=Number(s.period),time=String(s.time||'');if(!p||out.has(p)||!/\d{1,2}:\d{2}\s*[~\-]\s*\d{1,2}:\d{2}/.test(time))continue;const m=time.match(/(\d{1,2}:\d{2})\s*[~\-]\s*(\d{1,2}:\d{2})/);out.set(p,{start:mins(m[1]),end:mins(m[2]),label:time,exact:true})}return out
  }
  function periodRange(y,p,ranges){
    const exact=ranges?.get(Number(p));if(exact)return exact;
    const raw=(y.schoolLevel==='고등학교'?HIGH:MIDDLE)[Number(p)];return raw?{start:mins(raw[0]),end:mins(raw[1]),label:`${raw[0]}~${raw[1]}`,exact:false}:null;
  }
  function slotsToday(y){
    const date=iso(new Date()),live=y.liveTimetableWeeks?.[ws(new Date())];
    if(live){
      const truth=truth17(y,{live:true});if(!truth.known)return{source:truth.label||'컴시간 상태 미확인',live:false,known:false,reason:truth.reason,slots:[]};
      return{source:'컴시간 실제표',live:true,known:true,slots:(live.slots||[]).filter(s=>s.date===date).map(s=>({...s,target:V6.normalizeScope(s.target||V6.targetFromLabel(s.label))})).filter(s=>/^\d+-\d+$/.test(s.target)).sort((a,b)=>Number(a.period)-Number(b.period))};
    }
    const truth=truth17(y,{live:false});if(!truth.known)return{source:truth.label||'시간표 자료 미확인',live:false,known:false,reason:truth.reason,slots:[]};
    return{source:'기본 시간표',live:false,known:true,slots:(y.timetable||[]).filter(s=>s.day===day()).map(s=>({...s,target:V6.normalizeScope(s.target||V6.targetFromLabel(s.label))})).filter(s=>/^\d+-\d+$/.test(s.target)).sort((a,b)=>Number(a.period)-Number(b.period))};
  }
  function detect(y){
    const info=slotsToday(y);if(info.known===false)return{slot:null,source:info.source,live:false,status:'unknown',msg:'오늘 수업을 자동 확정하지 않습니다.'};
    const ranges=periodRangeMap17(y),list=info.slots.map(s=>({...s,range:periodRange(y,s.period,ranges)}));
    if(!list.length)return{slot:null,source:info.source,live:info.live,status:'none',msg:'오늘 등록된 수업이 없습니다.'};
    const n=new Date(),m=n.getHours()*60+n.getMinutes();
    const current=list.find(s=>s.range&&m>=s.range.start-5&&m<=s.range.end+5);
    if(current)return{slot:current,source:info.source,live:info.live,status:'current',msg:`현재 ${current.period}교시`};
    const next=list.filter(s=>s.range&&s.range.start>=m-5).sort((a,b)=>a.range.start-b.range.start)[0];
    if(next)return{slot:next,source:info.source,live:info.live,status:'next',msg:`다음 ${next.period}교시`};
    return{slot:null,source:info.source,live:info.live,status:'done',msg:'오늘 수업 시간이 모두 지났습니다.'};
  }
  function pretty(t){const m=String(t||'').match(/^(\d+)-(\d+)$/);return m?`${m[1]}학년 ${m[2]}반`:String(t||'')}
  function setValues(slot){
    const sel=q('#lessonTarget'),p=q('#lessonPeriod');if(!sel||!p)return;
    if(!slot){sel.value='';p.value='';return}
    if(![...sel.options].some(o=>o.value===slot.target)){const o=document.createElement('option');o.value=slot.target;o.textContent=slot.target;sel.appendChild(o)}
    sel.value=slot.target;p.value=Number(slot.period)||'';
  }
  function updateCard(slot,d){
    const title=q('#lessonAutoTitle'),sub=q('#lessonAutoSub'),badge=q('#lessonAutoBadge'),start=q('#lessonStart');if(!title)return;
    if(slot){title.textContent=`${pretty(slot.target)} · ${slot.period}교시`;sub.textContent=`${d.source}${d.live?' 우선 적용':''}${slot.range?.label?' · '+slot.range.label:''} · ${d.msg}`;badge.textContent=d.live?'컴시간 자동':'시간표 자동';badge.className='lesson-auto-badge '+(d.status==='current'?'is-current':'is-next');if(start){start.disabled=false;start.title=''}}
    else{title.textContent=d.status==='done'?'오늘 수업 종료':d.status==='unknown'?'수업 정보 미확정':'오늘 수업 없음';sub.textContent=`${d.source} · ${d.msg}`;badge.textContent=d.status==='unknown'?'확인 필요':'대기';badge.className='lesson-auto-badge is-idle';if(start){start.disabled=true;start.title=d.msg}}
  }
  function removeManual(){
    if(guarding)return;guarding=true;try{
      ['#ttAdd','#ttExceptionAdd','#ttDlg','#ttExceptionDlg'].forEach(s=>q(s)?.remove());
      q('#ttExceptionList')?.closest('article')?.remove();
      qa('#timetable .cell-add,#timetable [data-tt-add],#timetable [data-tt-edit]').forEach(x=>x.remove());
      const row=q('#lessonlog .lesson-target-row');if(row){row.style.setProperty('display','none','important');row.setAttribute('aria-hidden','true')}
      const table=q('#timetableTable');if(table){table.classList.remove('editable-timetable');table.classList.add('readonly-timetable');qa('#timetableTable td').forEach(td=>td.style.cursor='default')}
    }finally{guarding=false}
  }
  function addBuild(){
    if(!q('#v17Chip')){const h=q('#title');if(h)h.insertAdjacentHTML('afterend','<span id="v17Chip" class="v17-build-chip">v0.17 적용됨</span>')}
    const rec=q('#lessonlog .lesson-recorder');if(rec&&!q('#v17AutoNote'))rec.insertAdjacentHTML('beforeend','<div id="v17AutoNote" class="v17-auto-note">반·교시는 직접 선택하지 않습니다. 확인된 시간표와 현재 시각으로만 자동 설정됩니다.</div>');
    const foot=q('.side-foot');if(foot)foot.textContent='v0.17 · AUTO CONTEXT LOCK';
  }
  function refresh(force=false){
    removeManual();addBuild();const y=typeof cur==='function'?cur():null;if(!y)return;
    const stop=q('#lessonStop'),recording=stop&&!stop.disabled;
    if(recording&&locked&&!force){setValues(locked);return}
    const d=detect(y);if(!recording||force){locked=recording&&locked?locked:d.slot;setValues(d.slot);updateCard(d.slot,d)}
  }
  function bind(){
    const start=q('#lessonStart');if(start&&!start.dataset.v17){const legacy=start.onclick;start.dataset.v17='1';start.onclick=function(ev){const y=typeof cur==='function'?cur():null;if(!y)return false;const d=detect(y);if(!d.slot){setValues(null);updateCard(null,d);ev?.preventDefault?.();return false}locked=d.slot;setValues(locked);const r=legacy?.call(this,ev);setValues(locked);updateCard(locked,d);return r}}
    const stop=q('#lessonStop');if(stop&&!stop.dataset.v17){const legacy=stop.onclick;stop.dataset.v17='1';stop.onclick=function(ev){if(locked)setValues(locked);const r=legacy?.call(this,ev);locked=null;setTimeout(()=>refresh(true),0);return r}}
  }
  function boot(){removeManual();addBuild();bind();refresh(true);setTimeout(()=>{bind();refresh(true)},1200);setInterval(()=>{bind();refresh(false)},30000)}
  const prev=globalThis.render;if(typeof prev==='function')globalThis.render=function(){const r=prev.apply(this,arguments);setTimeout(()=>{removeManual();addBuild();bind();refresh(false)},0);return r};
  const mo=new MutationObserver(()=>requestAnimationFrame(()=>{removeManual();addBuild();bind()}));if(document.body)mo.observe(document.body,{subtree:true,childList:true});
  boot();
})();
