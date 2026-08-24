const {test,expect}=require('@playwright/test');

const ORIGIN='http://127.0.0.1:4173';
const TARGETS={
  legacy:`${ORIGIN}/dist-v1/legacy.html`,
  bundle:`${ORIGIN}/dist-v1/index.html`
};
const STATE_KEY='myTeacherOS.v01';

async function openApp(browser,url,viewport,seedState=null){
  const context=await browser.newContext({viewport,locale:'ko-KR',timezoneId:'Asia/Seoul'});
  await context.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({
    status:200,
    contentType:'application/javascript',
    body:'globalThis.XLSX=globalThis.XLSX||{};globalThis.mammoth=globalThis.mammoth||{};globalThis.JSZip=globalThis.JSZip||function JSZip(){};'
  }));
  if(seedState){
    await context.addInitScript(({key,value})=>{
      if(!sessionStorage.getItem('__teacherOsSeeded')){
        localStorage.setItem(key,JSON.stringify(value));
        sessionStorage.setItem('__teacherOsSeeded','1');
      }
    },{key:STATE_KEY,value:seedState});
  }
  const page=await context.newPage();
  const pageErrors=[];
  const requestFailures=[];
  page.on('pageerror',err=>pageErrors.push(String(err.message||err)));
  page.on('requestfailed',req=>requestFailures.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText||'failed'}`));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1200);
  return {context,page,pageErrors,requestFailures};
}

async function startupState(page){
  return page.evaluate(()=>({
    navCount:document.querySelectorAll('#nav button').length,
    hasWorkLibrary:!!document.querySelector('#worklibrary'),
    hasTeacherDesk:!!document.querySelector('#teacherDesk27')
  }));
}

async function bodyPreview(page){
  return page.evaluate(()=>String(document.body?.innerText||'').replace(/\s+/g,' ').trim().slice(0,400));
}

async function fingerprint(page){
  return page.evaluate(()=>{
    const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
    const side=document.querySelector('.side');
    const main=document.querySelector('.main');
    return {
      ids:[...document.querySelectorAll('[id]')].map(x=>x.id).filter(Boolean).sort(),
      nav:[...document.querySelectorAll('#nav button')].map(b=>({view:b.dataset.view||'',text:norm(b.textContent)})),
      views:[...document.querySelectorAll('.view')].map(v=>v.id).filter(Boolean).sort(),
      active:[...document.querySelectorAll('.view.active')].map(v=>v.id).sort(),
      yearOptions:[...document.querySelectorAll('#yearSelect option')].map(o=>norm(o.textContent)),
      title:norm(document.querySelector('#title')?.textContent),
      appTitle:document.title,
      bodyClass:document.body.className,
      sideDisplay:side?getComputedStyle(side).display:null,
      mainDisplay:main?getComputedStyle(main).display:null,
      rootFont:getComputedStyle(document.documentElement).fontSize,
      localStorageKeys:Object.keys(localStorage).sort()
    };
  });
}

async function navigationFingerprint(page){
  const wanted=['dashboard','importer','timetable','assessment','documents','settings','worklibrary'];
  const result=[];
  for(const id of wanted){
    const button=page.locator(`#nav button[data-view="${id}"]`);
    await expect(button,`missing nav button ${id}`).toHaveCount(1);
    await button.click();
    await page.waitForTimeout(50);
    result.push(await page.evaluate(view=>({
      requested:view,
      active:[...document.querySelectorAll('.view.active')].map(x=>x.id).sort(),
      navActive:[...document.querySelectorAll('#nav button.active')].map(x=>x.dataset.view||'').sort(),
      title:String(document.querySelector('#title')?.textContent||'').replace(/\s+/g,' ').trim()
    }),id));
  }
  return result;
}

async function storedState(page){
  return page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'null'),STATE_KEY);
}

function migrationProjection(state){
  const y=state?.years?.['2026']||{};
  return {
    currentYear:state?.currentYear,
    school:{year:y.year,schoolLevel:y.schoolLevel,schoolName:y.schoolName,educationOffice:y.educationOffice},
    timetable:(y.timetable||[]).map(x=>({id:x.id,day:x.day,period:x.period,label:x.label,target:x.target,subject:x.subject,time:x.time})),
    calendarEvents:(y.calendarEvents||[]).map(x=>({id:x.id,date:x.date,title:x.title,type:x.type,scope:x.scope,impact:x.impact})),
    timetableExceptions:y.timetableExceptions,
    classProgress:y.classProgress,
    paceStrategies:y.paceStrategies,
    lessonLogs:y.lessonLogs
  };
}

function oldSchemaSeed(){
  return {
    version:5,
    currentYear:'2026',
    profile:{major:'음악',minutes:45},
    years:{
      '2026':{
        year:2026,
        schoolLevel:'중학교',
        schoolName:'합성 테스트 학교',
        educationOffice:'경기도교육청',
        subjects:['음악'],
        projects:[],
        clubs:[],
        assessments:[],
        memories:[],
        tasks:[],
        calendarEvents:[{id:'e1',date:'2026-08-24',title:'합성 행사',type:'학교'}],
        timetable:[{id:'t1',day:'월',period:1,label:'2-1 음악'}],
        imports:[],
        lastBackupAt:null
      }
    }
  };
}

for(const device of [
  {name:'desktop',viewport:{width:1280,height:900}},
  {name:'mobile',viewport:{width:390,height:844}}
]){
  test(`v1 bundle preserves separate-layer startup and navigation on ${device.name}`,async({browser})=>{
    const legacy=await openApp(browser,TARGETS.legacy,device.viewport);
    const bundle=await openApp(browser,TARGETS.bundle,device.viewport);
    try{
      const legacyStart=await startupState(legacy.page);
      const bundleStart=await startupState(bundle.page);
      const legacyBody=await bodyPreview(legacy.page);
      const bundleBody=await bodyPreview(bundle.page);

      expect(legacy.pageErrors,`legacy page errors: ${legacy.pageErrors.join(' | ')}; state=${JSON.stringify(legacyStart)}; body=${legacyBody}`).toEqual([]);
      expect(legacy.requestFailures,`legacy request failures: ${legacy.requestFailures.join(' | ')}`).toEqual([]);
      expect(legacyStart.hasWorkLibrary,`legacy work library missing; state=${JSON.stringify(legacyStart)}`).toBe(true);
      expect(legacyStart.hasTeacherDesk,`legacy Teacher Desk missing; state=${JSON.stringify(legacyStart)}`).toBe(true);

      expect(bundle.pageErrors,`bundle page errors: ${bundle.pageErrors.join(' | ')}; state=${JSON.stringify(bundleStart)}; body=${bundleBody}`).toEqual([]);
      expect(bundle.requestFailures,`bundle request failures: ${bundle.requestFailures.join(' | ')}`).toEqual([]);
      expect(bundleStart).toEqual(legacyStart);
      expect(await fingerprint(bundle.page)).toEqual(await fingerprint(legacy.page));
      expect(await navigationFingerprint(bundle.page)).toEqual(await navigationFingerprint(legacy.page));
    } finally {
      await legacy.context.close();
      await bundle.context.close();
    }
  });
}

test('v1 shared storage preserves historical state migration across reload',async({browser})=>{
  const viewport={width:1280,height:900};
  const seed=oldSchemaSeed();
  const legacy=await openApp(browser,TARGETS.legacy,viewport,seed);
  const bundle=await openApp(browser,TARGETS.bundle,viewport,seed);
  try{
    expect(legacy.pageErrors,`legacy migration errors: ${legacy.pageErrors.join(' | ')}`).toEqual([]);
    expect(bundle.pageErrors,`bundle migration errors: ${bundle.pageErrors.join(' | ')}`).toEqual([]);

    const legacyMigrated=await storedState(legacy.page);
    const bundleMigrated=await storedState(bundle.page);
    const legacyProjection=migrationProjection(legacyMigrated);
    const bundleProjection=migrationProjection(bundleMigrated);
    expect(bundleProjection).toEqual(legacyProjection);

    const y=bundleMigrated.years['2026'];
    expect(Array.isArray(y.timetableExceptions)).toBe(true);
    expect(y.classProgress&&typeof y.classProgress).toBe('object');
    expect(y.paceStrategies&&typeof y.paceStrategies).toBe('object');
    expect(Array.isArray(y.lessonLogs)).toBe(true);
    expect(y.calendarEvents[0].scope).toBeTruthy();
    expect(y.calendarEvents[0].impact).toBeTruthy();
    expect(y.timetable[0].target).toBeTruthy();
    expect(y.timetable[0].subject).toBeTruthy();

    await legacy.page.reload({waitUntil:'domcontentloaded'});
    await bundle.page.reload({waitUntil:'domcontentloaded'});
    await legacy.page.waitForTimeout(900);
    await bundle.page.waitForTimeout(900);

    const legacyReloaded=migrationProjection(await storedState(legacy.page));
    const bundleReloaded=migrationProjection(await storedState(bundle.page));
    expect(legacyReloaded).toEqual(legacyProjection);
    expect(bundleReloaded).toEqual(bundleProjection);
    expect(bundleReloaded).toEqual(legacyReloaded);
    expect(Array.isArray(bundleReloaded.lessonLogs)).toBe(true);
    expect(bundle.pageErrors,`bundle reload errors: ${bundle.pageErrors.join(' | ')}`).toEqual([]);
  } finally {
    await legacy.context.close();
    await bundle.context.close();
  }
});
