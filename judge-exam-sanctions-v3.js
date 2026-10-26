/* Судейский экзамен: отдельная редакция модуля «Предупреждения, снятие и протесты».
 * Источник: Правила вида спорта «самбо», приказ № 892 с изменениями № 860
 * от 14.09.2026, статья 34(7–9).
 * Исторический банк редакции 2 и результат judge:1206 НЕ изменяются.
 * Учебный экзамен не является официальной аттестацией ВФС.
 */
(function(){
"use strict";
const engine=window.samboJudgeCourseEngine;
if(!engine||engine.modules.length!==11||!window.samboJudgeIndependentExamLoaded)
 throw Error("Sanctions exam v3: independent historical bank is not loaded");
const historical=engine.modules[5];
if(historical.examRevision!==2||historical.questions.length!==8)
 throw Error("Sanctions exam v3: unexpected historical revision");
const old=historical.questions[6];
if(!old.q.includes("первое предупреждение")||old.correct!==2)
 throw Error("Sanctions exam v3: historical item 47 no longer matches");
const corrected={
 q:"В схватке красный получил первое предупреждение на 01:10, синий — на 01:40. Вторые предупреждения обоим объявлены одновременно на 03:00. При равенстве остальных показателей кто проигрывает по статье 34(9)?",
 a:[
  "Красный: его первое предупреждение было раньше",
  "Синий: он получил первое предупреждение последним",
  "Оба спортсмена автоматически получают поражение",
  "Победитель определяется жеребьёвкой"
 ],
 correct:1,
 body:"Дано: красный получил первое предупреждение в 01:10, синий — в 01:40, а вторые предупреждения объявлены одновременно в 03:00. Важные факты: первые предупреждения обоих спортсменов получены в разное время; последующие — одновременно. Норма: статья 34(9) Правил вида спорта «самбо» (приказ № 892 с изменениями от 14.09.2026 № 860). Вывод: проигравшим по специальному критерию считается синий, потому что он получил первое предупреждение последним. Если первые предупреждения получены одновременно или нет данных об их времени, такой вывод по статье 34(9) делать нельзя. Это учебная ситуация, не официальный экзаменационный билет.",
 kind:"Независимая ситуационная задача"
};
const questions=historical.questions.map((q,i)=>i===6?corrected:q);
window.samboJudgeSanctionsExamV3={
 ...historical,questions,examRevision:3,progressIndex:1306,updated:"2026-10-26"
};
window.samboJudgeSanctionsExamV3Loaded=true;
})();
