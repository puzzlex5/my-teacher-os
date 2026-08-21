const fs=require('fs');
function assert(cond,msg){if(!cond){console.error('FAIL:',msg);process.exit(1)}}
const js=fs.readFileSync('app-v08.js','utf8');
const html=fs.readFileSync('app-v08.html','utf8');
assert(js.includes("input.addEventListener('change'"),'file selection should trigger analysis immediately');
assert(js.includes('applySuggestions()'),'high-confidence results should auto-apply');
assert(js.includes('불확실한 항목만 검토함'),'UI should explain review-only exceptions');
assert(html.includes('app-v08.js'),'v0.8 loader should include immediate-apply script');
console.log('v0.8 tests passed');
