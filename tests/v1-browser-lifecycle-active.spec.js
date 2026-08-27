const {test,expect}=require('@playwright/test');

const ORIGIN='http://127.0.0.1:4173';
const TARGETS={
  legacy:`${ORIGIN}/dist-v1/legacy.html`,
  bundle:`${ORIGIN}/dist-v1/index.html`
};

for(const [name,url] of Object.entries(TARGETS)){
  test(`v1 shared lifecycle is active in ${name} runtime`,async({browser})=>{
    const context=await browser.newContext({viewport:{width:1280,height:900},locale:'ko-KR',timezoneId:'Asia/Seoul'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',err=>errors.push(String(err.message||err)));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(1200);
    const state=await page.evaluate(()=>({
      hasLifecycle:!!globalThis.TeacherOSLifecycle,
      renderInstalled:globalThis.render?.__teacherOSLifecycleRender===true,
      switchInstalled:globalThis.switchView?.__teacherOSLifecycleSwitch===true,
      counts:globalThis.TeacherOSLifecycle?._counts?.()||null
    }));
    expect(errors,`${name} page errors: ${errors.join(' | ')}`).toEqual([]);
    expect(state.hasLifecycle,`${name} must load TeacherOSLifecycle`).toBe(true);
    expect(state.renderInstalled,`${name} must execute through the shared render dispatcher`).toBe(true);
    expect(state.switchInstalled,`${name} must execute through the shared switch dispatcher`).toBe(true);
    expect(state.counts?.render,`${name} must register shared render hooks`).toBeGreaterThan(0);
    expect(state.counts?.switch,`${name} must register shared switch hooks`).toBeGreaterThan(0);
    await context.close();
  });
}
