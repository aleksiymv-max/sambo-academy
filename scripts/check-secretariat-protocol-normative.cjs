/* Regression guard for officials: chief secretariat and bout protocol.
 * Source: Russian Sambo Rules (№892, amendments through 14.09.2026 №860),
 * articles 17 and 21; this is a structural guard, not legal certification.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{}};vm.createContext(sandbox);
for(const name of ['judge-course-engine.js','judge-program-officials.js']){
  vm.runInContext(fs.readFileSync(name,'utf8'),sandbox,{filename:name});
}
const mod=sandbox.window.samboJudgeCourseEngine.modules[0];
assert.equal(mod.lessons.length,8,'Existing lesson order and progress mapping must remain stable');
const specs=[
  {index:3,title:'Главный секретарь и секретариат',ref:'Статья 17',blocks:8,checks:5,
   markers:['с разрешения главного судьи','Заместитель главного секретаря','Распоряжения и утверждение результатов','Учебный алгоритм при расхождении']},
  {index:5,title:'Технический секретарь и протокол схватки',ref:'Статья 21',blocks:8,checks:5,
   markers:['обводятся окружностью','вписывать баллы за предупреждения в рамку','различия дисциплин','сохранять возможность определить последнюю оценку']}
];
for(const x of specs){
  const l=mod.lessons[x.index];
  assert.equal(l.title,x.title,'Lesson moved or renamed');
  assert.ok(l.ref.includes(x.ref),'Missing article reference');
  assert.ok(l.blocks.length>=x.blocks,'Insufficient explanation depth: '+x.title);
  assert.ok(l.checks.length>=x.checks,'Insufficient self-checks: '+x.title);
  assert.ok(l.goal&&l.situation&&l.caseAnalysis&&l.decision&&l.trap,'Missing editorial sections');
  const prose=l.blocks.map(b=>b.join(' ')).join(' ');
  for(const marker of x.markers)assert.ok(prose.includes(marker),'Missing verified content: '+marker);
  for(const q of l.checks){
    assert.ok(q[0]&&q[3]&&Array.isArray(q[1])&&q[1].length>=3,'Malformed question');
    assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<q[1].length,'Invalid answer index');
  }
}
assert.equal(new Set(mod.lessons.map(l=>l.title)).size,8,'Duplicate lesson titles');
console.log('PASS: officials articles 17 and 21, two deepened lessons, 16 teaching blocks and 10 explained checks; order preserved');
