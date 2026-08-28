import assert from 'node:assert';
import fs from 'node:fs';

const src=fs.readFileSync('app-v08.js','utf8');
assert.ok(src.includes('function bindLegacyIntakeV8()'));
assert.ok(src.includes('if(input.dataset.v23)return;'));
assert.ok(src.includes("input.addEventListener('change'"));
assert.ok(src.includes('setTimeout(bindLegacyIntakeV8,0)'));
assert.ok(src.includes('applySuggestions()'));
console.log('v08 intake handoff guard passed');
