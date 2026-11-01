'use strict';
// Regression for seven-topic admission sequence, source tables and revised exam.
// Normative content was editorially checked against the provided 112-page Rules PDF;
// this script verifies structure/data integrity, not an external qualification.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
const files=[
 'judge-course-engine.js','judge-program-admission.js','judge-program-admission-v2.js',
 'judge-program-participants.js','judge-program-officials.js','judge-program-bout.js',
 'judge-program-scoring.js','judge-program-sanctions.js','judge-program-infrastructure.js',
 'judge-program-combat.js','judge-program-beach.js','judge-program-demo.js',
 'judge-program-practicum.js','judge-exam-independent.js','judge-admission-exam-v3.js'
];
for(const f of files)vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const mod=ctx.window.samboJudgeCourseEngine.modules[0];
assert.equal(ctx.window.samboJudgeAdmissionV2Loaded,true);
assert.equal(ctx.window.samboJudgeAdmissionExamV3Loaded,true);
assert.equal(mod.lessons.length,7);
assert.equal(mod.questions.length,24);
assert.equal(mod.examRevision,3);
assert.equal(mod.progressIndex,2201);
const titles=Array.from(mod.lessons,x=>x.title);
const expected=[
 'Антидопинг: требования и пределы судейских полномочий',
 'Медицинское обеспечение и обязательные документы',
 'Противоправное влияние на результаты',
 'Возрастные группы и решение комиссии по допуску',
 'Весовые категории спортивного, боевого и пляжного самбо',
 'Взвешивание участников: процедура и фиксация',
 'Сквозной алгоритм допуска'
];
assert.deepEqual(titles,expected);
const sections=ctx.window.samboJudgeCourseEngine.sections(mod,1);
assert.equal(sections.length,9);
for(let i=0;i<7;i++){
 const item=mod.lessons[i];
 assert.ok(item.ref&&item.blocks.length>=6&&item.checks.length>=5,'Incomplete: '+item.title);
 assert.ok(sections[i+1].html.includes(item.title));
 assert.ok(sections[i+1].html.includes('СУДЕЙСКАЯ СИТУАЦИЯ'));
}
assert.ok(sections[4].html.includes('data-admission-v2="age"'));
assert.ok(sections[5].html.includes('data-admission-v2="weight"'));
assert.ok(sections[5].html.includes('data-admission-v2="youth"'));
assert.ok(sections[6].html.includes('data-admission-v2="weighing"'));
assert.ok(sections[7].html.includes('data-admission-v2="workflow"'));
for(const marker of ['11–12','12–14','14–16','16–18','18–25','До 24'])assert.ok(sections[4].html.includes(marker));
// Article 5(1) exceptions: students 18–25 and under-24 (18–23) must be taught as decisions, not just table labels.
for(const marker of ['Студенческая категория 18–25 лет','не является студентом','среди студентов',
 'Категория «до 24 лет»','уже исполнилось 24 года','18–23 лет'])
 assert.ok(sections[4].html.includes(marker),'Missing source-backed age eligibility case: '+marker);
for(const marker of ['Спортивное · 11–12','Спортивное · 12–14','Спортивное · 14–16','Спортивное · 16–18','Боевое · 14–16','Боевое · 16–18','Боевое · юниоры 18–20'])assert.ok(sections[5].html.includes(marker));
assert.ok(sections[6].html.includes('30 минут'));
assert.ok(sections[6].html.includes('за два часа'));
assert.ok(sections[6].html.includes('0,1 кг'));
const self=new Set(mod.lessons.flatMap(l=>l.checks.map(x=>x[0].trim().toLowerCase())));
assert.equal(new Set(mod.questions.map(x=>x.q.trim().toLowerCase())).size,24);
for(const q of mod.questions){
 assert.ok(!self.has(q.q.trim().toLowerCase()),'Exam repeats selfcheck: '+q.q);
 assert.equal(q.a.length,4);
 assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4);
 assert.ok(q.body.length>=30,'Short legal explanation: '+q.q);
}
const progress={window:{},localStorage:{getItem:()=>null},renderStudentDashboard(){},authMessage(){}};
vm.createContext(progress);vm.runInContext(fs.readFileSync('progress.js','utf8'),progress);
assert.deepEqual(Array.from(progress.window.samboJudgeHistoricalIndices(2201)),[1201,1101]);
assert.equal(progress.window.progressDone('judge',2201),false);
console.log('PASS: 7 coherent admission lessons and source-grounded age, weight and weigh-in visuals');
console.log('PASS: 24 independent application questions with explanations, new completion ID 2201');
console.log('PASS: old 1201/1101 results retained as read-only history');
