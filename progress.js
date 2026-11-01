// Cloud progress is isolated by Supabase Auth user id and protected by database RLS.
window.samboProgress = {userId:null,completed:new Set(),ready:false,error:false,loadId:0};
window.progressKey = (course,index) => course + ':' + index;
window.progressDone = (course,index) => {
  if (window.samboProgress.userId) return window.samboProgress.completed.has(progressKey(course,index));
  return localStorage.getItem('sambo-demo-'+course+'-'+index)==='done';
};
window.loadSamboProgress = async function(user) {
  const p=window.samboProgress;
  // Reject stale responses, including overlapping loads for the SAME account.
  const loadId=++p.loadId;
  p.userId=user?.id||null;p.completed=new Set();p.ready=false;p.error=false;
  if (!user){p.ready=true;renderStudentDashboard();return true;}
  // An authenticated session without a configured cloud client is NOT a successful load.
  // Keep the account scoped, but block unverified saves until a real read succeeds.
  if (!window.samboAuthClient){p.ready=true;p.error=true;renderStudentDashboard();return false;}
  const userId=user.id;
  try {
    const {data,error}=await window.samboAuthClient.from('lesson_progress').select('course_key,lesson_index').eq('user_id',userId);
    if(error)throw error;
    if(p.userId!==userId||p.loadId!==loadId)return false;
    // Preserve a successful save that finished while this read was in flight.
    p.completed=new Set([...p.completed,...(data||[]).map(row=>progressKey(row.course_key,row.lesson_index))]);
  } catch(e) {if(p.userId===userId&&p.loadId===loadId)p.error=true;}
  if(p.userId===userId&&p.loadId===loadId){p.ready=true;renderStudentDashboard();return !p.error;}
  return false;
};
window.saveSamboProgress = async function(course,index) {
  const p=window.samboProgress;
  if(!p.userId){localStorage.setItem('sambo-demo-'+course+'-'+index,'done');renderStudentDashboard();return true;}
  if(!p.ready||p.error){authMessage('Прогресс пока не сохранён: проверьте подключение базы данных.');return false;}
  const userId=p.userId;
  try {
    const {error}=await window.samboAuthClient.from('lesson_progress').upsert({user_id:userId,course_key:course,lesson_index:index},{onConflict:'user_id,course_key,lesson_index',ignoreDuplicates:true});
    if(error)throw error;
    if(p.userId===userId){p.completed.add(progressKey(course,index));renderStudentDashboard();return true;}
    return false;
  } catch(e) {authMessage('Не удалось сохранить результат в облаке. Повторите ответ позже.');return false;}
};


// Historical judge results remain visible but never count as completion of a revised exam.
// Only progress keys belonging to the active account (or this browser's guest mode) are read.
window.samboJudgeHistoricalIndices = function(currentIndex) {
  if(currentIndex===2201)return [1201,1101];
  if(currentIndex===2100)return [1100,100];
  if(currentIndex===1100)return [100];
  if(currentIndex>=1201&&currentIndex<=1211)return [currentIndex-100];
  // Sanctions exam revision 3 uses 1306; earlier 1206/1106 remain read-only history.
  if(currentIndex===1306)return [1206,1106];
  return [];
};
window.samboJudgeHistoricalCompletions = function(currentIndex) {
  return window.samboJudgeHistoricalIndices(currentIndex)
    .filter(index=>window.progressDone('judge',index));
};
