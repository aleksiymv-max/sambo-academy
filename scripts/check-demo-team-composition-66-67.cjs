/* Demonstration sambo team composition arts 66–67: editorial and progress regression.
 * This is a structural guard, not independent referee approval.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js','judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js','judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js','judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js'])
  vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const modules=ctx.window.samboJudgeCourseEngine.modules,demo=modules[9],lesson=demo.lessons[3];
assert.equal(modules.length,11);
assert.equal(demo.lessons.length,5);
assert.equal(lesson.title,'Командная композиция и судейская бригада');
assert.ok(lesson.ref.includes('66')&&lesson.ref.includes('67'));
assert.ok(lesson.blocks.length>=12,'Expected 12 explanatory blocks');
assert.ok(lesson.checks.length>=7,'Expected 7 self-check questions');
assert.ok(lesson.caseAnalysis.startsWith('Норма:')&&lesson.decision.startsWith('Вывод:'));
const body=[lesson.ref,...lesson.blocks.map(b=>b.join(' ')),lesson.situation,lesson.caseAnalysis,lesson.decision,lesson.trap,...lesson.checks.map(q=>q[3])].join(' ').toLowerCase();
for(const marker of ['статья 66','статья 67','статья 68','две судейские бригады','три судьи','два','20%','10%','одновременн','фонограмм','не зависящ','травмоопасн','повтор','расхождение'])
  assert.ok(body.includes(marker.toLowerCase()),'Missing normative anchor: '+marker);
assert.ok(body.includes('статья 68(2)'),'Unresolved crew-size discrepancy must remain explicit');
// Article 67 also requires a pre-submitted, labelled and quality-checked audio flash card.
// Preserve this easily overlooked procedural requirement without inventing a penalty.
for(const marker of ['флеш-карте','название команды','проверить качество','до начала выступления','не предусмотренный правилами штраф'])
  assert.ok(body.includes(marker),'Missing article 67 audio-media preparation: '+marker);
assert.ok(!lesson.checks.some(q=>q[0].includes('Сколько судей исполнительского мастерства обязательно')),'No false exam key for conflicting 66/68 figures');
const original=[
 ['Как выполняется обязательная часть командной композиции?',['Одновременно всеми участниками','Только капитаном','По одному спортсмену','Только ассистентами'],0],
 ['Какой верхний предел времени предусмотрен для творческого компонента?',['10% общего времени','20% общего времени','50% общего времени','Без ограничений'],0],
 ['Сколько смен позиций требуется в обязательной части?',['Не менее двух','Ровно одна','Не менее пяти','Смена позиций запрещена'],0]
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
console.log('PASS demo arts 66–67: '+lesson.blocks.length+' blocks, '+lesson.checks.length+' checks, 3 original keys, 54 lessons / 88 independent questions; 66/68 conflict disclosed');
