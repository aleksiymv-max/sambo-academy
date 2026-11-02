/* Structural regression for rules articles 15, 21, 42–43 and appendices.
 * Checks teaching coverage and answer shape; does not replace normative review.
 */
const fs=require('node:fs');
const vm=require('node:vm');
const ctx={window:{}};
vm.createContext(ctx);
for(const name of ['judge-course-engine.js','judge-program-infrastructure.js']){
 vm.runInContext(fs.readFileSync(name,'utf8'),ctx,{filename:name});
}
const mods=ctx.window.samboJudgeCourseEngine.modules;
if(mods.length!==1)throw Error('Expected one infrastructure module');
const lessons=mods[0].lessons;
if(lessons.length!==3)throw Error('Infrastructure lesson count changed; progress mapping at risk');
const markers=[
 ['11×11','14×14','5 см','6 до 9','1 м','45°','представителем','приложению 11'],
 ['гонг','выверены','без сброса','разминочном','механическое','видеозаписи','50 сантиметров','чистки'],
 ['приложение 8','приложение 9','приложение 11','приложение 12','приложение 14','технический секретарь','трёх дней','первое предупреждение','второе','третье','четвёртом предупреждении','медицинской помощи']
];
let checks=0;
for(let i=0;i<lessons.length;i++){
 const l=lessons[i];
 if(l.blocks.length<5||l.checks.length<4)throw Error('Infrastructure lesson lacks depth: '+l.title);
 const text=[l.title,l.ref,l.goal,l.lead,...l.blocks.flat(),l.situation,l.caseAnalysis,l.decision,l.trap,...l.checks.flat(2)].join(' ').toLowerCase();
 for(const marker of markers[i])if(!text.includes(marker.toLowerCase()))throw Error('Missing rule marker '+marker+' in '+l.title);
 for(const q of l.checks){
  if(!q[0]||!Array.isArray(q[1])||q[1].length!==4||!Number.isInteger(q[2])||q[2]<0||q[2]>=4||!q[3])throw Error('Invalid self-check in '+l.title);
  checks++;
 }
}
// Article 21(2) regression: preserve the five original checks and their keys.
const protocol=lessons[2];
const originalProtocolChecks=[
 'Где находится форма судейского протокола схватки?',
 'Где находится акт готовности места?',
 'Кто ведёт протокол схватки?',
 'В какой срок главный судья направляет отчёт?',
 'Как фиксируют оценки удержаний в протоколе?'
];
if(protocol.checks.length!==9)throw Error('Protocol self-check count changed; expected five originals, two article 21 checks and two appendix 14 checks');
for(let i=0;i<originalProtocolChecks.length;i++){
 if(protocol.checks[i][0]!==originalProtocolChecks[i]||protocol.checks[i][2]!==0)
  throw Error('Original protocol self-check text/key changed at '+i);
}
const [warning,medical,form,signers]=protocol.checks.slice(5);
if(warning[2]!==1||medical[2]!==2||
 !warning[0].includes('второе предупреждение')||
 !medical[0].includes('досрочном окончании'))
 throw Error('New protocol checks have incorrect questions/keys');
if(form[2]!==3||signers[2]!==1||
 !form[0].includes('шапке судейского протокола')||
 !signers[0].includes('подписи предусмотрены'))
 throw Error('Appendix 14 checks have incorrect questions/keys');
const teaching=protocol.blocks.map(x=>x.join(' ')).join(' ');
for(const term of ['Статья 21(2)','Первое предупреждение','второе — 1','третье — 1','четвёртом предупреждении','время оказания ему медицинской помощи','через дробь']){
 if(!teaching.includes(term))throw Error('Missing article 21 teaching evidence: '+term);
}
for(const term of ['Приложение 14: шапка и графы','номер ковра, круг и весовая категория','главного судьи, секретаря, руководителя ковра и технического секретаря','не новая санкция']){
 if(!teaching.includes(term))throw Error('Missing appendix 14 teaching evidence: '+term);
}
const html=ctx.window.samboJudgeCourseEngine.sections(mods[0],7).map(s=>s.html||'').join(' ');
if(!html.includes('Предупреждения в протоколе')||!html.includes('Чистое и медицинское время')||!html.includes('Приложение 14: шапка и графы'))
 throw Error('New article 21 teaching blocks are not rendered');
const all=lessons.flatMap(l=>l.blocks.flat()).join(' ');
if(!all.includes('рекомендацией')||!all.includes('Учебный алгоритм'))throw Error('Normative obligations and educational guidance must be distinguished');
console.log('PASS: 3 infrastructure lessons, '+checks+' self-checks; article 21 warning frame and medical time verified structurally; original checks preserved');
console.log('NOTE: structural coverage only; expert source audit and authenticated Supabase E2E remain open');
