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
  '  let timer27=null,contactsCache27=null;\n',
  'contact cache declaration'
);

replaceOnce(
  "  function contacts(){try{const x=JSON.parse(localStorage.getItem(CONTACT_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}\n  function saveContacts(rows){localStorage.setItem(CONTACT_KEY,JSON.stringify(rows||[]))}\n",
  "  function contacts(){if(contactsCache27)return contactsCache27;try{const x=JSON.parse(localStorage.getItem(CONTACT_KEY)||'[]');contactsCache27=Array.isArray(x)?x:[]}catch{contactsCache27=[]}return contactsCache27}\n  function saveContacts(rows){const next=Array.isArray(rows)?rows:[];localStorage.setItem(CONTACT_KEY,JSON.stringify(next));contactsCache27=next}\n",
  'cached contact storage helpers'
);

replaceOnce(
  "  function renderContacts(){const query=(q('#contactSearch27')?.value||'').trim().toLowerCase(),rows=contacts().filter(r=>!query||[r.name,r.extension,r.department,r.room].some(v=>String(v||'').toLowerCase().includes(query))).slice(0,80),box=q('#contactList27');if(!box)return;const emptyText=contacts().length?'검색 결과가 없습니다.':'연락처 파일을 한 번 불러오세요.';box.innerHTML=rows.length?rows.map(r=>`<div class=\"contact-row27\"><div><b>${esc(r.name)}</b><span>${esc([r.department,r.room].filter(Boolean).join(' · ')||'부서/위치 미등록')}</span></div><button type=\"button\" class=\"contact-ext27\" data-copy-ext27=\"${esc(r.extension)}\">${esc(r.extension||'내선 없음')}</button></div>`).join(''):`<div class=\"empty\">${esc(emptyText)}</div>`}\n",
  "  function renderContacts(){const query=(q('#contactSearch27')?.value||'').trim().toLowerCase(),all=contacts(),rows=all.filter(r=>!query||[r.name,r.extension,r.department,r.room].some(v=>String(v||'').toLowerCase().includes(query))).slice(0,80),box=q('#contactList27');if(!box)return;const emptyText=all.length?'검색 결과가 없습니다.':'연락처 파일을 한 번 불러오세요.';box.innerHTML=rows.length?rows.map(r=>`<div class=\"contact-row27\"><div><b>${esc(r.name)}</b><span>${esc([r.department,r.room].filter(Boolean).join(' · ')||'부서/위치 미등록')}</span></div><button type=\"button\" class=\"contact-ext27\" data-copy-ext27=\"${esc(r.extension)}\">${esc(r.extension||'내선 없음')}</button></div>`).join(''):`<div class=\"empty\">${esc(emptyText)}</div>`}\n",
  'single-read contact render'
);

fs.writeFileSync(path,src);
console.log('Prepared v1 Teacher Desk contact cache without changing local-only storage semantics.');
