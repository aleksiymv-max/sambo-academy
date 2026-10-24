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
const full=lessons.map(l=>[l.ref,...l.blocks.flat(),...l.checks.flat(2)].join(' ')).join(' ');
for(const token of ['статьи 36','статьи 34','Статьи 66 и 68','официальных изменениях 2026','учебный алгоритм']){
 if(!full.toLowerCase().includes(token.toLowerCase()))throw Error('Missing documented decision marker: '+token);
}
console.log('PASS: 4 practicum lessons, '+total+' self-check questions, unchanged lesson order and explicit normative caveats');
console.log('NOTE: structural regression only; original rules and authenticated user E2E still require independent verification');
