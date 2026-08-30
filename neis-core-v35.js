(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.TeacherOSNeisCore35=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const API_ROOT='https://open.neis.go.kr/hub/';
  const arr=v=>Array.isArray(v)?v:[];
  const txt=v=>String(v??'').trim();

  function hash36(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
  function basicToISO(v){const s=txt(v).replace(/\D/g,'');return /^\d{8}$/.test(s)?`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`:''}
  function isoToBasic(v){const s=txt(v).replace(/\D/g,'');return /^\d{8}$/.test(s)?s:''}
  function localISO(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function addDays(date,n){const d=new Date(date.getFullYear(),date.getMonth(),date.getDate()+n);return d}
  function semesterForDate(d=new Date()){const m=d.getMonth()+1;return m>=3&&m<=7?'1':'2'}

  function buildUrl(service,params={},apiKey=''){
    if(!/^[A-Za-z][A-Za-z0-9]*$/.test(service))throw new Error('올바르지 않은 NEIS 서비스명');
    const u=new URL(API_ROOT+service);
    const all={Type:'json',pIndex:1,pSize:100,...params};
    if(txt(apiKey))all.KEY=txt(apiKey);
    Object.entries(all).forEach(([k,v])=>{if(v!==undefined&&v!==null&&txt(v)!=='')u.searchParams.set(k,String(v))});
    return u.toString();
  }

  function parseRows(payload,service){
    const top=payload&&payload[service];
    if(Array.isArray(top)){
      const head=top[0]?.head||[],result=head.find(x=>x&&x.RESULT)?.RESULT||{};
      const total=Number(head.find(x=>x&&x.list_total_count)?.list_total_count||0);
      const rows=arr(top.find(x=>x&&Array.isArray(x.row))?.row);
      return{rows,total,code:txt(result.CODE)||'INFO-000',message:txt(result.MESSAGE)};
    }
    const result=payload?.RESULT||{};
    const code=txt(result.CODE),message=txt(result.MESSAGE);
    if(code==='INFO-200')return{rows:[],total:0,code,message};
    return{rows:[],total:0,code:code||'ERROR-UNKNOWN',message:message||'NEIS 응답 형식을 확인할 수 없습니다.'};
  }

  function normalizeSchool(row){return{
    officeCode:txt(row?.ATPT_OFCDC_SC_CODE),officeName:txt(row?.ATPT_OFCDC_SC_NM),schoolCode:txt(row?.SD_SCHUL_CODE),
    schoolName:txt(row?.SCHUL_NM),schoolLevel:txt(row?.SCHUL_KND_SC_NM),address:txt(row?.ORG_RDNMA),homepage:txt(row?.HMPG_ADRES),loadedAt:txt(row?.LOAD_DTM)
  }}

  function chooseSchool(rows,schoolName,officeName='',schoolLevel=''){
    const want=txt(schoolName).replace(/\s+/g,''),office=txt(officeName),level=txt(schoolLevel);
    if(!want)return null;
    const scored=arr(rows).map(raw=>{const s=normalizeSchool(raw),name=s.schoolName.replace(/\s+/g,'');let score=0;
      if(name===want)score+=100;else if(name.includes(want)||want.includes(name))score+=35;
      if(office&&s.officeName===office)score+=40;
      if(level&&s.schoolLevel===level)score+=20;
      return{s,score};
    }).filter(x=>x.s.schoolCode&&x.score>0).sort((a,b)=>b.score-a.score||a.s.schoolName.localeCompare(b.s.schoolName,'ko'));
    if(!scored.length)return null;
    if(scored[0].score<100)return null;
    return scored[0].s;
  }

  function scheduleExternalKey(row){return['neis35','schedule',txt(row?.ATPT_OFCDC_SC_CODE),txt(row?.SD_SCHUL_CODE),txt(row?.AA_YMD),txt(row?.EVENT_NM)].join(':')}
  function scheduleEvent(row){
    const date=basicToISO(row?.AA_YMD),title=txt(row?.EVENT_NM);if(!date||!title)return null;
    const key=scheduleExternalKey(row);
    return{id:'neis35-'+hash36(key),date,title,type:'NEIS 학사',source:'NEIS 공식 Open API',readonly:true,neisOfficial:true,externalKey:key,
      content:txt(row?.EVENT_CNTNT),gradeFlags:{one:txt(row?.ONE_GRADE_EVENT_YN),two:txt(row?.TW_GRADE_EVENT_YN),three:txt(row?.THREE_GRADE_EVENT_YN)}};
  }

  function reconcileSchedule(existing,rows){
    const keep=arr(existing).filter(x=>x?.neisOfficial!==true&&!(txt(x?.externalKey).startsWith('neis35:schedule:')));
    const oldCount=arr(existing).length-keep.length,seen=new Set(),official=[];
    arr(rows).forEach(r=>{const e=scheduleEvent(r);if(!e||seen.has(e.externalKey))return;seen.add(e.externalKey);official.push(e)});
    official.sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'ko'));
    return{events:[...keep,...official],officialCount:official.length,replacedCount:oldCount};
  }

  function classRefsFromText(value){
    const s=txt(value),out=[];let m;
    const dash=/(?:^|[^0-9])([1-3])\s*[-–]\s*([1-9][0-9]?)(?=$|[^0-9])/g;
    while((m=dash.exec(s)))out.push({grade:m[1],className:m[2]});
    const korean=/([1-3])\s*학년\s*([1-9][0-9]?)\s*반/g;
    while((m=korean.exec(s)))out.push({grade:m[1],className:m[2]});
    return out;
  }
  function extractClassRefs(year){
    const map=new Map();
    const add=v=>classRefsFromText(v).forEach(x=>map.set(`${x.grade}-${x.className}`,x));
    arr(year?.timetable).forEach(x=>add(x?.label));arr(year?.assessments).forEach(x=>add(x?.target));
    return[...map.values()].sort((a,b)=>Number(a.grade)-Number(b.grade)||Number(a.className)-Number(b.className)).slice(0,24);
  }

  function timetableService(schoolLevel){const s=txt(schoolLevel);if(s==='초등학교')return'elsTimetable';if(s==='고등학교')return'hisTimetable';if(s==='특수학교')return'spsTimetable';return'misTimetable'}
  function timetableWindow(now=new Date()){return{from:isoToBasic(localISO(addDays(now,-3))),to:isoToBasic(localISO(addDays(now,21))),semester:semesterForDate(now)}}
  function compactTimetableRow(r){return{date:basicToISO(r?.ALL_TI_YMD),grade:txt(r?.GRADE),className:txt(r?.CLASS_NM),period:Number(r?.PERIO)||0,content:txt(r?.ITRT_CNTNT),room:txt(r?.CLRM_NM),loadedAt:txt(r?.LOAD_DTM)}}

  function weekday(dateText){const d=new Date(`${dateText}T12:00:00`);return['일','월','화','수','목','금','토'][d.getDay()]||''}
  function slotClass(slot){return classRefsFromText(slot?.label)[0]||null}
  function compareTeacherTimetable(year,officialRows,subjects){
    const rows=arr(officialRows).map(compactTimetableRow).filter(x=>x.date&&x.grade&&x.className&&x.period);
    const subjectList=arr(subjects).map(txt).filter(Boolean);if(!subjectList.length)return[];
    const anomalies=[],seen=new Set();
    arr(year?.timetable).forEach(slot=>{
      const ref=slotClass(slot);if(!ref)return;
      const day=txt(slot?.day),period=Number(slot?.period)||0;if(!day||!period)return;
      rows.filter(r=>r.grade===ref.grade&&r.className===ref.className&&r.period===period&&weekday(r.date)===day).forEach(r=>{
        if(!r.content)return;
        const matches=subjectList.some(s=>r.content.includes(s));if(matches)return;
        const key=`${r.date}:${ref.grade}-${ref.className}:${period}:${r.content}`;if(seen.has(key))return;seen.add(key);
        anomalies.push({key,date:r.date,grade:ref.grade,className:ref.className,period,expected:subjectList.join('·'),actual:r.content,title:`${ref.grade}-${ref.className} ${period}교시 공식 시간표 변경 확인`});
      });
    });
    return anomalies.sort((a,b)=>a.date.localeCompare(b.date)||a.period-b.period).slice(0,30);
  }

  function taskCandidates(anomalies,tasks){
    const existing=new Set(arr(tasks).map(x=>txt(x?.neis35Key)).filter(Boolean));
    return arr(anomalies).filter(a=>!existing.has(a.key)).map(a=>({text:`${a.title} · NEIS ${a.actual} / Teacher OS ${a.expected}`,done:false,agentGenerated:true,agentCategory:'NEIS 공식시간표',neis35Key:a.key,createdAt:new Date().toISOString()}));
  }

  function schoolYearRange(year){const y=Number(year)||new Date().getFullYear();return{from:`${y}0301`,to:`${y+1}0228`}}

  return{API_ROOT,hash36,basicToISO,isoToBasic,buildUrl,parseRows,normalizeSchool,chooseSchool,scheduleExternalKey,scheduleEvent,reconcileSchedule,classRefsFromText,extractClassRefs,timetableService,timetableWindow,compactTimetableRow,compareTeacherTimetable,taskCandidates,schoolYearRange,semesterForDate};
});
