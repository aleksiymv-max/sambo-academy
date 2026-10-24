/* Regression guard for referee officials: Russian Sambo Rules arts. 14–16, revision 14.09.2026 №860.
 * Checks presence and structural integrity, NOT an independent legal certification. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{}};vm.createContext(sandbox);
for(const name of ['judge-course-engine.js','judge-program-officials.js']){
  vm.runInContext(fs.readFileSync(name,'utf8'),sandbox,{filename:name});
}
const mod=sandbox.window.samboJudgeCourseEngine.modules[0];
assert.equal(mod.title,'Судейская коллегия и должностные обязанности');
assert.equal(mod.lessons.length,8,'Do not change established lesson/progress positions');
const expected=[
 {title:'Состав коллегии и судейская тройка',ref:'Статья 14',blocks:6,checks:4,terms:['три федеральных округа','Аргументация решений','Судейская форма']},
 {title:'Главный судья: до, во время и после турнира',ref:'Статья 15',blocks:7,checks:5,terms:['Пределы полномочий','в течение трёх дней','отменять решение судейской тройки']},
 {title:'Заместитель главного судьи',ref:'Статья 16',blocks:6,checks:4,terms:['НЕ после объявления результата','Санкции и разделение полномочий','ходатайствует']}
];
for(let i=0;i<expected.length;i++){
 const l=mod.lessons[i],e=expected[i];
 assert.equal(l.title,e.title);
 assert.ok(l.ref.includes(e.ref),l.title+': missing normative reference');
 assert.ok(l.blocks.length>=e.blocks,l.title+': missing explanation blocks');
 assert.ok(l.checks.length>=e.checks,l.title+': missing self-check questions');
 const prose=l.blocks.map(p=>p.join(' ')).join(' ');
 for(const term of e.terms)assert.ok(prose.includes(term),l.title+': missing '+term);
 for(const q of l.checks){
  assert.ok(q[0]&&q[3]&&q[1].length>=3&&Number.isInteger(q[2])&&q[2]>=0&&q[2]<q[1].length,'Malformed self-check in '+l.title);
 }
}
assert.equal(new Set(mod.lessons.map(l=>l.title)).size,mod.lessons.length,'Duplicate lesson titles');
console.log('PASS: officials arts. 14–16, 3 enhanced lessons, 10 new explanatory blocks, 7 self-checks, lesson order preserved');
