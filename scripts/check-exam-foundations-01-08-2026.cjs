'use strict';
// Normative audit of foundation exam items 1–8, 26.10.2026.
// Official source: order 892, amended by order 860 of 14.09.2026; arts 1–2, appendix 1.
// Explanations 1–8 are checked here; items 9–16 have a separate test. All historical questions/keys and progress index 1100 stay intact.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{}};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('judge-foundations.js','utf8'),sandbox,{filename:'judge-foundations.js'});
const mod=sandbox.window.samboJudgeFoundations;
const qs=Array.from(mod.questions);
assert.equal(mod.progressIndex,1100,'Foundation historical result index changed');
assert.equal(mod.version,'2026-10-23-1','Foundation content version changed');
assert.equal(mod.lessons.length,6);
assert.equal(qs.length,24);
assert.equal(qs.filter(q=>q.kind==='Проверка нормы').length,12);
assert.equal(qs.filter(q=>q.kind==='Судейская ситуация').length,12);
function fnv(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h.toString(16);}
const stable=qs.map(({q,a,correct,kind})=>({q,a,correct,kind}));
assert.equal(fnv(JSON.stringify(stable)),'4910eed2','Original 24 exam questions/options/keys/order changed');
// Foundation items 17–24 are checked by check-exam-foundations-17-24-2026.cjs.
assert.equal(fnv(JSON.stringify(mod.lessons.map((l,i)=>l.questions.slice(0,4)))),'c41346d9','Lesson self-checks were modified');
const expected=[
 ['На что следует опираться в спорной или неописанной в Положении ситуации?',1,'На Правила вида спорта «самбо»',['Приложение 1, пункт 1','Правилами','судейская коллегия']],
 ['Какая статья регулирует характер соревнований?',1,'Статья 1',['Статья 1, пункты 1–5','статье 2','Положением']],
 ['Кто может изменять Положение?',2,'Организации, его утвердившие',['Приложение 1, пункт 4','не позднее начала жеребьёвки','уведомляют']],
 ['Каков предельный срок изменения Положения?',1,'Не позднее начала жеребьёвки',['Приложение 1, пункт 4','после начала жеребьёвки','уведомление']],
 ['Какие характеры соревнований перечислены в статье 1?',0,'Личные, командные, лично-командные',['Статья 1, пункт 1','Статья 1(2)','статье 2']],
 ['Что определяют в личных соревнованиях?',0,'Место спортсмена в его весовой категории',['Статья 1, пункт 3','пункт 4','пункт 5']],
 ['Какие варианты распределения предусматривает статья 2?',0,'Одна группа или несколько подгрупп',['Статья 2, пункт 1','статье 2(3)','перехода']],
 ['Что ещё необходимо указать при подгруппах?',0,'Принцип перехода выигравших и выбывания других',['Статья 2, пункт 1','Статья 2(3)','статья 2(4)']]
];
const self=new Set(mod.lessons.flatMap(l=>l.questions.map(q=>q[0].trim().toLowerCase())));
for(let i=0;i<8;i++){
 const q=qs[i],x=expected[i];
 assert.equal(q.q,x[0],'Question changed at foundation '+(i+1));
 assert.equal(q.correct,x[1],'Answer index changed at foundation '+(i+1));
 assert.equal(q.a[q.correct],x[2],'Correct answer changed at foundation '+(i+1));
 assert.ok(q.body.length>=450,'Insufficient article-level explanation at foundation '+(i+1));
 for(const marker of x[3])assert.ok(q.body.includes(marker),'Missing '+marker+' at foundation '+(i+1));
}
assert.ok(qs.slice(12).every(q=>!self.has(q.q.trim().toLowerCase())),'Independent situational questions must not duplicate self-checks');
console.log('PASS: foundation exam 1–8 source explanations and stable 24-item historical fingerprint');
console.log('PASS: appendix 1(1,4), articles 1(1–5), 2(1,3–4); unchanged self-checks; exam items 17–24 audited separately');
console.log('KNOWN DESIGN: first 12 normative recall items reuse lesson self-check questions; 12 new scenarios do not');
console.log('NOT VERIFIED: authenticated progress restoration, external referee-methodologist sign-off, unresolved cross-article conflicts');
