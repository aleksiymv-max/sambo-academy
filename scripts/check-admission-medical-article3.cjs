'use strict';
// Regression for the article 3 medical/anti-doping lesson; not normative approval.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-admission.js'])
  vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const mod=ctx.window.samboJudgeCourseEngine.modules[0];
assert.equal(mod.lessons.length,5,'Admission lesson positions must be preserved');
assert.equal(mod.lessons[0].title,'Антидопинг и медицинское обеспечение');
assert.equal(mod.lessons[1].title,'Противоправное влияние на результаты');
const lesson=mod.lessons[0];
assert.ok(lesson.blocks.length>=9,'Article 3 needs nine explained sections');
assert.ok(lesson.checks.length>=5,'Article 3 needs five self-checks');
const text=[lesson.ref,lesson.lead,lesson.blocks.flat().join(' '),
 lesson.situation,lesson.caseAnalysis,lesson.decision,lesson.trap].join(' ').toLowerCase();
for(const term of ['статья 3(1)','статья 3(2)','статья 3(3)','статья 3(4)',
 'статья 3(5)','статья 3(6)','статья 3(7)','1144н','русадa'.replace('a','а'),
 'терапевтическое использование','допущен','личной печатью',
 'страхования жизни и здоровья','омс','учебный алгоритм'])
 assert.ok(text.includes(term.toLowerCase()),'Missing article 3 concept: '+term);
assert.ok(lesson.situation.length>=200&&lesson.caseAnalysis.length>=200,
 'Case must identify distinct factual and normative issues');
assert.ok(lesson.decision.length>=200&&lesson.trap.length>=100,
 'Case conclusion and common error must be explained');
for(const q of lesson.checks){
 assert.equal(q[1].length,4,'Four alternatives required');
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4,'Valid answer index required');
 assert.ok(q[3].length>=100,'Answer must have normative explanation');
}
assert.equal(new Set(lesson.checks.map(q=>q[0])).size,lesson.checks.length,
 'Self-checks must not repeat');
assert.equal(mod.questions.length,8,'Independent exam bank must remain unchanged');
console.log('PASS: article 3 medical/anti-doping distinctions, worked case, five checks; lesson positions and eight exam questions preserved');
