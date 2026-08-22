(function(){
  const V6=globalThis.TeacherOSCoreV6;
  if(!V6)return;
  const q=s=>document.querySelector(s);
  const pad=n=>String(n).padStart(2,'0');
  const localISO=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const minutes=s=>{const m=String(s||'').match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null};
  const weekStart=date=>{const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return localISO(d)};
  const dayKo=()=>['일','월','화','수','목','금','토'][new Date().getDay()];
  const DEFAULT_MIDDLE={1:['09:00','09:45'],2:['09:55','10:40'],3:['10:50','11:35'],4:['11:45','12:30'],5:['13:30','14:15'],6:['14:25','15:10'],7:['15:20','16:05']};
  const DEFAULT_HIGH={1:['09:00','09:50'],2:['10:00','10:50'],3:['11:00','11:50'],4:['12:00','12:50'],5:['13:50','14:40'],6:['14:50','15:40'],7:['15:50','16:40']};
  let timer=null;

  function todaySlots(y){
    const date=localISO(new Date()),ws=weekStart(new Date()),live=y.liveTimetableWeeks?.[ws];
    if(live){
      return {source:'컴시간 실제표',live:true,slots:(live.slots||[]).filter(s=>s.date===date).map(s=>({...s,target:V6.normalizeScope(s.target||V6.targetFromLabel(s.label))})).filter(s=>/^\d+-\d+$/.test(s.target)).sort((a,b)=>Number(a.period)-Number(b.period))};
    }
    return {source:'기본 시간표',live:false,slots:(y.timetable||[]).filter(s=>s.day===dayKo()).map(s=>({...s,target:V6.normalizeScope(s.target||V6.targetFromLabel(s.label))})).filter(s=>/^\d+-\d+$/.test(s.target)).sort((a,b)=>Number(a.period)-Number(b.period))};
  }
  function rangeForPeriod(y,p){
    const configured=(y.timetable||[]).map(s=>({p:Number(s.period),time:String(s.time||'')})).find(x=>x.p===Number(p)&&/\d{1,2}:\d{2}\s*[~\-]\s*\d{1,2}:\d{2}/.test(x.time));
    if(configured){const ms=configured.time.match(/(\d{1,2}:\d{2})\s*[~\-]\s*(\d{1,2}:\d{2})/);return {start:minutes(ms[1]),end:minutes(ms[2]),exact:true,label:configured.time}}
    const table=y.schoolLevel==='고등학교'?DEFAULT_HIGH:DEFAULT_MIDDLE,raw=table[Number(p)];
    return raw?{start:minutes(raw[0]),end:minutes(raw[1]),exact:false,label:`${raw[0]}~${raw[1]}`} : null;
  }
  function loggedToday(y,slot){return (y.lessonLogs||[]).some(l=>l.date===localISO(new Date())&&Number(l.period)===Number(slot.period)&&V6.normalizeScope(l.target)===V6.normalizeScope(slot.target)&&!l.undone)}
  function detect(y){
    const info=todaySlots(y),slots=info.slots;
    if(!slots.length)return {status:'none',source:info.source,live:info.live,slot:null,message:'오늘 등록된 수업이 없습니다.'};
    const now=new Date(),nowMin=now.getHours()*60+now.getMinutes();
    const enriched=slots.map(s=>({...s,range:rangeForPeriod(y,s.period)}));
    const current=enriched.find(s=>s.range&&nowMin>=s.range.start-5&&nowMin<=s.range.end+5);
    if(current)return {status:'current',source:info.source,live:info.live,slot:current,message:`현재 ${current.period}교시 수업으로 자동 설정`};
    const next=enriched.filter(s=>s.range&&s.range.start>=nowMin-5).sort((a,b)=>a.range.start-b.range.start)[0];
    if(next)return {status:'next',source:info.source,live:info.live,slot:next,message:`다음 ${next.period}교시 수업으로 미리 설정`};
    const unlogged=enriched.find(s=>!loggedToday(y,s));
    if(unlogged)return {status:'unlogged',source:info.source,live:info.live,slot:unlogged,message:`오늘 미기록 ${unlogged.period}교시로 자동 설정`};
    return {status:'done',source:info.source,live:info.live,slot:null,message:'오늘 컴시간 수업은 모두 기록되었습니다.'};
  }
  function prettyTarget(t){const m=String(t||'').match(/^(\d+)-(\d+)$/);return m?`${m[1]}학년 ${m[2]}반`:String(t||'')}
  function ensureCard(){
    const rec=q('.lesson-recorder');if(!rec||q('#lessonAutoContext'))return;
    const row=q('.lesson-recorder .lesson-target-row');
    const html=`<div id="lessonAutoContext" class="lesson-auto-context"><div class="lesson-auto-mark">⌁</div><div class="lesson-auto-main"><span class="lesson-auto-kicker">COMCIGAN AUTO</span><strong id="lessonAutoTitle">컴시간 확인 중</strong><span id="lessonAutoSub">오늘 실제 시간표와 현재 시각을 확인합니다.</span></div><span id="lessonAutoBadge" class="lesson-auto-badge">자동</span></div>`;
    row?.insertAdjacentHTML('beforebegin',html);
    if(row){row.classList.add('lesson-target-hidden');row.setAttribute('aria-hidden','true')}
  }
  function setHidden(slot){
    const sel=q('#lessonTarget'),period=q('#lessonPeriod');if(!sel||!period)return;
    if(!slot){sel.value='';period.value='';return}
    if(![...sel.options].some(o=>o.value===slot.target)){const o=document.createElement('option');o.value=slot.target;o.textContent=slot.target;sel.appendChild(o)}
    sel.value=slot.target;period.value=Number(slot.period)||'';
  }
  function applyAutoContext(force=false){
    ensureCard();const y=typeof cur==='function'?cur():null,title=q('#lessonAutoTitle'),sub=q('#lessonAutoSub'),badge=q('#lessonAutoBadge'),start=q('#lessonStart'),stop=q('#lessonStop');
    if(!y||!title)return;
    const recording=stop&&!stop.disabled;if(recording&&!force)return;
    const d=detect(y),slot=d.slot;setHidden(slot);
    if(slot){
      title.textContent=`${prettyTarget(slot.target)} · ${slot.period}교시`;
      const time=slot.range?.label?` · ${slot.range.label}`:'';
      sub.textContent=`${d.source}${d.live?' 우선 적용':''}${time} · ${d.message}`;
      badge.textContent=d.live?'컴시간 자동':'시간표 자동';
      badge.className='lesson-auto-badge '+(d.status==='current'?'is-current':d.status==='next'?'is-next':'');
      if(start){start.disabled=false;start.title=''}
    }else{
      title.textContent=d.status==='done'?'오늘 수업 기록 완료':'오늘 수업 없음';
      sub.textContent=`${d.source} · ${d.message}`;
      badge.textContent='대기';badge.className='lesson-auto-badge is-idle';
      if(start){start.disabled=true;start.title=d.message}
    }
  }
  function bindStart(){
    const b=q('#lessonStart');if(!b||b.dataset.autoBound)return;b.dataset.autoBound='1';
    const old=b.onclick;b.onclick=function(ev){applyAutoContext(true);const target=q('#lessonTarget')?.value,period=q('#lessonPeriod')?.value;if(!target||!period){ev?.preventDefault?.();return false}return old?.call(this,ev)};
  }
  function boot(){
    ensureCard();bindStart();applyAutoContext(true);
    if(timer)clearInterval(timer);timer=setInterval(()=>applyAutoContext(false),30000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)applyAutoContext(false)},{passive:true});
    const foot=q('.side-foot');if(foot)foot.textContent='v0.16 · Comcigan auto lesson context';
  }
  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(()=>{ensureCard();bindStart();applyAutoContext(false)},0);return r};
  boot();requestAnimationFrame(()=>applyAutoContext(true));
})();
