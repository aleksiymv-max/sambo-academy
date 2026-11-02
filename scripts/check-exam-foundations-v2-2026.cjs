'use strict';
// Independent foundation exam revision 2; old judge:1100 and judge:100 remain readable.
require('./check-exam-foundations-17-24-2026.cjs');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
const paths=[
 'judge-foundations.js','judge-exam-foundations-v2.js','judge-course-engine.js',
 'judge-program-admission.js','judge-program-participants.js','judge-program-officials.js',
 'judge-program-bout.js','judge-program-scoring.js','judge-program-sanctions.js',
 'judge-program-infrastructure.js','judge-program-combat.js','judge-program-beach.js',
 'judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js',
 'judge-exam-sanctions-v3.js'
];
for(const p of paths)vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
const old=ctx.window.samboJudgeFoundations,active=ctx.window.samboJudgeFoundationsExamV2;
assert.equal(old.progressIndex,1100);
assert.equal(old.version,'2026-10-23-1');
assert.equal(active.progressIndex,2100);
assert.equal(active.examRevision,2);
assert.equal(active.questions.length,24);
assert.equal(active.lessons,old.lessons,'All six lessons and self-checks must remain unchanged');
assert.equal(old.questions.length,24);
const norm=q=>q.trim().toLowerCase().replace(/\\s+/g,' ');
const self=new Set(old.lessons.flatMap(l=>l.questions.map(q=>norm(q[0]))));
const historical=new Set(old.questions.map(q=>norm(q.q)));
const fresh=new Set();
for(let i=0;i<12;i++){
 const q=active.questions[i];
 assert.equal(q.kind,'Судейская ситуация');
 assert.ok(!self.has(norm(q.q)),'New exam duplicates lesson self-check '+(i+1));
 assert.ok(!historical.has(norm(q.q)),'New exam duplicates historical exam '+(i+1));
 assert.ok(!fresh.has(norm(q.q)),'Duplicate new exam question '+(i+1));
 fresh.add(norm(q.q));
 assert.equal(q.a.length,4);
 assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4);
 assert.ok(q.body.length>=260,'Incomplete decision explanation '+(i+1));
 assert.match(q.body,/Норма:/);
 assert.match(q.body,/Вывод:/);
 assert.match(q.body,/(статья|приложение)/i);
}
for(let i=12;i<24;i++)assert.equal(active.questions[i],old.questions[i],'Historical application item changed '+(i+1));
const expectedRefs=[
 'приложение 1, пункт 1','статья 2, пункт 4','статья 1, пункты 1–2',
 'статья 1, пункт 4','статья 1, пункт 2','статья 2, пункт 1',
 'статья 2, пункт 2(д)','статья 2, пункт 5','приложение 2, раздел I, пункт 1',
 'статья 2(2)(в)','приложение 1, пункт 3','приложение 1, пункт 4'
];
for(let i=0;i<12;i++)assert.ok(active.questions[i].body.toLowerCase().includes(expectedRefs[i].toLowerCase()),'Source missing '+(i+1));
// Regression: official Rules art. 2(1,3–4) and appendix 1(1,4) must not
// be taught as permission for the secretariat to invent a competition format.
const firstLesson=old.lessons[0],drawLesson=old.lessons[3];
assert.equal(firstLesson.blocks.length,6,'Foundation lesson 1 needs both mandatory-regulation and discipline-source boundaries');
assert.equal(drawLesson.blocks.length,6,'Foundation lesson 4 needs a subgroup decision algorithm');
const firstBlock=firstLesson.blocks.find(([title])=>title.includes('Пробел в Положении'));
assert.ok(firstBlock && firstBlock[1].includes('статья 2, пункт 4') &&
 firstBlock[1].includes('приложению 1, пункту 4'),
 'Mandatory system/method and authorized regulation change must be explained');
assert.ok(firstLesson.case[1].includes('Статья 2, пункт 4') &&
 firstLesson.case[2].includes('Не выдавать личный выбор секретаря'),
 'Foundation case must not imply that appendix 1(1) authorizes a missing competition format');
// Editorial regression: an authorized pre-draw amendment is not sufficient if
// one participating team has not been notified (Appendix 1, paragraph 4).
const regulationLesson=old.lessons[1];
assert.equal(regulationLesson.blocks.length,6,'Amendment lesson must teach three independent conditions');
const amendmentMatrix=regulationLesson.blocks.find(([title])=>title.includes('три независимых условия'));
assert.ok(amendmentMatrix && amendmentMatrix[1].includes('Ситуация А:') &&
 amendmentMatrix[1].includes('Ситуация Б:') && amendmentMatrix[1].includes('Ситуация В:'),
 'Amendment lesson must distinguish authority, notice and deadline');
assert.ok(regulationLesson.case[0].includes('Две из трёх команд уведомлены') &&
 regulationLesson.case[1].includes('оповещения представителей всех') &&
 regulationLesson.case[2].includes('Не считать поправку отвечающей требованиям'),
 'Pre-draw amendment with incomplete notice must not be treated as valid');
// The original four checks retain their order, answer keys and explanations.
// The fifth is a separate application case, not a copied independent exam item.
assert.equal(regulationLesson.questions.length,5,'Amendment lesson needs an applied deadline check');
const fnv=s=>{let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');};
assert.equal(fnv(JSON.stringify(regulationLesson.questions.slice(0,4))),'868f07b9',
 'Historical four self-checks or answer keys changed');
const deadlineCheck=regulationLesson.questions[4];
assert.match(deadlineCheck[0],/после её начала/);
assert.equal(deadlineCheck[2],2,'Post-draw change must not be accepted');
assert.match(deadlineCheck[3],/Приложение 1, пункт 4/);
assert.match(deadlineCheck[3],/срок/);
assert.ok(!active.questions.some(q=>norm(q.q)===norm(deadlineCheck[0])),
 'Self-check must not duplicate an independent exam item');
assert.match(old.render(regulationLesson,1),/Проверка изменения Положения/);
assert.match(old.render(regulationLesson,1),/после её начала/);
// Article 1(4–5): personally-team standings must use the CURRENT regulation,
// not last year's formula or the results of head-to-head team meetings.
const characterLesson=old.lessons[2];
assert.equal(characterLesson.blocks.length,6,'Character lesson needs a worked scoring-boundary example');
const characterBoundary=characterLesson.blocks.find(([title])=>title.includes('формула командного зачёта'));
assert.ok(characterBoundary && characterBoundary[1].includes('статье 1, пункту 5') &&
 characterBoundary[1].includes('действующее Положение'),
 'Character lesson must explain the difference between team meetings and personally-team scoring');
assert.equal(characterLesson.questions.length,5,'Character lesson needs an applied scoring check');
assert.equal(fnv(JSON.stringify(characterLesson.questions.slice(0,4))),'987ea919',
 'Historical four character self-checks or answer keys changed');
const characterCheck=characterLesson.questions[4];
assert.match(characterCheck[0],/прошлогоднего турнира/);
assert.equal(characterCheck[2],2,'Current tournament regulation must govern personally-team results');
assert.match(characterCheck[3],/Статья 1, пункт 5/);
assert.ok(!active.questions.some(q=>norm(q.q)===norm(characterCheck[0])),
 'Character self-check duplicates independent exam');
assert.match(old.render(characterLesson,2),/формула командного зачёта/);
const subgroupBlock=drawLesson.blocks.find(([title])=>title.includes('Контрольный пример'));
assert.ok(subgroupBlock && subgroupBlock[1].includes('статье 2, пункту 1') &&
 subgroupBlock[1].includes('статье 2, пункту 3') &&
 subgroupBlock[1].includes('приложения 1, пункта 4'),
 'Subgroup progression, draw and amendment constraints must remain distinct');
assert.match(old.render(firstLesson,0),/Пробел в Положении/);
// The first foundation lesson must teach selection of the discipline-specific
// source before making a technical ruling; preserve all four historic checks.
const disciplineBlock=firstLesson.blocks.find(([title])=>title.includes('Проверка дисциплины'));
assert.ok(disciplineBlock && disciplineBlock[1].includes('статья 49, пункт 1') &&
 disciplineBlock[1].includes('только в положении стоя') &&
 disciplineBlock[1].includes('спортивного самбо'),
 'Beach sambo must not inherit sporting-sambo holds by habit');
assert.equal(firstLesson.questions.length,5,'Foundation lesson 1 needs an applied discipline-source self-check');
assert.equal(fnv(JSON.stringify(firstLesson.questions.slice(0,4))),'a2401aa9',
 'Historical first four foundation checks, answer keys or explanations changed');
const disciplineCheck=firstLesson.questions[4];
assert.match(disciplineCheck[0],/пляжном турнире/);
assert.equal(disciplineCheck[2],2,'Beach source-selection answer key must remain correct');
assert.match(disciplineCheck[3],/статья 49, пункт 1/);
assert.ok(!active.questions.some(q=>norm(q.q)===norm(disciplineCheck[0])),
 'Beach source-selection self-check must not duplicate an independent exam item');
assert.match(old.render(firstLesson,0),/Проверка дисциплины до выбора нормы/);
assert.match(old.render(firstLesson,0),/На пляжном турнире секретарь/);

assert.match(old.render(drawLesson,3),/Контрольный пример/);
// Official Rules, article 2(1,3–4) and Appendix 1(4): no retroactive subgroup progression rule.
assert.equal(drawLesson.questions.length,5,'Subgroup lesson needs an applied pre-draw self-check');
assert.equal(fnv(JSON.stringify(drawLesson.questions.slice(0,4))),'93a7a868',
 'Historical subgroup self-checks, keys or explanations changed');
const subgroupDecision=drawLesson.blocks.find(([title])=>title.includes('Алгоритм проверки'));
assert.ok(subgroupDecision && subgroupDecision[1].includes('Ситуация А:') &&
 subgroupDecision[1].includes('Ситуация Б:') && subgroupDecision[1].includes('Ситуация В:') &&
 subgroupDecision[1].includes('приложение 1, пункт 4'),
 'Subgroup lesson must distinguish valid draw, missing progression and authorized amendment');
const subgroupCheck=drawLesson.questions[4];
assert.match(subgroupCheck[0],/первые встречи/);
assert.equal(subgroupCheck[2],2,'Missing progression principle cannot be decided after matches');
assert.match(subgroupCheck[3],/Статья 2, пункт 1/);
assert.ok(!active.questions.some(q=>norm(q.q)===norm(subgroupCheck[0])),
 'Subgroup self-check must remain independent of the active exam');
assert.match(old.render(drawLesson,3),/Алгоритм проверки перед составлением пар/);
assert.match(old.render(drawLesson,3),/В двух подгруппах уже провели/);

// Article 2(5) and Appendix 2(I.1): an explicit round-robin rule in the
// current Regulation is an exception to the default for <=7 athletes.
const methodsLesson=old.lessons[4];
assert.equal(methodsLesson.blocks.length,7,'Methods lesson needs a contrasting default/exception decision');
const methodsContrast=methodsLesson.blocks.find(([title])=>title.includes('Сравнение двух решений'));
assert.ok(methodsContrast && methodsContrast[1].includes('Ситуация А:') &&
 methodsContrast[1].includes('Ситуация Б:') && methodsContrast[1].includes('Приложение 2'),
 'Methods lesson must distinguish the default from a lawful round-robin exception');
assert.equal(methodsLesson.questions.length,5,'Methods lesson needs a contextual exception self-check');
assert.equal(fnv(JSON.stringify(methodsLesson.questions.slice(0,4))),'68f5d71b',
 'Historical four methods checks or their answer keys/explanations changed');
const methodsCheck=methodsLesson.questions[4];
assert.match(methodsCheck[0],/шесть спортсменов/);
assert.equal(methodsCheck[2],0,'Six athletes and an explicit round-robin Regulation must be distinguished from the default');
assert.match(methodsCheck[3],/Статья 2, пункт 5/);
assert.match(methodsCheck[3],/Приложение 2/);
assert.ok(!active.questions.some(q=>norm(q.q)===norm(methodsCheck[0])),
 'Methods self-check must not duplicate the active independent exam');
assert.match(old.render(methodsLesson,4),/Сравнение двух решений/);
assert.match(old.render(methodsLesson,4),/Утверждённое Положение прямо предусматривает круговую систему/);

// Integrative practicum: test an omitted subgroup-progression rule BEFORE the draw.
// Historical four self-checks, active independent exam and progress IDs remain unchanged.
const practicumLesson=old.lessons[5];
assert.equal(practicumLesson.blocks.length,7,'Foundation practicum needs a pre-draw decision checklist');
const preDraw=practicumLesson.blocks.find(([title])=>title.includes('Сводная проверка до жеребьёвки'));
assert.ok(preDraw && preDraw[1].includes('статье 2(1, 4)') &&
 preDraw[1].includes('приложения 1(4)') &&
 preDraw[1].includes('оповещение всех'),
 'Missing subgroup progression must be resolved through authorized pre-draw procedure');
assert.equal(practicumLesson.questions.length,5,'Foundation practicum needs an applied pre-draw self-check');
assert.equal(fnv(JSON.stringify(practicumLesson.questions.slice(0,4))),'c420f046',
 'Historical four practicum checks, keys or explanations changed');
const preDrawCheck=practicumLesson.questions[4];
assert.match(preDrawCheck[0],/Жеребьёвка ещё не началась/);
assert.equal(preDrawCheck[2],2,'Pre-draw omission must be referred to the authorized organizers');
assert.match(preDrawCheck[3],/Статья 2, пункты 1 и 4/);
assert.match(preDrawCheck[3],/Приложение 1, пункт 4/);
assert.ok(!active.questions.some(q=>norm(q.q)===norm(preDrawCheck[0])),
 'Practicum self-check must not duplicate the active independent exam');
assert.match(old.render(practicumLesson,5),/Сводная проверка до жеребьёвки/);
assert.match(old.render(practicumLesson,5),/В Положении названы две подгруппы/);

const groups=[{title:old.title,parts:old.lessons.map(l=>({title:l.title})),premiumFoundations:true,progressIndex:1100},
 ...ctx.window.samboJudgeCourseEngine.modules.map(m=>({title:m.title,parts:m.lessons}))];
const bridge={
 window:ctx.window,
 samboModuleData:key=>key==='judge'?groups.map(g=>({...g})):[],
 samboQuizQuestions:()=>[],
 samboLessonSections:g=>g.premiumFoundations?[{title:'intro',html:'intro'},{title:'exam',quiz:true,html:'Итоговый тест: 24 вопросов'}]:[]
};
vm.createContext(bridge);
vm.runInContext(fs.readFileSync('judge-program-bridge.js','utf8'),bridge);
const routed=bridge.samboModuleData('judge');
assert.equal(routed.length,12);
assert.equal(routed[0].progressIndex,2100);
assert.equal(routed[0].examRevision,2);
assert.equal(bridge.samboQuizQuestions(routed[0]),active.questions);
assert.match(bridge.samboLessonSections(routed[0]).at(-1).html,/Редакция экзамена: 2/);
assert.equal(routed[6].progressIndex,1306,'Sanctions revision 3 must stay active');
const store=new Map();
const progress={window:{},localStorage:{
 getItem:key=>store.get(key)||null,
 setItem:(key,val)=>store.set(key,String(val)),
 removeItem:key=>store.delete(key)
},renderStudentDashboard(){},authMessage(){}};
vm.createContext(progress);
vm.runInContext(fs.readFileSync('progress.js','utf8'),progress);
progress.progressKey=progress.window.progressKey;
const w=progress.window;
assert.deepEqual(Array.from(w.samboJudgeHistoricalIndices(2100)),[1100,100]);
assert.deepEqual(Array.from(w.samboJudgeHistoricalIndices(1100)),[100]);
store.set('sambo-demo-judge-1100','done');
store.set('sambo-demo-judge-100','done');
assert.deepEqual(Array.from(w.samboJudgeHistoricalCompletions(2100)),[1100,100]);
assert.equal(w.progressDone('judge',2100),false,'Old pass must not count as current pass');
w.samboProgress.userId='account-A';
w.samboProgress.completed=new Set(['judge:1100']);
assert.deepEqual(Array.from(w.samboJudgeHistoricalCompletions(2100)),[1100]);
w.samboProgress.userId='account-B';
w.samboProgress.completed=new Set();
assert.deepEqual(Array.from(w.samboJudgeHistoricalCompletions(2100)),[],'Account isolation failed');
assert.equal(w.progressDone('judge',2100),false);
const html=fs.readFileSync('index.html','utf8');
assert.ok(html.indexOf('judge-foundations.js')<html.indexOf('judge-exam-foundations-v2.js'));
assert.ok(html.indexOf('judge-exam-foundations-v2.js')<html.indexOf('judge-program-bridge.js'));
console.log('PASS: 12 independent, source-checked scenarios; 12 other exam questions untouched');
console.log('PASS: historical exam, self-checks and original keys unchanged');
console.log('PASS: active foundation result judge:2100 does not inherit judge:1100/100');
console.log('LIMITATION: Supabase real-account E2E and independent referee review remain open');
