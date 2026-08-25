import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hwpxXmlToText} from '../scripts/v1-hwpx-structure-core.mjs';

const synthetic=`<?xml version="1.0" encoding="UTF-8"?>
<hp:section xmlns:hp="urn:synthetic-hwpx">
  <hp:p><hp:run><hp:t>2026학년도 평가계획</hp:t></hp:run></hp:p>
  <hp:tbl>
    <hp:tr>
      <hp:tc><hp:cellSpan colSpan="2" rowSpan="1"/><hp:p><hp:run><hp:t>평가명</hp:t></hp:run></hp:p></hp:tc>
      <hp:tc><hp:p><hp:run><hp:t>일자</hp:t></hp:run></hp:p></hp:tc>
    </hp:tr>
    <hp:tr>
      <hp:tc><hp:p><hp:run><hp:t>합주 수행평가</hp:t></hp:run></hp:p></hp:tc>
      <hp:tc><hp:p><hp:run><hp:t>30%</hp:t></hp:run></hp:p></hp:tc>
      <hp:tc><hp:p><hp:run><hp:t>9월 3일</hp:t></hp:run></hp:p></hp:tc>
    </hp:tr>
  </hp:tbl>
  <hp:p><hp:run><hp:t>확인 문장 &amp; 후속 안내</hp:t></hp:run></hp:p>
</hp:section>`;
const text=hwpxXmlToText(synthetic);
const lines=text.split('\n').filter(Boolean);
assert.equal(lines[0],'2026학년도 평가계획');
assert.equal(lines[1],'평가명\t\t일자','merged two-column cell must retain an empty column placeholder');
assert.equal(lines[2],'합주 수행평가\t30%\t9월 3일','table rows and cells must remain distinct');
assert.equal(lines[3],'확인 문장 & 후속 안내','XML entities must decode without flattening paragraphs');
assert.equal(lines.length,4,'synthetic HWPX should not create duplicate table text');

const prep=fs.readFileSync('scripts/prepare-v1-hwpx-structure.mjs','utf8');
assert.ok(prep.includes('v1-hwpx-structure-core.mjs'));
assert.ok(prep.includes("if(ext==='hwpx')"));
assert.ok(prep.includes('.sort((a,b)=>Number((a.match('),'HWPX sections must be processed in numeric section order');
assert.ok(prep.includes('still flattens XML structure'));
console.log('v1 structured HWPX extraction tests passed');
