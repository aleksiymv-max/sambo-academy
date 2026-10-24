'use strict';
/* Editorial regression for sports sambo, article 28 (2026-09-14 revision).
 * Source: https://sambo.ru/wp-content/uploads/2025/09/pravila-vida-sporta-sambo-s-izm.-i-dopolneniyami.pdf
 * This is a structural guard, not independent certification of legal accuracy.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-bout.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
const mod=ctx.window.samboJudgeCourseEngine.modules[0];
assert.equal(mod.title,'Проведение схватки: положения, время и результат');
assert.equal(mod.lessons.length,7,'Lesson order and progress identifiers must remain stable');
const expected=[
 {i:0,title:'Положения спортсменов: стоя, лёжа и варианты приземления',blocks:8,words:['непрерывный перекат','полумост','90 градусов','статье 35']},
 {i:1,title:'Бросок и контрбросок: установить инициатора',blocks:9,words:['перехват инициативы','неудачный','полный отрыв','половину']},
 {i:2,title:'Болевые приёмы и удержания: критерии начала и остановки',blocks:10,words:['1 минута','20 секунд','аннулируют','положение «стоя»']}
];
for(const {i,title,blocks,words} of expected){
 const l=mod.lessons[i];
 assert.equal(l.title,title);
 assert.ok(l.ref.includes('28'),'Article 28 anchor required: '+title);
 assert.ok(l.blocks.length>=blocks,'Too few teaching sections: '+title);
 assert.equal(l.checks.length,5,'Five explained checks required: '+title);
 for(const key of ['goal','lead','situation','caseAnalysis','decision','trap']){
  assert.ok(String(l[key]||'').length>=35,'Missing '+key+': '+title);
 }
 const prose=l.blocks.map(b=>b.join(' ')).join(' ').toLowerCase();
 for(const word of words)assert.ok(prose.includes(word.toLowerCase()),'Missing source concept '+word+': '+title);
 const seen=new Set();
 for(const q of l.checks){
  assert.ok(typeof q[0]==='string'&&q[0].length>15);
  assert.ok(Array.isArray(q[1])&&q[1].length===4);
  assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4);
  assert.ok(String(q[3]).includes('Статья 28'),'Answer must explain article 28: '+q[0]);
  assert.ok(String(q[3]).length>=50,'Explain why the answer is correct: '+q[0]);
  assert.ok(!seen.has(q[0]),'Repeated question: '+q[0]);seen.add(q[0]);
 }
}
assert.equal(mod.lessons[3].title,'Выход на ковёр, начало и окончание схватки');
assert.equal(mod.lessons[6].title,'Определение активности в середине встречи');
console.log('PASS: article 28 positions, throws, holds; 27 sections, 15 explained checks; 7 lesson IDs unchanged');
