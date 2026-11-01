'use strict';
// Article 9(1) duties: evidence-based lesson-depth and preservation regression.
// Marker checks do not replace independent normative review by a referee.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
const mod=ctx.window.samboJudgeCourseEngine.modules[1];
assert.deepEqual(Array.from(mod.lessons,l=>l.title),[
 'Обязанности спортсмена',
 'Права спортсмена: информация, обращение и медицинская помощь',
 'Экипировка спортивного самбо',
 'Представитель команды и тренер',
 'Официальные лица и безопасность'
],'Participant lesson order and progress keys must remain unchanged');
const lesson=mod.lessons[0];
assert.ok(lesson.blocks.length>=9,'Nine explanatory blocks expected');
assert.ok(lesson.checks.length>=6,'Six self-check questions expected, including article 39 handshake case');
const body=[lesson.ref,lesson.goal,lesson.lead,...lesson.blocks.flat(),lesson.situation,lesson.caseAnalysis,lesson.decision,lesson.trap].join(' ').toLowerCase();
for(const token of [
 'статья 9(1)','положение','вызову','немедленно сообщить',
 'рукопожатия','корректного отношения','короткой бородой',
 'ногтями','20 см','медицинский допуск','статью 10',
 'статью 3(5)','специальную норму','учебная последовательность',
 'статья 39(3)','статьи 39(1)','статье 40(3)','спортивном самбо'
])assert.ok(body.includes(token),'Missing article 9 distinction: '+token);
assert.ok(lesson.situation.length>=230&&lesson.caseAnalysis.length>=270&&lesson.decision.length>=240&&lesson.trap.length>=170,'Worked case requires evidence, conclusion and trap');
const original=[
 ['Какова обязанность спортсмена по статье 9?',0],
 ['Что делать, если спортсмен не может продолжать турнир?',0]
];
for(let i=0;i<original.length;i++){
 assert.equal(lesson.checks[i][0],original[i][0],'Original self-check prompt changed');
 assert.equal(lesson.checks[i][2],original[i][1],'Original answer index changed');
}
const handshake=lesson.checks.find(q=>q[0].includes('отказался пожать руку'));
assert.ok(handshake,'Article 39 handshake self-check is missing');
assert.equal(handshake[2],0,'Handshake answer must follow chief referee procedure');
assert.ok(handshake[3].includes('39(3)')&&handshake[3].includes('40(3)'),
 'Handshake answer must explain the explicit sanction and approval procedure');
const seen=new Set();
for(const [i,q] of lesson.checks.entries()){
 assert.equal(q[1].length,4,'Exactly four answer options');
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4,'Correct index in range');
 assert.ok(!seen.has(q[0]),'Duplicate self-check');
 if(i>=original.length)assert.ok(q[3].length>=120,'New answer explanation must be developed');
 seen.add(q[0]);
}
for(const file of [
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js',
 'judge-exam-independent.js'
])vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
assert.equal(mod.questions.length,8,'Independent participant exam remains eight questions');
assert.equal(ctx.window.samboJudgeCourseEngine.modules.length,11,'All eleven expanded modules preserved');
console.log('PASS: article 9 duties, nine blocks, five questions, original answers, order and independent exam preserved');
