/* Integrated practicum: articles 32–34, 37–41. Structural and preservation regression.
 * Passing this test is not independent normative or authenticated progress acceptance.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const files=['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js','judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js','judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js','judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js'];
const ctx={window:{}};vm.createContext(ctx);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const mods=ctx.window.samboJudgeCourseEngine.modules,practicum=mods[10],lesson=practicum.lessons[2];
assert.equal(mods.length,11);
assert.equal(practicum.lessons.length,4,'Do not change saved lesson indices');
assert.equal(lesson.title,'Сценарий итогов: равенство, нарушения, протокол');
assert.ok(lesson.ref.includes('34')&&lesson.ref.includes('41'));
assert.ok(lesson.blocks.length>=13&&lesson.checks.length>=9,'Editorial threshold');
assert.ok(lesson.caseAnalysis.startsWith('Норма:')&&lesson.decision.startsWith('Вывод:'));
const full=[lesson.ref,...lesson.blocks.flat(),lesson.situation,lesson.caseAnalysis,lesson.decision,lesson.trap,...lesson.checks.map(q=>q[3])].join(' ').toLowerCase();
for(const marker of ['статья 34(4)','статья 34(8)','статья 34(9)','статья 37','статья 38','статья 39','статья 40(2)','статье 41(5)','техническ','предупрежден','протокол','дисквалификац','утратили силу','неординарн'])
 assert.ok(full.includes(marker.toLowerCase()),'Missing normative marker: '+marker);
const originals=[
 ['Какой критерий применяют в конце цепочки равенства?',['Последнее оценённое действие','Алфавит','Вес тренера','Болельщики'],0],
 ['Какая статья регулирует протест?',['41','8','10','42'],0],
 ['При равенстве баллов можно сразу объявить ничью?',['Нет, проверить критерии статьи 34','Да, всегда','По жребию','По просьбе тренера'],0],
 ['Протокол и табло расходятся. Что делать?',['Передать на сверку компетентным судьям','Исправить по памяти','Удалить запись','Спросить зрителей'],0],
 ['Снятие и дисквалификация — одно и то же?',['Нет, разные основания и последствия','Да','Только в финале','По решению тренера'],0]
];
for(let i=0;i<originals.length;i++){
 assert.equal(lesson.checks[i][0],originals[i][0]);
 assert.equal(JSON.stringify(lesson.checks[i][1]),JSON.stringify(originals[i][1]));
 assert.equal(lesson.checks[i][2],originals[i][2]);
}
for(const q of lesson.checks)assert.ok(q[0]&&q[3]&&Array.isArray(q[1])&&q[1].length===4&&Number.isInteger(q[2])&&q[2]>=0&&q[2]<4);
assert.equal(mods.reduce((n,m)=>n+m.lessons.length,0),54);
assert.equal(mods.reduce((n,m)=>n+m.questions.length,0),88);
assert.equal(practicum.questions.length,8);
const self=new Set(practicum.lessons.flatMap(l=>l.checks.map(q=>q[0].trim().toLowerCase())));
assert.ok(practicum.questions.every(q=>!self.has(q.q.trim().toLowerCase())),'Independent exam questions must remain separate');
const shallow=mods.flatMap(m=>m.lessons.filter(l=>l.blocks.length<6||l.checks.length<5).map(l=>m.title+': '+l.title));
assert.equal(shallow.length,0,'Every expanded lesson must reach quantitative editorial threshold: '+shallow.join('; '));
console.log('PASS practicum arts 32–34, 37–41: '+lesson.blocks.length+' blocks, '+lesson.checks.length+' questions; five original answer keys preserved');
console.log('PASS 54 expanded lessons / 88 independent exam questions; no shallow expanded lessons');
console.log('NOTE: quantitative threshold does not prove normative accuracy, methodical acceptance or real-account progress restoration');
