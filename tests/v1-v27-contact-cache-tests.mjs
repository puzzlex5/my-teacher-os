import assert from 'node:assert';
import fs from 'node:fs';

const src=fs.readFileSync('app-v27.js','utf8');

assert.ok(src.includes('contactsCache27=null'),'v27 contact cache declaration missing');
assert.ok(src.includes('if(contactsCache27)return contactsCache27'),'v27 contacts must reuse the in-memory cache');
assert.ok(src.includes('contactsCache27=next'),'v27 contact writes must refresh the cache');
assert.ok(src.includes("all=contacts(),rows=all.filter"),'v27 contact render must read contacts once per render');
assert.ok(src.includes("const emptyText=all.length?'검색 결과가 없습니다.'"),'v27 empty-state decision must reuse the same contact snapshot');
assert.ok(!src.includes("rows=contacts().filter"),'v27 render must not reparse contacts for filtering');
assert.ok(!src.includes("const emptyText=contacts().length"),'v27 render must not reparse contacts for empty-state checks');
assert.ok(src.includes("localStorage.setItem(CONTACT_KEY,JSON.stringify(next))"),'contacts must remain local-only browser storage');

console.log('v1 Teacher Desk contact cache tests passed');
