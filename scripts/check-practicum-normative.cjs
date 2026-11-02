/* Structural regression for the integrated referee practicum.
 * Does not assert independent normative or methodical approval.
 */
const fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{}};vm.createContext(ctx);
for(const path of ['judge-course-engine.js','judge-program-practicum.js']){
 vm.runInContext(fs.readFileSync(path,'utf8'),ctx,{filename:path});
}
const modules=ctx.window.samboJudgeCourseEngine.modules;
if(modules.length!==1)throw Error('Expected one integrated practicum module');
const lessons=modules[0].lessons;
const expected=[
 'Сценарий до соревнований: документация и допуск',
 'Сценарий на ковре: от технического действия до оценки',
 'Сценарий итогов: равенство, нарушения, протокол',
 'Сценарий специальных дисциплин'
];
if(lessons.length!==4)throw Error('Lesson count changed: saved progress mapping may break');
let total=0;
for(let i=0;i<lessons.length;i++){
 const l=lessons[i];
 if(l.title!==expected[i])throw Error('Lesson order/title changed: '+i);
 if(l.blocks.length<5||l.checks.length<5)throw Error('Insufficient explanation or self-check: '+l.title);
 if(!l.ref||!l.goal||!l.situation||!l.caseAnalysis||!l.decision||!l.trap)throw Error('Missing editorial element: '+l.title);
 for(const q of l.checks){
  if(!q[0]||!Array.isArray(q[1])||q[1].length!==4||!Number.isInteger(q[2])||q[2]<0||q[2]>=4||!q[3])throw Error('Invalid self-check answer: '+l.title);
  total++;
 }
}
// Article 15(2)(a), article 42(4), and appendix 11 describe different roles.
const preflight=lessons[0];
const oldPreflightQuestions=[
 'Какой документ определяет систему турнира?',
 'Кто проверяет готовность места проведения?',
 'Спортсмен есть в сетке, но отсутствует во взвешивании. Что проверять?',
 'Кто вправе исправлять расхождение в документах?',
 'Является ли учебный алгоритм самостоятельной нормой?'
];
if(preflight.checks.length!==6)throw Error('Expected five historical + one venue-roles self-check');
for(let i=0;i<oldPreflightQuestions.length;i++){
 if(preflight.checks[i][0]!==oldPreflightQuestions[i]||preflight.checks[i][2]!==0)
  throw Error('Historical practicum self-check changed at '+i);
}
const venueBlock=preflight.blocks.find(b=>b[0]==='Различайте готовность места, пригодность ковра и акт');
if(!venueBlock)throw Error('Missing venue-readiness distinction');
for(const token of ['Статья 15(2)(а)','Статья 42(4)','приложения 11','представитель ОСФ','представитель спортсооружения','врач','Учебный случай','не создаёт новой санкции']){
 if(!venueBlock[1].includes(token))throw Error('Missing source-specific venue detail: '+token);
}
const extra=preflight.checks[5];
if(extra[2]!==2||!extra[0].includes('статье 42(4)')||
 !extra[1][2].includes('представитель ОСФ')||
 !extra[3].includes('приложения 11'))throw Error('Venue roles self-check answer or explanation invalid');
const html=ctx.window.samboJudgeCourseEngine.sections(modules[0],0)[1].html;
for(const token of ['Различайте готовность места, пригодность ковра и акт','Статья 42(4)','Кто по статье 42(4) определяет']){
 if(!html.includes(token))throw Error('Venue roles lesson missing from rendered HTML: '+token);
}

const full=lessons.map(l=>[l.ref,...l.blocks.flat(),...l.checks.flat(2)].join(' ')).join(' ');
for(const token of ['статьи 36','статьи 34','Статьи 66 и 68','официальных изменениях 2026','учебный алгоритм']){
 if(!full.toLowerCase().includes(token.toLowerCase()))throw Error('Missing documented decision marker: '+token);
}
console.log('PASS: 4 practicum lessons, '+total+' self-check questions, unchanged lesson order and explicit normative caveats');
console.log('NOTE: structural regression only; original rules and authenticated user E2E still require independent verification');
