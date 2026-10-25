/* Demonstration sambo team results, arts 68–69: structural and preservation regression.
 * This test does not replace independent referee validation.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js','judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js','judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js','judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js'])
  vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const modules=ctx.window.samboJudgeCourseEngine.modules,demo=modules[9],lesson=demo.lessons[4];
assert.equal(modules.length,11);
assert.equal(demo.lessons.length,5);
assert.equal(lesson.title,'Определение победителей командной демонстрации');
assert.ok(lesson.ref.includes('68')&&lesson.ref.includes('69'));
assert.ok(lesson.blocks.length>=12,'Expected at least 12 explanatory blocks');
assert.ok(lesson.checks.length>=7,'Expected at least 7 self-check questions');
assert.ok(lesson.caseAnalysis.startsWith('Норма:')&&lesson.decision.startsWith('Вывод:'));
const body=[lesson.ref,...lesson.blocks.map(b=>b.join(' ')),lesson.situation,lesson.caseAnalysis,lesson.decision,lesson.trap,...lesson.checks.map(q=>q[3])].join(' ').toLowerCase();
for(const marker of ['статья 68','статья 69','техническ','исполнительск','общего впечатления','стойке','партере','нулевой оценкой','расхождение','округлен','жребий','протокол'])
  assert.ok(body.includes(marker.toLowerCase()),'Missing normative anchor: '+marker);
assert.ok(body.includes('статья 68(2)'),'Unresolved 66/68 judge count must remain disclosed');
const original=[
 ['Какова максимальная шкала оценки общего впечатления?',['5 баллов','10 баллов','3 балла','20 баллов'],0],
 ['Какой первый критерий при равенстве итоговых сумм?',['Более высокая оценка технического мастерства','Более яркая форма','Меньший возраст капитана','Более поздний выход'],0],
 ['Какое снижение указано за каждые 30 секунд выхода за временной регламент?',['0,5 балла','5 баллов','2 балла','Не предусмотрено'],0]
];
for(let i=0;i<original.length;i++){
 assert.equal(lesson.checks[i][0],original[i][0]);
 assert.equal(JSON.stringify(lesson.checks[i][1]),JSON.stringify(original[i][1]));
 assert.equal(lesson.checks[i][2],original[i][2]);
}
for(const q of lesson.checks)assert.ok(q[0]&&q[3]&&Array.isArray(q[1])&&q[1].length===4&&Number.isInteger(q[2])&&q[2]>=0&&q[2]<4);
assert.equal(demo.questions.length,8);
const self=new Set(demo.lessons.flatMap(l=>l.checks.map(q=>q[0].trim().toLowerCase())));
assert.ok(demo.questions.every(q=>!self.has(q.q.trim().toLowerCase())),'Independent final exam questions must remain separate');
assert.equal(modules.reduce((n,m)=>n+m.lessons.length,0),54);
assert.equal(modules.reduce((n,m)=>n+m.questions.length,0),88);
console.log('PASS demo arts 68–69: '+lesson.blocks.length+' blocks, '+lesson.checks.length+' checks, 3 original keys; 54 lessons / 88 independent exam questions; unresolved 66/68 disclosed');
