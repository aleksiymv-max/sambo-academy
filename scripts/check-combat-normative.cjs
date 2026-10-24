/* Combat sambo editorial regression: articles 5, 10, 19, 28, 33, 35–38.
 * Structural and source-marker check only; not an official normative sign-off.
 */
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{}};
vm.createContext(context);
for(const file of ['judge-course-engine.js','judge-program-combat.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}
const mods=context.window.samboJudgeCourseEngine.modules;
if(mods.length!==1)throw Error('Expected exactly one combat module');
const mod=mods[0];
if(mod.lessons.length!==4)throw Error('Combat lesson count changed; preserve progress mapping');
const markers=[
 ['14–16','16–18','6 унций','тейпирование','Статья 10'],
 ['нокдаун','10','14–16','16–18','снять шлем','врача'],
 ['одна минута','параллельные отсчёты','20 секунд','два балла','исходного положения'],
 ['Четыре балла','Два балла','Один балл','большинством','медицинского лимита']
];
let questions=0;
for(let i=0;i<mod.lessons.length;i++){
 const l=mod.lessons[i];
 if(l.blocks.length<5||l.checks.length<3)throw Error('Insufficient combat lesson depth: '+l.title);
 const body=[l.title,l.ref,l.goal,l.lead,...l.blocks.flat(),l.situation,l.caseAnalysis,l.decision,l.trap,...l.checks.flat(2)].join(' ');
 for(const marker of markers[i]){
  if(!body.toLowerCase().includes(marker.toLowerCase()))throw Error('Missing combat marker '+marker+' in '+l.title);
 }
 for(const q of l.checks){
  if(!q[0]||!Array.isArray(q[1])||q[1].length!==4||!Number.isInteger(q[2])||q[2]<0||q[2]>=4||!q[3])throw Error('Invalid combat self-check: '+l.title);
  questions++;
 }
}
const all=mod.lessons.map(l=>[l.title,...l.blocks.flat(),l.decision,l.trap].join(' ')).join(' ');
if(all.includes('не накладывать два несоответствующих таймера'))throw Error('Old incorrect parallel-timer instruction persists');
if(!all.includes('До официального разъяснения'))throw Error('Medical-time ambiguity must be flagged');
console.log('PASS: 4 combat lessons, '+questions+' self-checks, verified article markers and parallel timer correction');
console.log('NOTE: independent normative expertise and real-account Supabase E2E remain open');
