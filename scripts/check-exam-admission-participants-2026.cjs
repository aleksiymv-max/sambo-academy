'use strict';
// Editorial regression for the first 16 INDEPENDENT exam questions.
// Article-by-article source verification is documented separately.
// This test cannot certify the correctness of the remaining 72 questions.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const raw=fs.readFileSync('judge-exam-independent.js','utf8');
const qLines=raw.split(/\r?\n/).filter(line=>line.startsWith('Q('));
assert.equal(qLines.length,88,'Preserve all 88 expanded-module exam questions');
// Fingerprint of the ORIGINAL question text, four choices and correct indices,
// deliberately excluding explanatory feedback. A changed key or choice must
// receive a separately reviewed baseline rather than silently overwriting it.
const canonical=qLines.map(line=>{
 const m=line.match(/^(Q\(.*\],\d+,)"/);
 assert.ok(m,'Unexpected independent-question format');
 return m[1];
}).join('\n');
let hash=2166136261;
for(let i=0;i<canonical.length;i++){
 hash^=canonical.charCodeAt(i);
 hash=Math.imul(hash,16777619);
}
assert.equal((hash>>>0).toString(16).padStart(8,'0'),'b0f69259',
 'Question/choice/correct-key fingerprint changed: check historical results and exam revision');
const context={window:{}};
vm.createContext(context);
const program=[
 'judge-course-engine.js',
 'judge-program-admission.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js',
 'judge-program-combat.js','judge-program-beach.js','judge-program-demo.js',
 'judge-program-practicum.js','judge-exam-independent.js'
];
for(const file of program)vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const mods=context.window.samboJudgeCourseEngine.modules;
assert.equal(mods.length,11,'Expanded module order must remain stable');
assert.equal(mods.reduce((n,m)=>n+m.questions.length,0),88);
const expected=[
 ['Запросить обязательный полис до допуска',/Статья 3\(5–7\).*страхования.*ОМС/s],
 ['Не допускать к соревнованиям',/Статья 8\(2\).*опоздавший.*не допускается/s],
 ['Официальное взвешивание проводится один раз',/Статья 8\(2\).*только один раз.*Контроль/s],
 ['Записать точный вес и отметку о несоответствии с подписью спортсмена',/Статья 8\(6\).*«НВ».*подпись.*Положения/s],
 ['Статья 5 о недопустимости заявочного взноса для несовершеннолетних',/Статья 5\(3\).*младше 18 лет.*без заявочного/s],
 ['Проверить применимую процедуру разрешения на терапевтическое использование',/Статья 3\(3\).*разрешения на терапевтическое использование/s],
 ['Не допускать к взвешиванию по заключению врача',/Статья 8\(4\).*осмотр.*кожного заболевания/s],
 ['Проверить конкретную возрастную группу, пол, дисциплину и Положение',/Статьи 5\(1\), 7.*возрастную группу.*дисциплину/s],
 ['Через представителя команды',/Статья 9\(2\)\(а\).*представителя команды.*личных соревнованиях/s],
 ['Подать сигнал голосом или жестом',/Статья 9\(2\)\(е\).*жестом или голосом/s],
 ['Проверить и привести форму к требованиям белой футболки',/Статья 10\(1\).*белая футболка.*рисунком/s],
 ['Попросить закрыть тейп эластичным наколенником цвета формы',/Статья 10\(4\).*наколенником цвета формы/s],
 ['Развести роли: представитель не может быть судьёй этого соревнования',/Статья 11\(7\).*не может одновременно/s],
 ['Поднять руку, оставаясь на своём месте',/Статья 11\(10\).*поднятой рукой.*не вставая/s],
 ['К арбитру',/Статья 9\(2\)\(д\).*медицинской помощи.*формы/s],
 ['Требует привести внешний вид в соответствие Правилам',/Статья 9\(1\)\(ж\).*косу или хвост.*20 см/s]
];
const audited=[...Array.from(mods[0].questions),...Array.from(mods[1].questions)];
assert.equal(audited.length,16,'Preserve the first two eight-question exams');
for(let i=0;i<expected.length;i++){
 const q=audited[i], [correctText,explanation]=expected[i];
 assert.equal(q.a.length,4,'Four options expected at question '+(i+1));
 assert.equal(q.a[q.correct],correctText,'Incorrect key at question '+(i+1));
 assert.match(q.body,explanation,'Incomplete source-specific explanation at question '+(i+1));
 const lessonTexts=new Set(mods[Math.floor(i/8)].lessons.flatMap(l=>l.checks.map(x=>x[0].trim().toLowerCase())));
 assert.ok(!lessonTexts.has(q.q.trim().toLowerCase()),'Exam duplicates self-check: '+(i+1));
}
assert.ok(mods.every(m=>m.examRevision===2),'Preserve exam revision for unchanged questions and keys');
console.log('PASS: 16/88 independent questions source-checked (arts 3, 5, 7–11); all original 88 question/choice/key fingerprints preserved');
console.log('NOT VERIFIED: 72 other independent questions, 24 foundation questions, unresolved normative conflicts and real-account progress E2E');
