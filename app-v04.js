const KEY='myTeacherOS.v01';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], arr=v=>Array.isArray(v)?v:[];
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(16).slice(2);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

const OFFICES={
 '서울특별시교육청':'https://www.sen.go.kr/','부산광역시교육청':'https://www.pen.go.kr/','대구광역시교육청':'https://www.dge.go.kr/','인천광역시교육청':'https://www.ice.go.kr/','광주광역시교육청':'https://www.gen.go.kr/','대전광역시교육청':'https://www.dje.go.kr/','울산광역시교육청':'https://www.use.go.kr/','세종특별자치시교육청':'https://www.sje.go.kr/','경기도교육청':'https://www.goe.go.kr/','강원특별자치도교육청':'https://www.gwe.go.kr/','충청북도교육청':'https://www.cbe.go.kr/','충청남도교육청':'https://www.cne.go.kr/','전북특별자치도교육청':'https://www.jbe.go.kr/','전라남도교육청':'https://www.jne.go.kr/','경상북도교육청':'https://www.gbe.kr/','경상남도교육청':'https://www.gne.go.kr/','제주특별자치도교육청':'https://www.jje.go.kr/'
};
const MOE_CURRICULUM='https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=141&boardSeq=93458&lev=0&m=040401';
const MOE_CREDIT='https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=88188&lev=0&m=020402&opType=N&s=moe&statusYN=W';
const GOE_GRADE_2026='https://www.goe.go.kr/goe/na/ntt/selectNttInfo.do?mi=10961&nttSn=2340527';
const GOE_HS_2026='https://www.goe.go.kr/goe/na/ntt/selectNttInfo.do?mi=10961&nttSn=2340881';

const fresh=()=>({version:4,currentYear:null,profile:{major:'음악',minutes:45,style:''},years:{}});
let state=(()=>{try{return JSON.parse(localStorage.getItem(KEY))||fresh()}catch{return fresh()}})();
let suggestions=[];

function defaultClubs(){return[
 {id:uid(),name:'국제교류 자율동아리',type:'국제교류',goal:'해외 학교 학생들과 국제교류 활동 운영',due:'',activities:[]},
 {id:uid(),name:'밴드 자율동아리',type:'밴드',goal:'학생 주도 합주와 공연 운영',due:'',activities:[]}
]}
function yearObj(n,l='중학교',s=''){return{year:Number(n),schoolLevel:l,schoolName:s,educationOffice:'경기도교육청',subjects:['음악'],grades:[],homeroom:'',projects:[],clubs:defaultClubs(),assessments:[],memories:[],tasks:[],attachments:[],calendarEvents:[],imports:[]}}
function migrate(){
 state=state&&typeof state==='object'?state:fresh(); state.version=4; state.years=state.years||{};
 Object.values(state.years).forEach(y=>{y.projects=arr(y.projects);y.assessments=arr(y.assessments);y.memories=arr(y.memories);y.tasks=arr(y.tasks);y.attachments=arr(y.attachments);y.calendarEvents=arr(y.calendarEvents);y.imports=arr(y.imports);y.clubs=arr(y.clubs);if(!y.clubs.length)y.clubs=defaultClubs();if(!y.educationOffice)y.educationOffice='경기도교육청';if(!arr(y.subjects).length)y.subjects=['음악']});
 localStorage.setItem(KEY,JSON.stringify(state));
}
function cur(){return state.currentYear?state.years[state.currentYear]:null}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
function dueDays(d){if(!d)return null;const t=new Date(d+'T00:00:00'),n=new Date();n.setHours(0,0,0,0);return Math.ceil((t-n)/86400000)}
function dueText(d){const n=dueDays(d);if(n===null)return'';if(n===0)return'오늘';return n>0?`D-${n}`:`${Math.abs(n)}일 지남`}
function openDlg(id){$(id).showModal()} function closeDlgs(){$$('dialog[open]').forEach(d=>d.close())}
function ensureYear(){if(cur())return true;openYear();return false}
function switchView(id){$$('.view').forEach(x=>x.classList.toggle('active',x.id===id));$$('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===id));$('#title').textContent=({dashboard:'오늘',importer:'자동세팅',calendar:'학사일정',assessment:'수업·평가',clubs:'동아리',projects:'행정업무',policy:'교육과정·지침',documents:'자료함',memory:'업무기억'})[id]||id}

function curriculumMode(y){
 const yr=Number(y.year), lv=y.schoolLevel;
 if(!['중학교','고등학교'].includes(lv))return '학교급별 교육과정 확인 필요';
 if(yr>=2027)return '2022 개정 교육과정 · 전 학년 적용';
 if(yr===2026)return '1·2학년 2022 개정 / 3학년 2015 개정';
 if(yr===2025)return '1학년 2022 개정 / 2·3학년 2015 개정';
 return '2015 개정 교육과정 중심';
}
function creditMode(y){return y.schoolLevel==='고등학교'&&Number(y.year)>=2025}
function policyFor(y){
 const office=y.educationOffice||'경기도교육청', officeUrl=OFFICES[office]||'';
 const sources=[
  {name:'교육부 · 2022 개정 초·중등학교 교육과정 시행 일정',url:MOE_CURRICULUM,status:'국가 기준',note:'2027년 3월 1일부터 중3·고3까지 적용되어 중·고 전 학년이 2022 개정 체계가 됩니다.'}
 ];
 if(creditMode(y))sources.push({name:'교육부 · 고교학점제 전면 적용 이행 기준',url:MOE_CREDIT,status:'국가 기준',note:'고등학교는 학점제 운영을 전제로 교육과정·이수·평가 정보를 관리합니다.'});
 if(office==='경기도교육청'){
   sources.push({name:'경기도교육청 · 2026 중학교·고등학교 학업성적관리 시행지침',url:GOE_GRADE_2026,status:Number(y.year)===2026?'현재 학년도 기준':'참고용',note:Number(y.year)===2026?'2026.3.1~2027.2.28 적용 지침':'2027학년도 이후에는 해당 연도의 새 지침이 발표되면 반드시 그 자료를 우선합니다.'});
   if(y.schoolLevel==='고등학교')sources.push({name:'경기도교육청 · 학생중심 학교교육과정 도움자료집(고등학교)',url:GOE_HS_2026,status:'운영 참고',note:'2022 개정 교육과정과 고교학점제 편성·운영 자료'});
 }else if(officeUrl){sources.push({name:`${office} · 연도별 학업성적관리/교육과정 지침`,url:officeUrl,status:'매년 확인',note:`${y.year}학년도 최신 시행지침과 교육과정 편성·운영 자료를 우선해야 합니다.`})}
 return {curriculum:curriculumMode(y),credit:creditMode(y),office,officeUrl,sources,annualReady:Number(y.year)<=2026};
}

function renderPolicy(y){
 const p=policyFor(y);
 $('#policyBanner').innerHTML=`<div class="head"><div><span class="auto-chip">자동 적용</span><h3>${esc(p.curriculum)}</h3><div class="profile-line"><span>${esc(y.educationOffice||'교육청 미설정')}</span><span>${esc(y.schoolLevel||'학교급 미설정')}</span>${p.credit?'<span>고교학점제 모드</span>':''}</div></div><button class="btn secondary tiny" data-go-policy>기준 보기</button></div>`;
 $('#assessmentPolicy').innerHTML=`<b>${esc(y.year)}학년도 평가 기준:</b> ${esc(p.office)}의 해당 연도 학업성적관리 시행지침을 최종 기준으로 봅니다. ${Number(y.year)>=2027?'<span class="status-warn">2027 지침 발표 전에는 세부 평가 규칙을 미리 확정하지 않습니다.</span>':''}`;
 $('#policySummary').innerHTML=`
   <article class="card policy-card"><span class="kicker">CURRICULUM</span><strong>${esc(p.curriculum)}</strong><div class="mini">학년도·학교급으로 자동 판정</div></article>
   <article class="card policy-card"><span class="kicker">HIGH SCHOOL CREDIT</span><strong>${p.credit?'고교학점제 적용':'해당 없음'}</strong><div class="mini">고등학교 · 2025학년도 이후 자동 활성화</div></article>
   <article class="card policy-card"><span class="kicker">LOCAL RULE</span><strong>${esc(p.office)}</strong><div class="mini">평가·성적관리 세부는 매년 교육청 최신 지침 우선</div></article>`;
 $('#policySources').innerHTML=p.sources.map(s=>`<div class="policy-source"><div class="grow"><a class="source-link" href="${s.url}" target="_blank" rel="noopener">${esc(s.name)}</a><div class="mini">${esc(s.note)}</div></div><span class="pill ${s.status==='참고용'||s.status==='매년 확인'?'warn':''}">${esc(s.status)}</span></div>`).join('');
}

function render(){
 const y=cur(),years=Object.keys(state.years).sort((a,b)=>b-a);
 $('#yearSelect').innerHTML=years.length?years.map(k=>`<option value="${k}" ${String(state.currentYear)===String(k)?'selected':''}>${k}학년도</option>`).join(''):'<option>학년도 없음</option>';
 $('#firstHero').hidden=!!y; $('#dashboardBody').style.display=y?'block':'none';
 if(!y){['nextList','calendarList','assItems','clubGrid','projectGrid','sourceList','memoryList'].forEach(id=>$('#'+id).innerHTML='<div class="empty">학년도를 먼저 만들어 주세요.</div>');$('#policySummary').innerHTML='<div class="empty">학년도를 먼저 만들어 주세요.</div>';$('#policySources').innerHTML='';return}
 y.calendarEvents=arr(y.calendarEvents);y.assessments=arr(y.assessments);y.projects=arr(y.projects);y.clubs=arr(y.clubs);y.tasks=arr(y.tasks);y.imports=arr(y.imports);y.memories=arr(y.memories);
 $('#mEnv').textContent=[y.schoolLevel,y.schoolName].filter(Boolean).join(' · ')||y.schoolLevel||'-';$('#mCal').textContent=y.calendarEvents.length+'개';$('#mAss').textContent=y.assessments.length+'개';$('#mClub').textContent=y.clubs.length+'개';$('#mProj').textContent=y.projects.length+'개';
 renderPolicy(y);renderNext(y);renderCalendar(y);renderAssess(y);renderClubs(y);renderProjects(y);renderSources(y);renderMemory(y);renderTasks(y);
}
function allUpcoming(y){let a=[];y.calendarEvents.forEach(e=>a.push({date:e.date,title:e.title,type:e.type||'학교'}));y.assessments.forEach(e=>e.due&&a.push({date:e.due,title:e.name,type:'평가'}));y.projects.forEach(e=>e.due&&a.push({date:e.due,title:e.name,type:'행정'}));y.clubs.forEach(e=>e.due&&a.push({date:e.due,title:e.name,type:'동아리'}));return a.filter(x=>x.date&&dueDays(x.date)>=0).sort((a,b)=>a.date.localeCompare(b.date))}
function renderNext(y){const a=allUpcoming(y).slice(0,10);$('#nextList').innerHTML=a.length?a.map(x=>`<div class="row"><div class="calendar-date">${esc(x.date)}</div><div class="grow"><strong>${esc(x.title)}</strong><div class="mini">${esc(x.type)} · ${dueText(x.date)}</div></div></div>`).join(''):'<div class="empty">다가오는 일정이 없습니다.</div>'}
function renderCalendar(y){const a=y.calendarEvents.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''));$('#calendarList').innerHTML=a.length?a.map(e=>`<div class="row"><div class="calendar-date">${esc(e.date)}</div><div class="grow"><strong>${esc(e.title)}</strong><div class="mini">${esc(e.type||'학교')} · ${esc(e.source||'예외 입력')}</div></div><button class="linkbtn danger-text" data-cal-del="${e.id}">삭제</button></div>`).join(''):'<div class="empty">자동세팅에서 학교 학사일정 자료를 올리세요.</div>'}
function renderAssess(y){$('#assItems').innerHTML=y.assessments.length?y.assessments.map(a=>`<div class="row"><div class="grow"><strong>${esc(a.name)}</strong><div class="mini">${esc(a.target||'')} ${a.weight?'· '+esc(a.weight):''} ${a.due?'· '+esc(a.due):''}</div><div class="source">${esc(a.source||'')}</div></div><button class="linkbtn danger-text" data-ass-del="${a.id}">삭제</button></div>`).join(''):'<div class="empty">평가계획서를 자동세팅에서 올리세요. 같은 내용을 다시 입력하지 않습니다.</div>'}
function renderClubs(y){$('#clubGrid').innerHTML=y.clubs.map(c=>`<article class="card project"><span class="pill blue">${c.type==='국제교류'?'🌏':'🎸'} ${esc(c.type)}</span><h3>${esc(c.name)}</h3><p class="muted">${esc(c.goal||'')}</p><div class="mini due">${c.due?esc(c.due)+' · '+dueText(c.due):'학교 일정과 연동 예정'}</div></article>`).join('')}
function renderProjects(y){$('#projectGrid').innerHTML=y.projects.length?y.projects.map(p=>`<article class="card project"><span class="pill">행정</span><h3>${esc(p.name)}</h3><p class="muted">${esc(p.desc||'')}</p><div class="mini due">${p.due?esc(p.due)+' · '+dueText(p.due):'마감 미정'}</div><div class="source">${esc(p.source||'예외 입력')}</div></article>`).join(''):'<div class="empty">업무분장표나 공문을 자동세팅에서 올리세요.</div>'}
function renderSources(y){$('#sourceList').innerHTML=y.imports.length?y.imports.slice().reverse().map(f=>`<div class="row"><div class="grow"><strong>${esc(f.name)}</strong><div class="mini">${esc(f.kind)} · ${esc(f.when||'')}</div>${f.detected?`<div class="source">자동 인식: ${esc(f.detected)}</div>`:''}</div></div>`).join(''):'<div class="empty">분석한 원본 자료가 없습니다.</div>'}
function renderMemory(y){$('#memoryList').innerHTML=y.memories.length?y.memories.slice().reverse().map(m=>`<div class="row"><div class="grow"><strong>${esc(m.note)}</strong><div class="mini">${esc(m.improve||'')}</div></div></div>`).join(''):'<div class="empty">내년에 재사용할 것만 기록하세요.</div>'}
function renderTasks(y){$('#taskList').innerHTML=y.tasks.length?y.tasks.map(t=>`<div class="row task ${t.done?'done':''}"><input type="checkbox" data-task="${t.id}" ${t.done?'checked':''}><div class="grow">${esc(t.text)}</div><button class="linkbtn danger-text" data-task-del="${t.id}">삭제</button></div>`).join(''):'<div class="empty">문서에 없는 임시 할 일만 적습니다.</div>'}

function normDate(y,m,d){const yy=Number(y||cur()?.year||new Date().getFullYear()),mm=Number(m),dd=Number(d);if(!mm||!dd)return'';return `${yy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`}
function findDates(text){const out=[];const push=(date,idx,raw)=>{if(date&&!out.some(x=>x.date===date&&x.idx===idx))out.push({date,idx,raw})};let m;const regs=[/(20\d{2})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})일?/g,/(\d{1,2})월\s*(\d{1,2})일/g,/(\d{1,2})[./-](\d{1,2})(?!\d)/g];for(let r=0;r<regs.length;r++){const re=regs[r];while((m=re.exec(text))){if(r===0)push(normDate(m[1],m[2],m[3]),m.index,m[0]);else push(normDate(null,m[1],m[2]),m.index,m[0])}}return out.sort((a,b)=>a.idx-b.idx)}
function classify(line,hint='auto'){if(hint!=='auto')return hint;if(/평가|수행|지필|성취기준|반영비율|고사/.test(line))return'assessment';if(/업무분장|담당|제출|공문|기안|결재|보고|신청/.test(line))return'admin';return'calendar'}
function cleanTitle(line,raw=''){let t=line.replace(raw,' ').replace(/\s+/g,' ').trim();t=t.replace(/^[-–—•·\d.()\s]+/,'').trim();return t.slice(0,120)||'학교 일정'}
function parseWeight(line){const m=line.match(/(\d+(?:\.\d+)?)\s*%/);return m?m[1]+'%':''}
function parseTarget(line){const m=line.match(/([123])\s*학년/);return m?m[1]+'학년':''}
function dedupeSuggestions(a){const seen=new Set();return a.filter(x=>{const k=[x.kind,x.date,x.title].join('|');if(seen.has(k))return false;seen.add(k);return true})}
function textToSuggestions(text,source,hint='auto'){
 const lines=text.replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean),res=[];
 for(const line of lines){const ds=findDates(line);if(ds.length){for(const d of ds){const kind=classify(line,hint);res.push({id:uid(),checked:true,kind,date:d.date,title:cleanTitle(line,d.raw),source,raw:line,weight:parseWeight(line),target:parseTarget(line)})}}else if((hint==='assessment'||/평가|수행/.test(line))&&/%/.test(line)&&line.length<180){res.push({id:uid(),checked:true,kind:'assessment',date:'',title:cleanTitle(line),source,raw:line,weight:parseWeight(line),target:parseTarget(line)})}}
 return dedupeSuggestions(res);
}
function inferProfile(text){
 const foundOffice=Object.keys(OFFICES).find(n=>text.includes(n));
 let school=''; const sm=text.match(/([가-힣A-Za-z0-9·\- ]{2,30}(?:중학교|고등학교))/); if(sm)school=sm[1].replace(/\s+/g,' ').trim();
 let level=''; if(/고등학교/.test(school)||/고등학교/.test(text.slice(0,3000)))level='고등학교'; else if(/중학교/.test(school)||/중학교/.test(text.slice(0,3000)))level='중학교';
 return {office:foundOffice||'',school,level};
}
async function fileText(file){const ext=file.name.split('.').pop().toLowerCase();if(['txt','csv','ics'].includes(ext))return await file.text();if(['xlsx','xls'].includes(ext)){const ab=await file.arrayBuffer();const wb=XLSX.read(ab,{type:'array',cellDates:false});return wb.SheetNames.map(n=>XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n')}if(ext==='docx'){const ab=await file.arrayBuffer();const r=await mammoth.extractRawText({arrayBuffer:ab});return r.value}if(ext==='hwpx'){const zip=await JSZip.loadAsync(await file.arrayBuffer());const names=Object.keys(zip.files).filter(n=>/Contents\/section\d+\.xml$/i.test(n));let s='';for(const n of names)s+='\n'+(await zip.file(n).async('text')).replace(/<[^>]+>/g,' ');return s}if(ext==='pdf'){const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs');pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';const doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;let out='';for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i),c=await p.getTextContent();out+='\n'+c.items.map(x=>x.str).join(' ')}return out}throw new Error('지원하지 않는 형식')}
function parseICS(text,source){const r=[];for(const block of text.split('BEGIN:VEVENT').slice(1)){const dt=(block.match(/DTSTART(?:;[^:]*)?:(\d{8})/)||[])[1],sum=(block.match(/SUMMARY:(.*)/)||[])[1];if(dt&&sum)r.push({id:uid(),checked:true,kind:'calendar',date:`${dt.slice(0,4)}-${dt.slice(4,6)}-${dt.slice(6,8)}`,title:sum.trim(),source,raw:sum.trim()})}return r}
function renderSuggestions(){if(!suggestions.length){$('#suggestions').innerHTML='<div class="empty">추출된 항목이 없습니다.</div>';return}$('#suggestions').innerHTML=suggestions.map(s=>`<label class="suggestion"><input type="checkbox" data-sg="${s.id}" ${s.checked?'checked':''}><span class="tag">${s.kind==='calendar'?'학사':s.kind==='assessment'?'평가':'행정'}</span><span class="sg-date">${esc(s.date||'날짜 없음')}</span><span class="sg-title"><b>${esc(s.title)}</b><div class="source">${esc(s.source)}${s.weight?' · '+esc(s.weight):''}</div></span></label>`).join('')}
async function analyzeFiles(){
 if(!ensureYear())return;const files=[...$('#importFiles').files];if(!files.length){alert('파일을 선택해 주세요.');return}const hint=$('#importHint').value;$('#importStatus').textContent='자료를 읽고 있습니다...';let add=[],det=[];
 for(const f of files){try{const ext=f.name.split('.').pop().toLowerCase(),text=await fileText(f),profile=inferProfile(text);if(profile.office){cur().educationOffice=profile.office;det.push(profile.office)}if(profile.school&&!cur().schoolName){cur().schoolName=profile.school;det.push(profile.school)}if(profile.level&&(!cur().schoolLevel||cur().schoolLevel==='기타')){cur().schoolLevel=profile.level;det.push(profile.level)}const got=ext==='ics'?parseICS(text,f.name):textToSuggestions(text,f.name,hint);add.push(...got);cur().imports.push({id:uid(),name:f.name,kind:hint==='auto'?'자동판별':hint,when:new Date().toLocaleString('ko-KR'),detected:[profile.office,profile.school,profile.level].filter(Boolean).join(' · ')})}catch(e){add.push({id:uid(),checked:false,kind:'calendar',date:'',title:`${f.name} 분석 실패: ${e.message}`,source:f.name,raw:''})}}
 suggestions=dedupeSuggestions([...suggestions,...add]);$('#importStatus').textContent=`${files.length}개 파일에서 ${add.filter(x=>x.checked).length}개 후보를 찾았습니다.${det.length?' 학교 정보도 일부 자동 인식했습니다.':''}`;renderSuggestions();save();
}
function applySuggestions(){const y=cur();if(!y)return;const sel=suggestions.filter(x=>x.checked);let count=0;for(const s of sel){if(s.kind==='calendar'&&s.date){if(!y.calendarEvents.some(e=>e.date===s.date&&e.title===s.title)){y.calendarEvents.push({id:uid(),date:s.date,title:s.title,type:'학교',source:s.source});count++}}else if(s.kind==='assessment'){if(!y.assessments.some(e=>e.name===s.title&&e.due===s.date)){y.assessments.push({id:uid(),name:s.title,target:s.target||'',weight:s.weight||'',due:s.date||'',criteria:'',source:s.source});count++}}else if(s.kind==='admin'){if(!y.projects.some(e=>e.name===s.title&&e.due===s.date)){y.projects.push({id:uid(),name:s.title,desc:'',due:s.date||'',source:s.source});count++}}}suggestions=suggestions.filter(x=>!x.checked);renderSuggestions();save();alert(`${count}개 항목을 적용했습니다.`)}

function openYear(){const y=cur();$('#yYear').value=y?.year||new Date().getFullYear();$('#yLevel').value=y?.schoolLevel||'중학교';$('#yOffice').value=y?.educationOffice||'경기도교육청';$('#ySchool').value=y?.schoolName||'';openDlg('#yearDlg')}
function openSimple(kind){$('#simpleKind').value=kind;$('#simpleName').value='';$('#simpleMemo').value='';$('#simpleDue').value='';if(kind==='project'){$('#simpleTitle').textContent='문서에 없는 예외 업무';$('#simpleName').placeholder='업무명'}else{$('#simpleTitle').textContent='내년에 기억할 것';$('#simpleName').placeholder='기억할 내용'}openDlg('#simpleDlg')}
function runCheck(){const y=cur();if(!y)return;const p=policyFor(y),items=allUpcoming(y).filter(x=>{const d=dueDays(x.date);return d!==null&&d<=30}).slice(0,8).map(x=>`• ${x.type} · ${x.title}: ${dueText(x.date)}`);items.unshift(`• ${p.curriculum}${p.credit?' · 고교학점제':''}`);if(Number(y.year)>=2027)items.push(`• ${p.office} ${y.year}학년도 최신 학업성적관리 시행지침 발표 여부를 확인해야 합니다.`);$('#agentResult').innerHTML=items.map(esc).join('<br>')}

$('#yOffice').innerHTML=Object.keys(OFFICES).map(n=>`<option>${n}</option>`).join('');
$('#today').textContent=new Intl.DateTimeFormat('ko-KR',{dateStyle:'full'}).format(new Date());migrate();render();
$('#nav').addEventListener('click',e=>{const b=e.target.closest('button[data-view]');if(b)switchView(b.dataset.view)});document.addEventListener('click',e=>{if(e.target.closest('[data-go-policy]'))switchView('policy')});
$('#yearSelect').onchange=e=>{if(state.years[e.target.value]){state.currentYear=e.target.value;save()}};$('#newYear').onclick=openYear;$('#firstYear').onclick=openYear;
$('#yearForm').onsubmit=e=>{e.preventDefault();const yr=String($('#yYear').value);let y=state.years[yr]||yearObj(Number(yr),$('#yLevel').value,$('#ySchool').value.trim());y.year=Number(yr);y.schoolLevel=$('#yLevel').value;y.educationOffice=$('#yOffice').value;y.schoolName=$('#ySchool').value.trim()||y.schoolName||'';state.years[yr]=y;state.currentYear=yr;closeDlgs();save()};
$('#taskAdd').onclick=()=>{if(!ensureYear())return;const v=$('#taskInput').value.trim();if(v){cur().tasks.push({id:uid(),text:v,done:false});$('#taskInput').value='';save()}};$('#taskList').onclick=e=>{const c=e.target.closest('[data-task]'),d=e.target.closest('[data-task-del]');if(c){const t=cur().tasks.find(x=>x.id===c.dataset.task);if(t){t.done=c.checked;save()}}if(d){cur().tasks=cur().tasks.filter(x=>x.id!==d.dataset.taskDel);save()}};
$('#analyzeBtn').onclick=analyzeFiles;$('#applySuggestions').onclick=applySuggestions;$('#suggestions').onchange=e=>{const c=e.target.closest('[data-sg]');if(c){const s=suggestions.find(x=>x.id===c.dataset.sg);if(s)s.checked=c.checked}};
$('#manualCal').onclick=()=>ensureYear()&&openDlg('#calDlg');$('#calForm').onsubmit=e=>{e.preventDefault();cur().calendarEvents.push({id:uid(),date:$('#calDate').value,title:$('#calTitle').value.trim(),type:$('#calType').value,source:'예외 입력'});e.target.reset();closeDlgs();save()};$('#calendarList').onclick=e=>{const b=e.target.closest('[data-cal-del]');if(b){cur().calendarEvents=cur().calendarEvents.filter(x=>x.id!==b.dataset.calDel);save()}};
$('#assItems').onclick=e=>{const b=e.target.closest('[data-ass-del]');if(b){cur().assessments=cur().assessments.filter(x=>x.id!==b.dataset.assDel);save()}};
$('#projAdd').onclick=()=>ensureYear()&&openSimple('project');$('#memoryAdd').onclick=()=>ensureYear()&&openSimple('memory');$('#simpleForm').onsubmit=e=>{e.preventDefault();const kind=$('#simpleKind').value,name=$('#simpleName').value.trim(),memo=$('#simpleMemo').value.trim(),due=$('#simpleDue').value;if(kind==='project')cur().projects.push({id:uid(),name,desc:memo,due,source:'예외 입력'});else cur().memories.push({id:uid(),note:name,improve:memo,created:new Date().toISOString()});e.target.reset();closeDlgs();save()};
$('#agentRun').onclick=runCheck;$$('[data-close]').forEach(b=>b.onclick=closeDlgs);
