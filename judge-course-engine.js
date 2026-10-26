/* Судейский курс: редакционный движок. Нормативная база — Правила вида спорта «самбо»
 * приказ Минспорта России № 892, изменения до 14.09.2026 № 860.
 * Всякий учебный вывод должен быть сверен с текстом указанной статьи/приложения.
 * Не заменяет аттестацию Федерации и не даёт судейскую квалификацию.
 */
(function(){
"use strict";
const modules=[];
const clean=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rulesUrl='https://sambo.ru/wp-content/uploads/2025/09/pravila-vida-sporta-sambo-s-izm.-i-dopolneniyami.pdf';
const sourceLink=()=>'<p class="jp-source"><a href="'+rulesUrl+'" target="_blank" rel="noopener noreferrer">Открыть полный текст Правил вида спорта «самбо» (PDF; приказ № 892, изменения по 14.09.2026 № 860)</a></p>';
const amendmentsUrl='https://sambo.ru/wp-content/uploads/2025/09/izmeneniya_v_pravila_vida_sporta_sambo_bez_utesheniya.pdf';
const clarificationsUrl='https://sambo.ru/wp-content/uploads/2025/09/razyasneniya_pravil_vida_sporta_sambo_sentyabr_2026_god.pdf';
const amendmentSourceLinks=()=>'<p class="jp-source" data-amendment-sources="2026"><a href="'+amendmentsUrl+'" target="_blank" rel="noopener noreferrer">Изменения Правил с 1 сентября 2026 (PDF)</a> · <a href="'+clarificationsUrl+'" target="_blank" rel="noopener noreferrer">Разъяснения ВФС по изменениям 2026 (PDF)</a></p>';
const paragraphs=s=>String(s).split(/¶/).filter(Boolean).map(p=>'<p>'+clean(p.trim())+'</p>').join('');
const lesson=(title,ref,goal,lead,blocks,situation,caseAnalysis,decision,trap,checks)=>
 ({title,ref,goal,lead,blocks,situation,caseAnalysis,decision,trap,checks});
function register(title,lead,lessons,extras=[]){
 if(!lessons.length || lessons.some(x=>!x.checks?.length||!x.blocks?.length))throw Error('Judge course module incomplete: '+title);
 const exam=lessons.flatMap((lesson,i)=>lesson.checks.map(c=>({q:c[0],a:c[1],correct:c[2],body:c[3],kind:'Проверка: '+lesson.title}))).concat(extras.map(c=>({q:c[0],a:c[1],correct:c[2],body:c[3],kind:'Практический экзамен'})));
 if(!exam.length)throw Error('Empty examination: '+title);
 modules.push({title,lead,lessons,questions:exam,updated:'2026-10-23'});
}
// Editorial caveats are visible before the exam, not only after an answer is graded.
// Keys are expanded-module display indices (1-based); do not alter progress indices.
const editorialWarnings=Object.freeze({
  5:{heading:"Удержание ровно 10 секунд",body:"Статья 28(6) указывает диапазон от 10 до 19 секунд, а статья 35(3)(д) — неоконченное удержание более 10 секунд. Граничный случай ровно 10 секунд требует официального разъяснения; учебный курс не устанавливает новую норму."},
  6:{heading:"Процедура снятия и история вопроса № 47",body:"В редакции экзамена № 3 вопрос № 47 содержит время первых предупреждений обоих спортсменов, необходимое для применения статьи 34(9). Прежняя неоднозначная формулировка и её результат judge:1206 сохранены как история; действующий зачёт записывается отдельно в judge:1306. Статьи 38(1) и 40(3) по-прежнему различаются в описании процедуры снятия со схватки и требуют официального разъяснения. Дополнительно: сводная статья 41(2)(а) говорит «непосредственно во время соревнований», тогда как отдельные изменения 2026 года и разъяснения ВФС указывают «в день фиксации нарушения» с обязательным перечислением нарушенных пунктов. Это расхождение источников по сроку протеста остаётся открытым; нельзя выдавать более позднюю подачу за бесспорно разрешённую."},
  9:{heading:"Судейская бригада пляжного самбо",body:"Статья 45(4) описывает бригаду из руководителя площадки и судьи, а статья 56 ссылается на большинство из трёх. Отдельные изменения Правил с 1 сентября 2026 и разъяснения ВФС прямо перечисляют трёх лиц: руководителя площадки, судью и бокового судью. Сводная статья 45(4) при этом сохраняет перечень из двух лиц. Направление поправки подтверждено, но несогласованность опубликованных текстов требует официального уточнения; курс не подменяет утверждённый порядок назначения судей."},
  10:{heading:"Оценка исполнительского мастерства",body:"Статья 66 предусматривает трёх судей исполнительского мастерства в бригаде, а статья 68(2) — двух. Количество судей и порядок расчёта оценки нельзя считать окончательно согласованными без официального разъяснения."}
});
function editorialWarning(index){
 const w=editorialWarnings[index];
 return w?'<aside class="jp-mistake" role="note" data-editorial-warning="'+index+'"><strong>Редакторское предупреждение: '+clean(w.heading)+'</strong><p>'+clean(w.body)+'</p></aside>'+(index===6||index===9?amendmentSourceLinks():''):'';
}
function introduction(mod,index){
 return '<article class="judge-prime"><div class="jp-kicker">ШКОЛА СУДЕЙ · МОДУЛЬ '+(index+1)+'</div><h2>'+clean(mod.title)+'</h2><p class="jp-lead">'+clean(mod.lead)+'</p><div class="jp-goal"><strong>Как проходит обучение</strong><p>Уроки идут последовательно: суть нормы → условия и исключения → порядок действий судьи → практический эпизод → ошибки → самопроверка. Завершает модуль итоговый тест.</p></div><ol>'+mod.lessons.map(x=>'<li>'+clean(x.title)+'</li>').join('')+'</ol><div class="jp-mistake"><strong>Важно:</strong> материал составлен на основании российской редакции Правил самбо с изменениями до 14.09.2026 № 860; сам по себе курс не заменяет официальную практическую аттестацию. При подготовке к реальному турниру проверяйте Положение и действующую редакцию Правил.</div>'+sourceLink()+editorialWarning(index)+'</article>';
}
function render(mod,x,index,moduleIndex){
 const sections=x.blocks.map((pair,k)=>'<section class="jp-part"><h3>'+clean((k+1)+'. '+pair[0])+'</h3>'+paragraphs(pair[1])+'</section>').join('');
 const questions=x.checks.map((q,k)=>'<details class="jp-question"><summary><span>'+(k+1)+'</span>'+clean(q[0])+'</summary><div class="jp-answer"><strong>Ответ: </strong>'+clean(q[1][q[2]])+'<p>'+clean(q[3])+'</p></div></details>').join('');
 return '<article class="judge-prime"><div class="jp-kicker">УРОК '+(index+1)+' ИЗ '+mod.lessons.length+'</div><h2>'+clean(x.title)+'</h2><p class="jp-lead">'+clean(x.lead)+'</p>'+editorialWarning(moduleIndex)+'<div class="jp-goal"><strong>Практическая цель:</strong><p>'+clean(x.goal)+'</p></div>'+sections+
 '<section class="jp-case"><div class="jp-kicker">СУДЕЙСКАЯ СИТУАЦИЯ</div><h3>От условия к решению</h3><p><strong>Что произошло:</strong> '+clean(x.situation)+'</p><p><strong>Что проверить:</strong> '+clean(x.caseAnalysis)+'</p><p><strong>Обоснованный вывод:</strong> '+clean(x.decision)+'</p></section>'+
 '<div class="jp-mistake"><strong>Типичная ошибка:</strong> '+clean(x.trap)+'</div>'+
 '<div class="jp-summary"><strong>Алгоритм:</strong> Факты → применимый пункт '+clean(x.ref)+' → необходимое действие → фиксация решения.</div>'+
 '<section class="jp-self"><h3>Самопроверка</h3><p>Сначала сформулируйте ответ самостоятельно, затем раскройте пояснение.</p>'+questions+'</section>'+
 '<p class="jp-source">Нормативная основа: '+clean(x.ref)+'. Для окончательного решения используйте полный текст Правил, условия Положения и актуальные указания уполномоченных органов.</p>'+sourceLink()+'</article>';
}
function sections(mod,index){
 return [{title:'План модуля',html:introduction(mod,index)},...mod.lessons.map((x,i)=>({title:x.title,topicIndex:i,html:render(mod,x,i,index)})),{title:'Экзамен по модулю',quiz:true,html:'<div class="jp-panel"><h3>Итоговая проверка знаний</h3><p>'+mod.questions.length+' вопросов по этому модулю. Для зачёта необходимо 85% правильных ответов. Ошибки разбираются после завершения. Это учебный, а не официальный квалификационный экзамен.</p><p>Редакция экзамена: '+clean(mod.examRevision||1)+'. Предыдущие результаты не засчитываются за новую редакцию автоматически.</p>'+editorialWarning(index)+sourceLink()+'</div>'}];
}
window.samboJudgeCourseEngine={modules,lesson,register,sections,clean};
})();