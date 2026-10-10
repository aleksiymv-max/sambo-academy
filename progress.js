// Cloud progress is isolated by Supabase Auth user id and protected by database RLS.
window.samboProgress = {userId:null,completed:new Set(),ready:false,error:false};
window.progressKey = (course,index) => course + ':' + index;
window.progressDone = (course,index) => {
  if (window.samboProgress.userId) return window.samboProgress.completed.has(progressKey(course,index));
  return localStorage.getItem('sambo-demo-'+course+'-'+index)==='done';
};
window.loadSamboProgress = async function(user) {
  const p=window.samboProgress;
  p.userId=user?.id||null;p.completed=new Set();p.ready=false;p.error=false;
  if (!user || !window.samboAuthClient){p.ready=true;renderStudentDashboard();return;}
  const userId=user.id;
  try {
    const {data,error}=await window.samboAuthClient.from('lesson_progress').select('course_key,lesson_index').eq('user_id',userId);
    if(error)throw error;
    if(p.userId!==userId)return;
    p.completed=new Set((data||[]).map(row=>progressKey(row.course_key,row.lesson_index)));
  } catch(e) {if(p.userId===userId)p.error=true;}
  if(p.userId===userId){p.ready=true;renderStudentDashboard();}
};
window.saveSamboProgress = async function(course,index) {
  const p=window.samboProgress;
  if(!p.userId){localStorage.setItem('sambo-demo-'+course+'-'+index,'done');renderStudentDashboard();return;}
  if(!p.ready||p.error){authMessage('Прогресс пока не сохранён: проверьте подключение базы данных.');return;}
  const userId=p.userId;
  try {
    const {error}=await window.samboAuthClient.from('lesson_progress').upsert({user_id:userId,course_key:course,lesson_index:index},{onConflict:'user_id,course_key,lesson_index',ignoreDuplicates:true});
    if(error)throw error;
    if(p.userId===userId){p.completed.add(progressKey(course,index));renderStudentDashboard();}
  } catch(e) {authMessage('Не удалось сохранить результат в облаке. Повторите ответ позже.');}
};
