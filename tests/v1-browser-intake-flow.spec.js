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

async function uploadSyntheticCalendar(page){
  const ics=[
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Teacher OS Synthetic Test//KO',
    'BEGIN:VEVENT',
    'UID:synthetic-school-festival-20260903',
    'DTSTART;VALUE=DATE:20260903',
    'SUMMARY:합성 학교축제',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  await page.locator('#nav button[data-view="importer"]').click();
  await page.locator('#importFiles').setInputFiles({
    name:'2026학년도_합성_학사일정.ics',
    mimeType:'text/calendar',
    buffer:Buffer.from(ics,'utf8')
  });
  await expect(page.locator('#importStatus')).toContainText('처리 완료',{timeout:15000});
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
}
