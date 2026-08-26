(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TeacherOSRecordQuality=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const SENSITIVE_RE=/(질병|진단|약물|정신|우울|자해|가정폭력|이혼|경제사정|기초생활|성폭력|성적지향|종교|장애|주민등록|전화번호)/;
  const DIRECT_PII_RE=/(?:\b01[016789][- .]?\d{3,4}[- .]?\d{4}\b|\b\d{6}[- ]?[1-4]\d{6}\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)/i;
  const PROHIBITED_RE=/(공인\s*어학|토익|토플|텝스|교외\s*(?:대회|수상)|전국\s*(?:대회|수상)|모의고사|전국연합학력평가|소논문|연구보고서|논문\s*게재|인증시험)/;
  const PRAISE_RE=/(천재|최고의|압도적|완벽한|탁월한|매우\s*우수한|누구보다|독보적)/;
  const ACTION_RE=/(참여|발표|설명|분석|비교|탐구|연습|수행|제작|협력|질문|적용|표현|작성|조정|해결|선택|기획|준비|관찰|토의|토론|연주|창작|실험|조사|정리|피드백)/;
  const GROWTH_RE=/(이후|최근|점차|향상|변화|성장|개선|확장|심화|발전|보완|스스로|자기주도)/;
  const PROCESS_RE=/(과정|활동|수업|평가|역할|시도|노력|문제|해결|협력|책임|탐구|참여)/;
  const ALLOWED_EVIDENCE_KINDS=new Set(['담임관찰','교과관찰','자율자치활동','진로활동','동아리·창체','수업·평가관찰']);
  const STOP=new Set('학생 학교 수업 활동 과정 모습 관찰 평가 위와 같은 통해 관련 대한 해당 또한 이후 최근 있으며 함 됨 보임 중심 바탕 내용 기록 경우 정도'.split(' '));
  const PARTICLE_SUFFIXES=['으로','에서','에게','을','를','이','가','은','는','에','의','와','과','로','도','만','며','고','함','됨'];
  const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
  function clean(s){return String(s||'').replace(/\s+/g,' ').trim()}
  function sensitiveText(s){const text=String(s||'');return SENSITIVE_RE.test(text)||DIRECT_PII_RE.test(text)}
  function sentences(text){return String(text||'').replace(/\r/g,'').split(/\n+|(?<=[.!?])\s+/).map(clean).filter(x=>x.length>=5)}
  function normalizeToken(token){const x=String(token||'');for(const suffix of PARTICLE_SUFFIXES){if(!x.endsWith(suffix))continue;const base=x.slice(0,-suffix.length);if(base.length>=2)return base}return x}
  function tokens(text){return clean(text).replace(/[^가-힣A-Za-z0-9\s]/g,' ').split(/\s+/).map(normalizeToken).filter(x=>x.length>=2&&!STOP.has(x))}
  function overlapCount(a,b){const B=new Set(tokens(b));return [...new Set(tokens(a))].filter(x=>B.has(x)).length}
  function uniqueDates(rows){return [...new Set((rows||[]).map(x=>x.date).filter(Boolean))].sort()}
  function repeatedPhrases(text){const s=clean(text);const chunks=[];for(let i=0;i<=s.length-12;i+=4){const c=s.slice(i,i+12);if(!/\s/.test(c[0]||''))chunks.push(c)}const count=new Map();chunks.forEach(c=>count.set(c,(count.get(c)||0)+1));return [...count.entries()].filter(([,n])=>n>=2).map(([c])=>c).slice(0,4)}
  function usableEvidence(rows,area=''){
    return (Array.isArray(rows)?rows:[]).filter(x=>{
      if(!x||x.eligible===false)return false;
      if(x.area&&area&&x.area!==area)return false;
      if(x.kind&&!ALLOWED_EVIDENCE_KINDS.has(x.kind))return false;
      if(sensitiveText(x.text))return false;
      return !!clean(x.text);
    });
  }
  function grounding(text,evidence){
    const ev=(evidence||[]).map(x=>clean(x.text)).filter(Boolean),ss=sentences(text);if(!ev.length)return{score:0,unsupported:ss,ratio:0};
    let supported=0;const unsupported=[];
    ss.forEach(s=>{const ts=tokens(s),best=Math.max(0,...ev.map(e=>overlapCount(s,e))),need=ts.length>=8?2:1;if(ts.length>0&&best>=need){supported++;return}unsupported.push(s)});
    const ratio=ss.length?supported/ss.length:0;return{score:Math.round(ratio*35),unsupported,ratio};
  }
  function analyzeDraft(input={}){
    const rawText=String(input.text||'').replace(/\r/g,''),text=clean(rawText),area=input.area||'subject',evidence=usableEvidence(input.evidence,area),issues=[],strengths=[];
    if(!text)return{score:0,level:'검사 필요',critical:true,issues:[{severity:'critical',code:'EMPTY',message:'검사할 초안이 없습니다.'}],strengths:[],dimensions:{grounding:0,specificity:0,growth:0,process:0,clarity:0,safety:0},unsupportedSentences:[]};
    const draftSentences=sentences(rawText),g=grounding(rawText,evidence);if(!evidence.length)issues.push({severity:'critical',code:'NO_EVIDENCE',message:'연결된 직접 관찰 근거가 없습니다.'});else if(g.unsupported.length)issues.push({severity:'warn',code:'UNSUPPORTED',message:`근거 연결이 약한 문장 ${g.unsupported.length}개가 있습니다.`});else strengths.push('모든 문장이 선택된 관찰근거와 연결됩니다.');
    let specificity=0;if(text.length>=55)specificity+=5;if(ACTION_RE.test(text))specificity+=6;if(/구체|예를|\d|교시|모둠|발표|연주|작품|과제|질문|역할/.test(text))specificity+=4;specificity=Math.min(15,specificity);if(specificity<9)issues.push({severity:'info',code:'SPECIFICITY',message:'관찰한 행동·과정이 더 구체적으로 드러나면 좋습니다.'});else strengths.push('구체적인 활동·행동 단서가 포함되어 있습니다.');
    const dates=uniqueDates(evidence);let growth=0;if(dates.length>=2)growth+=8;if(GROWTH_RE.test(text))growth+=7;growth=Math.min(15,growth);if(dates.length>=2&&growth>=12)strengths.push('여러 시점의 근거와 변화·성장 흐름이 연결됩니다.');else if(dates.length>=2)issues.push({severity:'info',code:'GROWTH',message:'여러 시점의 근거가 있으므로 변화·성장 흐름을 더 명료하게 연결할 수 있습니다.'});
    let process=0;if(PROCESS_RE.test(text))process+=7;if(ACTION_RE.test(text))process+=5;if(area==='subject'&&/(성취|이해|적용|분석|표현|탐구|문제해결|수행)/.test(text))process+=3;else if(area!=='subject'&&/(협력|책임|참여|역할|자기주도|탐색)/.test(text))process+=3;process=Math.min(15,process);if(process<9)issues.push({severity:'info',code:'PROCESS',message:'결과보다 참여 과정·노력·역할이 더 드러나는지 확인하세요.'});else strengths.push('과정·참여·역할 중심의 표현이 확인됩니다.');
    const reps=repeatedPhrases(text);let clarity=10;if(text.length>1500)clarity-=2;if(reps.length)clarity-=Math.min(4,reps.length);if(draftSentences.some(s=>s.length>220))clarity-=2;clarity=Math.max(3,clarity);if(reps.length)issues.push({severity:'info',code:'REPEAT',message:'반복되는 표현이 있어 문장을 압축할 수 있습니다.'});
    let safety=10,critical=!evidence.length;if(sensitiveText(text)){safety=0;critical=true;issues.push({severity:'critical',code:'SENSITIVE',message:'민감정보로 볼 수 있는 표현이 감지되었습니다. 공식 기록 사용 전 반드시 제거·확인하세요.'})}if(PROHIBITED_RE.test(text)){safety=0;critical=true;issues.push({severity:'critical',code:'PROHIBITED',message:'학교생활기록부 기재 제한 가능성이 높은 외부실적·시험·논문 관련 표현이 감지되었습니다.'})}if(PRAISE_RE.test(text)){safety=Math.min(safety,6);issues.push({severity:'warn',code:'PRAISE',message:'관찰 사실보다 과도한 평가·칭찬으로 읽힐 수 있는 표현이 있습니다.'})}
    if(!critical&&safety===10)strengths.push('민감정보·대표적 기재 제한 위험 표현이 감지되지 않았습니다.');
    const dimensions={grounding:g.score,specificity,growth,process,clarity,safety};const score=clamp(g.score+specificity+growth+process+clarity+safety);const level=critical?'최종 사용 금지':score>=88?'매우 안정':score>=78?'안정':score>=65?'보완 권장':'검토 필요';
    return{score,level,critical,issues,strengths:[...new Set(strengths)],dimensions,unsupportedSentences:g.unsupported,evidenceCount:evidence.length,dateCount:dates.length};
  }
  return{analyzeDraft,tokens,grounding,usableEvidence,sensitiveText,SENSITIVE_RE,DIRECT_PII_RE,PROHIBITED_RE,PRAISE_RE};
});