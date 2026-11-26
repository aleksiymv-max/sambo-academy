/* Structural regression for source-verified athlete case studies.
 * Normative approval against the official PDF is separately documented.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('athlete-applied-cases.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const ctx={window:{}};
vm.runInNewContext(code,ctx,{filename:'athlete-applied-cases.js'});
const cases=ctx.window.samboAthleteAppliedCases;
assert(cases,'Athlete case bank unavailable');
const titles=Object.keys(cases);
assert.equal(titles.length,4,'Expected four source-verified athlete cases');
assert(new Set(Object.values(cases).map(item=>item.correct)).size>=3,'Predictable correct-answer positions');
const expectedAnswers=["Не допускать к соревнованиям","Свидетельство о рождении и справка с фотографией","Подать сигнал жестом или голосом","Немедленно явиться на ковёр по вызову судейской коллегии"];
assert.deepEqual(titles.map(title=>cases[title].answers[cases[title].correct]),expectedAnswers,'Correct answer text changed');
const expected={
 'Взвешивание: важные действия спортсмена':'Статья 8, пункт 2',
 'Взвешивание: документы, одежда и медицинский осмотр':'Статья 8, пункты 4–5',
 'Права спортсмена во время схватки':'Статья 9, пункт 2, подпункты «д»–«е»',
 'Обязанности участника на ковре':'Статья 9, пункт 1, подпункты «б»–«г»'
};
for(const [title,ref] of Object.entries(expected)){
 const item=cases[title];assert(item,'Missing scenario: '+title);
 assert.equal(item.ref,ref);
 for(const field of ['situation','question','decision','trap'])assert(item[field]&&item[field].length>35,title+': thin '+field);
 assert(item.answers?.length>=3,'Not enough answer choices');
 assert(new Set(item.answers).size===item.answers.length,'Duplicate answer choices');
 assert(Number.isInteger(item.correct)&&item.correct>=0&&item.correct<item.answers.length,'Invalid answer index');
 assert(html.includes("title:'"+title+"'"),'Unpublished target lesson: '+title);
 const rendered=ctx.window.samboAthleteAppliedCaseCard({title},'athlete');
 assert(rendered.includes(item.ref)&&rendered.includes(item.question),'Rendering missing question/reference');
 assert(rendered.includes('Типичная ошибка')&&rendered.includes('Разбор'),'Missing pedagogical elements');
 assert.equal(ctx.window.samboAthleteAppliedCaseCard({title},'judge'),'','Athlete cases visible for referees');
}
assert(html.includes('<script src="athlete-applied-cases.js"></script>'),'Case bank not loaded');
assert(html.includes("practice+(window.samboAthleteAppliedCaseCard?.(p,currentCourse)||'')+"),'Cases not attached to lessons');
assert(html.includes("return group?.progressIndex??(100+moduleIndex);"),'Progress index changed');
assert(html.includes("const base=group.parts.map(p=>({q:p.q,a:p.a,correct:p.correct,body:p.body,kind:'Теория'}))"),
 'Historical quiz source changed');
console.log('PASS: four distinct athlete cases with references, explanations, no quiz/progress mutation');
