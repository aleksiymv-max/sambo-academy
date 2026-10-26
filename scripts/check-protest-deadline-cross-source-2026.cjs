'use strict';
/* Source-conflict regression for article 41(2)(a) after the 2026 amendments.
 * This checks educational wording and unchanged exam keys, NOT an official interpretation.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const sandbox={window:{}};
vm.createContext(sandbox);
const files=[
 'judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js',
 'judge-exam-independent.js'
];
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const modules=sandbox.window.samboJudgeCourseEngine.modules;
assert.equal(modules.length,11);
assert.equal(modules.reduce((sum,m)=>sum+m.lessons.length,0),54);
assert.equal(modules.reduce((sum,m)=>sum+m.questions.length,0),88);
const sanctions=modules[5],practicum=modules[10];
const protestBlock=sanctions.lessons[2].blocks.find(b=>b[0]==='Кто, как и когда подаёт');
assert.ok(protestBlock,'Protest deadline lesson block missing');
const practicumText=practicum.lessons.flatMap(l=>l.blocks.map(b=>b[1])).join(' ');
const exam=sanctions.questions[2];
assert.equal(exam.q,'Представитель подаёт протест без указания конкретных пунктов Правил. Что необходимо?');
assert.equal(exam.correct,2);
assert.equal(exam.a[2],'Требовать письменный протест с указанием нарушенных пунктов');
assert.equal(sanctions.examRevision,2);
for(const [name,text] of [
 ['sanctions lesson',protestBlock[1]],['practicum',practicumText],['independent exam explanation',exam.body]
]){
 assert.match(text,/непосредственно во время соревнований/,name+': missing consolidated text');
 assert.match(text,/в день фиксации нарушения/,name+': missing September 2026 amendment');
 assert.match(text,/расхождени/i,name+': missing source-conflict caveat');
 assert.match(text,/не (?:разрешает|позволяет|считать)/i,name+': missing caution against unconditional deferral');
}
const engine=fs.readFileSync('judge-course-engine.js','utf8');
assert.ok(engine.includes('https://sambo.ru/wp-content/uploads/2025/09/pravila-vida-sporta-sambo-s-izm.-i-dopolneniyami.pdf'));
assert.ok(engine.includes('https://sambo.ru/wp-content/uploads/2026/08/izmeneniya_v_pravila_vida_sporta_sambo_bez_utesheniya.pdf'));
assert.ok(engine.includes('data-amendment-sources="2026"'));
console.log('PASS: source conflict in article 41(2)(a) is visible in sanctions lesson, practicum and independent exam explanation');
console.log('PASS: unchanged question, answer key, 54 lessons, 88 expanded questions and revision 2');
console.log('LIMITATION: amendment interpretation requires an official referee-methodologist review');
