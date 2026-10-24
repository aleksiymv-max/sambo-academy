'use strict';
// Article 11 representatives/coaches and article 41 protest procedure.
// Editorial regression only: independent normative acceptance still required.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const name of ['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js'])
 vm.runInContext(fs.readFileSync(name,'utf8'),ctx,{filename:name});
const mod=ctx.window.samboJudgeCourseEngine.modules[1];
assert.deepEqual(Array.from(mod.lessons,l=>l.title),[
 'Обязанности спортсмена',
 'Права спортсмена: информация, обращение и медицинская помощь',
 'Экипировка спортивного самбо',
 'Представитель команды и тренер',
 'Официальные лица и безопасность'
],'Lesson order and progress positions must remain stable');
const l=mod.lessons[3];
assert.ok(l.blocks.length>=11,'Article 11 lesson needs 11 explanation blocks');
assert.ok(l.checks.length>=7,'Article 11 lesson needs seven self-check questions');
const body=[l.ref,l.goal,l.lead,...l.blocks.flat(),l.situation,l.caseAnalysis,l.decision,l.trap].join(' ').toLowerCase();
for(const token of [
 'статья 11(1)','статья 11(2)','статья 11(3)','статья 11(4)',
 'статья 11(5)','статья 11(6)','статья 11(7)','статья 11(8)',
 'статья 11(9)','статья 11(10)','статья 41(1–2)','статья 41(2)(а)',
 'статья 41(2)(б)','статья 41(3–4)','статья 41(5)',
 'в день фиксации нарушения','непосредственно во время соревнований',
 'различаются','не является автоматическим','учебный алгоритм'
])assert.ok(body.includes(token),'Missing article 11/41 normative distinction: '+token);
assert.ok(l.situation.length>380&&l.caseAnalysis.length>400&&l.decision.length>450&&l.trap.length>250,
 'Detailed scenario, analysis, decision and traps required');
const original=[
 ['Кто подаёт письменный протест?',0],
 ['Может ли представитель быть судьёй тех же соревнований?',0]
];
for(let i=0;i<original.length;i++){
 assert.equal(l.checks[i][0],original[i][0],'Original self-check question changed');
 assert.equal(l.checks[i][2],original[i][1],'Original answer key changed');
}
const seen=new Set();
for(const [i,q] of l.checks.entries()){
 assert.equal(q[1].length,4,'Each self-check must have four options');
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4,'Answer index must be valid');
 assert.ok(!seen.has(q[0]),'Duplicate question');
 if(i>=original.length)assert.ok(q[3].length>=145,'New answer explanations must be substantive');
 seen.add(q[0]);
}
for(const name of [
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js',
 'judge-exam-independent.js'
])vm.runInContext(fs.readFileSync(name,'utf8'),ctx,{filename:name});
assert.equal(mod.questions.length,8,'Independent module exam must be preserved');
assert.equal(ctx.window.samboJudgeCourseEngine.modules.length,11,'All expanded modules must remain');
const independentQuestions=new Set(mod.questions.map(q=>q.q.trim().toLowerCase()));
assert.equal([...seen].filter(q=>independentQuestions.has(q.trim().toLowerCase())).length,0,
 'Self-checks must not duplicate independent exam');
console.log('PASS: article 11/41, eleven blocks, seven checks, source discrepancy, original answers and exam preserved');
