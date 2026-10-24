/* Regression check for the demonstration sambo editorial expansion.
 * Verifies lesson structure and guards against silently resolving the
 * discrepancy between articles 66 and 68 of the official rules.
 * This does NOT replace a referee's normative review.
 */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const context={window:{}};vm.createContext(context);
for(const file of ['judge-course-engine.js','judge-program-demo.js']){
  vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}
const [demoModule]=context.window.samboJudgeCourseEngine.modules;
assert(demoModule && demoModule.title.includes('Демонстрационное самбо'));
assert.equal(demoModule.lessons.length,5,'Preserve stable lesson order and progress');
for(const [index,lesson] of demoModule.lessons.entries()){
  assert(lesson.blocks.length>=5,'Insufficient normative depth in demo lesson '+(index+1));
  assert(lesson.checks.length>=3,'Insufficient self-check coverage in demo lesson '+(index+1));
  assert(lesson.ref && lesson.situation && lesson.caseAnalysis && lesson.decision && lesson.trap);
  for(const [q,options,correct,why] of lesson.checks){
    assert(q && options.length===4 && Number.isInteger(correct) && correct>=0 && correct<4 && why);
  }
}
const joined=demoModule.lessons.flatMap(l=>l.blocks.map(x=>x[1])).join('\n');
for(const phrase of ['Статья 60','Статья 62','Статья 63','Статья 67','Статья 68','Статья 69','двух судьях','трёх судей']){
  assert(joined.includes(phrase),'Missing normative coverage or ambiguity note: '+phrase);
}
console.log('PASS: 5 detailed demonstration lessons, 15+ self-checks, articles 59–69 and unresolved 66/68 discrepancy noted.');
