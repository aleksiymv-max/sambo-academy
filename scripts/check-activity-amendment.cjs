/* Guard against reintroducing the obsolete activity-as-warning rule.
 * Source: VFS official September 2026 amendments and explanatory PDF.
 * Structural check only, not independent normative certification.
 */
const fs=require('node:fs');
const vm=require('node:vm');
const ctx={window:{}};vm.createContext(ctx);
for(const f of ['judge-course-engine.js','judge-program-bout.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const m=ctx.window.samboJudgeCourseEngine.modules[0];
const lesson=m.lessons.find(l=>l.title==='Определение активности в середине встречи');
if(!lesson)throw Error('Activity lesson missing');
const txt=[lesson.ref,...lesson.blocks.flat(),...lesson.checks.flat(2)].join(' ');
for(const word of ['Активность','вместо предупреждения','большинством','«А»']){
 if(!txt.includes(word))throw Error('Missing official 2026 activity rule: '+word);
}
if(txt.includes('сопернику объявляют очередное предупреждение'))throw Error('Obsolete activity-as-warning instruction persists');
const exam=fs.readFileSync('judge-exam-independent.js','utf8');
if(!exam.includes('записывать оценку «Активность» («А») вместо предупреждения')||exam.includes('определяется активный спортсмен и предупреждается соперник'))throw Error('Independent exam activity explanation outdated');
console.log('PASS: official 2026 activity assessment in lesson and independent exam, no obsolete warning');
