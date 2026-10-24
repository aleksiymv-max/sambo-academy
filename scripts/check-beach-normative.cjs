/* Regression guard for verified beach-sambo lessons (Rules 2026, articles 44–58).
 * This verifies authored coverage and answer structure, NOT an official rules approval.
 */
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{}};
vm.createContext(context);
for(const path of ['judge-course-engine.js','judge-program-beach.js']){
  vm.runInContext(fs.readFileSync(path,'utf8'),context,{filename:path});
}
const modules=context.window.samboJudgeCourseEngine.modules;
if(modules.length!==1)throw Error('Expected one beach sambo module');
const mod=modules[0];
if(mod.lessons.length!==5)throw Error('Expected five beach sambo lessons');
const markers=[
 ['ст. 44','ст. 45','ст. 46','арбитр','ст. 48','боковой судья'],
 ['Контрбросок','Неудачный бросок','падением','шорт'],
 ['гонгу','3 минуты','двух минут','10 минут'],
 ['ст. 53','ст. 54','ст. 55','дисквалификац'],
 ['ст. 56','ст. 57','ст. 58','6×6','гонг']
];
for(let i=0;i<mod.lessons.length;i++){
 const l=mod.lessons[i];
 if(l.blocks.length<5||l.checks.length<5)throw Error('Insufficient explanation/checks in '+l.title);
 const text=[l.title,l.ref,l.lead,...l.blocks.flat(),l.situation,l.caseAnalysis,l.decision,l.trap,...l.checks.flat(2)].join(' ');
 for(const marker of markers[i]){
  if(!text.toLowerCase().includes(marker.toLowerCase()))throw Error('Missing normative marker '+marker+' in '+l.title);
 }
 for(const q of l.checks){
  if(!q[0]||!Array.isArray(q[1])||q[1].length!==4||!Number.isInteger(q[2])||q[2]<0||q[2]>=4||!q[3])throw Error('Malformed check in '+l.title);
 }
}
const all=mod.lessons.map(l=>[l.title,l.ref,...l.blocks.flat()].join(' ')).join(' ');
if(!all.includes('ст. 56')||!all.includes('ст. 45')||!all.includes('Изменения от 1 сентября 2026'))throw Error('Official beach-sambo side-referee amendment not documented');
console.log('PASS: 5 beach-sambo lessons, 25 self-checks, verified article markers 44–58, 2026 side-referee amendment applied and PDF discrepancy documented');
console.log('NOTE: normative and real-account end-to-end approval remain separate from this regression guard');
