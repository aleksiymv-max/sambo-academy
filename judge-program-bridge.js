/* Редакторское подключение учебных модулей самбо. */
(function(){
const engine=window.samboJudgeCourseEngine;
if(!engine)return;
const previousData=samboModuleData;
const previousQuiz=samboQuizQuestions;
const previousSections=samboLessonSections;
samboModuleData=function(key){
 const groups=previousData(key);
 if(key==='judge')engine.modules.forEach((m,i)=>{
  const g=groups[i+1];if(!g)return;
  groups[i+1]={...g,title:m.title,premiumFoundations:true,premiumCourse:true,
  moduleIndex:i,progressIndex:1101+i,
  parts:m.lessons.map((l,j)=>({title:l.title,sourceIndex:-1,order:j}))};
 });
 return groups;
};
samboQuizQuestions=function(g){return g?.premiumCourse?engine.modules[g.moduleIndex].questions:previousQuiz(g)};
samboLessonSections=function(g){return g?.premiumCourse?engine.sections(engine.modules[g.moduleIndex],g.moduleIndex+1):previousSections(g)};
window.samboJudgeExpansionLoaded=true;
})();