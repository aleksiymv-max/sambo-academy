/* Editorial regression: individual demonstration sambo, Rules arts 59–60 and appendix 10.2.
 * Structural/normative anchor checks, NOT an official judging certification.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.createContext(context);
const files=['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js','judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js','judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js','judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js'];
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const modules=context.window.samboJudgeCourseEngine.modules;
assert.equal(modules.length,11,'Expanded module count changed');
const demo=modules[9],lesson=demo.lessons[0];
assert.equal(demo.title,'Демонстрационное самбо: личный и командный зачёт');
assert.equal(demo.lessons.length,5,'Demo lesson order/count changed');
assert.equal(lesson.title,'Возрастные группы и судейская коллегия личной демонстрации');
assert.ok(lesson.blocks.length>=10,'Insufficient explanatory depth');
assert.ok(lesson.checks.length>=7,'Insufficient applied self-checks');
const body=[lesson.ref,...lesson.blocks.map(b=>b.join(' ')),lesson.situation,lesson.caseAnalysis,lesson.decision,lesson.trap].join(' ');
for(const marker of ['Статья 59','Статья 60','статьи 62','приложение № 10.2','10–12','12–14','14–16','16–18','18–20','календарном году','две бригады','десять участников','один информатор','2016','2017']){
 assert.ok(body.toLowerCase().includes(marker.toLowerCase()),'Missing normative anchor: '+marker);
}
assert.ok(lesson.caseAnalysis.includes('Норма:'),'Case must distinguish normative basis');
assert.ok(lesson.decision.includes('Вывод:'),'Case must give grounded conclusion');
const original=[
 ['Сколько бригад предусматривает статья 60 на один ковёр?',['Две','Одну','Три','Число не регулируется'],0],
 ['Кто непосредственно показывает оценки личного упражнения?',['Руководитель ковра и два боковых судьи','Только информатор','Главный секретарь и врач','Только руководитель команды'],0],
 ['Когда проверяют достижение установленного возраста?',['В календарном году соревнований','Только на день жеребьёвки','По возрасту тренера','После церемонии награждения'],0]
];
for(let i=0;i<original.length;i++){
 assert.equal(lesson.checks[i][0],original[i][0],'Original question changed or moved');
 assert.equal(JSON.stringify(lesson.checks[i][1]),JSON.stringify(original[i][1]),'Original options changed');
 assert.equal(lesson.checks[i][2],original[i][2],'Original answer key changed');
}
for(const q of lesson.checks){
 assert.ok(q[0]&&q[3]&&Array.isArray(q[1])&&q[1].length===4);
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4);
}
assert.equal(demo.questions.length,8,'Independent demonstration exam count changed');
const self=new Set(demo.lessons.flatMap(l=>l.checks.map(q=>q[0].trim().toLowerCase())));
assert.ok(demo.questions.every(q=>!self.has(q.q.trim().toLowerCase())),'Independent exam repeats self-check');
assert.equal(modules.reduce((n,m)=>n+m.lessons.length,0),54,'Expanded lesson count changed');
assert.equal(modules.reduce((n,m)=>n+m.questions.length,0),88,'Independent exam bank count changed');
console.log('PASS: demonstration arts 59–60 and appendix 10.2; '+lesson.blocks.length+' blocks, '+lesson.checks.length+' questions; three original questions and keys preserved; 54 lessons / 88 independent questions');
