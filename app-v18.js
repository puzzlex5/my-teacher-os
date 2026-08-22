(function(){
  const C=globalThis.TeacherOSCore;
  const V6=globalThis.TeacherOSCoreV6;
  if(!C||typeof readTextFile!=='function'||typeof textSuggestions!=='function')return;
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const HWP_MODULE='https://cdn.jsdelivr.net/npm/@ssabrojs/hwpxjs@0.4.0/dist/browser/hwpxjs.browser.mjs';
  const ACTION_RE=/(제출|신청|보고|설문|연수|회의|협의회|협의|공문|기안|결재|마감|등록|회신|제출일|신청서)/;
  const CLUB_RE=/(동아리|창체|창의적\s*체험|국제교류|밴드)/;
  const MEAL_RE=/(급식\s*미실시|급식\s*없음|미급식)/;
  const TRAIN_RE=/(연수|교직원|전교사\s*근무|교사\s*연수)/;
  const COUNSEL_RE=/(상담주간|학부모\s*상담|상담)/;
  const EVENT_RE=/(축제|예술제|와우제|체육대회|체험학습|수학여행|행사|공개수업|토론회)/;
  const ASSESS_RE=/(수행평가|지필평가|중간고사|기말고사|평가계획|고사)/;

  async function readLegacyHwp(file){
    const status=q('#importStatus');
    if(status)status.textContent=`${file.name} HWP 문서를 직접 읽는 중...`;
    try{
      const mod=await import(HWP_MODULE);
      if(typeof mod.hwpToText!=='function')throw new Error('HWP 텍스트 추출 함수를 찾지 못했습니다.');
      const bytes=new Uint8Array(await file.arrayBuffer());
      const text=await mod.hwpToText(bytes);
      if(!String(text||'').trim())throw new Error('문서에서 읽을 수 있는 본문을 찾지 못했습니다.');
      return String(text);
    }catch(err){
      const msg=String(err?.message||err||'알 수 없는 오류');
      if(/encrypt|암호/i.test(msg))throw new Error('암호화된 HWP라 직접 읽을 수 없습니다. 암호를 해제한 사본을 올려주세요.');
      if(/HWP\s*3|3\.0|ViewText|배포용|unsupported/i.test(msg))throw new Error('아주 오래된 HWP 3.0 또는 일부 배포용 HWP는 직접 읽기 어렵습니다. 이 파일만 HWPX/PDF로 변환해 주세요.');
      throw new Error('HWP 직접 분석 실패: '+msg);
    }
  }

  const previousReadTextFile=readTextFile;
  readTextFile=async function(file){
    const ext=String(file?.name||'').split('.').pop().toLowerCase();
    if(ext==='hwp')return readLegacyHwp(file);
    return previousReadTextFile(file);
  };

  function subtypeFor(line){
    const s=String(line||'');
    if(MEAL_RE.test(s))return'급식';
    if(CLUB_RE.test(s))return'동아리·창체';
    if(TRAIN_RE.test(s))return'교사연수';
    if(COUNSEL_RE.test(s))return'상담';
    if(ASSESS_RE.test(s))return'평가';
    if(/방학|휴업|공휴일|대체공휴일|재량휴업|개교기념/.test(s))return'휴업·휴일';
    if(EVENT_RE.test(s))return'학교행사';
    return'학교일정';
  }
  function eventTypeFor(line){
    const s=String(line||'');
    if(CLUB_RE.test(s))return'동아리';
    if(MEAL_RE.test(s))return'급식';
    if(ASSESS_RE.test(s))return'평가';
    if(TRAIN_RE.test(s)||COUNSEL_RE.test(s))return'행정';
    return'학교';
  }
  function adminTypeFor(line){
    const s=String(line||'');
    if(/제출|회신|보고/.test(s))return'제출·보고';
    if(/신청|등록|설문/.test(s))return'신청·응답';
    if(/연수/.test(s))return'연수';
    if(/회의|협의/.test(s))return'회의·협의';
    if(/공문|기안|결재/.test(s))return'공문·결재';
    return'행정업무';
  }
  function extractOwner(line){
    const m=String(line||'').match(/(?:담당자|담당교사|담당부서|주관)\s*[:：]?\s*([가-힣A-Za-z0-9·()_-]{2,24})/);
    return m?m[1].trim():'';
  }
  function extractMethod(line){
    const m=String(line||'').match(/(실기|관찰|포트폴리오|프로젝트|발표|서술형|논술형|구술|지필|자기평가|동료평가)/);
    return m?m[1]:'';
  }
  function extractCriteria(line){
    const m=String(line||'').match(/성취기준\s*[:：]?\s*(.{5,100})/);
    return m?m[1].replace(/\s+/g,' ').trim().slice(0,100):'';
  }
  function enrichSuggestion(s){
    const raw=String(s.raw||s.title||s.label||'');
    if(s.kind==='calendar'){
      s.scope=s.scope||C.extractTarget(raw)||'전체';
      s.impact=s.impact||(V6?V6.inferImpact(raw):'none');
      s.eventType=s.eventType||eventTypeFor(raw);
      s.subtype=s.subtype||subtypeFor(raw);
    }else if(s.kind==='assessment'){
      s.target=s.target||C.extractTarget(raw)||'';
      s.weight=s.weight||C.extractWeight(raw)||'';
      s.method=s.method||extractMethod(raw);
      s.criteria=s.criteria||extractCriteria(raw);
    }else if(s.kind==='admin'){
      s.owner=s.owner||extractOwner(raw);
      s.adminType=s.adminType||adminTypeFor(raw);
    }
    return s;
  }

  const previousTextSuggestions=textSuggestions;
  textSuggestions=function(text,source,hint,year){
    const base=(previousTextSuggestions(text,source,hint,year)||[]).map(enrichSuggestion);
    const lines=String(text||'').replace(/\r/g,'').split('\n').map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
    const extra=[];
    lines.forEach(line=>{
      const dates=C.findDates(line,year);
      if(ACTION_RE.test(line)&&dates.length){
        dates.forEach(d=>{
          const title=C.cleanTitle(line,d.raw);
          if(base.some(x=>x.kind==='admin'&&x.date===d.date&&x.title===title))return;
          extra.push(enrichSuggestion({id:uid(),checked:true,kind:'admin',date:d.date,title,source,raw:line,confidence:.84}));
        });
      }
    });
    return C.dedupe([...base,...extra],x=>`${x.kind}|${x.date||''}|${x.day||''}|${x.period||''}|${x.title||x.label||''}|${x.profileType||''}`);
  };

  const previousApplySuggestions=applySuggestions;
  applySuggestions=function(){
    let selected=[];
    try{selected=suggestions.filter(x=>x.checked).map(x=>({...x}))}catch{}
    previousApplySuggestions();
    const y=typeof cur==='function'?cur():null;if(!y)return;
    selected.forEach(s=>{
      if(s.kind==='calendar'){
        const ev=(y.calendarEvents||[]).find(x=>x.date===s.date&&x.title===s.title);
        if(ev){ev.scope=s.scope||ev.scope||'전체';ev.impact=s.impact||ev.impact||(V6?V6.inferImpact(ev.title):'none');ev.type=s.eventType||ev.type||'학교';ev.subtype=s.subtype||ev.subtype||'';}
      }else if(s.kind==='assessment'){
        const a=(y.assessments||[]).find(x=>x.name===s.title&&x.due===(s.date||''));
        if(a){a.method=s.method||a.method||'';a.criteria=s.criteria||a.criteria||'';}
      }else if(s.kind==='admin'){
        const p=(y.projects||[]).find(x=>x.name===s.title&&x.due===(s.date||''));
        if(p){p.owner=s.owner||p.owner||'';p.category=s.adminType||p.category||'행정업무';}
      }
    });
    localStorage.setItem(KEY,JSON.stringify(state));
    if(typeof render==='function')render();
  };

  function renderCapabilities(){
    const input=q('#importFiles');
    if(input)input.accept='.pdf,.xlsx,.xls,.csv,.txt,.docx,.hwp,.hwpx,.ics,.jpg,.jpeg,.png,.webp';
    const upload=q('#importer .upload');
    const strong=upload?.querySelector('strong');if(strong)strong.textContent='여기에 HWP까지 한꺼번에 올리면 바로 적용';
    const small=upload?.querySelector('small');if(small)small.textContent='HWP · HWPX · PDF · Excel · DOCX · ICS · JPG/PNG';
    const banner=q('#bulkInboxBanner .mini');if(banner)banner.textContent='파일을 선택하면 즉시 읽고 학교정보·일정·수업영향·시간표·평가·행정·동아리/창체로 나눠 자동 적용합니다. 일반 HWP 5.x도 변환 없이 바로 읽습니다.';
    const importer=q('#importer');
    const cap=importer?[...importer.querySelectorAll('article.card')].find(x=>/자동으로 잡는 항목/.test(x.querySelector('h3')?.textContent||'')):null;
    if(cap)cap.innerHTML=`<h3>자동으로 잡는 항목</h3><div class="rows capture-rows"><div class="row"><span class="pill">환경</span><div class="grow"><b>학교명·교육청</b><small>문서에서 학교 기본정보 후보</small></div></div><div class="row"><span class="pill">일정</span><div class="grow"><b>날짜·행사·휴업·상담·연수·급식</b><small>일정 종류까지 자동 구분</small></div></div><div class="row"><span class="pill">수업영향</span><div class="grow"><b>전체/학년/반 · 수업없음/일부영향</b><small>남은 실제 수업 횟수 계산에 연결</small></div></div><div class="row"><span class="pill blue">시간표</span><div class="grow"><b>기본표·컴시간 실제표</b><small>요일·교시·학년반·과목 자동 추출</small></div></div><div class="row"><span class="pill">평가</span><div class="grow"><b>평가명·날짜·대상·반영비율</b><small>평가방법·성취기준이 있으면 함께 후보화</small></div></div><div class="row"><span class="pill">행정</span><div class="grow"><b>제출·신청·보고·회의·연수·마감</b><small>담당자/부서 표기가 있으면 함께 저장</small></div></div><div class="row"><span class="pill">동아리</span><div class="grow"><b>창체·동아리·국제교류·밴드</b><small>학사일정 속 동아리성 활동 자동 구분</small></div></div><div class="row hwp-ready"><span class="pill">HWP</span><div class="grow"><b>구형 .hwp 직접 업로드</b><small>일반 HWP 5.x는 변환 없이 브라우저에서 분석</small></div></div></div>`;
    const notice=importer?[...importer.querySelectorAll('.notice')].find(x=>x.id!=='privacyNotice'&&!x.closest('#bulkInboxBanner')):null;
    if(notice&&/다시 입력하지 않습니다|학교교육계획/.test(notice.textContent||''))notice.innerHTML='<b>그냥 올리세요.</b> 학교교육계획·학사일정·평가계획·업무분장·공문·시간표와 <b>일반 HWP(.hwp)</b>까지 한 번에 올리면 필요한 항목만 구조화해 자동 적용합니다. 원문 파일 자체는 Teacher OS 데이터에 저장하지 않습니다.';
    const chip=q('#v17Chip');if(chip)chip.textContent='v0.18 · HWP 직접 업로드';
    const foot=q('.side-foot');if(foot)foot.textContent='v0.18 · HWP direct + richer auto capture';
  }

  renderCapabilities();
  requestAnimationFrame(renderCapabilities);
  const prevRender=globalThis.render;
  if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(renderCapabilities,0);return r};
})();
