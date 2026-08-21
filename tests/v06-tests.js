const V6=require('../core-v06.js');
function ok(name,cond){if(!cond)throw new Error('FAIL: '+name);console.log('PASS',name)}
ok('307 label -> 3-7',V6.targetFromLabel('307 음악')==='3-7');
ok('208 label -> 2-8',V6.targetFromLabel('208 음악')==='2-8');
ok('grade scope matches class',V6.scopeMatches('2학년','2-8')===true);
ok('grade scope excludes other grade',V6.scopeMatches('2학년','3-4')===false);
ok('partial event does not block automatically',V6.eventBlocksTarget({title:'2학년 봉사활동',scope:'2학년',impact:'partial'},'2-8')===false);
ok('no-class event blocks target only',V6.eventBlocksTarget({title:'2학년 진로행사',scope:'2학년',impact:'no-class'},'2-8')===true&&V6.eventBlocksTarget({title:'2학년 진로행사',scope:'2학년',impact:'no-class'},'3-4')===false);
const tt=[{day:'월',period:1,label:'208 음악',target:'2-8'},{day:'수',period:2,label:'208 음악',target:'2-8'},{day:'월',period:2,label:'304 음악',target:'3-4'}];
const cal=[{date:'2026-08-24',title:'2학년 학년행사',scope:'2학년',impact:'no-class'}];
ok('class-specific calendar removes only affected class',V6.countClassTeachingSlots(tt,cal,[],'2-8','2026-08-24','2026-08-26')===1&&V6.countClassTeachingSlots(tt,cal,[],'3-4','2026-08-24','2026-08-26')===1);
const ex=[{date:'2026-08-26',target:'2-8',period:2,action:'cancel'}];
ok('date exception cancels exact class slot',V6.countClassTeachingSlots(tt,[],ex,'2-8','2026-08-24','2026-08-26')===1);
const stats=V6.paceStats({'2-1':{lesson:10},'2-2':{lesson:8}},['2-1','2-2']);
ok('pace gap calculated',stats.find(x=>x.target==='2-1').gap===1&&stats.find(x=>x.target==='2-2').gap===-1);
ok('middle grade 3 defaults early finish',V6.defaultPaceStrategy('중학교','3')==='조기완료');
ok('middle grade 2 defaults slower pace',V6.defaultPaceStrategy('중학교','2')==='여유진행');
console.log('v0.6 tests passed');
