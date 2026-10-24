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
 ['приложение 8','приложение 9','приложение 11','приложение 12','приложение 14','технический секретарь','трёх дней']
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
const all=lessons.flatMap(l=>l.blocks.flat()).join(' ');
if(!all.includes('рекомендацией')||!all.includes('Учебный алгоритм'))throw Error('Normative obligations and educational guidance must be distinguished');
console.log('PASS: 3 infrastructure lessons, '+checks+' self-checks, rules 15/21/42/43 and appendices 8/9/11/12/14 markers');
console.log('NOTE: structural coverage only; expert source audit and authenticated Supabase E2E remain open');
