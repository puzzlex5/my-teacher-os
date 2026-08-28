import fs from 'node:fs';

const path='app-v27.js';
let src=fs.readFileSync(path,'utf8');

function replaceOnce(before,after,label){
  if(src.includes(after))return;
  if(!src.includes(before))throw new Error(`prepare-v1-v27-contact-cache: missing ${label}`);
  src=src.replace(before,after);
}

replaceOnce(
  '  let timer27=null;\n',
  '  let timer27=null,contactsCache27=null,contactsLoadFailed27=false;\n',
  'contact cache declaration'
);

replaceOnce(
  "  function contacts(){try{const x=JSON.parse(localStorage.getItem(CONTACT_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}\n  function saveContacts(rows){localStorage.setItem(CONTACT_KEY,JSON.stringify(rows||[]))}\n",
  "  function contacts(){if(contactsCache27)return contactsCache27;let raw;try{raw=localStorage.getItem(CONTACT_KEY)}catch{contactsLoadFailed27=true;contactsCache27=[];return contactsCache27}if(raw===null){contactsLoadFailed27=false;contactsCache27=[];return contactsCache27}try{const x=JSON.parse(raw);if(!Array.isArray(x))throw new Error('invalid-contact-shape');contactsLoadFailed27=false;contactsCache27=x}catch{contactsLoadFailed27=true;contactsCache27=[]}return contactsCache27}\n  function saveContacts(rows){const next=Array.isArray(rows)?rows:[];if(contactsLoadFailed27)throw new Error('기존 연락처 저장 데이터를 불러오지 못해 덮어쓰기를 중단했습니다. 먼저 전체 삭제로 손상 데이터를 명시적으로 초기화한 뒤 다시 가져오세요.');localStorage.setItem(CONTACT_KEY,JSON.stringify(next));contactsCache27=next;contactsLoadFailed27=false}\n  function clearContacts(){localStorage.removeItem(CONTACT_KEY);contactsCache27=[];contactsLoadFailed27=false}\n",
  'cached contact storage helpers'
);

replaceOnce(
  "  function renderContacts(){const query=(q('#contactSearch27')?.value||'').trim().toLowerCase(),rows=contacts().filter(r=>!query||[r.name,r.extension,r.department,r.room].some(v=>String(v||'').toLowerCase().includes(query))).slice(0,80),box=q('#contactList27');if(!box)return;const emptyText=contacts().length?'검색 결과가 없습니다.':'연락처 파일을 한 번 불러오세요.';box.innerHTML=rows.length?rows.map(r=>`<div class=\"contact-row27\"><div><b>${esc(r.name)}</b><span>${esc([r.department,r.room].filter(Boolean).join(' · ')||'부서/위치 미등록')}</span></div><button type=\"button\" class=\"contact-ext27\" data-copy-ext27=\"${esc(r.extension)}\">${esc(r.extension||'내선 없음')}</button></div>`).join(''):`<div class=\"empty\">${esc(emptyText)}</div>`}\n",
  "  function renderContacts(){const query=(q('#contactSearch27')?.value||'').trim().toLowerCase(),all=contacts(),rows=all.filter(r=>!query||[r.name,r.extension,r.department,r.room].some(v=>String(v||'').toLowerCase().includes(query))).slice(0,80),box=q('#contactList27');if(!box)return;const emptyText=contactsLoadFailed27?'저장된 연락처를 불러오지 못했습니다. 데이터가 손상됐을 수 있습니다. 전체 삭제로 초기화하거나 브라우저 저장소를 복구하세요.':all.length?'검색 결과가 없습니다.':'연락처 파일을 한 번 불러오세요.';box.innerHTML=rows.length?rows.map(r=>`<div class=\"contact-row27\"><div><b>${esc(r.name)}</b><span>${esc([r.department,r.room].filter(Boolean).join(' · ')||'부서/위치 미등록')}</span></div><button type=\"button\" class=\"contact-ext27\" data-copy-ext27=\"${esc(r.extension)}\">${esc(r.extension||'내선 없음')}</button></div>`).join(''):`<div class=\"empty\">${esc(emptyText)}</div>`}\n",
  'single-read contact render with explicit load failure state'
);

replaceOnce(
  "if(e.target.closest('#contactClear27')){if(confirm('이 브라우저에 저장된 교무실 연락처를 모두 삭제할까요?')){saveContacts([]);renderContacts();q('#contactStatus27').textContent='연락처를 삭제했습니다.'}return}",
  "if(e.target.closest('#contactClear27')){if(confirm('이 브라우저에 저장된 교무실 연락처를 모두 삭제할까요?')){clearContacts();renderContacts();q('#contactStatus27').textContent='연락처를 삭제했습니다.'}return}",
  'explicit contact reset path'
);

fs.writeFileSync(path,src);
console.log('Prepared v1 Teacher Desk contact cache with explicit unreadable-vs-empty state and fail-closed overwrite protection.');
