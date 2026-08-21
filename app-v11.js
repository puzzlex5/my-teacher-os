(function(){
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];

  function addNavGroups(){
    const nav=q('#nav');
    if(!nav||nav.querySelector('.nav-group-label'))return;
    const groups=[
      {before:'dashboard',label:'Workspace'},
      {before:'importer',label:'Plan'},
      {before:'timetable',label:'Teach'},
      {before:'clubs',label:'Operate'},
      {before:'policy',label:'System'}
    ];
    groups.forEach(g=>{
      const btn=nav.querySelector(`[data-view="${g.before}"]`);
      if(!btn)return;
      const el=document.createElement('div');
      el.className='nav-group-label';
      el.textContent=g.label;
      el.setAttribute('aria-hidden','true');
      nav.insertBefore(el,btn);
    });
  }

  function refineCopy(){
    const small=q('.brand small');
    if(small)small.textContent='교사의 하루를 자동으로 정리합니다';
    const foot=q('.side-foot');
    if(foot)foot.textContent='v0.11 · Premium workspace';
  }

  function decorateHeader(){
    const title=q('#title');
    if(!title||q('#premiumTopChip'))return;
    const chip=document.createElement('span');
    chip.id='premiumTopChip';
    chip.className='premium-top-chip';
    chip.textContent='LIVE WORKSPACE';
    title.insertAdjacentElement('afterend',chip);
  }

  function decorateDashboard(){
    const body=q('#dashboardBody');
    if(!body)return;
    const grids=[...body.querySelectorAll(':scope > .grid2')];
    if(grids[0]){
      grids[0].querySelector('.card:first-child')?.classList.add('premium-focus-card');
      grids[0].querySelector('.agent')?.classList.add('premium-agent-card');
    }
    if(grids[1]){
      grids[1].querySelector('.card:first-child')?.classList.add('premium-today-card');
      grids[1].querySelector('.card:last-child')?.classList.add('premium-flow-card');
    }
    const metrics=qa('.summary .metric');
    const labels=['환경','일정','시간표','평가','동아리','행정'];
    metrics.forEach((m,i)=>m.dataset.metricLabel=labels[i]||'');
  }

  function improveAccessibility(){
    qa('#nav button').forEach(btn=>{
      const label=btn.querySelector('span')?.textContent?.trim();
      if(label)btn.setAttribute('aria-label',label);
    });
    qa('.linkbtn').forEach(btn=>{if(!btn.type)btn.type='button'});
  }

  function apply(){
    document.body.classList.add('premium-ui');
    addNavGroups();
    refineCopy();
    decorateHeader();
    decorateDashboard();
    improveAccessibility();
  }

  apply();
  requestAnimationFrame(apply);
})();
