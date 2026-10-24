'use strict';
// Editorial regression for sports-sambo boundary decisions: Rules arts 28, 35(6), 36(1–8), 37(7).
// A structural/content guard, NOT a complete normative approval.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-scoring.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
const mod=ctx.window.samboJudgeCourseEngine.modules[0];
assert.equal(mod.lessons.length,5,'Preserve the five scoring lessons and their progress positions');
assert.deepEqual(Array.from(mod.lessons,l=>l.title),[
 'Досрочная чистая победа: пять оснований',
 'Оценка броска: матрица без и с падением',
 'Удержания и общая сумма оценок',
 'Как определить победителя после времени',
 'Граница ковра и оцениваемые действия'
]);
const lesson=mod.lessons[4];
for(const article of ['28','35','36','37'])assert.ok(lesson.ref.includes(article),'Missing article reference: '+article);
assert.ok(lesson.blocks.length>=10,'Boundary lesson needs at least ten focused explanations');
assert.ok(lesson.checks.length>=7,'Boundary lesson needs at least seven explained self-checks');
const prose=lesson.blocks.map(x=>x.join(' ')).join(' ').toLowerCase();
for(const term of [
 'двумя ногами','оба оказались','зоны безопасности','туловище атакуемого',
 'начатого в положении','бокового судьи','большинством судейской тройки',
 'свободный или умышленный выход','таблица статьи 35','один спортсмен остаётся'
]){
 assert.ok(prose.includes(term.toLowerCase()),'Missing boundary distinction: '+term);
}
assert.ok(lesson.situation.length>=120&&lesson.caseAnalysis.length>=100);
assert.ok(lesson.decision.length>=90&&lesson.trap.length>=70);
const questions=new Set();
for(const q of lesson.checks){
 assert.equal(q[1].length,4,'Each self-check must have four answer choices');
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4,'Invalid answer index');
 assert.ok(q[3].length>=55,'Self-check needs a reasoned explanation');
 assert.ok(!questions.has(q[0]),'Duplicate self-check question');
 questions.add(q[0]);
}
assert.ok(lesson.checks.some(q=>q[0].includes('Оба спортсмена в положении лёжа')));
assert.ok(lesson.checks.some(q=>q[0].includes('Можно ли сразу назначить четыре балла')));
console.log('PASS: sports-sambo article 36 boundary lesson: 10+ blocks, 7+ checks, scoring and sanctions separated; lesson order preserved');
