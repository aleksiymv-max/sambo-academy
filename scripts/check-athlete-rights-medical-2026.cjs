/* Regression: do not apply the sporting-sambo medical limit to combat sambo.
 * Structural guard only; editorial source verification is documented separately.
 */
const fs=require('node:fs');
const vm=require('node:vm');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-participants.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
const modules=ctx.window.samboJudgeCourseEngine.modules;
if(modules.length!==1)throw Error('Expected one participants module');
const mod=modules[0];
if(mod.lessons.length!==5)throw Error('Participant lesson order/count changed');
const lesson=mod.lessons.find(l=>l.title==='Права спортсмена: информация, обращение и медицинская помощь');
if(!lesson)throw Error('Athlete rights lesson missing');
if(lesson.blocks.length<6||lesson.checks.length<5)throw Error('Athlete rights lesson remains incomplete');
const text=[lesson.ref,lesson.goal,lesson.lead,...lesson.blocks.map(b=>b.join(' ')),lesson.situation,lesson.caseAnalysis,lesson.decision,lesson.trap,...lesson.checks.map(q=>q.join(' '))].join(' ');
for(const marker of ['Статья 9(2)','статья 30(4)','01.09.2026','боевого самбо','3 минуты','2 минуты','статье 41']){
 if(!text.includes(marker))throw Error('Missing normative qualification: '+marker);
}
if(lesson.checks.some(q=>q[0]==='Сколько времени медицинской помощи предусмотрено в одной схватке?'))throw Error('Ambiguous medical time question returned');
for(const q of lesson.checks){
 if(!Array.isArray(q[1])||q[1].length<3||!Number.isInteger(q[2])||q[2]<0||q[2]>=q[1].length||!q[3])throw Error('Invalid answer/explanation: '+q[0]);
}
const combat=lesson.checks.find(q=>q[0].includes('для боевого самбо'));
const sport=lesson.checks.find(q=>q[0].includes('В спортивном самбо'));
if(!combat||combat[1][combat[2]]!=='3 минуты'||!sport||sport[1][sport[2]]!=='Не более 2 минут')throw Error('Medical time answers not discipline-specific');
console.log('PASS: athlete rights lesson has discipline-specific 2/3-minute limits, source markers, case and 5 explained questions');
