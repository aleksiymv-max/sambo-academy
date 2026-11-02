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
// Appendix 13.1: distinguish procedural gestures from the article 51(3) activity award.
const beachTime=mod.lessons[2];
const historicalTimeChecks=[
 'Сколько длится пляжная схватка, включая медальные встречи?',
 'Что является моментом окончания схватки по статье 50?',
 'Когда применяется оценка активности по статье 51?',
 'Что произойдёт, если после оценки активности до конца схватки так и не было технических действий?',
 'Какой минимальный отдых между схватками?'
];
if(beachTime.checks.length!==8)throw Error('Expected five historical + three beach-gesture checks');
for(let i=0;i<historicalTimeChecks.length;i++){
 if(beachTime.checks[i][0]!==historicalTimeChecks[i]||beachTime.checks[i][2]!==0)
  throw Error('Historical beach timing self-check changed: '+i);
}
for(const [i,key] of [[5,1],[6,2],[7,3]]){
 if(beachTime.checks[i][2]!==key)throw Error('Beach gesture self-check answer changed: '+i);
}
const gestureBlocks=beachTime.blocks.filter(b=>/приложение 13\.1|Судейская ситуация: жест активности/.test(b[0]));
if(gestureBlocks.length!==5)throw Error('Five appendix 13.1 teaching blocks required');
const gestureText=gestureBlocks.flat().join(' ').toLowerCase();
for(const marker of ['жест № 10','вращение предплечьями','знак «+»','статья 51(3)','врач','секундометрист','гонгом','жест № 11','№ 13','судейская ситуация','решение:','ошибка:']){
 if(!gestureText.includes(marker.toLowerCase()))throw Error('Missing beach gesture detail: '+marker);
}
const gestureHtml=context.window.samboJudgeCourseEngine.sections(mod,0)[3].html;
for(const marker of ['Активизировать борьбу — не присудить активность','Судейская ситуация: жест активности','Что означает вращение предплечьями','Как арбитр показывает остановку времени','Когда секундометрист начинает отсчёт']){
 if(!gestureHtml.includes(marker))throw Error('Beach gesture missing from rendered lesson: '+marker);
}

// Article 45(5): judge's own kit is distinct from athlete uniform (article 44).
const judgeKit=mod.lessons[0];
const historicalKitChecks=[
 'Какая куртка предусмотрена для пляжного самбо?',
 'Какова нижняя граница шорт по статье 44?',
 'Кто руководит работой судейской бригады на площадке?',
 'Как обозначают активного спортсмена на табло?',
 'Кто входит в нейтральную пляжную бригаду согласно отдельным изменениям ВФС от 1 сентября 2026?'
];
if(judgeKit.checks.length!==6)throw Error('Expected 5 historical + 1 article 45 judge-kit self-check');
for(let i=0;i<historicalKitChecks.length;i++){
 if(judgeKit.checks[i][0]!==historicalKitChecks[i]||judgeKit.checks[i][2]!==0)
  throw Error('Historical beach judge-kit self-check changed: '+i);
}
const kitBlock=judgeKit.blocks.find(b=>b[0]==='Судейская форма и обязательный комплект (ст. 45, п. 5)');
if(!kitBlock)throw Error('Missing article 45(5) judge readiness block');
for(const term of ['Статья 45(5)','судейский билет','Правила соревнований','свисток','белая рубашка','красным и синим рукавами','белые шорты','белые носки','спортивная обувь','кепка','белый брючный ремень','не должно быть никаких предметов','Учебный случай','не устанавливает санкцию спортсмену']){
 if(!kitBlock[1].toLowerCase().includes(term.toLowerCase()))throw Error('Missing judge-kit source-specific detail: '+term);
}
if(judgeKit.checks[5][2]!==1||!judgeKit.checks[5][0].includes('статья 45(5)')||
   !judgeKit.checks[5][3].includes('судейский билет'))
 throw Error('Article 45(5) new self-check key or explanation invalid');
const kitHtml=context.window.samboJudgeCourseEngine.sections(mod,0)[1].html;
for(const term of ['Судейская форма и обязательный комплект','судейский билет','Арбитр пляжного самбо пришёл']){
 if(!kitHtml.includes(term))throw Error('Article 45(5) missing from rendered lesson: '+term);
}

// Article 58(6–8) is a beach-specific equipment rule, not the general mat rule.
const equipment=mod.lessons[4];
const originalChecks=[
 'Каков размер пляжной площадки?',
 'Сколько флагов предусмотрено по углам?',
 'Какое требование к сигналам разных площадок?',
 'Может ли секундомер обнуляться при каждой остановке?',
 'Можно ли подать апелляцию против судейского решения по пляжной схватке по статье 56?'
];
for(let i=0;i<originalChecks.length;i++){
 if(equipment.checks[i][0]!==originalChecks[i]||equipment.checks[i][2]!==0)
  throw Error('Historical beach self-check changed: '+i);
}
const equipmentText=[...equipment.blocks.flat(),...equipment.checks.flat(2)].join(' ');
for(const term of ['ст. 58, п. 6','ст. 58, пп. 7–8','каждой площадке','ручной секундомер','видеокамера','20 дюймов','не требует механическое табло','Факты:','Норма:','Вывод:']){
 if(!equipmentText.toLowerCase().includes(term.toLowerCase()))
  throw Error('Missing article 58 equipment detail: '+term);
}
if(equipment.checks.length!==8)throw Error('Expected 5 historical + 3 new equipment checks');
for(const [i,key] of [[5,1],[6,2],[7,3]]){
 if(equipment.checks[i][2]!==key)throw Error('Incorrect article 58 check key: '+i);
}
const rendered=context.window.samboJudgeCourseEngine.sections(mod,0)[5].html;
for(const term of ['Резерв при отключении электричества','Камера и экран для просмотра','Ситуация: табло отключилось','20 дюймов']){
 if(!rendered.includes(term))throw Error('Beach article 58 lesson missing from rendered HTML: '+term);
}
const all=mod.lessons.map(l=>[l.title,l.ref,...l.blocks.flat()].join(' ')).join(' ');
if(!all.includes('ст. 56')||!all.includes('ст. 45')||!all.includes('Изменения от 1 сентября 2026'))throw Error('Official beach-sambo side-referee amendment not documented');
console.log('PASS: '+mod.lessons.length+' beach-sambo lessons, '+mod.lessons.reduce((n,l)=>n+l.checks.length,0)+' self-checks, article 58(6–8) backup/video/monitor coverage, 2026 side-referee amendment and PDF discrepancy documented');
console.log('NOTE: normative and real-account end-to-end approval remain separate from this regression guard');
