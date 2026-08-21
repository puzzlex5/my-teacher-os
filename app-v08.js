(function(){
  const q=s=>document.querySelector(s);
  const btn=q('#analyzeBtn'), input=q('#importFiles'), applyBtn=q('#applySuggestions');
  if(!btn||!input)return;

  const previousAnalyze=btn.onclick;
  let running=false;

  function reviewCount(){
    try{return Array.isArray(suggestions)?suggestions.filter(x=>!x.checked).length:0}catch{return 0}
  }
  function checkedCount(){
    try{return Array.isArray(suggestions)?suggestions.filter(x=>x.checked).length:0}catch{return 0}
  }
  function refreshApplyButton(){
    if(!applyBtn)return;
    const n=reviewCount();
    applyBtn.textContent=n?`검토 항목 ${n}개 적용`:'추가 검토 없음';
    applyBtn.hidden=!n;
  }

  async function analyzeAndApply(){
    if(running)return;
    const files=[...input.files];
    if(!files.length)return;
    running=true;
    btn.disabled=true;
    const status=q('#importStatus');
    try{
      if(status)status.textContent=`${files.length}개 자료를 자동 분류하고 바로 적용하는 중...`;
      await previousAnalyze?.call(btn);
      const auto=checkedCount();
      const review=reviewCount();
      if(auto>0){
        applySuggestions();
      }
      refreshApplyButton();
      if(status){
        status.innerHTML=`<b>${auto}개 항목 자동 적용 완료</b>${review?` · ${review}개만 인식이 불확실해 검토함에 남김`:''}`;
      }
      if(review>0){
        try{switchView('importer')}catch{}
      }
    }catch(err){
      if(status)status.textContent='자동 적용 실패: '+(err?.message||err);
    }finally{
      btn.disabled=false;
      running=false;
    }
  }

  input.addEventListener('change',()=>{
    if(input.files?.length)analyzeAndApply();
  });
  btn.onclick=analyzeAndApply;
  btn.textContent='다시 분석';
  if(applyBtn){
    applyBtn.textContent='추가 검토 항목 적용';
    applyBtn.hidden=true;
  }

  const banner=q('#bulkInboxBanner .mini');
  if(banner)banner.textContent='파일을 선택하는 즉시 자동 분석하고 학사일정 / 기본시간표 / 이번 주 실제시간표 / 평가 / 행정으로 나눠 바로 적용합니다. 불확실한 항목만 검토함에 남깁니다.';
  const strong=q('#importer .upload strong');
  if(strong)strong.textContent='여기에 한꺼번에 올리면 바로 적용';
})();
