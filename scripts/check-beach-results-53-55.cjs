/* Editorial regression for beach sambo: Rules section VII, arts 49, 51, 53–55.
 * This verifies normative anchors and stability, NOT official judging certification.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.createContext(context);
const files=['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js','judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js','judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js','judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js'];
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const modules=context.window.samboJudgeCourseEngine.modules;
assert.equal(modules.length,11,'Expanded module count changed');
const beach=modules[8],lesson=beach.lessons[3];
assert.equal(beach.title,'Пляжное самбо: самостоятельная система судейства');
assert.equal(beach.lessons.length,5,'Beach lesson count changed');
assert.equal(lesson.title,'Результат, дисквалификация и запрещённые действия');
assert.ok(lesson.blocks.length>=9,'Missing explanatory blocks');
assert.ok(lesson.checks.length>=7,'Missing scenario questions');
const body=[lesson.ref,...lesson.blocks.map(b=>b.join(' ')),lesson.situation,lesson.caseAnalysis,lesson.decision].join(' ');
for(const marker of ['ст. 53','ст. 54','ст. 55','49(4)','51(3)','53(1)','53(2)(а)','53(2)(г)','медицинское снятие','немедленную дисквалификацию','поражение обоих'])
 assert.ok(body.toLowerCase().includes(marker.toLowerCase()),'Missing normative anchor: '+marker);
assert.ok(lesson.caseAnalysis.includes('Дано:')&&lesson.caseAnalysis.includes('Норма:'));
assert.ok(lesson.decision.includes('Норма:')&&lesson.decision.includes('Вывод:'));
const original=[
 ['Какой исход допускает статья 53, помимо победы одного спортсмена?',0],
 ['Какие действия запрещены в пляжном самбо?',0],
 ['Что предусмотрено за запрещённые действия из статьи 55?',0],
 ['Получает ли дисквалифицированный место или медаль?',0],
 ['Какое основание победы прямо указано в статье 53?',0]
];
for(let i=0;i<original.length;i++){
 assert.equal(lesson.checks[i][0],original[i][0],'Original question changed or moved');
 assert.equal(lesson.checks[i][2],original[i][1],'Original answer key changed');
}
for(const q of lesson.checks){
 assert.ok(q[0]&&q[3]&&Array.isArray(q[1])&&q[1].length===4);
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4);
}
assert.equal(beach.questions.length,8,'Independent beach exam changed');
const self=new Set(beach.lessons.flatMap(l=>l.checks.map(q=>q[0].trim().toLowerCase())));
assert.ok(beach.questions.every(q=>!self.has(q.q.trim().toLowerCase())),'Independent exam duplicates self-check');
assert.equal(modules.reduce((n,m)=>n+m.lessons.length,0),54,'Expanded lesson count changed');
assert.equal(modules.reduce((n,m)=>n+m.questions.length,0),88,'Independent exam bank changed');
console.log('PASS: beach arts 49/51/53–55, '+lesson.blocks.length+' blocks, '+lesson.checks.length+' checks, five original keys preserved, 54 lessons / 88 independent exam questions');
