(function(){
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const esc20=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
  const id20=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(16).slice(2);
  const date20=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const ROLE_DEFS=[
    ['subject','교과담당','수업 관찰·평가·과목별 세부능력 및 특기사항 근거'],
    ['homeroom','담임교사','담임 관찰·자율자치·진로·행동특성 및 종합의견'],
    ['head','부장교사','부서업무·마감·업무팩 중심'],
    ['violence','학교폭력 담당','학교폭력 사안·예방·후속조치 기록'],
    ['guidance','생활교육 담당','생활지도·관계회복·후속관찰'],
    ['studentrecord','학교생활기록부 담당','학생부 기재 점검·지원'],
    ['assessment','평가 담당','평가계획·성적관리·마감 점검'],
    ['club','창체·동아리 담당','자율자치·동아리 활동 운영'],
    ['career','진로 담당','진로활동·상담·프로그램 운영'],
    ['info','정보 담당','정보·개인정보·교육정보 업무'],
    ['other','기타 업무','학교별 별도 업무']
  ];
  const ROLE_MAP=Object.fromEntries(ROLE_DEFS.map(x=>[x[0],x]));
  const EVIDENCE_KINDS=new Set(['담임관찰','교과관찰','자율자치활동','진로활동','동아리·창체','수업·평가관찰']);
  const SENSITIVE_RE=/(질병|진단|약물|정신|우울|자해|가정폭력|이혼|경제사정|기초생활|성폭력|성적지향|종교|장애|주민등록|전화번호)/;
  let selectedStudentId='',transcriberPromise=null,currentTranscript='';

  function ensure20(){
    state.version=Math.max(Number(state.version)||0,20);
    Object.values(state.years||{}).forEach(y=>{
      y.roleProfile=y.roleProfile&&typeof y.roleProfile==='object'?y.roleProfile:{roles:['subject'],homeroomGrade:'',homeroomClass:'',department:'',other:''};
      y.roleProfile.roles=Array.isArray(y.roleProfile.roles)?y.roleProfile.roles:[];
      y.students=Array.isArray(y.students)?y.students:[];
      y.studentRecords=Array.isArray(y.studentRecords)?y.studentRecords:[];
      y.consultations=Array.isArray(y.consultations)?y.consultations:[];
      y.studentDrafts=y.studentDrafts&&typeof y.studentDrafts==='object'?y.studentDrafts:{};
    });
    localStorage.setItem(KEY,JSON.stringify(state));
  }
  function y20(){return typeof cur==='function'?cur():null}
  function save20(renderNow=true){localStorage.setItem(KEY,JSON.stringify(state));if(renderNow&&typeof render==='function')render()}
  function roles(y=y20()){return new Set(y?.roleProfile?.roles||[])}
  function hasRole(id,y=y20()){return roles(y).has(id)}
  function roleLabel(id){return ROLE_MAP[id]?.[1]||id}
  function studentById(id,y=y20()){return (y?.students||[]).find(s=>s.id===id)}
  function studentLabel(s){return s?`${s.grade||''}-${s.classNo||''} ${s.number?String(s.number)+'번 ':''}${s.name||''}`.replace(/^-/,'').trim():''}
  function canDraft(area,y=y20()){
    if(area==='subject')return hasRole('subject',y);
    if(['behavior','autonomy','career'].includes(area))return hasRole('homeroom',y);
    return false;
  }
  function areaLabel(a){return ({behavior:'행동특성 및 종합의견',autonomy:'자율·자치활동',career:'진로활동',subject:'과목별 세부능력 및 특기사항',reference:'참고만'})[a]||a}
  function kindArea(kind){if(kind==='교과관찰'||kind==='수업·평가관찰')return'subject';if(kind==='자율자치활동'||kind==='동아리·창체')return'autonomy';if(kind==='진로활동')return'career';if(kind==='담임관찰')return'behavior';return'reference'}
  function roleFeatures(y=y20()){
    const r=roles(y),out=[];
    if(r.has('homeroom'))out.push('담임 관찰','행특','자율·자치','진로');
    if(r.has('subject'))out.push('교과 관찰','과세특');
    if(r.has('violence'))out.push('학교폭력 사안·예방');
    if(r.has('guidance'))out.push('생활지도·관계회복');
    if(r.has('head'))out.push('부서업무');
    if(r.has('studentrecord'))out.push('학생부 기재 점검');
    if(r.has('assessment'))out.push('평가·성적관리');
    if(r.has('club'))out.push('창체·동아리');
    if(r.has('career'))out.push('진로업무');
    return [...new Set(out)];
  }

  function ensureUI(){
    const nav=q('#nav');
    if(nav&&!nav.querySelector('[data-view="studentrecords"]')){
      const anchor=nav.querySelector('[data-view="lessonlog"]')||nav.querySelector('[data-view="assessment"]');
      anchor?.insertAdjacentHTML('afterend','<button data-view="studentrecords">♙ <span>학생 기록</span></button>');
    }
    if(!q('#studentrecords')){
      const anchor=q('#assessment')||q('#projects');
      anchor?.insertAdjacentHTML('beforebegin',`<section id="studentrecords" class="view">
        <div class="section-intro"><div><span class="kicker">STUDENT RECORDS</span><h2>학생 기록</h2><p class="muted">상담·담임관찰·교과관찰·생활지도를 분리해 누적하고, 생활기록부에 쓸 수 있는 직접 관찰 근거만 따로 모읍니다.</p></div><button class="btn secondary" id="studentRoleBtn">내 역할 설정</button></div>
        <div id="studentRoleSummary" class="sr-role-summary"></div>
        <div class="notice warning spaced"><b>기재 근거 분리.</b> 상담 녹음·상담 원문·학교폭력/생활지도 기록은 생활기록부 근거로 자동 사용하지 않습니다. 담임·교과교사가 학교교육활동에서 직접 관찰·평가한 기록만 초안 근거함에 들어갑니다.</div>
        <div class="sr-layout spaced">
          <aside class="card sr-roster-card"><div class="sr-card-head"><div><span class="kicker">ROSTER</span><h3>학생</h3></div><span id="srStudentCount" class="pill">0명</span></div>
            <label class="sr-roster-upload"><input id="srRosterFile" type="file" accept=".xlsx,.xls,.csv,.txt"><b>명렬표 가져오기</b><small>Excel · CSV · TXT · 기기에서만 처리</small></label>
            <div class="sr-add-student"><input id="srStudentName" class="field" placeholder="학생 이름"><div class="sr-mini-fields"><input id="srStudentGrade" class="field" inputmode="numeric" placeholder="학년"><input id="srStudentClass" class="field" inputmode="numeric" placeholder="반"><input id="srStudentNo" class="field" inputmode="numeric" placeholder="번호"></div><button class="btn secondary" id="srAddStudent">학생 추가</button></div>
            <div id="srStudentList" class="sr-student-list"></div>
          </aside>
          <div class="sr-main">
            <article class="card"><div class="sr-card-head"><div><span class="kicker">STUDENT TIMELINE</span><h3 id="srSelectedTitle">학생을 선택하세요</h3></div><span id="srEvidenceCount" class="pill">근거 0</span></div><div id="srTimeline" class="sr-timeline"><div class="empty">학생을 선택하면 연간 기록이 시간순으로 표시됩니다.</div></div></article>
            <div class="grid2 spaced">
              <article class="card"><span class="kicker">OBSERVATION</span><h3>관찰·활동 기록</h3><div class="sr-form"><input id="srRecordDate" class="field" type="date"><select id="srRecordKind" class="field"></select><textarea id="srRecordText" class="field" rows="4" placeholder="관찰한 사실을 짧게 기록"></textarea><div id="srEvidenceBox" class="sr-evidence-box"><label><input id="srUseEvidence" type="checkbox" checked> 생활기록부 근거함에 사용</label><select id="srRecordArea" class="field"><option value="behavior">행동특성 및 종합의견</option><option value="autonomy">자율·자치활동</option><option value="career">진로활동</option><option value="subject">과목별 세부능력 및 특기사항</option></select></div><button class="btn primary" id="srSaveRecord">기록 저장</button></div></article>
              <article class="card"><span class="kicker">COUNSELING AUDIO</span><h3>전화·면담 상담 기록</h3><p class="muted">녹음파일은 기기에서만 분석하고 원본 음성·전체 녹취는 Teacher OS에 저장하지 않습니다.</p><div class="sr-form"><input id="srCounselDate" class="field" type="date"><select id="srCounselParty" class="field"><option>학생</option><option>학부모</option><option>학생+학부모</option><option>기타</option></select><input id="srAudioFile" class="field" type="file" accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.webm"><button class="btn secondary" id="srTranscribe">녹음 분석 · 기기 내 Whisper</button><div id="srAudioStatus" class="mini"></div><textarea id="srTranscript" class="field" rows="5" placeholder="자동 변환된 녹취가 여기에 표시됩니다. 필요하면 직접 붙여넣어도 됩니다."></textarea><button class="btn secondary" id="srSummarize">상담 요약 만들기</button><textarea id="srCounselSummary" class="field" rows="4" placeholder="저장할 상담 핵심내용"></textarea><input id="srCounselFollow" class="field" placeholder="후속 확인·조치 (선택)"><button class="btn primary" id="srSaveCounsel">상담기록 저장</button></div></article>
            </div>
            <article class="card spaced"><div class="sr-card-head"><div><span class="kicker">SCHOOL RECORD DRAFT</span><h3>근거 기반 생활기록부 초안</h3><p class="muted">현재 역할에 해당하는 항목만 생성합니다. 상담·민감정보·학폭/생활지도 기록은 자동 제외합니다.</p></div></div><div id="srDraftButtons" class="sr-draft-buttons"></div><textarea id="srDraftText" class="field sr-draft-text" rows="7" placeholder="학생을 선택하고 초안 항목을 누르세요."></textarea><div id="srDraftEvidence" class="sr-draft-evidence"></div></article>
          </div>
        </div>
      </section>`);
    }
    if(!q('#roleDlg'))document.body.insertAdjacentHTML('beforeend',`<dialog id="roleDlg"><form class="modal role-modal" id="roleForm"><div class="modal-head"><div><span class="kicker">YEAR ROLE PROFILE</span><h2>올해 내 역할</h2><p class="muted">여러 역할을 동시에 선택할 수 있습니다. 담임이 아니어도 부장·학교폭력·생활교육 등 담당업무를 선택하세요.</p></div><button type="button" class="close" data-role-close>×</button></div><div id="roleChoices" class="role-choices"></div><div id="homeroomFields" class="role-extra"><b>담임 학급</b><div class="sr-mini-fields"><input id="roleGrade" class="field" inputmode="numeric" placeholder="학년"><input id="roleClass" class="field" inputmode="numeric" placeholder="반"></div></div><div id="headFields" class="role-extra"><b>부서</b><input id="roleDepartment" class="field" placeholder="예: 예술체육부, 학생안전부"></div><div class="role-extra"><b>기타 업무 메모</b><input id="roleOther" class="field" placeholder="학교별 별도 역할이 있으면 입력"></div><div class="modal-actions"><button type="button" class="btn secondary" data-role-close>취소</button><button class="btn primary">역할 저장</button></div></form></dialog>`);
    const top=q('.top-actions');if(top&&!q('#roleSetupBtn'))top.insertAdjacentHTML('afterbegin','<button class="btn secondary" id="roleSetupBtn">내 역할</button>');
    const dash=q('#dashboardBody');if(dash&&!q('#roleDashboardCard'))dash.insertAdjacentHTML('afterbegin','<article id="roleDashboardCard" class="card role-dashboard-card"><div><span class="kicker">MY ROLE</span><div id="roleDashboardText"></div></div><button class="btn secondary tiny" id="roleDashEdit">역할 설정</button></article>');
    const chip=q('#v17Chip');if(chip)chip.textContent='v0.20 · 역할 + 학생기록';
    const foot=q('.side-foot');if(foot)foot.textContent='v0.20 · role-aware student records';
  }

  function openRoleDialog(){
    const y=y20();if(!y)return;
    const rp=y.roleProfile||{},set=new Set(rp.roles||[]);
    q('#roleChoices').innerHTML=ROLE_DEFS.map(([id,name,desc])=>`<label class="role-choice"><input type="checkbox" name="teacherRole" value="${id}" ${set.has(id)?'checked':''}><span><b>${name}</b><small>${desc}</small></span></label>`).join('');
    q('#roleGrade').value=rp.homeroomGrade||'';q('#roleClass').value=rp.homeroomClass||'';q('#roleDepartment').value=rp.department||'';q('#roleOther').value=rp.other||'';
    toggleRoleExtras();q('#roleDlg').showModal();
  }
  function toggleRoleExtras(){const set=new Set(qa('input[name="teacherRole"]:checked').map(x=>x.value));q('#homeroomFields').hidden=!set.has('homeroom');q('#headFields').hidden=!set.has('head')}
  function saveRoles(ev){
    ev.preventDefault();const y=y20();if(!y)return;
    y.roleProfile={roles:qa('input[name="teacherRole"]:checked').map(x=>x.value),homeroomGrade:q('#roleGrade').value.trim(),homeroomClass:q('#roleClass').value.trim(),department:q('#roleDepartment').value.trim(),other:q('#roleOther').value.trim()};
    if(!y.roleProfile.roles.length)y.roleProfile.roles=['subject'];
    q('#roleDlg').close();save20();render20();
  }
  function renderRole(){
    const y=y20();if(!y)return;const rp=y.roleProfile||{},rs=rp.roles||[],features=roleFeatures(y);
    const chips=rs.map(id=>`<span class="role-chip">${esc20(roleLabel(id))}</span>`).join('');
    const extra=[hasRole('homeroom',y)&&rp.homeroomGrade&&rp.homeroomClass?`${rp.homeroomGrade}학년 ${rp.homeroomClass}반 담임`:'',hasRole('head',y)&&rp.department?rp.department:''].filter(Boolean).join(' · ');
    if(q('#studentRoleSummary'))q('#studentRoleSummary').innerHTML=`<div><b>현재 역할</b><div class="role-chip-row">${chips||'<span class="muted">역할 미설정</span>'}</div>${extra?`<small>${esc20(extra)}</small>`:''}</div><div><b>활성 기능</b><span>${features.map(esc20).join(' · ')||'기본 기능'}</span></div>`;
    if(q('#roleDashboardText'))q('#roleDashboardText').innerHTML=`<div class="role-chip-row">${chips||'<span class="muted">올해 역할을 설정하세요.</span>'}</div><small>${esc20(extra||features.slice(0,5).join(' · '))}</small>`;
  }

  function recordKinds(y=y20()){
    const out=['상담 참고'];
    if(hasRole('homeroom',y))out.push('담임관찰','자율자치활동','진로활동','동아리·창체');
    if(hasRole('subject',y))out.push('교과관찰','수업·평가관찰');
    if(hasRole('violence',y))out.push('학교폭력 업무기록');
    if(hasRole('guidance',y)||hasRole('homeroom',y))out.push('생활지도');
    return [...new Set(out)];
  }
  function renderKindOptions(){const sel=q('#srRecordKind');if(!sel)return;const old=sel.value;sel.innerHTML=recordKinds().map(k=>`<option>${k}</option>`).join('');if([...sel.options].some(o=>o.value===old))sel.value=old;syncEvidenceBox()}
  function syncEvidenceBox(){const kind=q('#srRecordKind')?.value||'',eligible=EVIDENCE_KINDS.has(kind);if(q('#srEvidenceBox'))q('#srEvidenceBox').hidden=!eligible;if(eligible&&q('#srRecordArea'))q('#srRecordArea').value=kindArea(kind)}

  function sortedStudents(y=y20()){return [...(y?.students||[])].sort((a,b)=>Number(a.grade)-Number(b.grade)||Number(a.classNo)-Number(b.classNo)||Number(a.number)-Number(b.number)||String(a.name).localeCompare(String(b.name),'ko'))}
  function renderRoster(){
    const y=y20();if(!y)return;const list=sortedStudents(y);if(!selectedStudentId&&list.length)selectedStudentId=list[0].id;if(selectedStudentId&&!studentById(selectedStudentId,y))selectedStudentId=list[0]?.id||'';
    q('#srStudentCount').textContent=`${list.length}명`;q('#srStudentList').innerHTML=list.length?list.map(s=>`<button type="button" class="sr-student ${s.id===selectedStudentId?'active':''}" data-student-id="${s.id}"><span>${esc20(s.name)}</span><small>${esc20(`${s.grade||'-'}-${s.classNo||'-'} ${s.number?`${s.number}번`:''}`)}</small></button>`).join(''):'<div class="empty">명렬표를 가져오거나 학생을 추가하세요.</div>';
    renderStudentDetail();
  }
  function addStudent(){const y=y20();if(!y)return;const name=q('#srStudentName').value.trim();if(!name)return;const s={id:id20(),name,grade:q('#srStudentGrade').value.trim(),classNo:q('#srStudentClass').value.trim(),number:q('#srStudentNo').value.trim()};if(!y.students.some(x=>x.name===s.name&&String(x.grade)===String(s.grade)&&String(x.classNo)===String(s.classNo)&&String(x.number)===String(s.number)))y.students.push(s);selectedStudentId=s.id;q('#srStudentName').value='';q('#srStudentNo').value='';save20(false);renderRoster()}
  function findHeader(rows){for(let i=0;i<Math.min(rows.length,12);i++){const row=rows[i].map(x=>String(x||'').trim());const hasName=row.some(x=>/^(이름|성명|학생명)$/.test(x));if(hasName)return i}return-1}
  async function importRoster(file){
    const y=y20();if(!y||!file)return;let rows=[];const ext=file.name.split('.').pop().toLowerCase();
    try{
      if(['xlsx','xls','csv'].includes(ext)&&globalThis.XLSX){const data=ext==='csv'?await file.text():await file.arrayBuffer(),wb=XLSX.read(data,{type:ext==='csv'?'string':'array',cellDates:false});wb.SheetNames.some(n=>{const r=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:''});if(r.length>rows.length)rows=r;return false})}
      else if(ext==='txt')rows=(await file.text()).split(/\r?\n/).map(line=>line.split(/[\t,]/));
      const hi=findHeader(rows);if(hi<0)throw new Error('이름/성명 열을 찾지 못했습니다.');const head=rows[hi].map(x=>String(x||'').trim());
      const idx=re=>head.findIndex(x=>re.test(x)),ni=idx(/^(이름|성명|학생명)$/),gi=idx(/학년/),ci=idx(/^(반|학급)$/),noi=idx(/번호|번$/);let added=0;
      rows.slice(hi+1).forEach(r=>{const name=String(r[ni]||'').trim();if(!name||name.length>20)return;const s={id:id20(),name,grade:gi>=0?String(r[gi]||'').replace(/\D/g,''):y.roleProfile.homeroomGrade||'',classNo:ci>=0?String(r[ci]||'').replace(/\D/g,''):y.roleProfile.homeroomClass||'',number:noi>=0?String(r[noi]||'').replace(/\D/g,''):''};if(!y.students.some(x=>x.name===s.name&&String(x.grade)===String(s.grade)&&String(x.classNo)===String(s.classNo)&&String(x.number)===String(s.number))){y.students.push(s);added++}});
      save20(false);renderRoster();alert(`${added}명의 학생을 가져왔습니다. 학생 정보는 이 브라우저에만 저장됩니다.`)
    }catch(err){alert('명렬표 가져오기 실패: '+(err?.message||err))}
  }

  function recordsForStudent(id,y=y20()){return (y?.studentRecords||[]).filter(r=>r.studentId===id)}
  function consultsForStudent(id,y=y20()){return (y?.consultations||[]).filter(r=>r.studentId===id)}
  function evidenceForStudent(id,y=y20()){return recordsForStudent(id,y).filter(r=>r.eligible===true&&EVIDENCE_KINDS.has(r.kind)&&!SENSITIVE_RE.test(r.text||''))}
  function renderStudentDetail(){
    const y=y20(),s=studentById(selectedStudentId,y);if(!q('#srTimeline'))return;
    q('#srSelectedTitle').textContent=s?studentLabel(s):'학생을 선택하세요';const evidence=s?evidenceForStudent(s.id,y):[];q('#srEvidenceCount').textContent=`근거 ${evidence.length}`;
    if(!s){q('#srTimeline').innerHTML='<div class="empty">학생을 선택하세요.</div>';renderDraftButtons();return}
    const items=[...recordsForStudent(s.id,y).map(r=>({...r,_type:'record'})),...consultsForStudent(s.id,y).map(r=>({...r,_type:'consult'}))].sort((a,b)=>(b.date||'').localeCompare(a.date||'')||String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    q('#srTimeline').innerHTML=items.length?items.map(x=>x._type==='consult'?`<div class="sr-time-item is-consult"><div class="sr-time-meta"><span class="pill">상담</span><b>${esc20(x.date||'')}</b><span>${esc20(x.party||'')}</span></div><p>${esc20(x.summary||'')}</p>${x.followUp?`<small>후속: ${esc20(x.followUp)}</small>`:''}<div class="sr-time-foot"><span>생기부 자동 제외</span><button class="linkbtn danger-text" data-consult-del="${x.id}">삭제</button></div></div>`:`<div class="sr-time-item ${x.eligible?'is-evidence':''}"><div class="sr-time-meta"><span class="pill">${esc20(x.kind)}</span><b>${esc20(x.date||'')}</b>${x.eligible?`<span class="sr-evidence-mark">${esc20(areaLabel(x.area))} 근거</span>`:'<span>참고 기록</span>'}</div><p>${esc20(x.text||'')}</p><div class="sr-time-foot"><span>${esc20(x.source||'교사 직접 입력')}</span><button class="linkbtn danger-text" data-record-del="${x.id}">삭제</button></div></div>`).join(''):'<div class="empty">아직 기록이 없습니다.</div>';
    renderDraftButtons();
  }
  function saveRecord(){
    const y=y20(),s=studentById(selectedStudentId,y);if(!s){alert('학생을 먼저 선택하세요.');return}const text=q('#srRecordText').value.trim();if(!text)return;const kind=q('#srRecordKind').value,date=q('#srRecordDate').value||date20(),eligible=EVIDENCE_KINDS.has(kind)&&q('#srUseEvidence').checked,area=eligible?q('#srRecordArea').value:'reference';
    y.studentRecords.push({id:id20(),studentId:s.id,date,kind,text,eligible,area,source:'교사 직접 관찰',createdAt:new Date().toISOString()});q('#srRecordText').value='';save20(false);renderStudentDetail();
  }

  function sentenceSplit(text){return String(text||'').replace(/\s+/g,' ').split(/(?<=[.!?]|다\.|요\.)\s+|\n+/).map(x=>x.trim()).filter(x=>x.length>=6)}
  function summarizeTranscript(text){
    const sents=sentenceSplit(text);const cues=/(학교|수업|친구|교우|관계|학급|공부|과제|출결|지각|결석|진로|걱정|어려움|갈등|요청|희망|상담|확인|약속|하기로|필요)/;
    const selected=[...sents.filter(s=>cues.test(s)),...sents].filter((s,i,a)=>a.indexOf(s)===i).slice(0,5);return selected.join(' ').slice(0,700)
  }
  function inferFollowup(text){const s=sentenceSplit(text).filter(x=>/(다음|추후|확인|하기로|연락|관찰|안내|상담|면담|조치)/.test(x));return s.slice(-2).join(' ').slice(0,250)}
  async function audioTo16k(file){
    const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)throw new Error('이 브라우저는 음성 디코딩을 지원하지 않습니다.');const ac=new AC();try{const ab=await file.arrayBuffer(),decoded=await ac.decodeAudioData(ab.slice(0)),frames=Math.max(1,Math.ceil(decoded.duration*16000)),offline=new OfflineAudioContext(1,frames,16000),src=offline.createBufferSource();src.buffer=decoded;src.connect(offline.destination);src.start(0);const rendered=await offline.startRendering();return new Float32Array(rendered.getChannelData(0))}finally{await ac.close().catch(()=>{})}
  }
  async function getTranscriber(){
    if(!transcriberPromise)transcriberPromise=(async()=>{const mod=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0');if(mod.env){mod.env.allowLocalModels=false;mod.env.useBrowserCache=true}return mod.pipeline('automatic-speech-recognition','Xenova/whisper-tiny')})();return transcriberPromise
  }
  async function transcribeAudio(){
    const file=q('#srAudioFile').files?.[0],status=q('#srAudioStatus');if(!file){alert('녹음파일을 선택하세요.');return}const btn=q('#srTranscribe');btn.disabled=true;try{status.textContent='처음 한 번은 음성모델을 내려받습니다. 녹음파일은 외부로 업로드하지 않습니다.';const [pipe,audio]=await Promise.all([getTranscriber(),audioTo16k(file)]);status.textContent='한국어 음성을 기기에서 분석 중...';const result=await pipe(audio,{language:'korean',task:'transcribe',chunk_length_s:30,stride_length_s:5});currentTranscript=String(result?.text||'').trim();q('#srTranscript').value=currentTranscript;if(!currentTranscript)throw new Error('음성을 텍스트로 변환하지 못했습니다.');status.textContent='음성 변환 완료. 요약 후 저장하면 원본 음성과 전체 녹취는 저장되지 않습니다.'}catch(err){status.textContent='음성 분석 실패: '+(err?.message||err)+' · 아래 칸에 녹취를 직접 붙여넣어도 상담기록을 만들 수 있습니다.'}finally{btn.disabled=false}
  }
  function makeCounselSummary(){const text=q('#srTranscript').value.trim();if(!text)return;currentTranscript=text;q('#srCounselSummary').value=summarizeTranscript(text);if(!q('#srCounselFollow').value)q('#srCounselFollow').value=inferFollowup(text);if(SENSITIVE_RE.test(text))q('#srAudioStatus').textContent='민감정보로 보이는 표현이 있습니다. 상담요약에는 필요한 최소 내용만 남기세요.'}
  function saveCounsel(){
    const y=y20(),s=studentById(selectedStudentId,y);if(!s){alert('학생을 먼저 선택하세요.');return}const summary=q('#srCounselSummary').value.trim();if(!summary)return;const item={id:id20(),studentId:s.id,date:q('#srCounselDate').value||date20(),party:q('#srCounselParty').value,summary,followUp:q('#srCounselFollow').value.trim(),source:q('#srAudioFile').files?.[0]?'전화 녹음 요약':'상담 메모',sensitive:true,createdAt:new Date().toISOString()};y.consultations.push(item);q('#srTranscript').value='';q('#srCounselSummary').value='';q('#srCounselFollow').value='';q('#srAudioFile').value='';currentTranscript='';q('#srAudioStatus').textContent='상담요약만 저장했습니다. 음성파일과 전체 녹취는 저장하지 않았습니다.';save20(false);renderStudentDetail();
  }

  function draftButtons(){const y=y20(),buttons=[];if(canDraft('behavior',y))buttons.push(['behavior','행동특성·종합의견']);if(canDraft('autonomy',y))buttons.push(['autonomy','자율·자치']);if(canDraft('career',y))buttons.push(['career','진로']);if(canDraft('subject',y))buttons.push(['subject',`${(y.subjects||['교과'])[0]} 과세특`]);return buttons}
  function renderDraftButtons(){const box=q('#srDraftButtons');if(!box)return;const b=draftButtons();box.innerHTML=b.length?b.map(([a,t])=>`<button type="button" class="btn secondary" data-draft-area="${a}">${esc20(t)}</button>`).join(''):'<div class="empty">현재 선택한 역할에는 생활기록부 서술형 초안 생성 권한을 연결하지 않았습니다. 상담·사안·업무 기록은 계속 사용할 수 있습니다.</div>'}
  function buildDraft(area){
    const y=y20(),s=studentById(selectedStudentId,y);if(!s)return;if(!canDraft(area,y)){q('#srDraftText').value='현재 역할에서는 이 항목의 초안을 생성하지 않습니다.';return}const ev=evidenceForStudent(s.id,y).filter(r=>r.area===area);if(!ev.length){q('#srDraftText').value='직접 관찰한 근거가 아직 없습니다. 관찰·활동 기록을 먼저 누적하세요.';q('#srDraftEvidence').innerHTML='';return}
    const facts=ev.slice(-8).map(r=>r.text.replace(/[.!?]+$/,'').trim()).filter(Boolean);let text='';
    if(area==='behavior')text=facts.map((x,i)=>i===facts.length-1?`${x}하는 등 학교생활에서의 성장과 발전 가능성이 관찰됨.`:`${x}.`).join(' ');
    else if(area==='autonomy')text=facts.map((x,i)=>i===facts.length-1?`${x}하며 자율적이고 협력적으로 활동함.`:`${x}.`).join(' ');
    else if(area==='career')text=facts.map((x,i)=>i===facts.length-1?`${x}하며 자신의 진로를 탐색하고 구체화함.`:`${x}.`).join(' ');
    else text=facts.map((x,i)=>i===facts.length-1?`${x}하며 학습활동에 참여함.`:`${x}.`).join(' ');
    q('#srDraftText').value=text.replace(/\.\s*\./g,'.').slice(0,1600);q('#srDraftEvidence').innerHTML=`<b>사용한 근거 ${ev.length}개</b>${ev.map(r=>`<span>${esc20(r.date)} · ${esc20(r.kind)} · ${esc20(r.text)}</span>`).join('')}`;
    y.studentDrafts[s.id]=y.studentDrafts[s.id]||{};y.studentDrafts[s.id][area]={text:q('#srDraftText').value,evidenceIds:ev.map(x=>x.id),updatedAt:new Date().toISOString()};save20(false)
  }

  function render20(){
    ensure20();ensureUI();renderRole();renderKindOptions();renderRoster();
    const y=y20();if(y){const rp=y.roleProfile||{};if(hasRole('homeroom',y)){if(!q('#srStudentGrade').value)q('#srStudentGrade').value=rp.homeroomGrade||'';if(!q('#srStudentClass').value)q('#srStudentClass').value=rp.homeroomClass||''}}
    if(q('#srRecordDate')&&!q('#srRecordDate').value)q('#srRecordDate').value=date20();if(q('#srCounselDate')&&!q('#srCounselDate').value)q('#srCounselDate').value=date20();
  }

  function bind(){
    document.body.addEventListener('click',e=>{
      if(e.target.closest('#roleSetupBtn,#roleDashEdit,#studentRoleBtn')){openRoleDialog();return}
      const s=e.target.closest('[data-student-id]');if(s){selectedStudentId=s.dataset.studentId;renderRoster();return}
      const rd=e.target.closest('[data-record-del]');if(rd){const y=y20();y.studentRecords=(y.studentRecords||[]).filter(x=>x.id!==rd.dataset.recordDel);save20(false);renderStudentDetail();return}
      const cd=e.target.closest('[data-consult-del]');if(cd){const y=y20();y.consultations=(y.consultations||[]).filter(x=>x.id!==cd.dataset.consultDel);save20(false);renderStudentDetail();return}
      const db=e.target.closest('[data-draft-area]');if(db){buildDraft(db.dataset.draftArea);return}
      if(e.target.closest('[data-role-close]'))q('#roleDlg')?.close();
    });
    q('#roleForm')?.addEventListener('submit',saveRoles);q('#roleChoices')?.addEventListener('change',toggleRoleExtras);
    q('#srRecordKind')?.addEventListener('change',syncEvidenceBox);q('#srAddStudent')?.addEventListener('click',addStudent);q('#srSaveRecord')?.addEventListener('click',saveRecord);
    q('#srRosterFile')?.addEventListener('change',e=>e.target.files?.[0]&&importRoster(e.target.files[0]));q('#srTranscribe')?.addEventListener('click',transcribeAudio);q('#srSummarize')?.addEventListener('click',makeCounselSummary);q('#srSaveCounsel')?.addEventListener('click',saveCounsel);
  }

  ensure20();ensureUI();bind();render20();
  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='studentrecords'){qa('.view').forEach(x=>x.classList.toggle('active',x.id==='studentrecords'));qa('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='studentrecords'));if(q('#title'))q('#title').textContent='학생 기록';render20()}return r};
  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(render20,0);return r};
})();
