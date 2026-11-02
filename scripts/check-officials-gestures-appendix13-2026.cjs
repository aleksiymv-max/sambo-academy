/* Source-anchored structural guard for Sambo Rules, appendix 13 gestures 2–9 and 21–23.
 * It checks content and preservation, not independent technical certification of gestures. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-officials.js'])
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const engine=ctx.window.samboJudgeCourseEngine,mod=engine.modules[0];
assert.equal(mod.title,'Судейская коллегия и должностные обязанности');
assert.equal(mod.lessons.length,8,'Lesson positions and saved progress must remain stable');
const lesson=mod.lessons[4];
assert.equal(lesson.title,'Руководитель ковра, арбитр, боковой судья');
assert.ok(lesson.ref.includes('приложение 13'));
const prose=lesson.blocks.map(x=>x.join(' ')).join(' ');
for(const term of ['жесты № 3–6','большой и указательный','четыре пальца','открытая ладонь','сжатым кулаком','жест № 21','жест № 22','жест № 23','Статья 20(3)','18(2)(б)'])
 assert.ok(prose.toLowerCase().includes(term.toLowerCase()),'Missing official gesture distinction: '+term);
assert.ok(lesson.blocks.length>=12,'Four additional explanatory blocks expected');
const originalQuestions=[
 'Где находится арбитр во время схватки?',
 'Кто руководит судейской бригадой конкретной схватки?',
 'Как боковой судья привлекает внимание арбитра для остановки?',
 'Кто контролирует технического секретаря, оператора табло и секундометриста?',
 'Что вправе сделать руководитель ковра при существенном расхождении мнений тройки?'
];
assert.equal(lesson.checks.length,8,'Five original plus three additional self-checks');
for(let i=0;i<5;i++){
 assert.equal(lesson.checks[i][0],originalQuestions[i],'Original question changed');
 assert.equal(lesson.checks[i][2],0,'Original answer key changed');
}
assert.deepEqual(Array.from(lesson.checks.slice(5),q=>q[2]),[1,2,3],'New answers must test distinct concepts');
const rendered=engine.sections(mod,4)[5].html;
for(const marker of ['Оценочные жесты','Удержание и болевой','Схватка закончилась','Запрос внимания бокового судьи','Как отличить жест начала удержания'])
 assert.ok(rendered.includes(marker),'Rendered lesson missing: '+marker);
console.log('PASS: appendix 13 gestures 2–9, 21–23 taught and rendered; 8 lesson positions and five original checks preserved');
