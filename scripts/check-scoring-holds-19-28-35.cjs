'use strict';
// Editorial regression for sports-sambo hold scoring, consolidated Rules arts 19(5), 28 (Holds), 35.
// Checks structure and explicit handling of the 10-second textual discrepancy; not a substitute for referee review.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const f of ['judge-course-engine.js','judge-program-scoring.js']){
 vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
}
const m=ctx.window.samboJudgeCourseEngine.modules[0];
assert.equal(m.lessons.length,5,'Preserve scoring lesson positions');
assert.equal(m.lessons[0].title,'Досрочная чистая победа: пять оснований');
assert.equal(m.lessons[1].title,'Оценка броска: матрица без и с падением');
assert.equal(m.lessons[3].title,'Как определить победителя после времени');
assert.equal(m.lessons[4].title,'Граница ковра и оцениваемые действия');
const lesson=m.lessons[2];
assert.equal(lesson.title,'Удержания и общая сумма оценок');
assert.match(lesson.ref,/19\(5\)/);
assert.match(lesson.ref,/28/);
assert.match(lesson.ref,/35/);
assert.ok(lesson.blocks.length>=9,'Require nine detailed explanatory blocks');
assert.equal(lesson.checks.length,5,'Require five explained self-checks');
const prose=lesson.blocks.map(x=>x.join(' ')).join(' ').toLowerCase();
for(const marker of ['обеих лопатках','более 10 секунд','ровно 10 секунд','20 секунд',
 'аннулируются','параллельный отсчёт','обильном кровотечении','сигнал сдачи','учебный алгоритм']){
 assert.ok(prose.includes(marker.toLowerCase()),'Missing normative topic: '+marker);
}
assert.ok(lesson.situation.length>=150&&lesson.caseAnalysis.length>=130);
assert.ok(lesson.decision.length>=130&&lesson.trap.length>=90);
const seen=new Set();
for(const q of lesson.checks){
 assert.equal(q[1].length,4,'Each check must have four options');
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4,'Invalid answer index');
 assert.ok(q[3].length>=70,'Each check needs substantive explanation');
 assert.ok(!seen.has(q[0]),'Duplicate self-check');seen.add(q[0]);
}
assert.equal(lesson.checks[0][0],'Сколько очков за полное удержание?');
assert.equal(lesson.checks[1][0],'Каков предел суммы за удержания в одной схватке?');
assert.ok(!lesson.checks.some(q=>/ровно 10 секунд/.test(q[0])),'Do not grade disputed exact-ten-second boundary');
console.log('PASS: arts 19/28/35 hold lesson: nine blocks, five checks, preserved order, disputed ten-second boundary disclosed');
