'use strict';
// Youth armbar amendment: 2026-09-01 source comparison. This guard checks
// presentation and key stability, NOT official interpretation of ambiguous text.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-bout.js','judge-exam-independent.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
const engine=ctx.window.samboJudgeCourseEngine,mod=engine.modules[0];
assert.equal(mod.title,'Проведение схватки: положения, время и результат');
assert.equal(mod.lessons.length,7,'Existing lesson identifiers must remain stable');
const l=mod.lessons[2];
assert.equal(l.title,'Болевые приёмы и удержания: критерии начала и остановки');
assert.equal(l.checks.length,5,'Do not silently alter existing lesson check questions');
assert.ok(l.ref.includes('Статья 28')&&l.ref.includes('статья 27'));
const youth=l.blocks.find(([title])=>title.includes('Поправка 2026: болевой на руку'));
assert.ok(youth,'Missing 2026 youth armbar source comparison');
const body=youth[1];
for(const term of ['11–12','12–14','14–16','атакуемого','плеч','переходе','разъяснение','Дано:','Проверка:','Вывод:']){
 assert.ok(body.includes(term),'Missing age-specific normative concept: '+term);
}
assert.ok(body.includes('сводном тексте')&&body.includes('отдельные изменения'));
const pages=engine.sections(mod,4);
assert.equal(pages.length,9);
for(const page of [pages[0],pages[3],pages.at(-1)]){
 assert.ok(page.html.includes('data-editorial-warning="4"'),'Missing caveat in plan, lesson or exam');
 assert.ok(page.html.includes('data-amendment-sources="2026"'),'Missing official amendment links');
 for(const url of [
  'https://sambo.ru/wp-content/uploads/2026/08/izmeneniya_v_pravila_vida_sporta_sambo_bez_utesheniya.pdf',
  'https://sambo.ru/wp-content/uploads/2026/08/razyasneniya_pravil_vida_sporta_sambo_sentyabr_2026_god.pdf'
 ])assert.ok(page.html.includes('href="'+url+'"'),'Missing source '+url);
}
assert.equal(mod.questions.length,8,'Existing active exam length must remain unchanged');
assert.equal(mod.examRevision,2,'Keep active independent exam revision 2');
console.log('PASS: age-specific 2026 armbar amendment explained in lesson, with uncertainty and source links');
console.log('PASS: module plan, lesson and exam disclose caveat; seven lessons and eight exam questions preserved');
console.log('OPEN: exact interpretation of ambiguous amendment wording requires authorised clarification');
