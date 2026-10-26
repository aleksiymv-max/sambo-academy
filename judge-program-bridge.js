/* Редакторское подключение учебных модулей самбо. */
(function(){
const engine=window.samboJudgeCourseEngine;
if(!engine)return;
const sanctionsV3=window.samboJudgeSanctionsExamV3;
if(!sanctionsV3||sanctionsV3.examRevision!==3||sanctionsV3.progressIndex!==1306)
 throw Error('Judge bridge: sanctions exam revision 3 missing');
const activeModule=i=>i===5?sanctionsV3:engine.modules[i];
const previousData=samboModuleData;
const previousQuiz=samboQuizQuestions;
const previousSections=samboLessonSections;
samboModuleData=function(key){
 const groups=previousData(key);
 if(key==='judge')engine.modules.forEach((historical,i)=>{
  const m=activeModule(i),g=groups[i+1]||{title:m.title,parts:[]};
  groups[i+1]={...g,title:m.title,premiumFoundations:true,premiumCourse:true,
  moduleIndex:i,progressIndex:i===5?1306:1201+i,examRevision:m.examRevision,
  parts:m.lessons.map((l,j)=>({title:l.title,sourceIndex:-1,order:j}))};
 });
 return groups;
};
samboQuizQuestions=function(g){return g?.premiumCourse?activeModule(g.moduleIndex).questions:previousQuiz(g)};
samboLessonSections=function(g){return g?.premiumCourse?engine.sections(activeModule(g.moduleIndex),g.moduleIndex+1):previousSections(g)};
window.samboJudgeExpansionLoaded=true;
})();