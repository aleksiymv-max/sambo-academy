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
assert.ok(lesson.checks.length>=questions.length,'Preserve the five original self-check questions');
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
// The participant-equipment module must not imply that every form breach is the same.
vm.runInContext(fs.readFileSync('judge-program-participants.js','utf8'),ctx,{filename:'judge-program-participants.js'});
const participant=engine.modules.find(x=>x.title==='Участник, представитель, экипировка и безопасность');
assert.ok(participant,'Participants module must remain registered');
const clothing=participant.lessons.find(x=>x.title==='Экипировка спортивного самбо');
assert.ok(clothing,'Article 10 lesson must remain present');
const exception=clothing.blocks.find(x=>x[0]==='Снятие куртки на ковре: специальное последствие с 01.09.2026');
assert.ok(exception,'The clothing lesson must distinguish jacket removal from an ordinary form defect');
for(const token of ['Статья 10','31.08.2026','01.09.2026','непосредственно на ковре','соревновательной зоне','без определения места','уполномоченным судьям','точный номер пункта','https://old.sambo.ru/press/news/2026/12181/'])
 assert.ok(exception[1].includes(token),'Missing participants exception condition or source: '+token);
assert.equal(clothing.checks.length,6,'Preserve all six participant-equipment self-check questions');
assert.deepEqual(Array.from(clothing.checks,q=>q[2]),[0,0,0,0,1,0],'Preserve all six participant-equipment self-check keys');
const participantsIntro=engine.sections(participant,2)[0].html;
const participantsExam=engine.sections(participant,2).at(-1).html;
for(const html of [participantsIntro,participantsExam]){
 assert.ok(html.includes('снятие куртки'),'Participants module must disclose the exception before the exam');
 assert.ok(html.includes('data-amendment-sources="2026"'),'Participants warning must link official 2026 PDF amendments');
 assert.ok(html.includes('не устанавливает дополнительные санкции'),'Do not invent an additional disqualification');
}
console.log('PASS 2026 jacket-removal: sanctions and participant lessons, 11 preserved self-check keys, two pre-exam warnings, source caveat');
