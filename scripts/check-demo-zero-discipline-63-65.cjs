/* Demonstration sambo arts 63–65: editorial and progress compatibility regression. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js','judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js','judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js','judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const mods=ctx.window.samboJudgeCourseEngine.modules,demo=mods[9],l=demo.lessons[2];
assert.equal(mods.length,11);assert.equal(demo.lessons.length,5);
assert.equal(l.title,'Нулевая оценка, дисциплина и перечни техник');
assert.ok(l.ref.includes('63')&&l.ref.includes('65'),'Reference must cover article range 63–65');
assert.ok(l.blocks.length>=10&&l.checks.length>=7);
const body=[l.ref,...l.blocks.map(b=>b.join(' ')),l.situation,l.caseAnalysis,l.decision,l.trap,...l.checks.map(q=>q[3])].join(' ').toLowerCase();
for(const marker of ['статья 62','статья 63','статья 64','статья 65','три ошибки','более чем','может быть дисквалифицирован','протокол','место не присуж','подсечк','бросок через бедро','по фазам','незаконченное'])assert.ok(body.includes(marker.toLowerCase()),'Missing normative anchor: '+marker);
assert.ok(l.caseAnalysis.startsWith('Норма:')&&l.decision.startsWith('Вывод:'));
const original=[
 ['Как оценивается упражнение с тремя ошибками?',['0 баллов','1 балл','2 балла','3 балла'],0],
 ['Что предусмотрено при дисквалификации по статье 64?',['Фиксация в протоколе и отсутствие места','Обязательная пересдача упражнения','Только снижение одного балла','Смена весовой категории'],0],
 ['Куда обратиться для проверки списка упражнений конкретной возрастной группы?',['К статье 65','К статье 34','К статье 52','К таблице пляжного самбо'],0]
];
for(let i=0;i<3;i++){assert.equal(l.checks[i][0],original[i][0]);assert.equal(JSON.stringify(l.checks[i][1]),JSON.stringify(original[i][1]));assert.equal(l.checks[i][2],original[i][2]);}
for(const q of l.checks)assert.ok(q[0]&&q[3]&&Array.isArray(q[1])&&q[1].length===4&&Number.isInteger(q[2])&&q[2]>=0&&q[2]<4);
assert.equal(demo.questions.length,8);
const self=new Set(demo.lessons.flatMap(x=>x.checks.map(q=>q[0].trim().toLowerCase())));
assert.ok(demo.questions.every(q=>!self.has(q.q.trim().toLowerCase())));
assert.equal(mods.reduce((n,m)=>n+m.lessons.length,0),54);
assert.equal(mods.reduce((n,m)=>n+m.questions.length,0),88);
console.log('PASS demo arts 63–65: '+l.blocks.length+' blocks, '+l.checks.length+' checks; 3 original keys; 54 lessons / 88 independent questions');
