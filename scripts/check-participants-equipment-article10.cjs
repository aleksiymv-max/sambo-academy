'use strict';
// Article 10 equipment: targeted normative/editorial and progress-preservation regression.
// Structural checks are not a substitute for an independent referee's normative review.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
const mod=ctx.window.samboJudgeCourseEngine.modules[1];
assert.deepEqual(Array.from(mod.lessons,x=>x.title),[
 'Обязанности спортсмена',
 'Права спортсмена: информация, обращение и медицинская помощь',
 'Экипировка спортивного самбо',
 'Представитель команды и тренер',
 'Официальные лица и безопасность'
],'Participant lesson order and progress identifiers must remain unchanged');
const lesson=mod.lessons[2];
assert.ok(lesson.blocks.length>=9,'Article 10 lesson must have nine explanatory blocks');
assert.ok(lesson.checks.length>=6,'Article 10 lesson must have six self-check questions');
const body=[lesson.ref,lesson.goal,lesson.lead,...lesson.blocks.flat(),lesson.situation,lesson.caseAnalysis,lesson.decision,lesson.trap].join(' ').toLowerCase();
for(const token of [
 'статья 10(1)','статья 10(2)','статья 10(3)','статья 10(4)','статья 10(5)',
 'не менее 10 см','25–30 см','5 см','красно-синими','до середины бедра',
 'футболку из плотного материала','спортивный топик','твёрдые предметы',
 'эластичным наколенником','красной форме','учебный алгоритм',
 'не устанавливает универсальное наказание'
])assert.ok(body.includes(token),'Missing article 10 requirement or pedagogical distinction: '+token);
assert.ok(lesson.situation.length>=240&&lesson.caseAnalysis.length>=330&&lesson.decision.length>=330&&lesson.trap.length>=240,'Detailed practical case required');
const original=[
 ['Базовая спортивная форма самбиста состоит из чего?',0],
 ['Какая форма указана для церемонии награждения?',0],
 ['Какой минимальный просвет между рукой и рукавом требуется?',0],
 ['Как закрывают тейп на открытом колене?',0]
];
for(let i=0;i<original.length;i++){
 assert.equal(lesson.checks[i][0],original[i][0],'Original question changed');
 assert.equal(lesson.checks[i][2],original[i][1],'Original answer key changed');
}
const seen=new Set();
for(const [i,q] of lesson.checks.entries()){
 assert.equal(q[1].length,4,'Exactly four answer choices');
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4,'Valid correct answer index');
 assert.ok(!seen.has(q[0]),'Duplicate question');
 if(i>=original.length)assert.ok(q[3].length>=150,'New answers require substantive explanations');
 seen.add(q[0]);
}
for(const file of [
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js',
 'judge-exam-independent.js'
])vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
assert.equal(mod.questions.length,8,'Independent participant exam remains eight questions');
assert.equal(ctx.window.samboJudgeCourseEngine.modules.length,11,'All expanded modules preserved');
console.log('PASS: article 10 equipment, nine blocks, six checks, original keys and independent exam preserved');
