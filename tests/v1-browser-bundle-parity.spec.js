const {test,expect}=require('@playwright/test');

const ORIGIN='http://127.0.0.1:4173';
const TARGETS={
  legacy:`${ORIGIN}/dist-v1/legacy.html`,
  bundle:`${ORIGIN}/dist-v1/index.html`
};

async function openApp(browser,url,viewport){
  const context=await browser.newContext({viewport,locale:'ko-KR',timezoneId:'Asia/Seoul'});
  // Runtime parity must not depend on a third-party CDN being fast or reachable.
  // Parser APIs are not exercised by this startup/navigation check, so harmless
  // placeholders are enough to let the identical HTML shell parse deterministically.
  await context.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({
    status:200,
    contentType:'application/javascript',
    body:'globalThis.XLSX=globalThis.XLSX||{};globalThis.mammoth=globalThis.mammoth||{};globalThis.JSZip=globalThis.JSZip||function JSZip(){};'
  }));
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
    hasTeacherDesk:!!document.querySelector('#teacherDesk27'),
    bodyText:String(document.body?.innerText||'').replace(/\s+/g,' ').trim().slice(0,400)
  }));
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

      expect(legacy.pageErrors,`legacy page errors: ${legacy.pageErrors.join(' | ')}; state=${JSON.stringify(legacyStart)}`).toEqual([]);
      expect(legacy.requestFailures,`legacy request failures: ${legacy.requestFailures.join(' | ')}`).toEqual([]);
      expect(legacyStart.hasWorkLibrary,`legacy work library missing; state=${JSON.stringify(legacyStart)}`).toBe(true);
      expect(legacyStart.hasTeacherDesk,`legacy Teacher Desk missing; state=${JSON.stringify(legacyStart)}`).toBe(true);

      expect(bundle.pageErrors,`bundle page errors: ${bundle.pageErrors.join(' | ')}; state=${JSON.stringify(bundleStart)}`).toEqual([]);
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
