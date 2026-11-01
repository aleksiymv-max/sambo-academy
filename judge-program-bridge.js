/* Редакторское подключение учебных модулей самбо. */
(function(){
const engine=window.samboJudgeCourseEngine;
if(!engine)return;
// Optional historical-test loader: the full production curriculum is checked by CI.
const sanctionsV3=window.samboJudgeSanctionsExamV3;
const foundationsV2=window.samboJudgeFoundationsExamV2;
if(!foundationsV2||foundationsV2.examRevision!==2||foundationsV2.progressIndex!==2100)
 throw Error('Judge bridge: independent foundation exam revision 2 missing');
if(!sanctionsV3||sanctionsV3.examRevision!==3||sanctionsV3.progressIndex!==1306)
 throw Error('Judge bridge: sanctions exam revision 3 missing');
const activeModule=i=>i===5?sanctionsV3:engine.modules[i];
const previousData=samboModuleData;
const previousQuiz=samboQuizQuestions;
const previousSections=samboLessonSections;
samboModuleData=function(key){
 const groups=previousData(key);
 if(key==='judge'){
  if(!groups[0])throw Error('Judge bridge: foundation module missing');
  groups[0]={...groups[0],premiumFoundations:true,progressIndex:2100,examRevision:2};
  engine.modules.forEach((historical,i)=>{
  const m=activeModule(i),g=groups[i+1]||{title:m.title,parts:[]};
  groups[i+1]={...g,title:m.title,premiumFoundations:true,premiumCourse:true,
  moduleIndex:i,progressIndex:i===0?2201:i===5?1306:1201+i,examRevision:m.examRevision,
  parts:m.lessons.map((l,j)=>({title:l.title,sourceIndex:-1,order:j}))};
  });
 }
 return groups;
};
samboQuizQuestions=function(g){
 if(g?.premiumFoundations&&!g?.premiumCourse)return foundationsV2.questions;
 return g?.premiumCourse?activeModule(g.moduleIndex).questions:previousQuiz(g);
};
samboLessonSections=function(g){
 if(g?.premiumCourse)return engine.sections(activeModule(g.moduleIndex),g.moduleIndex+1);
 const sections=previousSections(g);
 if(g?.premiumFoundations&&sections.length&&sections.at(-1).quiz){
  const last=sections.length-1;
  sections[last]={...sections[last],html:sections[last].html.replace('Итоговый тест:',
   'Редакция экзамена: 2 (отдельный зачёт). Итоговый тест:')};
 }
 return sections;
};
window.samboJudgeExpansionLoaded=true;
})();