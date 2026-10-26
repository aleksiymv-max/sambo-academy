'use strict';
// Normative editorial regression for foundation exam items 9–16, 26.10.2026.
// Primary source: Rules of Sambo, order 892 as amended by order 860 (14.09.2026),
// arts 1–2, appendix 1 (1,3,4), appendix 2(I.1), appendix 6, special sections VI–IX.
// This tests authored explanations and historical compatibility, NOT external methodologist approval.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{}};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('judge-foundations.js','utf8'),sandbox,{filename:'judge-foundations.js'});
const mod=sandbox.window.samboJudgeFoundations;
const qs=Array.from(mod.questions);
const fnv=text=>{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h.toString(16);};
assert.equal(mod.progressIndex,1100,'Historical progress index must remain unchanged');
assert.equal(mod.version,'2026-10-23-1','Historical module version must remain unchanged');
assert.equal(mod.lessons.length,6);
assert.equal(qs.length,24);
assert.equal(qs.filter(q=>q.kind==='Проверка нормы').length,12);
assert.equal(qs.filter(q=>q.kind==='Судейская ситуация').length,12);
assert.equal(fnv(JSON.stringify(qs.map(({q,a,correct,kind})=>({q,a,correct,kind})))),'4910eed2','Historical 24-item exam fingerprint changed');
assert.equal(fnv(JSON.stringify(qs.slice(0,8).map(q=>q.body))),'c654c4df','Audited explanations 1–8 were modified');
// Foundation items 17–24 are checked by check-exam-foundations-17-24-2026.cjs.
assert.equal(fnv(JSON.stringify(mod.lessons.map(l=>l.questions))),'c41346d9','Lesson self-checks were modified');
const expected=[
  [9,'Какой способ предполагает встречу каждого с каждым?',0,'Круговой',['Статья 2, пункт 2(а)','Приложение 2, раздел I, пункт 1','статья 2(5)']],
  [10,'В каком способе предусмотрено выбывание после двух поражений?',0,'Пункт 2(г)',['Статья 2, пункт 2(г)','приложении 6','шести штрафных очков']],
  [11,'С чего начать проверку условий турнира?',0,'С Правил и утверждённого Положения',['Приложение 1, пункт 1','статье 1','статье 2']],
  [12,'В лично-командных соревнованиях командные места зависят от чего?',0,'От личных результатов спортсменов согласно Положению',['Статья 1, пункт 5','статье 1(4)','Положением']],
  [13,'В Положении не описан порядок разрешения спорного организационного вопроса. На что опирается судейская коллегия?',1,'На нормы Правил вида спорта «самбо»',['Приложение 1, пункт 1','статье 2(4)','Правилами']],
  [14,'Один из судей использует правила спортивного самбо при рассмотрении вопроса по специальной дисциплине, не проверив её раздел. В чём недостаток?',0,'Не установлен применимый специальный нормативный раздел',['разделы: VI','VII','VIII–IX']],
  [15,'Утвердившая Положение организация изменила условия до начала жеребьёвки, но никого не уведомила. Выполнены ли все условия?',2,'Нет, необходимо обязательное оповещение представителей всех команд либо всех участников',['Приложение 1, пункт 4','не позднее начала жеребьёвки','оповестить']],
  [16,'В Положении нет сведений о способе проведения; сетку хотят определить после начала встреч. Какое требование не выполнено?',0,'Статья 2, пункт 4 о включении системы и способа в Положение',['Статья 2, пункт 4','Статья 2(3)','Приложение 1, пункт 3']]
];
for(const [num,question,correct,answer,markers] of expected){
 const q=qs[num-1];
 assert.equal(q.q,question,'Historical question changed at '+num);
 assert.equal(q.correct,correct,'Historical key changed at '+num);
 assert.equal(q.a[correct],answer,'Historical correct option changed at '+num);
 assert.ok(q.body.length>=600,'Explanation too short at '+num);
 for(const marker of markers)assert.ok(q.body.includes(marker),'Missing source/condition '+marker+' at '+num);
}
const self=new Set(mod.lessons.flatMap(l=>l.questions.map(q=>q[0].trim().toLowerCase())));
assert.ok(qs.slice(12).every(q=>!self.has(q.q.trim().toLowerCase())),'Situational exam items repeat self-checks');
console.log('PASS: foundation exam 9–16 audited explanations, exact historical question/key fingerprint and module progress 1100');
console.log('PASS: unchanged explanations 1–8; unchanged self-checks and 12 independent situational questions');
console.log('KNOWN DESIGN: 12 normative recall items duplicate lesson self-checks; replacement needs a new result index');
console.log('NOT VERIFIED: authenticated progress restoration, unresolved cross-article issues, independent referee-methodologist sign-off');
