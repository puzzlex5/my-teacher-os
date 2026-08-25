(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.TeacherOSCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const WEEKDAYS=['월','화','수','목','금'];
  const NO_CLASS_RE=/(방학|휴업|공휴일|재량휴업|개교기념|수학여행|현장체험|체험학습|졸업식|입학식|대체공휴일|임시공휴일|지필평가|중간고사|기말고사)/;
  function arr(v){return Array.isArray(v)?v:[]}
  function curriculumMode(year,level){
    const yr=Number(year);
    if(!['중학교','고등학교'].includes(level)) return '학교급별 교육과정 확인 필요';
    if(yr>=2027) return '2022 개정 교육과정 · 전 학년 적용';
    if(yr===2026) return '1·2학년 2022 개정 / 3학년 2015 개정';
    if(yr===2025) return '1학년 2022 개정 / 2·3학년 2015 개정';
    return '2015 개정 교육과정 중심';
  }
  function creditMode(year,level){return level==='고등학교'&&Number(year)>=2025}
  function normDate(year,month,day,fallbackYear){
    const yy=Number(year||fallbackYear||new Date().getFullYear()),mm=Number(month),dd=Number(day);
    if(!yy||!mm||!dd||mm<1||mm>12||dd<1||dd>31)return'';
    return `${yy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
  }
  function dueDays(date,baseDate){
    if(!date)return null;
    const t=new Date(date+'T00:00:00');
    const n=baseDate?new Date(baseDate):new Date(); n.setHours(0,0,0,0);
    return Math.ceil((t-n)/86400000);
  }
  function findDates(text,fallbackYear){
    text=String(text||''); const out=[]; let m;
    const push=(date,idx,raw)=>{if(date&&!out.some(x=>x.date===date&&x.idx===idx))out.push({date,idx,raw})};
    const regs=[/(20\d{2})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})일?/g,/(\d{1,2})월\s*(\d{1,2})일/g,/(\d{1,2})[./-](\d{1,2})(?!\d)/g];
    regs.forEach((re,i)=>{while((m=re.exec(text))){push(i===0?normDate(m[1],m[2],m[3],fallbackYear):normDate(null,m[1],m[2],fallbackYear),m.index,m[0])}});
    return out.sort((a,b)=>a.idx-b.idx);
  }
  function classifyLine(line,hint){
    line=String(line||''); if(hint&&hint!=='auto')return hint;
    if(/시간표|교시|월요일|화요일|수요일|목요일|금요일/.test(line))return'timetable';
    if(/수행평가|지필평가|평가계획|성취기준|반영비율|고사|평가 영역/.test(line))return'assessment';
    if(/업무분장|담당자|제출|공문|기안|결재|보고|신청|담당 업무/.test(line))return'admin';
    return'calendar';
  }
  function extractWeight(line){const m=String(line||'').match(/(\d{1,3}(?:\.\d+)?)\s*%/);return m?m[1]+'%':''}
  function extractTarget(line){
    const s=String(line||'');
    const grade=s.match(/([1-3])\s*학년/); const cls=s.match(/([1-3])\s*[-학년반 ]\s*([1-9]\d?)(?:\s*반)?/);
    if(cls)return `${cls[1]}-${cls[2]}`; if(grade)return `${grade[1]}학년`;
    const compact=s.match(/\b([1-3])-([1-9]\d?)\b/); return compact?`${compact[1]}-${compact[2]}`:'';
  }
  function cleanTitle(line,raw){
    let t=String(line||'').replace(raw||'',' ').replace(/\s+/g,' ').trim();
    t=t.replace(/^[-–—•·\d.()\s]+/,'').trim(); return t.slice(0,120)||'학교 일정';
  }
  function dedupe(items,keyFn){const seen=new Set();return arr(items).filter(x=>{const k=keyFn(x);if(seen.has(k))return false;seen.add(k);return true})}
  function parseTimetableGrid(rows,subject){
    rows=arr(rows).map(r=>arr(r).map(v=>String(v??'').trim())); if(!rows.length)return[];
    let headerIndex=-1, dayCols={};
    for(let i=0;i<Math.min(rows.length,12);i++){
      const row=rows[i]; const found={};
      row.forEach((v,j)=>{WEEKDAYS.forEach(d=>{if(v===d||v===d+'요일')found[d]=j})});
      if(Object.keys(found).length>=3){headerIndex=i;dayCols=found;break}
    }
    if(headerIndex<0)return[];
    const out=[];
    for(let i=headerIndex+1;i<rows.length;i++){
      const row=rows[i]; if(!row.some(Boolean))continue;
      const periodCell=row.slice(0,Math.max(1,Math.min(...Object.values(dayCols)))).find(v=>/\d+\s*교시|^\d+$/.test(v));
      const pm=(periodCell||'').match(/(\d+)/); if(!pm)continue; const period=Number(pm[1]);
      Object.entries(dayCols).forEach(([day,col])=>{
        const label=String(row[col]||'').trim(); if(!label)return;
        if(subject&&label.includes('점심'))return;
        out.push({day,period,label,subject:subject||'',target:extractTarget(label)});
      });
    }
    return dedupe(out,x=>`${x.day}|${x.period}|${x.label}`);
  }
  function weekdayKo(date){return ['일','월','화','수','목','금','토'][new Date(date+'T00:00:00').getDay()]}
  function isNoClassEvent(ev){return !!(ev&&NO_CLASS_RE.test(String(ev.title||'')))}
  function countTeachingSlots(timetable,calendar,target,startDate,dueDate){
    if(!dueDate)return 0; const start=new Date((startDate||new Date().toISOString().slice(0,10))+'T00:00:00'); const end=new Date(dueDate+'T00:00:00');
    if(end<start)return 0; const tt=arr(timetable).filter(x=>!target||!x.target||x.target===target||String(x.label||'').includes(target)); const cal=arr(calendar); let count=0;
    for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
      const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; if(cal.some(e=>e.date===iso&&isNoClassEvent(e)))continue;
      const wd=['일','월','화','수','목','금','토'][d.getDay()]; count+=tt.filter(x=>x.day===wd).length;
    }
    return count;
  }
  function privacySignals(text){
    text=String(text||''); const signals=[];
    if(/\b\d{6}-?[1-4]\d{6}\b/.test(text))signals.push('주민등록번호 형태');
    if(/\b01[016789][- .]?\d{3,4}[- .]?\d{4}\b/.test(text))signals.push('휴대전화번호 형태');
    const emailText=text.replace(/^UID(?:;[^:]*)?:[^\r\n]*(?:\r?\n[ \t][^\r\n]*)*/gim,'');
    if(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(emailText))signals.push('이메일 주소');
    return signals;
  }
  function detectOffice(text,officeNames){return arr(officeNames).find(n=>String(text||'').includes(n))||''}
  function detectSchoolName(text){
    const s=String(text||''); const m=s.match(/([가-힣A-Za-z0-9·\- ]{2,30}(?:중학교|고등학교|학교))/); if(!m)return'';
    return m[1].replace(/\s+/g,' ').trim();
  }
  return {WEEKDAYS,NO_CLASS_RE,arr,curriculumMode,creditMode,normDate,dueDays,findDates,classifyLine,extractWeight,extractTarget,cleanTitle,dedupe,parseTimetableGrid,weekdayKo,isNoClassEvent,countTeachingSlots,privacySignals,detectOffice,detectSchoolName};
});
