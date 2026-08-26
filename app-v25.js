(function(){
  const R=globalThis.TeacherOSRecordQuality;if(!R)return;
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const SUBJECT_NEIS_LIMIT25=1500;
  let library=null,lastResult=null,lastSignature='';
  function y(){return typeof cur==='function'?cur():null}
  function sid(){return q('#srStudentList .sr-student.active')?.dataset?.studentId||q('#srStudentList [data-student-id].active')?.dataset?.studentId||''}
  function area(){return q('[data-v21-area].active')?.dataset?.v21Area||''}
  function selectedText(){const k=q('[data-v21-card].selected')?.dataset?.v21Card;return k?q(`[data-v21-text="${k}"]`)?.value.trim()||'':''}
  function evidenceIds(){return (q('#v21DraftGrid')?.dataset?.evidenceIds||'').split(',').filter(Boolean)}
  function evidenceRows(){const yy=y(),id=sid(),ids=new Set(evidenceIds());return (yy?.studentRecords||[]).filter(r=>r.studentId===id&&ids.has(r.id))}
  function input25(){return{text:selectedText(),area:area(),evidence:evidenceRows()}}
  function neisBytes25(text){const s=String(text||'').replace(/\r\n?/g,'\n');if(globalThis.TextEncoder)return new TextEncoder().encode(s).length;let n=0;for(const ch of s){const cp=ch.codePointAt(0);n+=cp<=0x7f?1:cp<=0x7ff?2:cp<=0xffff?3:4}return n}
  function analyze25(input){const res=R.analyzeDraft(input),bytes=neisBytes25(input?.text||''),limit=input?.area==='subject'?SUBJECT_NEIS_LIMIT25:null;res.neisBytes=bytes;res.neisLimit=limit;if(limit&&bytes>limit&&!res.issues.some(x=>x.code==='NEIS_LIMIT')){const oldSafety=Number(res.dimensions?.safety)||0;if(res.dimensions)res.dimensions.safety=0;res.score=Math.max(0,(Number(res.score)||0)-oldSafety);res.critical=true;res.level='최종 사용 금지';res.issues.push({severity:'critical',code:'NEIS_LIMIT',message:`NEIS 환산 ${bytes}Byte로 과목별 세부능력 및 특기사항 최대 ${limit}Byte를 초과합니다.`})}else if(limit&&!res.strengths.some(x=>String(x).startsWith('NEIS 환산 ')))res.strengths.push(`NEIS 환산 ${bytes}/${limit}Byte 범위 안입니다.`);return res}
  function signature25(input=input25()){return JSON.stringify({text:String(input.text||''),area:String(input.area||''),evidence:(input.evidence||[]).map(r=>[r.id||'',r.date||'',r.area||'',r.kind||'',r.eligible===true,String(r.text||'')])})}
  function draft25(){const yy=y(),id=sid(),a=area();return yy&&id&&a?yy.studentDrafts?.[id]?.[a]:null}
  function invalidateSnapshot25(){lastResult=null;lastSignature='';const d=draft25();if(d?.qualityCheck)delete d.qualityCheck}
  function saveMain25(){globalThis.TeacherOSStorage.writeJSON(KEY,state)}
  async function loadLibrary(){if(library)return library;try{const r=await fetch('./school-record-quality-library.json?v='+Date.now(),{cache:'no-store'});if(r.ok)library=await r.json()}catch{}return library}
  function ensureUI(){
    const studio=q('#srDraftStudio');if(!studio||q('#v25QualityPanel'))return;
    studio.insertAdjacentHTML('beforeend',`<section id="v25QualityPanel" class="v25-quality-panel">
      <div class="v25-head"><div><span class="kicker">QUALITY GATE</span><h3>근거·기재기준 품질검사</h3><p class="muted">교육부 기재 기준을 우선 적용하고 대학 공개 평가관점은 보조 참고로만 사용합니다. 입시 가능성을 점수화하지 않습니다.</p></div><div class="v25-score" id="v25Score"><b>-</b><span>점검 전</span></div></div>
      <div class="v25-actions"><button class="btn primary" type="button" id="v25Run">현재 초안 품질검사</button><button class="btn secondary" type="button" id="v25Sources">공식 기준 보기</button><span class="mini" id="v25CheckedAt"></span></div>
      <div id="v25Dimensions" class="v25-dimensions"></div>
      <div class="v25-grid"><div><h4>검사 결과</h4><div id="v25Issues" class="v25-list"><div class="empty">초안을 선택한 뒤 품질검사를 실행하세요.</div></div></div><div><h4>잘 된 점</h4><div id="v25Strengths" class="v25-list"><div class="empty">검사 후 표시됩니다.</div></div></div></div>
      <div id="v25Unsupported" class="v25-unsupported" hidden></div>
      <div class="v25-note">이 점수는 <b>합격 가능성 점수</b>가 아니라 Teacher OS 내부의 <b>근거 연결·구체성·과정·성장·문장 안정성 점검값</b>입니다.</div>
    </section>`);
    if(!q('#v25SourceDlg'))document.body.insertAdjacentHTML('beforeend',`<dialog id="v25SourceDlg"><div class="modal v25-source-modal"><div class="modal-head"><div><span class="kicker">OFFICIAL SOURCES</span><h2>학생부 품질 기준 라이브러리</h2></div><button class="close" type="button" id="v25SourceClose">×</button></div><div class="notice"><b>적용 순서:</b> 교육부·학교생활기록부 공식 기준 → Teacher OS 근거검증 → 대학 공개 평가관점 참고. 대학 자료는 학생부 기재 규칙이 아닙니다.</div><div id="v25SourceList" class="v25-source-list spaced"></div></div></dialog>`);
  }
  const DIM_LABEL={grounding:'근거 연결',specificity:'구체성',growth:'변화·성장',process:'과정·역할',clarity:'문장 안정',safety:'기재 안전'};
  const DIM_MAX={grounding:35,specificity:15,growth:15,process:15,clarity:10,safety:10};
  function renderResult(res){
    lastResult=res;
    const score=q('#v25Score');if(score){score.innerHTML=`<b>${res.score}</b><span>${esc(res.level)}</span>`;score.className='v25-score '+(res.critical?'danger':res.score>=88?'good':res.score>=78?'ok':'warn')}
    const dims=q('#v25Dimensions');if(dims)dims.innerHTML=Object.entries(res.dimensions).map(([k,v])=>`<div class="v25-dim"><span>${DIM_LABEL[k]}</span><b>${v}/${DIM_MAX[k]}</b><meter min="0" max="${DIM_MAX[k]}" value="${v}"></meter></div>`).join('');
    const issues=q('#v25Issues');if(issues)issues.innerHTML=res.issues.length?res.issues.map(x=>`<div class="v25-item ${x.severity}"><b>${x.severity==='critical'?'필수 확인':x.severity==='warn'?'주의':'보완'}</b><span>${esc(x.message)}</span></div>`).join(''):'<div class="v25-item good"><b>통과</b><span>현재 규칙에서 별도 보완 경고가 없습니다.</span></div>';
    const strengths=q('#v25Strengths');if(strengths)strengths.innerHTML=res.strengths.length?res.strengths.map(x=>`<div class="v25-item good"><b>확인</b><span>${esc(x)}</span></div>`).join(''):'<div class="empty">확인된 강점이 아직 없습니다.</div>';
    const unsupported=q('#v25Unsupported');if(unsupported){
      unsupported.hidden=!res.unsupportedSentences?.length;
      unsupported.innerHTML=res.unsupportedSentences?.length?`<b>근거 연결이 약한 문장</b>${res.unsupportedSentences.map(x=>`<div>${esc(x)}</div>`).join('')}`:'';
    }
    const at=q('#v25CheckedAt');if(at){const byteText=res.neisLimit?` · NEIS ${res.neisBytes}/${res.neisLimit}Byte`:'';at.textContent='마지막 검사 '+new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})+byteText}
  }
  function run(){ensureUI();const input=input25();if(!input.text)return alert('A/B/C 초안 중 하나를 먼저 선택하세요.');const res=analyze25(input);lastSignature=signature25(input);renderResult(res);saveSnapshot(res,lastSignature);return res}
  function saveSnapshot(res,signature=lastSignature){const d=draft25();if(!d)return;const input=input25(),current=signature25(input);if(!res||!signature||signature!==current){if(!input.text){invalidateSnapshot25();return}res=analyze25(input);lastResult=res;lastSignature=current;renderResult(res)}d.qualityCheck={score:res.score,level:res.level,critical:res.critical,issueCodes:res.issues.map(x=>x.code),evidenceCount:res.evidenceCount,checkedAt:new Date().toISOString(),inputSignature:lastSignature,neisBytes:res.neisBytes,neisLimit:res.neisLimit};saveMain25()}
  async function showSources(){
    ensureUI();await loadLibrary();const box=q('#v25SourceList');
    if(box){
      if(library?.sources?.length){
        box.innerHTML=library.sources.map(s=>{
          const type=s.authority==='rule'?'공식 기재기준':s.authority==='rule-interpretation'?'공식 해석':'참고 관점';
          const blue=s.authority==='rule'?'blue':'';
          return `<article class="v25-source"><div class="v25-source-top"><span class="pill ${blue}">${type}</span><b>${esc(s.publisher)}</b></div><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a><div class="mini">${(s.criteria||[]).map(esc).join(' · ')}</div></article>`;
        }).join('');
      }else box.innerHTML='<div class="empty">기준 라이브러리를 불러오지 못했습니다.</div>';
    }
    q('#v25SourceDlg')?.showModal();
  }
  function reset(){ensureUI();lastResult=null;lastSignature='';const s=q('#v25Score');if(s){s.className='v25-score';s.innerHTML='<b>-</b><span>점검 전</span>'}q('#v25Dimensions')&&(q('#v25Dimensions').innerHTML='');q('#v25Issues')&&(q('#v25Issues').innerHTML='<div class="empty">초안을 선택한 뒤 품질검사를 실행하세요.</div>');q('#v25Strengths')&&(q('#v25Strengths').innerHTML='<div class="empty">검사 후 표시됩니다.</div>');q('#v25Unsupported')&&(q('#v25Unsupported').hidden=true)}
  function bind(){document.body.addEventListener('click',e=>{if(e.target.closest('#v25Run')){run();return}if(e.target.closest('#v25Sources')){showSources();return}if(e.target.closest('#v25SourceClose')){q('#v25SourceDlg')?.close();return}if(e.target.closest('[data-v21-select]'))setTimeout(()=>{reset();run()},0);if(e.target.closest('[data-v21-area]')||e.target.closest('[data-student-id]'))setTimeout(reset,0);if(e.target.closest('#v21SaveDraft'))setTimeout(()=>{const input=input25();if(input.text)saveSnapshot(lastResult,lastSignature)},0)});document.body.addEventListener('input',e=>{if(e.target.matches('.v21-draft-text')&&e.target.closest('[data-v21-card].selected')){invalidateSnapshot25();reset();clearTimeout(e.target._v25t);e.target._v25t=setTimeout(run,500)}})}
  function boot(){ensureUI();bind();loadLibrary();const foot=q('.side-foot');if(foot)foot.textContent='v0.25 · grounded school-record quality gate'}
  setTimeout(boot,0);const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(ensureUI,0);return r};const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='studentrecords')setTimeout(ensureUI,0);return r};
})();
