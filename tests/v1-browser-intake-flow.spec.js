const {test,expect}=require('@playwright/test');

const ORIGIN='http://127.0.0.1:4173';
const TARGETS={legacy:`${ORIGIN}/dist-v1/legacy.html`,bundle:`${ORIGIN}/dist-v1/index.html`};
const STATE_KEY='myTeacherOS.v01';

function seedState(){
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
        subjects:['음악'],projects:[],clubs:[],assessments:[],memories:[],tasks:[],calendarEvents:[],timetable:[],imports:[],lastBackupAt:null
      }
    }
  };
}

async function openSeeded(browser,url){
  const context=await browser.newContext({viewport:{width:1280,height:900},locale:'ko-KR',timezoneId:'Asia/Seoul'});
  await context.addInitScript(({key,value})=>{
    if(!sessionStorage.getItem('__teacherOsIntakeSeeded')){
      localStorage.setItem(key,JSON.stringify(value));
      sessionStorage.setItem('__teacherOsIntakeSeeded','1');
    }
  },{key:STATE_KEY,value:seedState()});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',err=>pageErrors.push(String(err.message||err)));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1000);
  return {context,page,pageErrors};
}

function syntheticCalendarBuffer(title='합성 학교축제'){
  const ics=[
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Teacher OS Synthetic Test//KO',
    'BEGIN:VEVENT',
    `UID:synthetic-${title==='합성 학교축제'?'school-festival':title==='합성 혼합업로드 행사'?'mixed-upload':'malformed-isolation'}-20260903`,
    'DTSTART;VALUE=DATE:20260903',
    `SUMMARY:${title}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  return Buffer.from(ics,'utf8');
}

function syntheticCp949CalendarBuffer(){
  return Buffer.from([50,48,50,54,199,208,179,226,181,181,32,199,208,187,231,192,207,193,164,10,50,48,50,54,45,48,57,45,48,50,32,199,208,177,179,195,224,193,166,10,50,48,50,54,45,48,57,45,48,51,32,195,188,199,232,199,208,189,192,10,50,48,50,54,45,48,57,45,48,52,32,192,231,183,174,200,222,190,247,192,207,10]);
}

async function uploadSyntheticCalendar(page){
  await page.locator('#nav button[data-view="importer"]').click();
  await page.locator('#importFiles').setInputFiles({
    name:'2026학년도_합성_학사일정.ics',
    mimeType:'text/calendar',
    buffer:syntheticCalendarBuffer()
  });
  await expect(page.locator('#importStatus')).toContainText('처리 완료',{timeout:15000});
}

async function uploadCp949CalendarText(page){
  await page.locator('#nav button[data-view="importer"]').click();
  await page.locator('#importFiles').setInputFiles({
    name:'2026학년도_CP949_학사일정.txt',
    mimeType:'text/plain',
    buffer:syntheticCp949CalendarBuffer()
  });
  await expect(page.locator('#importStatus')).toContainText('처리 완료',{timeout:15000});
  await expect(page.locator('#suggestions'),'CP949 Korean text must survive decoding and appear in review candidates').toContainText('학교축제');
}

async function uploadMixedLegacyHwpAndCalendar(page){
  await page.locator('#nav button[data-view="importer"]').click();
  await page.locator('#importFiles').setInputFiles([
    {
      name:'구형_업무분장.hwp',
      mimeType:'application/octet-stream',
      buffer:Buffer.from('synthetic no-pii legacy hwp placeholder','utf8')
    },
    {
      name:'2026학년도_혼합업로드_학사일정.ics',
      mimeType:'text/calendar',
      buffer:syntheticCalendarBuffer('합성 혼합업로드 행사')
    }
  ]);
  await expect(page.locator('#importStatus')).toContainText('처리 완료',{timeout:15000});
  await expect(page.locator('#importStatus')).toContainText('실패 1개');
  const badRow=page.locator('#v23ReportList .v23-file-row',{hasText:'구형_업무분장.hwp'});
  const goodRow=page.locator('#v23ReportList .v23-file-row',{hasText:'2026학년도_혼합업로드_학사일정.ics'});
  await expect(badRow).toContainText('실패');
  await expect(goodRow).not.toHaveClass(/is-error/);
}

async function uploadMalformedHwpxAndCalendar(page){
  await page.locator('#nav button[data-view="importer"]').click();
  await page.locator('#importFiles').setInputFiles([
    {
      name:'손상된_학교교육계획.hwpx',
      mimeType:'application/zip',
      buffer:Buffer.from('not-a-valid-zip synthetic no-pii fixture','utf8')
    },
    {
      name:'2026학년도_손상파일격리_학사일정.ics',
      mimeType:'text/calendar',
      buffer:syntheticCalendarBuffer('합성 손상파일 격리 행사')
    }
  ]);
  await expect(page.locator('#importStatus')).toContainText('처리 완료',{timeout:15000});
  await expect(page.locator('#importStatus')).toContainText('실패 1개');
  const badRow=page.locator('#v23ReportList .v23-file-row',{hasText:'손상된_학교교육계획.hwpx'});
  const goodRow=page.locator('#v23ReportList .v23-file-row',{hasText:'2026학년도_손상파일격리_학사일정.ics'});
  await expect(badRow).toContainText('실패');
  await expect(goodRow).not.toHaveClass(/is-error/);
}

async function intakeProjection(page){
  return page.evaluate(key=>{
    const state=JSON.parse(localStorage.getItem(key)||'null');
    const y=state?.years?.['2026']||{};
    const event=(y.calendarEvents||[]).find(x=>x.title==='합성 학교축제');
    const imp=(y.imports||[]).find(x=>x.name==='2026학년도_합성_학사일정.ics');
    return {
      event:event?{date:event.date,title:event.title,source:event.source}:null,
      import:imp?{
        name:imp.name,
        docClass:imp.docClass,
        status:imp.status||'',
        candidateCount:Number(imp.candidateCount||0),
        autoAttemptCount:Number(imp.autoAttemptCount||0),
        appliedCount:Number(imp.appliedCount||0),
        alreadyPresentCount:Number(imp.alreadyPresentCount||0),
        blockedCount:Number(imp.blockedCount||0)
      }:null
    };
  },STATE_KEY);
}

async function cp949ImportProjection(page){
  return page.evaluate(key=>{
    const state=JSON.parse(localStorage.getItem(key)||'null');
    const y=state?.years?.['2026']||{};
    const imp=(y.imports||[]).find(x=>x.name==='2026학년도_CP949_학사일정.txt');
    return imp?{name:imp.name,docClass:imp.docClass,status:imp.status||'',candidateCount:Number(imp.candidateCount||0)}:null;
  },STATE_KEY);
}

async function mixedIntakeProjection(page,title,importName){
  return page.evaluate(({key,title,importName})=>{
    const state=JSON.parse(localStorage.getItem(key)||'null');
    const y=state?.years?.['2026']||{};
    const event=(y.calendarEvents||[]).find(x=>x.title===title);
    const goodImport=(y.imports||[]).find(x=>x.name===importName);
    return {
      event:event?{date:event.date,title:event.title,source:event.source}:null,
      goodImport:goodImport?{name:goodImport.name,appliedCount:Number(goodImport.appliedCount||0)}:null
    };
  },{key:STATE_KEY,title,importName});
}

for(const [name,url] of Object.entries(TARGETS)){
  test(`v1 ${name} browser intake applies and persists a synthetic ICS calendar`,async({browser})=>{
    const app=await openSeeded(browser,url);
    try{
      await uploadSyntheticCalendar(app.page);
      const first=await intakeProjection(app.page);
      expect(first.event).toEqual({date:'2026-09-03',title:'합성 학교축제',source:'2026학년도_합성_학사일정.ics'});
      expect(first.import).not.toBeNull();
      expect(first.import.docClass).toBe('calendar');
      expect(first.import.appliedCount).toBe(1);
      expect(first.import.alreadyPresentCount).toBe(0);
      expect(first.import.blockedCount).toBe(0);
      expect(app.pageErrors).toEqual([]);

      await app.page.reload({waitUntil:'domcontentloaded'});
      await app.page.waitForTimeout(900);
      expect(await intakeProjection(app.page)).toEqual(first);
      expect(app.pageErrors).toEqual([]);
    } finally {
      await app.context.close();
    }
  });

  test(`v1 ${name} browser intake decodes CP949 Korean TXT into persistent review metadata`,async({browser})=>{
    const app=await openSeeded(browser,url);
    try{
      await uploadCp949CalendarText(app.page);
      const first=await cp949ImportProjection(app.page);
      expect(first).not.toBeNull();
      expect(first.docClass).toBe('calendar');
      expect(first.candidateCount).toBeGreaterThan(0);
      expect(app.pageErrors).toEqual([]);

      await app.page.reload({waitUntil:'domcontentloaded'});
      await app.page.waitForTimeout(900);
      expect(await cp949ImportProjection(app.page)).toEqual(first);
      expect(app.pageErrors).toEqual([]);
    } finally {
      await app.context.close();
    }
  });

  test(`v1 ${name} mixed legacy HWP upload still applies supported files`,async({browser})=>{
    const app=await openSeeded(browser,url);
    try{
      await uploadMixedLegacyHwpAndCalendar(app.page);
      const first=await mixedIntakeProjection(app.page,'합성 혼합업로드 행사','2026학년도_혼합업로드_학사일정.ics');
      expect(first.event).toEqual({date:'2026-09-03',title:'합성 혼합업로드 행사',source:'2026학년도_혼합업로드_학사일정.ics'});
      expect(first.goodImport).not.toBeNull();
      expect(first.goodImport.appliedCount).toBe(1);
      expect(app.pageErrors).toEqual([]);

      await app.page.reload({waitUntil:'domcontentloaded'});
      await app.page.waitForTimeout(900);
      expect(await mixedIntakeProjection(app.page,'합성 혼합업로드 행사','2026학년도_혼합업로드_학사일정.ics')).toEqual(first);
      expect(app.pageErrors).toEqual([]);
    } finally {
      await app.context.close();
    }
  });

  test(`v1 ${name} malformed supported file is isolated from valid files`,async({browser})=>{
    const app=await openSeeded(browser,url);
    try{
      await uploadMalformedHwpxAndCalendar(app.page);
      const first=await mixedIntakeProjection(app.page,'합성 손상파일 격리 행사','2026학년도_손상파일격리_학사일정.ics');
      expect(first.event).toEqual({date:'2026-09-03',title:'합성 손상파일 격리 행사',source:'2026학년도_손상파일격리_학사일정.ics'});
      expect(first.goodImport).not.toBeNull();
      expect(first.goodImport.appliedCount).toBe(1);
      expect(app.pageErrors).toEqual([]);

      await app.page.reload({waitUntil:'domcontentloaded'});
      await app.page.waitForTimeout(900);
      expect(await mixedIntakeProjection(app.page,'합성 손상파일 격리 행사','2026학년도_손상파일격리_학사일정.ics')).toEqual(first);
      expect(app.pageErrors).toEqual([]);
    } finally {
      await app.context.close();
    }
  });
}