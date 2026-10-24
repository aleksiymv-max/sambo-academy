'use strict';
// Editorial regression for admission articles 3, 5–8, 17 and appendices 8–9.
// This checks lesson completeness and preservation; it is not a federation approval.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-admission.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
const mod=ctx.window.samboJudgeCourseEngine.modules[0];
assert.equal(mod.lessons.length,5,'Preserve admission lesson count and progress positions');
assert.deepEqual(Array.from(mod.lessons,l=>l.title),[
 'Антидопинг и медицинское обеспечение',
 'Противоправное влияние на результаты',
 'Возрастные группы и весовые категории',
 'Взвешивание участников: процедура и фиксация',
 'Сквозной алгоритм допуска'
]);
for(const [i,terms] of [
 [2,['статья 5','статья 7','18 лет','18–25','до 24','на день соревнования','статья 6','пляжного самбо','представитель проводящей организации']],
 [4,['статья 3','статья 5','статья 8','приложение 9','полис ОМС','комиссию по допуску','официального взвешивания','сетка']]
]){
 const lesson=mod.lessons[i];
 assert.ok(lesson.blocks.length>=8,'Need eight explained blocks: '+lesson.title);
 assert.ok(lesson.checks.length>=5,'Need five self-checks: '+lesson.title);
 const prose=(lesson.ref+' '+lesson.blocks.flat().join(' ')+' '+lesson.situation+' '+lesson.caseAnalysis+' '+lesson.decision).toLowerCase();
 for(const term of terms)assert.ok(prose.includes(term.toLowerCase()),'Missing admission distinction: '+term);
 assert.ok(lesson.situation.length>=130&&lesson.caseAnalysis.length>=130,'Need worked case facts');
 assert.ok(lesson.decision.length>=140&&lesson.trap.length>=100,'Need grounded conclusion and common error');
 const unique=new Set();
 for(const q of lesson.checks){
  assert.equal(q[1].length,4,'Self-check must have four choices');
  assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4,'Bad correct index');
  assert.ok(q[3].length>=65,'Self-check needs normative explanation');
  assert.ok(!unique.has(q[0]),'Repeated question');
  unique.add(q[0]);
 }
}
console.log('PASS: admission ages, weight tables, commission, insurance and documented weighing; 5 lessons preserved');
