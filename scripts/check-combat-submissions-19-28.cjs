const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{}};vm.createContext(sandbox);
const files=['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js','judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js','judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js','judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js'];
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const modules=sandbox.window.samboJudgeCourseEngine.modules;
assert.equal(modules.length,11,'Expanded module count changed');
const combat=modules[7],lesson=combat.lessons[2];
assert.equal(combat.title,'Боевое самбо: специальные требования к судейству');
assert.equal(combat.lessons.length,4,'Combat lesson order changed');
assert.equal(lesson.title,'Болевые и удушающие: только правила отсчёта и безопасности');
assert.ok(lesson.blocks.length>=11,'Insufficient explanation depth');
assert.ok(lesson.checks.length>=7,'Insufficient self-check depth');
const body=[...lesson.blocks.map(b=>b.join(' ')),lesson.caseAnalysis,lesson.decision].join(' ');
for(const marker of ['19(5)(а)','19(5)(б)','19(8)(б','19(8)(в','19(8)(г','19(8)(д)','19(9)','19(10)','Статья 28','14–16','16–18','в стойку','потеря сознания'])
 assert.ok(body.toLowerCase().includes(marker.toLowerCase()),'Missing normative anchor: '+marker);
assert.ok(lesson.caseAnalysis.includes('Дано:')&&lesson.caseAnalysis.includes('Норма:'));
assert.ok(lesson.decision.includes('Норма:')&&lesson.decision.includes('Вывод:'));
const originals=[
 ['Сколько времени отводится на болевой/удушающий приём?',0],
 ['Сколько баллов за полное удержание в боевом самбо?',0],
 ['Защищающийся во время удержания начинает удушающий. Что с отсчётами?',0],
 ['Когда юноше разрешено начать удушающий приём?',0]
];
for(let i=0;i<originals.length;i++){
 assert.equal(lesson.checks[i][0],originals[i][0],'Original question changed or moved');
 assert.equal(lesson.checks[i][2],originals[i][1],'Original answer key changed');
}
for(const q of lesson.checks){
 assert.ok(q[0]&&q[3]&&Array.isArray(q[1])&&q[1].length===4);
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4);
}
assert.equal(combat.questions.length,8,'Independent combat exam changed');
const self=new Set(combat.lessons.flatMap(l=>l.checks.map(q=>q[0].trim().toLowerCase())));
assert.ok(combat.questions.every(q=>!self.has(q.q.trim().toLowerCase())),'Independent exam duplicates self-check');
assert.equal(modules.reduce((n,m)=>n+m.lessons.length,0),54,'Lesson count changed');
assert.equal(modules.reduce((n,m)=>n+m.questions.length,0),88,'Independent exam bank changed');
console.log('PASS: combat arts 19/28, '+lesson.blocks.length+' blocks, '+lesson.checks.length+' checks, original keys, 54 lessons / 88 independent exam questions');
