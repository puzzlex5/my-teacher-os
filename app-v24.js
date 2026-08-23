(function(){
  const q=s=>document.querySelector(s);
  const DEVICE_KEY='myTeacherOS.deviceProfile.v1';
  const blankAtBoot=!!globalThis.state&&!state.currentYear&&Object.keys(state.years||{}).length===0;
  let firstYearPending=blankAtBoot;

  function readDevice(){try{const x=JSON.parse(localStorage.getItem(DEVICE_KEY)||'null');return x&&typeof x==='object'?x:{}}catch{return{}}}
  function saveDevice(x){localStorage.setItem(DEVICE_KEY,JSON.stringify({...readDevice(),...x,updatedAt:new Date().toISOString()}))}
  function currentSubject(){const y=typeof cur==='function'?cur():null;return String(y?.subjects?.[0]||state?.profile?.major||readDevice().subject||'').trim()}

  function ensureSubjectField(){
    const form=q('#yearForm');if(!form||q('#ySubject'))return;
    const actions=form.querySelector('.modal-actions');
    const html='<label class="v24-subject-field">담당 교과<input class="field" id="ySubject" required placeholder="예: 음악, 국어, 수학, 체육"></label>';
    if(actions)actions.insertAdjacentHTML('beforebegin',html);else form.insertAdjacentHTML('beforeend',html);
  }
  function fillSubject(){ensureSubjectField();const el=q('#ySubject');if(el)el.value=currentSubject()}

  function wrapYearForm(){
    ensureSubjectField();const form=q('#yearForm');if(!form||form.dataset.v24Wrapped)return;form.dataset.v24Wrapped='1';const legacy=form.onsubmit;
    form.onsubmit=function(ev){
      const subject=String(q('#ySubject')?.value||'').trim();if(!subject){ev.preventDefault();alert('담당 교과를 입력하세요.');return}
      const wasFirst=firstYearPending&&Object.keys(state.years||{}).length===0;
      const ret=legacy?.call(this,ev);
      const yr=String(q('#yYear')?.value||state.currentYear||''),y=state.years?.[yr]||((typeof cur==='function')?cur():null);
      if(y){
        y.subjects=[subject];state.profile=state.profile&&typeof state.profile==='object'?state.profile:{};state.profile.major=subject;
        if(wasFirst){y.clubs=[];y.roleProfile={roles:[],homeroomGrade:'',homeroomClass:'',department:'',other:''};firstYearPending=false}
        saveDevice({subject});localStorage.setItem(KEY,JSON.stringify(state));if(typeof render==='function')render();
      }
      return ret;
    };
  }
  function wrapYearButtons(){['#firstYear','#newYear','#editYear'].forEach(sel=>{const b=q(sel);if(!b||b.dataset.v24Wrapped)return;const old=b.onclick;b.dataset.v24Wrapped='1';b.onclick=function(ev){const r=old?.call(this,ev);setTimeout(fillSubject,0);return r}})}

  function personalizeCopy(){
    const hero=q('#firstHero');if(hero){const h=hero.querySelector('h2'),p=hero.querySelector('p');if(h)h.textContent='학년도·학교급·담당 교과를 정하고 학교 자료를 올리세요.';if(p)p.textContent='같은 사이트 주소를 사용해도 이 브라우저의 학교·교과·업무·학생기록은 다른 사용자와 섞이지 않습니다.'}
    const clubs=q('#clubs .section-intro .muted');if(clubs)clubs.textContent='내가 맡은 동아리만 추가하거나 학교 자료에서 가져옵니다. 다른 사용자의 동아리 설정은 나타나지 않습니다.';
    const add=q('#clubAdd');if(add)add.textContent='+ 동아리 추가';
  }
  function ensureIsolationCard(){
    const settings=q('#settings');if(!settings||q('#v24IsolationCard'))return;const anchor=q('#localRecoveryCard')||settings.querySelector('.grid2');
    const html='<article class="card v24-isolation-card" id="v24IsolationCard"><div class="head"><div><span class="kicker">PERSONAL BROWSER</span><h3>이 기기만의 Teacher OS</h3><p class="muted">학교·교과·역할·업로드 결과·학생기록·컴시간 설정은 이 브라우저 저장공간에 유지됩니다. 같은 주소를 다른 선생님에게 보내도 서로의 로컬 데이터는 바뀌지 않습니다.</p></div><span class="pill">개인 분리</span></div><div class="mini spaced">다른 기기에서는 자동으로 따라오지 않습니다. 시크릿 모드나 사이트 데이터 삭제 시 로컬 데이터가 사라질 수 있으므로 백업 기능을 사용하세요.</div></article>';
    if(anchor)anchor.insertAdjacentHTML('afterend',html);else settings.insertAdjacentHTML('beforeend',html);
  }
  function neutralizeFreshDefaults(){if(!blankAtBoot)return;state.profile=state.profile&&typeof state.profile==='object'?state.profile:{};state.profile.major='';localStorage.setItem(KEY,JSON.stringify(state))}
  function boot(){neutralizeFreshDefaults();ensureSubjectField();wrapYearForm();wrapYearButtons();personalizeCopy();ensureIsolationCard();const foot=q('.side-foot');if(foot)foot.textContent='v0.24 · personal browser isolation'}
  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(()=>{ensureSubjectField();wrapYearForm();wrapYearButtons();personalizeCopy();ensureIsolationCard()},0);return r};
  boot();
})();
