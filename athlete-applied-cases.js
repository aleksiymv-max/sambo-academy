/* Applied scenarios for athlete lessons. Verified against the consolidated
 * Russian Rules of SAMBO, amendments through 14 September 2026.
 * This file only enriches study pages: it must not change existing exams,
 * answer mappings, progress indices or historical results.
 */
(function(root){
 'use strict';
 const scenarios=Object.freeze({
  'Взвешивание: важные действия спортсмена':{
   ref:'Статья 8, пункт 2',
   situation:'В Положении указано окончание официального взвешивания в 19:00. Спортсмен пришёл в 19:05 и просит взвесить его позднее.',
   question:'Что предусматривают Правила для опоздавшего?',
   answers:['Не допускать к соревнованиям','Взвесить позднее по устному разрешению тренера','Позволить пройти взвешивание перед первой схваткой без условия Положения'],
   correct:0,
   decision:'Статья 8(2) прямо указывает: опоздавший или не явившийся на взвешивание спортсмен к соревнованиям не допускается. Время процедуры заранее устанавливается Положением.',
   trap:'Не путайте предусмотренное Положением исключительное взвешивание в день соревнований с личным разрешением опоздать.'
  },
  'Взвешивание: документы, одежда и медицинский осмотр':{
   ref:'Статья 8, пункты 4–5',
   situation:'Тринадцатилетний спортсмен предъявляет свидетельство о рождении, но не подготовил справку с фотографией.',
   question:'Какой документальный комплект назван для участника моложе 14 лет?',
   answers:['Свидетельство о рождении и справка с фотографией','Только устное подтверждение тренера','Только свидетельство о рождении'],
   correct:0,
   decision:'Статья 8(5) требует для лиц моложе 14 лет свидетельство о рождении и справку с фотографией. Согласно пункту 4, перед процедурой проводится внешний медицинский осмотр.',
   trap:'Не путайте документы для установления личности при взвешивании с заявкой и страховками, предъявляемыми комиссии по допуску.'
  },
  'Права спортсмена во время схватки':{
   ref:'Статья 9, пункт 2, подпункты «д»–«е»',
   situation:'Спортсмен замечает запрещённый приём соперника, однако судьи его не замечают.',
   question:'Какое действие спортсмена разрешено?',
   answers:['Подать сигнал жестом или голосом','Самостоятельно остановить схватку и объявить победу','Без разрешения покинуть ковёр'],
   correct:0,
   decision:'По статье 9(2)(е) спортсмен вправе подать сигнал жестом или голосом при незамеченном запрещённом приёме. Просить арбитра об остановке по статье 9(2)(д) можно только для медпомощи или приведения формы в порядок.',
   trap:'Право подать сигнал не означает права самостоятельно прекратить схватку или принять судейское решение.'
  },
  'Обязанности участника на ковре':{
   ref:'Статья 9, пункт 1, подпункты «б»–«г»',
   situation:'Спортсмен уже вызван на ковёр, но решает дождаться товарища и самостоятельно переносит свой выход.',
   question:'Какое действие соответствует его обязанностям?',
   answers:['Немедленно явиться на ковёр по вызову судейской коллегии','Выйти после любого удобного команде перерыва','Самостоятельно изменить порядок схваток'],
   correct:0,
   decision:'Статья 9(1)(б–в) требует выполнять требования судей и немедленно выходить на ковёр по вызову. О невозможности продолжать соревнования следует немедленно сообщить судейской коллегии.',
   trap:'Расписание и вызов не являются рекомендациями; спортсмен не может сам изменять порядок выхода.'
  }
 });
 const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 root.samboAthleteAppliedCases=scenarios;
 root.samboAthleteAppliedCaseCard=function(part,course){
  if(course!=='athlete'||!part)return '';
  const item=scenarios[part.title];if(!item)return '';
  // Rotate displayed self-check options by the stable lesson title, without
  // changing the stored answer index or any historical quiz/progress data.
  const titles=Object.keys(scenarios);
  const offset=titles.indexOf(part.title)%item.answers.length;
  const shown=item.answers.map((_,i)=>item.answers[(i+offset)%item.answers.length]);
  const options=shown.map(a=>'<li>'+escapeHtml(a)+'</li>').join('');
  return '<section class="sambo-lesson-intro sambo-athlete-applied-case">'+
    '<h4>Практическая ситуация спортсмена</h4><p>'+escapeHtml(item.situation)+'</p>'+
    '<p><strong>Ваше решение:</strong> '+escapeHtml(item.question)+'</p><ol>'+options+'</ol>'+
    '<details class="sambo-self-check"><summary>Открыть решение, норму и типичную ошибку</summary>'+
    '<p><strong>Правильный ответ:</strong> '+escapeHtml(item.answers[item.correct])+'</p>'+
    '<p><strong>Разбор:</strong> '+escapeHtml(item.decision)+'</p>'+
    '<p><strong>Типичная ошибка:</strong> '+escapeHtml(item.trap)+'</p>'+
    '<p><strong>Нормативная основа:</strong> '+escapeHtml(item.ref)+' (редакция 14.09.2026).</p>'+
    '</details></section>';
 };
})(window);
