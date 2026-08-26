import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const R=require('../core-v25.js');

for(const noun of ['진로','성과','사고','의도']){
  if(!R.tokens(noun).includes(noun))throw new Error(`short Korean semantic noun was truncated: ${noun}`);
}

const directional=R.grounding('음악으로 감정을 표현함.',[{text:'음악을 활용해 감정을 표현함.'}]);
if(directional.ratio!==1)throw new Error('long particle normalization regressed');

const career=R.grounding('음악 진로를 조사하고 발표함.',[{text:'음악 관련 진로를 탐색하고 조사함.'}]);
if(career.ratio!==1)throw new Error('진로 must survive normalization and support grounding');

console.log('v1 v25 Korean short-noun particle normalization tests passed');
