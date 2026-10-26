/* 2026 VFS jacket-removal rule: lesson and exam warning regression.
 * Editorial source check, not a substitute for the signed amendment or referee approval.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-sanctions.js'])
  vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const engine=ctx.window.samboJudgeCourseEngine;
const mod=engine.modules[0];
assert.equal(mod.title,'Предупреждения, снятие и протесты');
const lesson=mod.lessons.find(x=>x.title==='Снятие со схватки и дисквалификация с соревнований');
assert.ok(lesson,'Sanctions lesson must exist');
assert.ok(lesson.ref.includes('39(1–4)'));
const block=lesson.blocks.find(x=>x[0]==='Куртка снята на ковре: отдельная поправка 2026');
assert.ok(block,'The 2026 jacket-removal amendment must be taught in the lesson');
for(const marker of ['31.08.2026','01.09.2026','непосредственно на ковре','соревновательной зоне',
  'дисквалификацию с соревнований без определения места','уполномоченным судьям',
  'не заменять её предупреждением','не заменяет проверку точного пункта поправки',
  'https://old.sambo.ru/press/news/2026/12181/'])
  assert.ok(block[1].includes(marker),'Missing verified source, condition or limit: '+marker);
const questions=[
 'Кто принимает решение о снятии со схватки по статье 38(1)?',
 'Кто принимает решение о дисквалификации по статье 39(1)?',
 'Как учитываются командные очки при снятии со схватки по статье 38(4)?',
 'Каковы последствия дисквалификации по статье 39(4)?',
 'Какое основание прямо названо в статье 39(3)?'
];
assert.equal(lesson.checks.length,questions.length,'Preserve the five original self-check questions');
for(let i=0;i<questions.length;i++){
 assert.equal(lesson.checks[i][0],questions[i],'Original self-check question changed');
 assert.equal(lesson.checks[i][2],0,'Original self-check key changed');
}
const intro=engine.sections(mod,6)[0].html;
const exam=engine.sections(mod,6).at(-1).html;
for(const html of [intro,exam]){
 assert.ok(html.includes('снятие куртки'),'Plan and exam must disclose the 2026 consequence');
 assert.ok(html.includes('data-amendment-sources="2026"'),'Official amendment links must remain visible');
 assert.ok(html.includes('не заменяет официальную')||html.includes('не официальный'),'No official qualification claim');
}
console.log('PASS 2026 jacket-removal: sourced lesson, preserved 5 keys, pre-exam warning, official PDF caveat');
