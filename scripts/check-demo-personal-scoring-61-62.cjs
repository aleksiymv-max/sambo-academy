/* Editorial regression: personal demonstration sambo, Rules arts 61–63 (2026 revision).
 * Checks normative anchors and preservation of original self-check keys.
 * Passing this test is not an official referee certification.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.createContext(context);
const files=['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js','judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js','judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js','judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js'];
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const modules=context.window.samboJudgeCourseEngine.modules;
assert.equal(modules.length,11,'Expanded module count changed');
const demo=modules[9],lesson=demo.lessons[1];
assert.equal(demo.title,'Демонстрационное самбо: личный и командный зачёт');
assert.equal(demo.lessons.length,5,'Demo lesson count changed');
assert.equal(lesson.title,'Личный комплекс и порядок выставления баллов');
assert.ok(lesson.ref.includes('61')&&lesson.ref.includes('62'),'Missing article references');
assert.ok(lesson.blocks.length>=10,'Insufficient explanatory depth');
assert.ok(lesson.checks.length>=7,'Insufficient applied self-checks');
const body=[lesson.ref,...lesson.blocks.map(b=>b.join(' ')),lesson.situation,lesson.caseAnalysis,lesson.decision,lesson.trap,...lesson.checks.map(q=>q[3])].join(' ').toLowerCase();
for(const marker of ['статья 61','статья 62','статья 63','десяти упражнений','той же весовой категории','свободном порядке','одновременно','один балл','два балла','три балла','нул','повтор','коллегиальн','информатор','секретарь']){
 assert.ok(body.includes(marker.toLowerCase()),'Missing normative anchor: '+marker);
}
assert.ok(lesson.caseAnalysis.startsWith('Норма:'),'Case must separate normative basis');
assert.ok(lesson.decision.startsWith('Вывод:'),'Case must provide grounded conclusion');
const original=[
 ['Сколько упражнений содержит личный комплекс?',['10','5','3','20'],0],
 ['Какой балл соответствует одной ошибке исполнения?',['2','3','1','0'],0],
 ['Оценки 1, 2, 3 за одно упражнение требуют чего?',['Разбора спорного момента с повтором','Немедленного усреднения','Снятия спортсмена','Нового взвешивания'],0]
];
for(let i=0;i<original.length;i++){
 assert.equal(lesson.checks[i][0],original[i][0],'Original question changed/moved');
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
assert.equal(modules.reduce((n,m)=>n+m.questions.length,0),88,'Independent exam count changed');
console.log('PASS: demonstration arts 61–63, '+lesson.blocks.length+' blocks, '+lesson.checks.length+' questions; original 3 keys retained; 54 lessons / 88 independent exam questions');
