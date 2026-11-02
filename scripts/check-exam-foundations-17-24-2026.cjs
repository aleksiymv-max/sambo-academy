'use strict';
// Foundation exam 17–24 normative editorial regression (26.10.2026).
// Primary source: Rules of Sambo, order 892 as amended by order 860 of 14.09.2026;
// arts 1–2 and appendices 1, 2, 5. Automated checks are not official approval.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{}};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('judge-foundations.js','utf8'),sandbox,{filename:'judge-foundations.js'});
const mod=sandbox.window.samboJudgeFoundations,qs=Array.from(mod.questions);
const fnv=text=>{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h.toString(16);};
assert.equal(mod.progressIndex,1100);assert.equal(mod.version,'2026-10-23-1');
assert.equal(mod.lessons.length,6);assert.equal(qs.length,24);
assert.equal(fnv(JSON.stringify(qs.map(({q,a,correct,kind})=>({q,a,correct,kind})))),'4910eed2','Historical question/choice/key fingerprint changed');
assert.equal(fnv(JSON.stringify(qs.slice(0,8).map(q=>q.body))),'c654c4df','Previously audited explanations 1–8 changed');
assert.equal(fnv(JSON.stringify(qs.slice(8,16).map(q=>q.body))),'1753162d','Previously audited explanations 9–16 changed');
// Preserve the first four historical checks in lessons 2, 3 and 4, and all
// checks of the other three lessons. New application checks are append-only.
assert.equal(fnv(JSON.stringify(mod.lessons.map((l,i)=>l.questions.slice(0,4)))),
 'c41346d9','Historical lesson self-checks changed');
const expected=[
  {
    "q": "На турнире определяют только личные места по категориям. Команды приехали вместе, но командных встреч и командного зачёта нет. Какой характер соответствует описанию?",
    "a": [
      "Командный только по факту делегаций",
      "Личный",
      "Лично-командный по умолчанию",
      "Смешанная система"
    ],
    "correct": 1,
    "kind": "Судейская ситуация"
  },
  {
    "q": "Итоги личных мест спортсменов переводят в места команд по формуле, указанной в Положении. Что это за характер?",
    "a": [
      "Личный без командного итога",
      "Командный со встречами сборных",
      "Лично-командный",
      "Круговой способ"
    ],
    "correct": 2,
    "kind": "Судейская ситуация"
  },
  {
    "q": "После распределения на три подгруппы не указано, кто выйдет в следующий этап. Какой пункт нужно применить?",
    "a": [
      "Статья 2, пункт 1",
      "Статья 1, пункт 3",
      "Статья 42",
      "Приложение о судейских жестах"
    ],
    "correct": 0,
    "kind": "Судейская ситуация"
  },
  {
    "q": "Жеребьёвку хотят провести до выбора способа проведения. Почему это неверная последовательность?",
    "a": [
      "Потому что порядок встреч определяется жеребьёвкой и выбранными системой и способом",
      "Потому что у судей закончились бланки",
      "Потому что для жеребьёвки всегда нужен полный зал",
      "Потому что способ определяется после финала"
    ],
    "correct": 0,
    "kind": "Судейская ситуация"
  },
  {
    "q": "В категории восемь участников. Применяется ли автоматически специальное правило статьи 2, пункта 5 для семи и менее?",
    "a": [
      "Да, оно касается любого числа",
      "Нет, порог пункта 5 здесь не выполнен",
      "Да, если соревнования командные",
      "Да, без исключений"
    ],
    "correct": 1,
    "kind": "Судейская ситуация"
  },
  {
    "q": "В категории шесть участников, а Положение предусматривает круговую систему. Можно ли использовать её по приведённой нормативной базе?",
    "a": [
      "Нет, это всегда запрещено",
      "Да, приложение 2 допускает круговую при шести и менее, а пункт 5 статьи 2 разрешает иной способ по Положению",
      "Только после двух поражений",
      "Только при отсутствии жеребьёвки"
    ],
    "correct": 1,
    "kind": "Судейская ситуация"
  },
  {
    "q": "В категории семь участников, иной способ в Положении не установлен. Какой применяется по статье 2, пункту 5?",
    "a": [
      "Круговой по умолчанию",
      "Выбывание после набора шести штрафных очков с подгруппами, пункт 2(в)",
      "Любой по усмотрению спортсменов",
      "Только выбывание после двух поражений"
    ],
    "correct": 1,
    "kind": "Судейская ситуация"
  },
  {
    "q": "Даже утвердившая Положение организация предлагает поменять способ после начала жеребьёвки. Допускает ли приложение 1 такое изменение?",
    "a": [
      "Да, раз это организация",
      "Нет, предельный срок — до начала жеребьёвки",
      "Да, только если спортсменов мало",
      "Да, при любой неявке"
    ],
    "correct": 1,
    "kind": "Судейская ситуация"
  }
];
const markers=[
  [
    "Статья 1, пункты 1–3",
    "статья 1(4)",
    "статья 1(5)",
    "статье 1(2)"
  ],
  [
    "Статья 1, пункт 5",
    "статья 1(4)",
    "статья 1(3)",
    "Статья 1(2)"
  ],
  [
    "Статья 2, пункт 1",
    "Статья 2(3)",
    "статья 2(4)",
    "подгрупп"
  ],
  [
    "Статья 2, пункт 3",
    "Пункт 4",
    "Приложение 1, пункт 3",
    "пункт 4"
  ],
  [
    "Статья 2, пункт 5",
    "семью и менее",
    "восемь",
    "приложение 5"
  ],
  [
    "Статья 2, пункт 2(а)",
    "Приложение 2, раздел I, пункт 1",
    "статья 2(5)",
    "круговая допустима"
  ],
  [
    "Статья 2, пункт 5",
    "статьи 2(2)(в)",
    "приложении 5",
    "семь"
  ],
  [
    "Приложение 1, пункт 4",
    "не позднее начала жеребьёвки",
    "Статья 2(4)",
    "приложение 1, пункт 1"
  ]
];
for(let i=0;i<8;i++){
 const q=qs[i+16],old=expected[i];
 assert.equal(q.q,old.q,'Historical question changed at '+(i+17));
 assert.equal(q.correct,old.correct,'Historical answer key changed at '+(i+17));
 assert.equal(q.a[q.correct],old.a[old.correct],'Historical correct answer changed at '+(i+17));
 assert.equal(q.kind,old.kind,'Historical question kind changed at '+(i+17));
 assert.ok(q.body.length>=600,'Insufficient source explanation at '+(i+17));
 for(const marker of markers[i])assert.ok(q.body.includes(marker),'Missing source/condition '+marker+' at '+(i+17));
}
const self=new Set(mod.lessons.flatMap(l=>l.questions.map(q=>q[0].trim().toLowerCase())));
assert.ok(qs.slice(12).every(q=>!self.has(q.q.trim().toLowerCase())),'Situational exam items must be independent of self-checks');
console.log('PASS: foundation 17–24 normative explanations and source/condition markers');
console.log('PASS: original 24 questions/keys, progressIndex 1100, version and earlier audited explanations preserved');
console.log('KNOWN DESIGN: first 12 recall questions duplicate self-checks; changing them needs a new result index');
console.log('NOT VERIFIED: authenticated progress restoration, unresolved Rules conflicts, independent referee-methodologist sign-off');
