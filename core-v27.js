(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TeacherOSDeskCore=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const DEFAULT_MIDDLE={1:['09:00','09:45'],2:['09:55','10:40'],3:['10:50','11:35'],4:['11:45','12:30'],5:['13:30','14:15'],6:['14:25','15:10'],7:['15:20','16:05']};
  const DEFAULT_HIGH={1:['09:00','09:50'],2:['10:00','10:50'],3:['11:00','11:50'],4:['12:00','12:50'],5:['13:50','14:40'],6:['14:50','15:40'],7:['15:50','16:40']};
  const ACTION_RE=/(제출|회신|확인|작성|입력|신청|준비|참석|전달|공유|제출|완료|검토|수정|업로드|보내|제출해|해\s*주세요|바랍니다|해야|필요)/;
  const DEADLINE_RE=/(오늘|내일|모레|이번\s*주|다음\s*주|금일|익일|까지|마감|기한|\d{1,2}[./월-]\s*\d{1,2}(?:일)?|\d{1,2}:\d{2}|오전|오후)/;
  const LOW_INFO_RE=/^(안녕하세요|감사합니다|수고하세요|좋은 하루|확인 부탁드립니다)[.! ]*$/;
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const dayKo=d=>['일','월','화','수','목','금','토'][d.getDay()];
  const minuteOfDay=d=>d.getHours()*60+d.getMinutes()+d.getSeconds()/60;
  const timeToMin=s=>{const m=String(s||'').match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null};
  function weekStart(date){const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return iso(d)}
  function normalizeTarget(v){const s=String(v||'').trim();let m=s.match(/^(\d+)\s*[-학년반 ]\s*(\d+)$/);if(m)return`${m[1]}-${m[2]}`;m=s.match(/(\d+)\s*학년\s*(\d+)\s*반/);return m?`${m[1]}-${m[2]}`:s}
  function parseRange(v){const m=String(v||'').match(/(\d{1,2}:\d{2})\s*[~\-–]\s*(\d{1,2}:\d{2})/);if(!m)return null;const start=timeToMin(m[1]),end=timeToMin(m[2]);return Number.isFinite(start)&&Number.isFinite(end)&&end>start?{start,end,label:`${m[1]}~${m[2]}`,exact:true}:null}
  function periodRangeMap(y){
    const exact=new Map();
    for(const s of y?.timetable||[]){const p=Number(s.period);if(!Number.isFinite(p)||exact.has(p))continue;const r=parseRange(s.time);if(r)exact.set(p,r)}
    return exact
  }
  function periodRange(y,period,exactMap){
    const p=Number(period),cached=exactMap?.get(p);if(cached)return cached;
    if(!exactMap){const found=(y?.timetable||[]).find(s=>Number(s.period)===p&&parseRange(s.time));if(found)return parseRange(found.time)}
    const table=y?.schoolLevel==='고등학교'?DEFAULT_HIGH:DEFAULT_MIDDLE,raw=table[p];
    return raw?{start:timeToMin(raw[0]),end:timeToMin(raw[1]),label:`${raw[0]}~${raw[1]}`,exact:false}:null;
  }
  function todaySlots(y,now=new Date()){
    const date=iso(now),ws=weekStart(now),live=y?.liveTimetableWeeks?.[ws];
    if(live&&Array.isArray(live.slots))return{source:'컴시간 실제표',live:true,slots:live.slots.filter(s=>s.date===date).map(s=>({...s,target:normalizeTarget(s.target||s.label)})).filter(s=>/^\d+-\d+$/.test(s.target)).sort((a,b)=>Number(a.period)-Number(b.period))};
    return{source:'기본 시간표',live:false,slots:(y?.timetable||[]).filter(s=>s.day===dayKo(now)).map(s=>({...s,target:normalizeTarget(s.target||s.label)})).filter(s=>/^\d+-\d+$/.test(s.target)).sort((a,b)=>Number(a.period)-Number(b.period))};
  }
  function lessonContext(y,now=new Date()){
    const info=todaySlots(y,now),n=minuteOfDay(now),ranges=periodRangeMap(y),slots=info.slots.map(s=>({...s,range:periodRange(y,s.period,ranges)}));
    if(!slots.length)return{status:'none',source:info.source,live:info.live,slot:null,seconds:null,exact:false};
    const current=slots.find(s=>s.range&&n>=s.range.start&&n<s.range.end);
    if(current)return{status:'current',source:info.source,live:info.live,slot:current,seconds:Math.max(0,Math.round((current.range.end-n)*60)),exact:!!current.range.exact};
    const next=slots.filter(s=>s.range&&s.range.start>n).sort((a,b)=>a.range.start-b.range.start)[0];
    if(next)return{status:'next',source:info.source,live:info.live,slot:next,seconds:Math.max(0,Math.round((next.range.start-n)*60)),exact:!!next.range.exact};
    return{status:'done',source:info.source,live:info.live,slot:null,seconds:null,exact:false};
  }
  function formatDuration(seconds){const s=Math.max(0,Number(seconds)||0),m=Math.floor(s/60),r=Math.floor(s%60);if(m>=60){const h=Math.floor(m/60),mm=m%60;return`${h}시간 ${mm?mm+'분 ':''}`.trim()}return`${m}분 ${pad(r)}초`}
  function splitSentences(text){return String(text||'').replace(/\r/g,'\n').split(/\n+|(?<=[.!?])\s+/).map(s=>s.replace(/^[-•*\s]+/,'').trim()).filter(s=>s.length>=3&&!LOW_INFO_RE.test(s))}
  function uniq(list){const out=[];for(const x of list){const k=x.replace(/\s+/g,' ').trim();if(k&&!out.some(y=>y===k))out.push(k)}return out}
  function messageDigest(text){
    const rows=splitSentences(text);if(!rows.length)return{points:[],actions:[],deadlines:[],confidence:'low'};
    const actions=uniq(rows.filter(s=>ACTION_RE.test(s))).slice(0,5),deadlines=uniq(rows.filter(s=>DEADLINE_RE.test(s))).slice(0,5);
    const scored=rows.map((s,i)=>({s,score:(ACTION_RE.test(s)?3:0)+(DEADLINE_RE.test(s)?2:0)+(i===0?1:0)+(s.length>=15&&s.length<=100?1:0)})).sort((a,b)=>b.score-a.score||rows.indexOf(a.s)-rows.indexOf(b.s));
    const points=uniq(scored.slice(0,Math.min(5,rows.length)).map(x=>x.s));
    return{points,actions,deadlines,confidence:rows.length>=3?'high':rows.length>=2?'medium':'low'};
  }
  function tidyText(text){return String(text||'').replace(/\r/g,'').split('\n').map(s=>s.replace(/[ \t]+/g,' ').trim()).filter(Boolean).join('\n').replace(/([!?.,])\1{1,}/g,'$1')}
  function safeContactRows(rows){return(rows||[]).map(r=>({name:String(r.name||'').trim(),extension:String(r.extension||'').replace(/[^0-9-]/g,'').trim(),department:String(r.department||'').trim(),room:String(r.room||'').trim()})).filter(r=>r.name&&(r.extension||r.department||r.room))}
  return{iso,weekStart,normalizeTarget,parseRange,periodRangeMap,periodRange,todaySlots,lessonContext,formatDuration,messageDigest,tidyText,safeContactRows};
});