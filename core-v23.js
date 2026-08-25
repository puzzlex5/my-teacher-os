(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TeacherOSDocAI=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const LABELS={calendar:'학사일정',timetable:'기본 시간표',live:'컴시간 변경표',assessment:'평가계획',admin:'업무분장·행정',club:'동아리·창체',student:'학생 명렬·학생자료',schoolplan:'학교교육계획·복합문서',unknown:'분류 미확정'};
  const RULES={
    calendar:{file:[/학사.*일정/,/연간.*일정/,/연간.*계획/,/교육.*일정/,/행사.*일정/],text:[/학사\s*일정/g,/개학|종업|방학|휴업|재량휴업/g,/체육대회|현장체험|수학여행|축제|예술제/g,/상담주간|학교행사/g]},
    timetable:{file:[/시간표/,/교사.*시간/,/수업.*시간/],text:[/월\s*화\s*수\s*목\s*금/g,/\d{1,2}\s*교시/g,/시간표/g,/담당\s*교사|교과\s*시간/g]},
    live:{file:[/컴시간/,/변경.*시간표/,/대체.*시간표/,/주간.*시간표/],text:[/컴시간/g,/변경\s*시간표|변경표/g,/대체|결강|보강/g,/이번\s*주|주간\s*시간표/g]},
    assessment:{file:[/평가.*계획/,/수행.*평가/,/지필.*평가/,/성적.*관리/],text:[/수행\s*평가/g,/지필\s*평가/g,/평가\s*계획/g,/반영\s*비율|배점|평가\s*방법/g,/성취\s*기준/g,/학업성적|고사/g]},
    admin:{file:[/업무.*분장/,/담당.*업무/,/교직원.*업무/,/공문/,/업무.*계획/],text:[/업무\s*분장/g,/담당\s*업무|담당자|담당\s*부서/g,/제출|회신|보고|신청|등록/g,/공문|기안|결재/g,/회의|협의회|연수/g]},
    club:{file:[/동아리/,/창체/,/국제.*교류/,/밴드/],text:[/동아리/g,/창의적\s*체험|창체/g,/국제\s*교류|자매\s*학교/g,/밴드|합주|공연/g]},
    student:{file:[/명렬/,/명단/,/학생.*목록/,/학급.*명부/,/상담.*기록/],text:[/학생\s*명렬|학생\s*명단|학급\s*명부/g,/학번|학생번호/g,/성명\s*학년\s*반|번호\s*성명/g,/상담\s*기록|학생\s*상담/g]},
    schoolplan:{file:[/학교.*교육.*계획/,/교육.*과정.*운영/,/학교.*운영.*계획/,/교육.*활동.*계획/],text:[/학교\s*교육\s*계획/g,/교육\s*과정\s*운영/g,/교육활동\s*계획/g,/학사\s*일정.*평가|평가.*업무\s*분장/g]}
  };
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  function clean(s){return String(s||'').replace(/\s+/g,' ').trim()}
  function fileStem(name){return clean(String(name||'').replace(/\.[^.]+$/,' ').replace(/(?:19|20)\d{2}/g,' ').replace(/\d{1,2}[._-]\d{1,2}/g,' ').replace(/[\[\](){}【】_\-]+/g,' ')).toLowerCase()}
  function feedbackSignature(name){return fileStem(name).replace(/\b\d+\b/g,' ').replace(/\s+/g,' ').trim().slice(0,120)}
  function hitCount(text,list){let score=0;for(const re of list||[]){const flags=re.flags.includes('g')?re.flags:re.flags+'g',rx=new RegExp(re.source,flags),m=String(text||'').match(rx);score+=Math.min(4,m?m.length:0)}return score}
  function dateDensity(text){const m=String(text||'').match(/(?:20\d{2}[.\/-]\s*\d{1,2}[.\/-]\s*\d{1,2}|\d{1,2}[.\/-]\s*\d{1,2})/g)||[];return Math.min(5,m.length/3)}
  function classifyDocument(input={}){
    const name=String(input.name||''),stem=fileStem(name),text=String(input.text||'').slice(0,180000),ext=String(input.ext||'').toLowerCase(),layout=input.layout||{},feedbackClass=input.feedbackClass||'';
    const scores={};
    Object.keys(RULES).forEach(id=>{const r=RULES[id];scores[id]=hitCount(stem,r.file)*2.8+hitCount(text,r.text)*1.25});
    const dates=dateDensity(text);scores.calendar+=dates*0.7;scores.assessment+=dates*0.35;scores.admin+=dates*0.2;
    if(['xlsx','xls','csv'].includes(ext)){scores.timetable+=Number(layout.timetableSlots||0)>2?7:0;scores.admin+=Number(layout.tableRows||0)>8?0.8:0;scores.assessment+=/평가|성취|반영/.test(text)?2:0}
    if(Number(layout.dayHeaders||0)>=4){scores.timetable+=5;scores.live+=/변경|컴시간|주간/.test(text)?3:0}
    if(Number(layout.classCodes||0)>=4)scores.timetable+=2.5;
    if(Number(layout.periodMarkers||0)>=3)scores.timetable+=2;
    if(ext==='ics')scores.calendar+=12;
    if(/업무분장/.test(stem))scores.admin+=8;if(/평가계획/.test(stem))scores.assessment+=8;if(/컴시간|변경시간표/.test(stem))scores.live+=9;
    if(feedbackClass&&scores[feedbackClass]!==undefined)scores[feedbackClass]+=18;
    const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);const [top,second]=[ranked[0]||['unknown',0],ranked[1]||['unknown',0]];
    let primary=top[0],topScore=top[1],secondScore=second[1],margin=topScore-secondScore;
    if(topScore<1.8)primary='unknown';
    const mixed=primary!=='unknown'&&topScore>=4.5&&secondScore>=4&&secondScore/topScore>=0.78;
    let confidence=primary==='unknown'?0.5:clamp(0.54+Math.min(.27,topScore*.025)+Math.min(.18,Math.max(0,margin)*.035),.5,.99);
    if(feedbackClass&&primary===feedbackClass)confidence=.99;else if(mixed)confidence=Math.min(confidence,.84);
    return{classId:primary,label:LABELS[primary]||LABELS.unknown,confidence,margin,score:topScore,secondClass:second[0],secondLabel:LABELS[second[0]]||LABELS.unknown,secondScore,mixed,scores};
  }
  function textQuality(text){const s=String(text||'').trim();if(!s)return 0;const useful=(s.match(/[가-힣A-Za-z0-9]/g)||[]).length,odd=(s.match(/[�□■◆◇※]{1}/g)||[]).length,ratio=useful/Math.max(1,s.length),lengthScore=clamp(Math.log10(s.length+10)/4,.2,1);return clamp(ratio*.7+lengthScore*.3-odd/Math.max(20,s.length),0,1)}
  function extractionQuality(input={}){const tq=textQuality(input.text),ocr=Number.isFinite(Number(input.ocrConfidence))?clamp(Number(input.ocrConfidence),0,1):null,method=String(input.method||'');let q=tq;if(/spreadsheet|native|docx|hwp|pptx|ics/i.test(method)&&tq>=.45)q=Math.max(q,.9);if(/hybrid/i.test(method))q=Math.max(q,.82);if(/ocr/i.test(method)&&ocr!==null)q=q*.45+ocr*.55;return clamp(q,.05,.99)}
  function compatibility(docClass,kind,mixed=false){
    if(kind==='profile')return 1;if(docClass==='schoolplan')return .9;
    if(docClass==='calendar')return kind==='calendar'?1:.28;
    if(docClass==='timetable')return kind==='timetable'?1:(kind==='live' ? .65 : .25);
    if(docClass==='live')return kind==='live'?1:(kind==='timetable' ? .75 : .25);
    if(docClass==='assessment')return kind==='assessment'?1:(kind==='calendar' ? .45 : .22);
    if(docClass==='admin')return kind==='admin'?1:(kind==='calendar' ? .42 : .24);
    if(docClass==='club')return kind==='calendar' ? .9 : (kind==='admin' ? .45 : .25);
    if(docClass==='student')return .08;return .55
  }
  function fuseSuggestion(input={}){const base=clamp(Number(input.baseConfidence)||.5),doc=clamp(Number(input.docConfidence)||.5),extract=clamp(Number(input.extractionQuality)||.5),compat=compatibility(input.docClass,input.kind,!!input.mixed),ambiguous=!!input.mixed&&input.docClass!=='schoolplan';let confidence=base*.52+extract*.25+(doc*compat)*.23;if(doc>=.9&&compat<.4)confidence-=.1;if(input.sensitive)confidence=Math.min(confidence,.58);confidence=clamp(confidence,.05,.99);const auto=confidence>=.9&&extract>=.72&&!input.sensitive&&!ambiguous&&(doc>=.82||input.docClass==='schoolplan');return{confidence,auto,compatibility:compat,needsReview:!auto}}
  function classOptions(){return Object.entries(LABELS).filter(([id])=>id!=='unknown').map(([id,label])=>({id,label}))}
  return{LABELS,RULES,fileStem,feedbackSignature,classifyDocument,textQuality,extractionQuality,fuseSuggestion,classOptions,clamp};
});
