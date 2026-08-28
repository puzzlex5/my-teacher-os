import assert from 'node:assert';
import fs from 'node:fs';

const src=fs.readFileSync('app-v27.js','utf8');

assert.ok(src.includes('contactsCache27=null,contactsLoadFailed27=false'),'v27 contact cache/load-state declaration missing');
assert.ok(src.includes('if(contactsCache27)return contactsCache27'),'v27 contacts must reuse the in-memory cache');
assert.ok(src.includes('const storage=globalThis.TeacherOSStorage;if(storage?.readJSONArray)'),'contacts must prefer the shared array storage reader');
assert.ok(src.includes('contactsLoadFailed27=storage.hasReadError(CONTACT_KEY)'),'shared contact reads must preserve unreadable-vs-empty truth state');
assert.ok(src.includes("if(raw===null){contactsLoadFailed27=false;contactsCache27=[];return contactsCache27}"),'fallback missing-contact key must remain a verified empty state');
assert.ok(src.includes("if(!Array.isArray(x))throw new Error('invalid-contact-shape')"),'fallback non-array stored contacts must be rejected as unreadable');
assert.ok(src.includes('contactsLoadFailed27=true;contactsCache27=[]'),'fallback contact read/parse failures must remain distinguishable from no contacts');
assert.ok(src.includes("if(contactsLoadFailed27)throw new Error('기존 연락처 저장 데이터를 불러오지 못해 덮어쓰기를 중단했습니다."),'unreadable contacts must block implicit overwrite');
assert.ok(src.includes('if(storage?.writeJSONArray)storage.writeJSONArray(CONTACT_KEY,next)'),'contacts must prefer the shared lossless array writer');
assert.ok(src.includes('else localStorage.setItem(CONTACT_KEY,JSON.stringify(next))'),'historical fallback must remain local-only for parity');
assert.ok(src.includes('contactsCache27=next;contactsLoadFailed27=false'),'successful contact writes must refresh cache and verified state');
assert.ok(src.includes('if(storage?.removeJSON)storage.removeJSON(CONTACT_KEY);else localStorage.removeItem(CONTACT_KEY)'),'explicit reset must use the shared storage reset when available');
assert.ok(src.includes("all=contacts(),rows=all.filter"),'v27 contact render must read contacts once per render');
assert.ok(src.includes("const emptyText=contactsLoadFailed27?'저장된 연락처를 불러오지 못했습니다."),'contact UI must distinguish load failure from verified empty contacts');
assert.ok(src.includes("all.length?'검색 결과가 없습니다.':'연락처 파일을 한 번 불러오세요.'"),'verified empty/search states must remain distinct');
assert.ok(!src.includes("rows=contacts().filter"),'v27 render must not reparse contacts for filtering');
assert.ok(!src.includes("const emptyText=contacts().length"),'v27 render must not reparse contacts for empty-state checks');
assert.ok(src.includes("{clearContacts();renderContacts();q('#contactStatus27').textContent='연락처를 삭제했습니다.'}"),'user-confirmed clear must be the explicit destructive recovery path');
assert.ok(!src.includes("{saveContacts([]);renderContacts();q('#contactStatus27').textContent='연락처를 삭제했습니다.'}"),'clear action must not pass through fail-closed normal save path');

console.log('v1 Teacher Desk shared contact storage/cache/truth tests passed');
