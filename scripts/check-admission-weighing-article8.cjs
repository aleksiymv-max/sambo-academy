'use strict';
// Focused regression for the article 8 weighing lesson. Structural/normative markers
// are not a substitute for an independent referee's point-by-point review.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-admission.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
const mod=ctx.window.samboJudgeCourseEngine.modules[0];
assert.deepEqual(Array.from(mod.lessons,l=>l.title),[
 'Антидопинг и медицинское обеспечение',
 'Противоправное влияние на результаты',
 'Возрастные группы и весовые категории',
 'Взвешивание участников: процедура и фиксация',
 'Сквозной алгоритм допуска'
],'Lesson order and progress indices must not change');
const l=mod.lessons[3];
assert.ok(l.blocks.length>=10,'Ten explained article 8 sections expected');
assert.ok(l.checks.length>=7,'Seven self-checks expected');
const body=[l.ref,l.goal,l.lead,...l.blocks.flat(),l.situation,l.caseAnalysis,l.decision,l.trap].join(' ').toLowerCase();
for(const token of [
 'статья 8','приложение № 9','одной весовой категории','30 минут',
 'за два часа','один раз','одних и тех же весах','представитель секретариата',
 'одного пола','врач','нижнем белье','без одежды','младше 14 лет',
 'справка с фотографией','анкету','58,1','64,0','64,1','«нв»',
 'подпись спортсмена','следующей весовой категории','квот',
 'руководитель вычёркивает','подписывают все члены'
])assert.ok(body.includes(token),'Missing article 8 distinction: '+token);
assert.ok(l.situation.length>=200&&l.caseAnalysis.length>=200&&l.decision.length>=250&&l.trap.length>=150,'Worked case needs evidence and explanation');
assert.ok(l.situation.includes('70,9')&&l.situation.includes('71,2'),'Control/official comparison missing');
const original=[
 ['Сколько официальных попыток даёт статья 8?',0],
 ['Сколько длится пляжное взвешивание?',0],
 ['Что делать при несоответствии веса своей категории?',0],
 ['Кто может находиться в помещении при официальном взвешивании?',0],
 ['С какой точностью записывают массу спортсмена?',0]
];
for(let i=0;i<original.length;i++){
 assert.equal(l.checks[i][0],original[i][0],'Original self-check prompt changed');
 assert.equal(l.checks[i][2],original[i][1],'Original correct index changed');
}
const questions=new Set();
for(const q of l.checks){
 assert.equal(q[1].length,4,'Four choices per question');
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4,'Valid correct answer index');
 assert.ok(q[3].length>=100,'Explain every answer with a source anchor');
 assert.ok(!questions.has(q[0]),'Duplicate self-check');
 questions.add(q[0]);
}
for(const file of ['judge-program-participants.js','judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js','judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js','judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
assert.equal(mod.questions.length,8,'Independent admission exam must remain eight questions');
console.log('PASS: article 8 weighing, ten sections, seven explained checks, original questions, lesson order and independent exam preserved');
