import assert from 'node:assert';
import fs from 'node:fs';

const app=fs.readFileSync('app-v23.js','utf8');

assert.ok(app.includes('const extracted=await extractSmart23(file,y)'),'v23 must still perform full local extraction while analyzing');
assert.ok(app.includes('sourceSuggestions23(extracted,file,y,doc,batchId)'),'v23 must still use extracted content to generate suggestions before releasing report references');
assert.ok(app.includes('suggestions=C.dedupe('),'v23 must still retain actionable suggestions for user review');
assert.ok(app.includes('report.pageCount=Number(extracted.pageCount||0)'),'batch report should retain only a non-sensitive page-count summary');
assert.ok(!app.includes('report.extracted='),'batch report must not retain full extracted text/OCR/layout objects after analysis');
assert.ok(!app.includes('report.suggestions='),'batch report must not duplicate raw suggestion details already held by the review queue');

console.log('v1 v23 transient document-memory hygiene checks passed.');
