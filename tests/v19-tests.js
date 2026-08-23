const fs=require('fs');
const lib=JSON.parse(fs.readFileSync('work-library.json','utf8'));
const js=fs.readFileSync('app-v19.js','utf8');
const css=fs.readFileSync('app-v19.css','utf8');
const index=fs.readFileSync('index.html','utf8');
if(!Array.isArray(lib.packs)||lib.packs.length<20)throw new Error('work pack library must contain at least 20 packs');
for(const id of ['assessment','student-record','school-violence','festival-art','international-exchange','highschool-credit','free-semester']){
  if(!lib.packs.some(p=>p.id===id))throw new Error('missing work pack '+id);
}
if(!lib.sources?.some(s=>/goe\.go\.kr/.test(s.url)))throw new Error('official education-office source missing');
if(!lib.sources?.some(s=>/moe\.go\.kr/.test(s.url)))throw new Error('official Ministry source missing');
if(!js.includes('추천 업무 모두 가져오기')||!js.includes('data-pack-install'))throw new Error('one-click install UI missing');
if(!js.includes('workPacks')||!js.includes('recommended(y)'))throw new Error('work pack state/recommendation missing');
if(!js.includes("if(p.source==='Teacher OS 업무 라이브러리')return false"))throw new Error('library-created project must be removed with its pack');
if(!js.includes('delete p.workPackId;delete p.libraryLinked;return true'))throw new Error('preexisting linked project must be preserved when pack is removed');
if(!css.includes('.wp-grid')||!css.includes('.wp-installed-list'))throw new Error('work library styles missing');
if(!index.includes('app-v19.js')||!index.includes('app-v19.css'))throw new Error('v0.19 loader missing');
console.log('v0.19 work pack library tests passed');
