const {test,expect}=require('@playwright/test');

const ORIGIN='http://127.0.0.1:4173';
const TARGETS={legacy:`${ORIGIN}/index.html`,bundle:`${ORIGIN}/dist-v1/index.html`};

async function openApp(browser,url,viewport){
  const context=await browser.newContext({viewport,locale:'ko-KR',timezoneId:'Asia/Seoul'});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',err=>pageErrors.push(String(err.message||err)));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{
    const nav=document.querySelectorAll('#nav button');
    return nav.length>=12 && document.querySelector('#worklibrary') && document.querySelector('#teacherDesk27');
  },null,{timeout:20000});
  await page.waitForTimeout(1200);
  return {context,page,pageErrors};
}

async function fingerprint(page){
  return page.evaluate(()=>{
    const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id).filter(Boolean).sort();
    const nav=[...document.querySelectorAll('#nav button')].map(b=>({view:b.dataset.view||'',text:norm(b.textContent)}));
    const views=[...document.querySelectorAll('.view')].map(v=>v.id).filter(Boolean).sort();
    const active=[...document.querySelectorAll('.view.active')].map(v=>v.id).sort();
    const yearOptions=[...document.querySelectorAll('#yearSelect option')].map(o=>norm(o.textContent));
    const rootStyle=getComputedStyle(document.documentElement);
    const side=document.querySelector('.side');
    const main=document.querySelector('.main');
    return {
      ids,nav,views,active,yearOptions,
      title:norm(document.querySelector('#title')?.textContent),
      appTitle:document.title,
      bodyClass:document.body.className,
      sideDisplay:side?getComputedStyle(side).display:null,
      mainDisplay:main?getComputedStyle(main).display:null,
      rootFont:rootStyle.fontSize,
      localStorageKeys:Object.keys(localStorage).sort()
    };
  });
}

async function navigationFingerprint(page){
  const wanted=['dashboard','importer','timetable','assessment','documents','settings','worklibrary'];
  const result=[];
  for(const id of wanted){
    const button=page.locator(`#nav button[data-view="${id}"]`);
    await expect(button).toHaveCount(1);
    await button.click();
    await page.waitForTimeout(40);
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
  test(`v1 bundled runtime matches legacy DOM and navigation on ${device.name}`,async({browser})=>{
    const legacy=await openApp(browser,TARGETS.legacy,device.viewport);
    const bundle=await openApp(browser,TARGETS.bundle,device.viewport);
    try{
      expect(legacy.pageErrors,`legacy page errors: ${legacy.pageErrors.join(' | ')}`).toEqual([]);
      expect(bundle.pageErrors,`bundle page errors: ${bundle.pageErrors.join(' | ')}`).toEqual([]);
      expect(await fingerprint(bundle.page)).toEqual(await fingerprint(legacy.page));
      expect(await navigationFingerprint(bundle.page)).toEqual(await navigationFingerprint(legacy.page));
    } finally {
      await legacy.context.close();
      await bundle.context.close();
    }
  });
}
