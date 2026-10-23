/* Судейский курс: редакционный движок. Нормативная база — Правила вида спорта «самбо»
 * приказ Минспорта России № 892, изменения до 14.09.2026 № 860.
 * Всякий учебный вывод должен быть сверен с текстом указанной статьи/приложения.
 * Не заменяет аттестацию Федерации и не даёт судейскую квалификацию.
 */
(function(){
"use strict";
const modules=[];
const clean=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paragraphs=s=>String(s).split(/¶/).filter(Boolean).map(p=>'<p>'+clean(p.trim())+'</p>').join('');
const lesson=(title,ref,goal,lead,blocks,situation,caseAnalysis,decision,trap,checks)=>
 ({title,ref,goal,lead,blocks,situation,caseAnalysis,decision,trap,checks});
function register(title,lead,lessons,extras=[]){
 if(!lessons.length || lessons.some(x=>!x.checks?.length||!x.blocks?.length))throw Error('Judge course module incomplete: '+title);
 const exam=lessons.flatMap((lesson,i)=>lesson.checks.map(c=>({q:c[0],a:c[1],correct:c[2],body:c[3],kind:'Проверка: '+lesson.title}))).concat(extras.map(c=>({q:c[0],a:c[1],correct:c[2],body:c[3],kind:'Практический экзамен'})));
 if(!exam.length)throw Error('Empty examination: '+title);
 modules.push({title,lead,lessons,questions:exam,updated:'2026-10-23'});
}
function introduction(mod,index){
 return '<article class="judge-prime"><div class="jp-kicker">ШКОЛА СУДЕЙ · МОДУЛЬ '+(index+1)+'</div><h2>'+clean(mod.title)+'</h2><p class="jp-lead">'+clean(mod.lead)+'</p><div class="jp-goal"><strong>Как проходит обучение</strong><p>Уроки идут последовательно: суть нормы → условия и исключения → порядок действий судьи → практический эпизод → ошибки → самопроверка. Завершает модуль итоговый тест.</p></div><ol>'+mod.lessons.map(x=>'<li>'+clean(x.title)+'</li>').join('')+'</ol><div class="jp-mistake"><strong>Важно:</strong> материал составлен на основании российской редакции Правил самбо с изменениями до 14.09.2026 № 860; сам по себе курс не заменяет официальную практическую аттестацию. При подготовке к реальному турниру проверяйте Положение и действующую редакцию Правил.</div></article>';
}
function render(mod,x,index){
 const sections=x.blocks.map((pair,k)=>'<section class="jp-part"><h3>'+clean((k+1)+'. '+pair[0])+'</h3>'+paragraphs(pair[1])+'</section>').join('');
 const questions=x.checks.map((q,k)=>'<details class="jp-question"><summary><span>'+(k+1)+'</span>'+clean(q[0])+'</summary><div class="jp-answer"><strong>Ответ: </strong>'+clean(q[1][q[2]])+'<p>'+clean(q[3])+'</p></div></details>').join('');
 return '<article class="judge-prime"><div class="jp-kicker">УРОК '+(index+1)+' ИЗ '+mod.lessons.length+'</div><h2>'+clean(x.title)+'</h2><p class="jp-lead">'+clean(x.lead)+'</p><div class="jp-goal"><strong>Практическая цель:</strong><p>'+clean(x.goal)+'</p></div>'+sections+
 '<section class="jp-case"><div class="jp-kicker">СУДЕЙСКАЯ СИТУАЦИЯ</div><h3>От условия к решению</h3><p><strong>Что произошло:</strong> '+clean(x.situation)+'</p><p><strong>Что проверить:</strong> '+clean(x.caseAnalysis)+'</p><p><strong>Обоснованный вывод:</strong> '+clean(x.decision)+'</p></section>'+
 '<div class="jp-mistake"><strong>Типичная ошибка:</strong> '+clean(x.trap)+'</div>'+
 '<div class="jp-summary"><strong>Алгоритм:</strong> Факты → применимый пункт '+clean(x.ref)+' → необходимое действие → фиксация решения.</div>'+
 '<section class="jp-self"><h3>Самопроверка</h3><p>Сначала сформулируйте ответ самостоятельно, затем раскройте пояснение.</p>'+questions+'</section>'+
 '<p class="jp-source">Нормативная основа: '+clean(x.ref)+'. Для окончательного решения используйте полный текст Правил, условия Положения и актуальные указания уполномоченных органов.</p></article>';
}
function sections(mod,index){
 return [{title:'План модуля',html:introduction(mod,index)},...mod.lessons.map((x,i)=>({title:x.title,topicIndex:i,html:render(mod,x,i)})),{title:'Экзамен по модулю',quiz:true,html:'<div class="jp-panel"><h3>Итоговая проверка знаний</h3><p>'+mod.questions.length+' вопросов по этому модулю. Для зачёта необходимо 85% правильных ответов. Ошибки разбираются после завершения. Это учебный, а не официальный квалификационный экзамен.</p></div>'}];
}
window.samboJudgeCourseEngine={modules,lesson,register,sections,clean};
})();