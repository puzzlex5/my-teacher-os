const fs=require('fs');
function assert(cond,msg){if(!cond){console.error('FAIL:',msg);process.exit(1)}}
const js=fs.readFileSync('app-v08.js','utf8');
const html=fs.readFileSync('app-v08.html','utf8');
assert(js.includes("input.addEventListener('change'"),'legacy fallback should still support immediate file analysis');
assert(js.includes('applySuggestions()'),'legacy fallback should preserve high-confidence auto-apply');
assert(js.includes('불확실한 항목만 검토함'),'UI should explain review-only exceptions');
assert(js.includes('function bindLegacyIntakeV8()'),'v1 should defer the legacy v08 intake binding');
assert(js.includes('if(input.dataset.v23)return;'),'v1 should yield intake ownership when v23 has claimed the file input');
assert(js.includes('setTimeout(bindLegacyIntakeV8,0)'),'v1 should let later v23 initialization claim the primary intake path before fallback binding');
assert(html.includes('app-v08.js'),'v0.8 loader should include immediate-apply script');
console.log('v0.8 tests passed');
