import { chromium } from 'playwright';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd(),port=8765;
const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(detail?' — '+detail:''));if(!ok)process.exitCode=1};
const contentTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+pathname.replace(/\/$/,'/index.html'));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':contentTypes[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res);});
await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
const errors=[];
let browser;
try {
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1365,height:900}});
 await context.addInitScript(()=>{
   window.__mock={user:null,cb:null,saved:[],guardian:'pending',saveFails:false};
 });
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 const moduleCode=`export function createClient(){
 const m=window.__mock;
 const auth={
   getUser:async()=>({data:{user:m.user},error:null}),
   onAuthStateChange:(cb)=>{m.cb=cb;return {data:{subscription:{unsubscribe(){}}}}},
   signInWithPassword:async()=>{m.user={id:'test-adult-1',email:'student@example.test',user_metadata:{date_of_birth:'1995-01-01',account_type:'adult_learner'}};m.cb?.('SIGNED_IN',{user:m.user});return {data:{user:m.user},error:null}},
   signOut:async()=>{m.user=null;m.cb?.('SIGNED_OUT',null);return {error:null}},
   signUp:async()=>({data:{user:null},error:null}),
   resetPasswordForEmail:async()=>({data:{},error:null}),
   updateUser:async({data})=>{m.user.user_metadata={...m.user.user_metadata,...data};return {data:{user:m.user},error:null}}
 };
 const from=(table)=>({
    select:()=>({eq:async()=>table==='lesson_progress'?{data:m.saved,error:null}:{data:{status:m.guardian},error:null},eq(){return this},maybeSingle:async()=>({data:{status:m.guardian},error:null})}),
    upsert:async(row)=>m.saveFails?{error:{message:'mock database offline'}}:(m.saved.push(row),{error:null}),
    insert:async()=>({error:null})
 });
 return {auth,from};
}`;
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm',route=>route.fulfill({status:200,contentType:'text/javascript',body:moduleCode}));
 await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!document.querySelector('.nav-actions')?.classList.contains('auth-pending'),{timeout:12000});
 check('initial landing, no browser errors',!!(await page.locator('h1').first().textContent()),errors.join(' | '));
 check('logged-out header login/signup visible',await page.locator('#navLogin').isVisible()&&await page.locator('#navSignup').isVisible());
 await page.evaluate(()=>openCourse('athlete'));
 const totalAthlete=await page.locator('#lessons .sambo-module-card').count();
 check('athlete course modules render',totalAthlete>=4,'modules='+totalAthlete);
 await page.locator('#lessons .sambo-module-card').first().locator('.sambo-topic-link').last().click();
 const heading=await page.locator('#lessonTitle').textContent();
 const currentTopic=await page.evaluate(()=>samboModuleData(currentCourse)[currentModule].parts.at(-1).title);
 check('topic link opens requested individual topic',heading.includes(currentTopic),heading);
 await page.locator('.logo-home').click();
 check('brand logo returns home',!(await page.locator('#home').evaluate(e=>e.classList.contains('hidden'))));
 await page.evaluate(()=>{openCourse('judge');});
 check('judge modules render',await page.locator('#lessons .sambo-module-card').count()>=5);
 // Every expanded module must be reachable from the visible course and render its own first lesson.
 const judgeModules=await page.evaluate(()=>samboModuleData('judge').map((g,i)=>({
  index:i,title:g.title,lessons:g.parts.length,first:g.parts[0]?.title,questions:samboQuizQuestions(g).length,
  progress:samboModuleProgressIndex('judge',i)
 })));
 check('all twelve judge modules registered',judgeModules.length===12,'modules='+judgeModules.length);
 check('expanded judge modules contain fifty-four authored lessons',judgeModules.slice(1).reduce((n,g)=>n+g.lessons,0)===54);
  check('independent exam bank loaded',await page.evaluate(()=>window.samboJudgeIndependentExamLoaded===true));
  check('all revised judge exams use independent questions',await page.evaluate(()=>window.samboJudgeCourseEngine.modules.every(m=>m.examRevision===2&&m.questions.length>=8&&!m.questions.some(q=>m.lessons.some(l=>l.checks.some(c=>c[0].trim().toLowerCase()===q.q.trim().toLowerCase()))))));
 check('LOCAL VFS 2026 submission timer majority explanation',await page.evaluate(()=>
   window.samboJudgeCourseEngine.modules[2].questions[5].body.includes('Это два голоса из трёх')));
 check('LOCAL independent bout exam source explanations',await page.evaluate(()=>
   window.samboJudgeCourseEngine.modules[3].questions.length===8&&
   window.samboJudgeCourseEngine.modules[3].questions.every(q=>q.body.length>180)&&
   window.samboJudgeCourseEngine.modules[3].questions[4].body.includes('Различие сводного текста')));
 check('expanded judge progress IDs are unique',new Set(judgeModules.map(g=>g.progress)).size===judgeModules.length);
 for(const g of judgeModules.slice(1)){
  await page.evaluate(()=>openCourse('judge'));
  const card=page.locator('#lessons .sambo-module-card').nth(g.index);
  await card.locator('summary').click();
  await card.locator('.sambo-topic-link').first().click();
  const shown=(await page.locator('.judge-prime h2').first().textContent())||'';
  check('judge module '+(g.index+1)+' opens authored lesson',shown.includes(g.first)&&await page.locator('.judge-prime .jp-part').count()>=2,shown);
  check('judge module '+(g.index+1)+' has exam questions',g.questions>=g.lessons);
 }
 await page.evaluate(()=>openCourse('judge'));
 const openFirst=await page.locator('#lessons details').first().evaluate(e=>e.open);
 check('first module expanded',openFirst);
 const judgeInfo=await page.evaluate(()=>{const g=samboModuleData('judge')[0];return {name:g.title,lessons:g.parts.length,premium:g.premiumFoundations,questions:samboQuizQuestions(g).length,progress:samboModuleProgressIndex('judge',0),sections:samboLessonSections(g).length}});
 check('judge foundation has six curated sequential lessons',judgeInfo.premium&&judgeInfo.lessons===6&&judgeInfo.sections===8,JSON.stringify(judgeInfo));
 check('judge foundation has 24 verified questions',judgeInfo.questions===24);
 check('updated judge module has separate progress version',judgeInfo.progress===1100);
 await page.locator('#lessons .sambo-module-card').first().locator('.sambo-topic-link').first().click();
 check('judge first lesson opens directly',await page.locator('#lessonTitle').textContent()!=='');
 check('judge first lesson contains clear sequence',await page.locator('.judge-prime .jp-part').count()>=4);
 check('judge first lesson contains situation and explanations',await page.locator('.judge-prime .jp-case').count()===1&&await page.locator('.judge-prime .jp-question').count()===4);
 await page.evaluate(()=>openCourse('judge'));
 await page.locator('#lessons .sambo-module-card').first().locator('.sambo-topic-link').last().click();
 check('judge last lesson is integrated practical exercise',(await page.locator('.judge-prime h2').textContent()).includes('практикум'));
 await page.evaluate(()=>{localStorage.setItem('sambo-demo-judge-100','done');openCourse('judge')});
 check('old judge module completion is not falsely credited',(await page.locator('#lessons .sambo-module-card').first().locator('.sambo-module-state').textContent()).includes('Раскрыть'));
 await page.evaluate(()=>{openLesson(0);samboSectionIndex=samboLessonSections(samboModuleData(currentCourse)[0]).length-1;renderSamboSection();startModuleQuiz();});
 const judgeQuizLength=await page.evaluate(()=>samboActiveQuiz.length);
 check('judge final exam creates all 24 questions',judgeQuizLength===24);
 if(judgeQuizLength===24){
  for(let j=0;j<judgeQuizLength;j++){
   const correct=await page.evaluate(()=>samboActiveQuiz[currentQuestion].correct);
   await page.locator('#answers button.answer').nth(correct).click();
   await page.locator('#answers button.btn').first().click();
  }
  await page.waitForTimeout(200);
  check('new judge exam persists versioned completion',await page.evaluate(()=>localStorage.getItem('sambo-demo-judge-1100')==='done'));
  await page.reload({waitUntil:'domcontentloaded'});
  check('new judge completion survives reload',await page.evaluate(()=>progressDone('judge',1100)));
  await page.evaluate(()=>{openCourse('judge');openLesson(0);samboSectionIndex=samboLessonSections(samboModuleData(currentCourse)[0]).length-1;renderSamboSection();startModuleQuiz();});
  for(let j=0;j<24;j++){
   const correct=await page.evaluate(()=>samboActiveQuiz[currentQuestion].correct);
   await page.locator('#answers button.answer').nth(j<20?correct:(correct+1)%4).click();
   await page.locator('#answers button.btn').first().click();
  }
  check('20 of 24 is below 85 percent pass mark',(await page.locator('#feedback').textContent()).includes('21 правильных'));
  await page.evaluate(()=>startModuleQuiz());
  for(let j=0;j<24;j++){
   const correct=await page.evaluate(()=>samboActiveQuiz[currentQuestion].correct);
   await page.locator('#answers button.answer').nth(j<21?correct:(correct+1)%4).click();
   await page.locator('#answers button.btn').first().click();
  }
  await page.waitForTimeout(150);
  check('21 of 24 reaches 85 percent pass mark',(await page.locator('#feedback').textContent()).includes('Модуль пройден'));
  check('successful judge exam still provides mistake review',await page.locator('.sambo-quiz-review .sambo-lesson-intro').count()===3);
 }

 await page.evaluate(()=>localStorage.removeItem('sambo-demo-judge-100'));
 await page.evaluate(()=>{openCourse('athlete');openLesson(0);samboSectionIndex=samboLessonSections(samboModuleData(currentCourse)[currentModule]).length-1;renderSamboSection();startModuleQuiz();});
 let n=await page.evaluate(()=>samboActiveQuiz.length);
 check('module quiz has questions',n>0,'questions='+n);
 if(n>0&&n<=60){
  for(let i=0;i<n;i++){
   const correct=await page.evaluate(()=>samboActiveQuiz[currentQuestion].correct);
   await page.locator('#answers button.answer').nth(correct).click();
   await page.locator('#answers button.btn').first().click();
  }
  await page.waitForTimeout(150);
  const saved=await page.evaluate(()=>localStorage.getItem('sambo-demo-athlete-100'));
  check('guest test stored, completion acknowledged',saved==='done'&&(await page.locator('#feedback').textContent()).includes('сохранён'));
  await page.reload({waitUntil:'domcontentloaded'});
  check('guest result retained on reload',await page.evaluate(()=>progressDone('athlete',100)));
 }
 await page.locator('#navLogin').click();
 check('login tab accessible',await page.locator('#account').isVisible()&&await page.locator('#authGuest').isVisible());
 await page.locator('#authEmail').fill('student@example.test');await page.locator('#authPassword').fill('test-password-123');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(()=>!!window.samboCurrentUser,{timeout:10000});
 check('mock signed-in nav only account',await page.locator('#navAccount').isVisible()&&!(await page.locator('#navSignup').isVisible())&&!(await page.locator('#navLogin').isVisible()));
 // Verify cloud save failure is not reported as a completed module, and retry succeeds.
 await page.evaluate(()=>{window.__mock.saveFails=true;openCourse('athlete');openLesson(0);samboSectionIndex=samboLessonSections(samboModuleData(currentCourse)[currentModule]).length-1;renderSamboSection();startModuleQuiz();});
 n=await page.evaluate(()=>samboActiveQuiz.length);
 if(n>0&&n<=60){
  for(let i=0;i<n;i++){
   const correct=await page.evaluate(()=>samboActiveQuiz[currentQuestion].correct);
   await page.locator('#answers button.answer').nth(correct).click();
   await page.locator('#answers button.btn').first().click();
  }
  await page.waitForTimeout(200);
  check('failed cloud save does not claim completion',(await page.locator('#feedback').textContent()).includes('не сохранён')&&await page.locator('button[onclick="samboRetrySave()"]').isVisible());
  check('failed cloud save leaves progress undone',!(await page.evaluate(()=>progressDone('athlete',100))));
  await page.evaluate(()=>{window.__mock.saveFails=false;});
  await page.locator('button[onclick="samboRetrySave()"]').click();
  await page.waitForFunction(()=>window.samboProgress?.completed?.has('athlete:100'),{timeout:10000});
  check('retry cloud save updates progress',await page.locator('#feedback').textContent()==='Результат сохранён.');
 }
 await page.evaluate(()=>show('account'));
 await page.evaluate(()=>studentTab('profile'));
 check('logout located in profile',await page.locator('#studentContent').getByText('Выйти из аккаунта').isVisible());
 check('profile birth date is locked after registration',await page.locator('#profileBirth').isDisabled());
 await page.getByText('Выйти из аккаунта').click();
 await page.waitForFunction(()=>!window.samboCurrentUser,{timeout:10000});
 check('logout returns login',await page.locator('#navLogin').isVisible());
 await page.evaluate(()=>{show('account');authMode('signup')});
 await page.locator('#authBirth').fill('2015-01-01');
 await page.locator('#authBirth').dispatchEvent('change');
 check('signup form requires parent information for a minor',await page.locator('#guardianName').evaluate(e=>e.required));
 await page.locator('#authBirth').fill('1990-01-01');
 await page.locator('#authBirth').dispatchEvent('change');
 check('adult signup hides parental requirements',!(await page.locator('#guardianName').evaluate(e=>e.required)));

 await page.evaluate(()=>{window.__mock.guardian='pending';authLoggedIn({id:'test-child-1',email:'minor@example.test',user_metadata:{account_type:'child_learner',date_of_birth:'2015-04-04'}})});
 await page.waitForFunction(()=>window.samboGuardianStatus==='pending',{timeout:10000});
 await page.evaluate(()=>openCourse('athlete'));
 check('pending minor blocked from course',await page.locator('#account').isVisible()&&!(await page.locator('#course').isVisible()));
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>authLoggedIn(null));
 await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(600);
 let width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
 check('mobile home no horizontal overflow',width.scroll<=width.viewport+3,JSON.stringify(width));
 const menu=page.locator('.mobile-navigation summary');
 check('mobile menu visible',await menu.isVisible());
 await page.evaluate(()=>openCourse('judge'));
 width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
 check('mobile course no horizontal overflow',width.scroll<=width.viewport+3,JSON.stringify(width));
 await page.evaluate(()=>openLesson(0));
 width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
 check('mobile lesson no horizontal overflow',width.scroll<=width.viewport+3,JSON.stringify(width));
 check('no uncaught JS errors',errors.length===0,errors.slice(0,5).join(' | '));
 // Final practicum: verify revised third lesson on local test server.
 await page.evaluate(()=>openCourse('judge'));
 const localPracticumCard=page.locator('#lessons .sambo-module-card').nth(11);
 await localPracticumCard.locator('summary').click();
 await localPracticumCard.locator('.sambo-topic-link').nth(2).click();
 check('LOCAL practicum results editorial depth',await page.locator('.judge-prime .jp-part').count()>=13&&await page.locator('.judge-prime .jp-question').count()>=9);
 check('LOCAL practicum article 34 exception visible',(await page.locator('.judge-prime').textContent()).includes('Статья 34(8)'));
 // Real published-page browser check (no credentials, no account mutations).
 try {
  const liveCtx=await browser.newContext({viewport:{width:1280,height:800}});
  const livePage=await liveCtx.newPage();
  const liveErrors=[];
  livePage.on('pageerror',e=>liveErrors.push(e.message));
  await livePage.goto('https://sambo-academy.pages.dev/',{waitUntil:'domcontentloaded',timeout:20000});
  await livePage.waitForFunction(()=>!document.querySelector('.nav-actions')?.classList.contains('auth-pending'),{timeout:25000});
  check('LIVE browser opens public site',await livePage.locator('h1').first().textContent()==='САМБО');
  check('LIVE course prices marked planned',(await livePage.locator('.course.athlete .price').textContent()).includes('Планируемая стоимость'));

  check('LIVE real Supabase SDK starts',!(await livePage.locator('#authSubmit').isDisabled()));
  // A negative login checks the real Auth API without creating accounts or using anyone's credentials.
  const tokenResponses=[];
  livePage.on('response',response=>{if(response.url().includes('/auth/v1/token'))tokenResponses.push(response.status())});
  await livePage.locator('#navLogin').click();
  await livePage.locator('#authEmail').fill('qa-nonexistent-20261023@example.invalid');
  await livePage.locator('#authPassword').fill('qa-invalid-password-2026');
  await livePage.locator('#authSubmit').click();
  await livePage.waitForFunction(()=>document.getElementById('authFeedback')?.textContent.includes('Не удалось выполнить действие'),{timeout:14000});
  check('LIVE invalid login handled without signing in',!(await livePage.locator('#authUser').isVisible())&&tokenResponses.some(code=>code===400||code===401),JSON.stringify(tokenResponses));

  await livePage.evaluate(()=>openCourse('athlete'));
  check('LIVE athlete modules clickable',await livePage.locator('#lessons details').count()>=4);
  await livePage.locator('#lessons details').first().locator('.sambo-topic-link').first().click();
  check('LIVE lesson shown after click',await livePage.locator('#lesson').isVisible());
  await livePage.evaluate(()=>openCourse('judge'));
  const judgeFirst=livePage.locator('#lessons .sambo-module-card').first();
  check('LIVE new judge course shown',(await judgeFirst.textContent()).includes('Нормативная основа и способы проведения'));
  await judgeFirst.locator('.sambo-topic-link').first().click();
  check('LIVE detailed judge lesson has ordered sections',await livePage.locator('.judge-prime .jp-part').count()>=4);
  // Verify the published Cloudflare version, not just the checked-out source.
  // Earlier smoke coverage exercised the expanded modules only on localhost.
  await livePage.evaluate(()=>openCourse('judge'));
  const liveModules=await livePage.evaluate(()=>samboModuleData('judge').map((g,i)=>({
   index:i,title:g.title,first:g.parts[0]?.title,questions:samboQuizQuestions(g).length,
   progress:samboModuleProgressIndex('judge',i)
  })));
  check('LIVE all twelve judge modules deployed',liveModules.length===12,'modules='+liveModules.length);
  check('LIVE revised judge modules have eight independent exam questions',liveModules.slice(1).every(g=>g.questions===8));
   check('LIVE independent exam bank and new result keys deployed',await livePage.evaluate(()=>window.samboJudgeIndependentExamLoaded===true)&&liveModules.slice(1).every((g,i)=>g.progress===1201+i));
  check('LIVE judge progress IDs are unique',new Set(liveModules.map(g=>g.progress)).size===liveModules.length);
  // Detect stale deployments of the actual normative lesson content, not just module registration.
  for(const [asset,marker] of [
   ['judge-program-admission.js','Граница компетенции судьи'],
   ['judge-program-admission.js','Для каких лиц и видов спорта действует запрет пари'],
   ['judge-program-admission.js','Протокол, подписи и неявившиеся'],
   ['judge-program-admission.js','Индивидуальная отметка «Допущен»'],
   ['judge-program-admission.js','Норма: участие несовершеннолетних без стартового взноса'],
   ['judge-program-admission.js','Шаг 7. Разобрать расхождение с сеткой'],
   ['judge-program-participants.js','Внешний вид: борода, ногти и волосы'],
   ['judge-program-participants.js','Куртка: цвет, материал, рукав и просвет'],
   ['judge-program-participants.js','Бандажи и тейпы: разрешение с условием'],
   ['judge-program-participants.js','Срок подачи: расхождение источников'],
    ['judge-program-participants.js','Пригодность ковра: совместная проверка'],
   ['judge-program-participants.js','увеличили специальный лимит до 3 минут'],
   ['judge-program-officials.js','Оператор табло и секундометрист: время и сигналы'],
   ['judge-program-officials.js','Пределы полномочий главного судьи'],
   ['judge-program-officials.js','Учебный алгоритм при расхождении'],
   ['judge-program-officials.js','Медицинская помощь и различия дисциплин'],
   ['judge-program-officials.js','Учебный алгоритм при споре'],
   ['judge-program-officials.js','Учебный алгоритм разграничения'],
   ['judge-program-sanctions.js','Две разные линии предупреждений'],
   ['judge-program-sanctions.js','Результат схватки и две процедуры протеста'],
   ['judge-program-scoring.js','Шаг 5. Одновременные предупреждения'],
   ['judge-program-scoring.js','Момент действия и момент показа оценки'],
   ['judge-program-scoring.js','Время, оценка и граница ровно 10 секунд'],
   ['judge-program-scoring.js','Критерий для досрочного преимущества — разница счёта'],
   ['judge-program-scoring.js','Исключение: полный отрыв с вращением'],
   ['judge-program-scoring.js','Бросок начался внутри, закончился снаружи рабочей зоны'],
   ['judge-program-scoring.js','Положение лёжа: рабочая зона и зона безопасности'],
   ['judge-program-bout.js','Разъяснения ВФС к изменениям с 1 сентября 2026 года вводят оценку «Активность»'],
   ['judge-program-bout.js','Статья 29(4–5) различает момент совершения действия и момент судейского жеста'],
   ['judge-program-bout.js','Второе удержание после неполного'],
    ['judge-program-bout.js','«Активность» — оценка, а не предупреждение'],
   ['judge-program-infrastructure.js','Обязательный резерв при сбое'],
   ['judge-program-infrastructure.js','50 сантиметров'],
   ['judge-program-combat.js','Параллельные отсчёты — важное исключение'],
   ['judge-program-combat.js','Возрастное исключение при нокдауне'],
   ['judge-program-beach.js','Отдельно опубликованное изменение ВФС дополняет статью 45 боковым судьёй'],
   ['judge-program-demo.js','Это внутреннее расхождение текста источника'],
   ['judge-program-practicum.js','Статьи 66 и 68 расходятся в количестве судей']
  ]){
   const response=await livePage.request.get('https://sambo-academy.pages.dev/'+asset,{timeout:12000,failOnStatusCode:false});
   const body=await response.text();
   check('LIVE normative lesson asset '+asset+' matches current revision',response.ok()&&body.includes(marker),String(response.status()));
  }

  for(const i of [1,2,3,6,7,8,9,11]){
   if(!liveModules[i])continue;
   await livePage.evaluate(()=>openCourse('judge'));
   const card=livePage.locator('#lessons .sambo-module-card').nth(i);
   await card.locator('summary').click();
   await card.locator('.sambo-topic-link').first().click();
   const heading=await livePage.locator('.judge-prime h2').first().textContent();
   check('LIVE module '+(i+1)+' opens its authored lesson',heading.includes(liveModules[i].first)&&await livePage.locator('.judge-prime .jp-part').count()>=2,heading);
  }

  // Verify newly revised admission lessons, without changing progress keys or lesson order.
  for(const [lessonIndex,headingText] of [
   [0,'Антидопинг и медицинское обеспечение'],
   [1,'Противоправное влияние на результаты'],
   [2,'Возрастные группы и весовые категории'],
   [3,'Взвешивание участников: процедура и фиксация'],
   [4,'Сквозной алгоритм допуска']
  ]){
   await livePage.evaluate(()=>openCourse('judge'));
   const admissionCard=livePage.locator('#lessons .sambo-module-card').nth(1);
   await admissionCard.locator('summary').click();
   await admissionCard.locator('.sambo-topic-link').nth(lessonIndex).click();
   const title=await livePage.locator('.judge-prime h2').first().textContent();
   const blocks=await livePage.locator('.judge-prime .jp-part').count();
   const checks=await livePage.locator('.judge-prime .jp-question').count();
   check('LIVE admission lesson '+(lessonIndex+1)+' revised editorial depth',
    title.includes(headingText)&&blocks>=8&&checks>=5,
    'blocks='+blocks+' checks='+checks);
  }

  // Verify article 9 duties lesson in the published participant module.
   await livePage.evaluate(()=>openCourse('judge'));
   const participantCard=livePage.locator('#lessons .sambo-module-card').nth(2);
   await participantCard.locator('summary').click();
   await participantCard.locator('.sambo-topic-link').first().click();
   const participantTitle=await livePage.locator('.judge-prime h2').first().textContent();
   const participantBlocks=await livePage.locator('.judge-prime .jp-part').count();
   const participantChecks=await livePage.locator('.judge-prime .jp-question').count();
   check('LIVE article 9 athlete duties lesson revised editorial depth',
    participantTitle.includes('Обязанности спортсмена')&&participantBlocks>=9&&participantChecks>=5,
    'blocks='+participantBlocks+' checks='+participantChecks);

   // Article 10: verify the published equipment lesson and original progress position.
   await livePage.evaluate(()=>openCourse('judge'));
   const equipmentCard=livePage.locator('#lessons .sambo-module-card').nth(2);
   await equipmentCard.locator('summary').click();
   await equipmentCard.locator('.sambo-topic-link').nth(2).click();
   const equipmentTitle=await livePage.locator('.judge-prime h2').first().textContent();
   const equipmentBlocks=await livePage.locator('.judge-prime .jp-part').count();
   const equipmentChecks=await livePage.locator('.judge-prime .jp-question').count();
   check('LIVE article 10 equipment lesson editorial depth',
     equipmentTitle.includes('Экипировка спортивного самбо')&&equipmentBlocks>=9&&equipmentChecks>=6,
     'blocks='+equipmentBlocks+' checks='+equipmentChecks);


   // Article 11: verify the newly revised representative/coach lesson in production.
   await livePage.evaluate(()=>openCourse('judge'));
   const representativeCard=livePage.locator('#lessons .sambo-module-card').nth(2);
   await representativeCard.locator('summary').click();
   await representativeCard.locator('.sambo-topic-link').nth(3).click();
   const representativeTitle=await livePage.locator('.judge-prime h2').first().textContent();
   const representativeBlocks=await livePage.locator('.judge-prime .jp-part').count();
   const representativeChecks=await livePage.locator('.judge-prime .jp-question').count();
   check('LIVE article 11 representatives and coaches editorial depth',
     representativeTitle.includes('Представитель команды и тренер')&&representativeBlocks>=11&&representativeChecks>=7,
     'blocks='+representativeBlocks+' checks='+representativeChecks);

   // Articles 12–13: inspect the deployed fifth participant lesson, not just the source.
   await livePage.evaluate(()=>openCourse('judge'));
   const safetyCard=livePage.locator('#lessons .sambo-module-card').nth(2);
   await safetyCard.locator('summary').click();
   await safetyCard.locator('.sambo-topic-link').nth(4).click();
   const safetyTitle=await livePage.locator('.judge-prime h2').first().textContent();
   const safetyBlocks=await livePage.locator('.judge-prime .jp-part').count();
   const safetyChecks=await livePage.locator('.judge-prime .jp-question').count();
   check('LIVE articles 12–13 official persons and safety editorial depth',
     safetyTitle.includes('Официальные лица и безопасность')&&safetyBlocks>=10&&safetyChecks>=7,
     'blocks='+safetyBlocks+' checks='+safetyChecks);

   // Verify revised officials lessons are rendered in the deployed course.
  for(const [lessonIndex,headingText] of [[3,'Главный секретарь и секретариат'],[4,'Руководитель ковра, арбитр, боковой судья'],[5,'Технический секретарь и протокол схватки'],[7,'Информатор, контроль формы, врач, администратор']]){
   await livePage.evaluate(()=>openCourse('judge'));
   const officialsCard=livePage.locator('#lessons .sambo-module-card').nth(3);
   await officialsCard.locator('summary').click();
   await officialsCard.locator('.sambo-topic-link').nth(lessonIndex).click();
   const title=await livePage.locator('.judge-prime h2').first().textContent();
   const blocks=await livePage.locator('.judge-prime .jp-part').count();
   const checks=await livePage.locator('.judge-prime .jp-question').count();
   check('LIVE officials lesson '+(lessonIndex+1)+' revised editorial depth',title.includes(headingText)&&blocks>=8&&checks>=5,'blocks='+blocks+' checks='+checks);
  }

  // Article 14: PR checks source through Validate; after merge require the deployed lesson.
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
   let article14AssetReady=false;
   let article14Status='not fetched';
   for(let attempt=0;attempt<6;attempt++){
    try{
     const res=await livePage.request.get('https://sambo-academy.pages.dev/judge-program-officials.js',{timeout:12000,failOnStatusCode:false});
     article14Status=String(res.status());
     article14AssetReady=res.ok()&&(await res.text()).includes('Назначение коллегии: четыре уровня');
     if(article14AssetReady)break;
    }catch(e){article14Status=String(e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,5000));
   }
   check('LIVE article 14 revised source published',article14AssetReady,article14Status);
   if(article14AssetReady){
    await livePage.evaluate(()=>openCourse('judge'));
    const article14Card=livePage.locator('#lessons .sambo-module-card').nth(3);
    await article14Card.locator('summary').click();
    await article14Card.locator('.sambo-topic-link').first().click();
    const article14Title=await livePage.locator('.judge-prime h2').first().textContent();
    const article14Blocks=await livePage.locator('.judge-prime .jp-part').count();
    const article14Checks=await livePage.locator('.judge-prime .jp-question').count();
    check('LIVE article 14 neutral-trio lesson editorial depth',
     article14Title.includes('Состав коллегии и судейская тройка')&&article14Blocks>=9&&article14Checks>=7,
     'blocks='+article14Blocks+' checks='+article14Checks);
   }
  }

  // Article 16: check the actual published lesson only after deployment, not on PR.
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
   let article16Ready=false,article16Status='not fetched';
   for(let attempt=0;attempt<6;attempt++){
    try{
     const response=await livePage.request.get('https://sambo-academy.pages.dev/judge-program-officials.js',{timeout:12000,failOnStatusCode:false});
     article16Status=String(response.status());
     article16Ready=response.ok()&&(await response.text()).includes('Распределение ответственности: снятие и дисквалификация');
     if(article16Ready)break;
    }catch(e){article16Status=String(e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,5000));
   }
   check('LIVE article 16 deputy lesson source published',article16Ready,article16Status);
   if(article16Ready){
    await livePage.evaluate(()=>openCourse('judge'));
    const deputyCard=livePage.locator('#lessons .sambo-module-card').nth(3);
    await deputyCard.locator('summary').click();
    await deputyCard.locator('.sambo-topic-link').nth(2).click();
    const title=await livePage.locator('.judge-prime h2').first().textContent();
    const blocks=await livePage.locator('.judge-prime .jp-part').count();
    const checks=await livePage.locator('.judge-prime .jp-question').count();
    check('LIVE article 16 deputy lesson editorial depth',
     title.includes('Заместитель главного судьи')&&blocks>=9&&checks>=7,
     'blocks='+blocks+' checks='+checks);
   }
  }

  // Timekeeping lesson: verify the deployed revision only after merge to main.
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
   let timekeepingReady=false,timekeepingStatus='not fetched';
   for(let attempt=0;attempt<6;attempt++){
    try{
     const response=await livePage.request.get('https://sambo-academy.pages.dev/judge-program-officials.js',{timeout:12000,failOnStatusCode:false});
     timekeepingStatus=String(response.status());
     timekeepingReady=response.ok()&&(await response.text()).includes('Оборудование на случай отказа питания');
     if(timekeepingReady)break;
    }catch(e){timekeepingStatus=String(e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,5000));
   }
   check('LIVE article 22–23 timekeeping source published',timekeepingReady,timekeepingStatus);
   if(timekeepingReady){
    await livePage.evaluate(()=>openCourse('judge'));
    const officialsCard=livePage.locator('#lessons .sambo-module-card').nth(3);
    await officialsCard.locator('summary').click();
    await officialsCard.locator('.sambo-topic-link').nth(6).click();
    const title=await livePage.locator('.judge-prime h2').first().textContent();
    const blocks=await livePage.locator('.judge-prime .jp-part').count();
    const checks=await livePage.locator('.judge-prime .jp-question').count();
    check('LIVE article 22–23 timekeeping editorial depth',
     title.includes('Оператор табло и секундометрист')&&blocks>=9&&checks>=7,
     'blocks='+blocks+' checks='+checks);
   }
  }

  // Article 40–41: deployed protest lesson must include both routes and the source discrepancy.
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
   let protestReady=false,protestStatus='not fetched';
   for(let attempt=0;attempt<6;attempt++){
    try{
     const response=await livePage.request.get('https://sambo-academy.pages.dev/judge-program-sanctions.js',{timeout:12000,failOnStatusCode:false});
     protestStatus=String(response.status());
     protestReady=response.ok()&&(await response.text()).includes('Различие сроков в двух официальных материалах');
     if(protestReady)break;
    }catch(e){protestStatus=String(e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,5000));
   }
   check('LIVE articles 40–41 protest source published',protestReady,protestStatus);
   if(protestReady){
    await livePage.evaluate(()=>openCourse('judge'));
    const sanctionsCard=livePage.locator('#lessons .sambo-module-card').nth(6);
    await sanctionsCard.locator('summary').click();
    await sanctionsCard.locator('.sambo-topic-link').nth(2).click();
    const title=await livePage.locator('.judge-prime h2').first().textContent();
    const blocks=await livePage.locator('.judge-prime .jp-part').count();
    const checks=await livePage.locator('.judge-prime .jp-question').count();
    check('LIVE articles 40–41 protest lesson editorial depth',
      title.includes('Результат схватки и две процедуры протеста')&&blocks>=9&&checks>=7,
      'blocks='+blocks+' checks='+checks);
   }
  }

  // Combat-sambo article 19/28/33: verify publication and rendered lesson after merge.
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
   let combatReady=false,combatStatus='not fetched';
   for(let attempt=0;attempt<6;attempt++){
    try{
     const response=await livePage.request.get('https://sambo-academy.pages.dev/judge-program-combat.js',{timeout:12000,failOnStatusCode:false});
     combatStatus=String(response.status());
     combatReady=response.ok()&&(await response.text()).includes('Разграничение оценки и исхода');
     if(combatReady)break;
    }catch(e){combatStatus=String(e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,5000));
   }
   check('LIVE combat knockdown revised lesson published',combatReady,combatStatus);
   if(combatReady){
    await livePage.evaluate(()=>openCourse('judge'));
    const combatCard=livePage.locator('#lessons .sambo-module-card').nth(8);
    await combatCard.locator('summary').click();
    await combatCard.locator('.sambo-topic-link').nth(1).click();
    const title=await livePage.locator('.judge-prime h2').first().textContent();
    const blocks=await livePage.locator('.judge-prime .jp-part').count();
    const checks=await livePage.locator('.judge-prime .jp-question').count();
    check('LIVE combat knockdown editorial depth',
      title.includes('Удары, нокдаун и нокаут')&&blocks>=9&&checks>=7,
      'blocks='+blocks+' checks='+checks);
   }
  }

  // Combat eligibility and protective equipment: verify publication after merge, not just local checkout.
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
   let equipmentReady=false,equipmentStatus='not fetched';
   for(let attempt=0;attempt<6;attempt++){
    try{
     const response=await livePage.request.get('https://sambo-academy.pages.dev/judge-program-combat.js',{timeout:12000,failOnStatusCode:false});
     equipmentStatus=String(response.status());
     equipmentReady=response.ok()&&(await response.text()).includes('Разграничение несоответствия и наказания');
     if(equipmentReady)break;
    }catch(e){equipmentStatus=String(e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,5000));
   }
   check('LIVE combat eligibility/equipment lesson source published',equipmentReady,equipmentStatus);
   if(equipmentReady){
    await livePage.evaluate(()=>openCourse('judge'));
    const combatCard=livePage.locator('#lessons .sambo-module-card').nth(8);
    await combatCard.locator('summary').click();
    await combatCard.locator('.sambo-topic-link').first().click();
    const title=await livePage.locator('.judge-prime h2').first().textContent();
    const blocks=await livePage.locator('.judge-prime .jp-part').count();
    const checks=await livePage.locator('.judge-prime .jp-question').count();
    check('LIVE combat eligibility/equipment editorial depth',
     title.includes('Что меняется в боевом самбо')&&blocks>=9&&checks>=7,
     'blocks='+blocks+' checks='+checks);
   }
  }

  // Combat submission timing and safety: published-file marker plus actual third lesson.
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
   let submissionsReady=false,submissionsStatus='not fetched';
   for(let attempt=0;attempt<6;attempt++){
    try{
     const response=await livePage.request.get('https://sambo-academy.pages.dev/judge-program-combat.js',{timeout:12000,failOnStatusCode:false});
     submissionsStatus=String(response.status());
     submissionsReady=response.ok()&&(await response.text()).includes('Одновременный и последовательный старт двух приёмов');
     if(submissionsReady)break;
    }catch(e){submissionsStatus=String(e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,5000));
   }
   check('LIVE combat submissions normative lesson source published',submissionsReady,submissionsStatus);
   if(submissionsReady){
    await livePage.evaluate(()=>openCourse('judge'));
    const combatCard=livePage.locator('#lessons .sambo-module-card').nth(8);
    await combatCard.locator('summary').click();
    await combatCard.locator('.sambo-topic-link').nth(2).click();
    const title=await livePage.locator('.judge-prime h2').first().textContent();
    const blocks=await livePage.locator('.judge-prime .jp-part').count();
    const checks=await livePage.locator('.judge-prime .jp-question').count();
    check('LIVE combat submissions editorial depth',
      title.includes('Болевые и удушающие')&&blocks>=11&&checks>=7,
      'blocks='+blocks+' checks='+checks);
   }
  }

  // Demonstration sambo arts 59–60: check deployed content and first lesson after merge.
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
   let demoReady=false,demoStatus='not fetched';
   for(let attempt=0;attempt<6;attempt++){
    try{
     const response=await livePage.request.get('https://sambo-academy.pages.dev/judge-program-demo.js',{timeout:12000,failOnStatusCode:false});
     demoStatus=String(response.status());
     demoReady=response.ok()&&(await response.text()).includes('Возраст в календарном году — не возраст в день выхода');
     if(demoReady)break;
    }catch(e){demoStatus=String(e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,5000));
   }
   check('LIVE demonstration arts 59–60 revised source published',demoReady,demoStatus);
   if(demoReady){
    await livePage.evaluate(()=>openCourse('judge'));
    const demoCard=livePage.locator('#lessons .sambo-module-card').nth(10);
    await demoCard.locator('summary').click();
    await demoCard.locator('.sambo-topic-link').first().click();
    const title=await livePage.locator('.judge-prime h2').first().textContent();
    const blocks=await livePage.locator('.judge-prime .jp-part').count();
    const checks=await livePage.locator('.judge-prime .jp-question').count();
    check('LIVE demonstration personal judging lesson editorial depth',
      title.includes('Возрастные группы и судейская коллегия личной демонстрации')&&blocks>=10&&checks>=7,
      'blocks='+blocks+' checks='+checks);
   }
  }

  // Personal demonstration arts 61–63: verify deployed second lesson, not just checkout.
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
   let scoringReady=false,scoringStatus='not fetched';
   for(let attempt=0;attempt<6;attempt++){
    try{
     const response=await livePage.request.get('https://sambo-academy.pages.dev/judge-program-demo.js',{timeout:12000,failOnStatusCode:false});
     scoringStatus=String(response.status());
     scoringReady=response.ok()&&(await response.text()).includes('Десять отдельных действий — десять отдельных наблюдений');
     if(scoringReady)break;
    }catch(e){scoringStatus=String(e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,5000));
   }
   check('LIVE demonstration arts 61–63 personal scoring source published',scoringReady,scoringStatus);
   if(scoringReady){
    await livePage.evaluate(()=>openCourse('judge'));
    const demoCard=livePage.locator('#lessons .sambo-module-card').nth(10);
    await demoCard.locator('summary').click();
    await demoCard.locator('.sambo-topic-link').nth(1).click();
    const title=await livePage.locator('.judge-prime h2').first().textContent();
    const blocks=await livePage.locator('.judge-prime .jp-part').count();
    const checks=await livePage.locator('.judge-prime .jp-question').count();
    check('LIVE demonstration personal scoring lesson editorial depth',
     title.includes('Личный комплекс и порядок выставления баллов')&&blocks>=10&&checks>=7,
     'blocks='+blocks+' checks='+checks);
   }
  }

  // Published demonstration sambo arts 63–65: third lesson and editorial depth.
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
   let zeroReady=false,zeroStatus='not fetched';
   for(let attempt=0;attempt<6;attempt++){
    try{
     const response=await livePage.request.get('https://sambo-academy.pages.dev/judge-program-demo.js',{timeout:12000,failOnStatusCode:false});
     zeroStatus=String(response.status());
     zeroReady=response.ok()&&(await response.text()).includes('Строгая граница двух минут');
     if(zeroReady)break;
    }catch(e){zeroStatus=String(e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,5000));
   }
   check('LIVE demonstration arts 63–65 revised source published',zeroReady,zeroStatus);
   if(zeroReady){
    await livePage.evaluate(()=>openCourse('judge'));
    const card=livePage.locator('#lessons .sambo-module-card').nth(10);
    await card.locator('summary').click();
    await card.locator('.sambo-topic-link').nth(2).click();
    const title=await livePage.locator('.judge-prime h2').first().textContent();
    const blocks=await livePage.locator('.judge-prime .jp-part').count();
    const checks=await livePage.locator('.judge-prime .jp-question').count();
    check('LIVE demonstration zero and discipline editorial depth',
      title.includes('Нулевая оценка, дисциплина и перечни техник')&&blocks>=10&&checks>=7,
      'blocks='+blocks+' checks='+checks);
   }
  }

  // Demonstration sambo arts 66–67: team composition and disputed crew count.
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
   let teamReady=false,teamStatus='not fetched';
   for(let attempt=0;attempt<6;attempt++){
    try{
     const response=await livePage.request.get('https://sambo-academy.pages.dev/judge-program-demo.js',{timeout:12000,failOnStatusCode:false});
     teamStatus=String(response.status());
     teamReady=response.ok()&&(await response.text()).includes('Две бригады на ковёр и разделение функций');
     if(teamReady)break;
    }catch(e){teamStatus=String(e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,5000));
   }
   check('LIVE demonstration arts 66–67 team source published',teamReady,teamStatus);
   if(teamReady){
    await livePage.evaluate(()=>openCourse('judge'));
    const card=livePage.locator('#lessons .sambo-module-card').nth(10);
    await card.locator('summary').click();
    await card.locator('.sambo-topic-link').nth(3).click();
    const title=await livePage.locator('.judge-prime h2').first().textContent();
    const blocks=await livePage.locator('.judge-prime .jp-part').count();
    const checks=await livePage.locator('.judge-prime .jp-question').count();
    check('LIVE demonstration team composition editorial depth',
      title.includes('Командная композиция и судейская бригада')&&blocks>=12&&checks>=7,
      'blocks='+blocks+' checks='+checks);
   }
  }

  // Demonstration sambo arts 68–69: published team results and tie-break lesson.
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
   let winnersReady=false,winnersStatus='not fetched';
   for(let attempt=0;attempt<6;attempt++){
    try{
     const response=await livePage.request.get('https://sambo-academy.pages.dev/judge-program-demo.js',{timeout:12000,failOnStatusCode:false});
     winnersStatus=String(response.status());
     winnersReady=response.ok()&&(await response.text()).includes('При равенстве: порядок сравнения');
     if(winnersReady)break;
    }catch(e){winnersStatus=String(e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,5000));
   }
   check('LIVE demonstration arts 68–69 team results source published',winnersReady,winnersStatus);
   if(winnersReady){
    await livePage.evaluate(()=>openCourse('judge'));
    const card=livePage.locator('#lessons .sambo-module-card').nth(10);
    await card.locator('summary').click();
    await card.locator('.sambo-topic-link').nth(4).click();
    const title=await livePage.locator('.judge-prime h2').first().textContent();
    const blocks=await livePage.locator('.judge-prime .jp-part').count();
    const checks=await livePage.locator('.judge-prime .jp-question').count();
    check('LIVE demonstration team results editorial depth',
      title.includes('Определение победителей командной демонстрации')&&blocks>=12&&checks>=7,
      'blocks='+blocks+' checks='+checks);
   }
  }

  // Final practicum: verify that the deployed source and third lesson are current.
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
   let finalReady=false,finalStatus='not fetched';
   for(let attempt=0;attempt<6;attempt++){
    try{
     const response=await livePage.request.get('https://sambo-academy.pages.dev/judge-program-practicum.js',{timeout:12000,failOnStatusCode:false});
     finalStatus=String(response.status());
     finalReady=response.ok()&&(await response.text()).includes('Особые случаи предупреждений');
     if(finalReady)break;
    }catch(e){finalStatus=String(e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,5000));
   }
   check('LIVE practicum results arts 34–41 source published',finalReady,finalStatus);
   if(finalReady){
    await livePage.evaluate(()=>openCourse('judge'));
    const finalCard=livePage.locator('#lessons .sambo-module-card').nth(11);
    await finalCard.locator('summary').click();
    await finalCard.locator('.sambo-topic-link').nth(2).click();
    const title=await livePage.locator('.judge-prime h2').first().textContent();
    const blocks=await livePage.locator('.judge-prime .jp-part').count();
    const checks=await livePage.locator('.judge-prime .jp-question').count();
    check('LIVE practicum results editorial depth',title.includes('Сценарий итогов: равенство, нарушения, протокол')&&blocks>=13&&checks>=9,'blocks='+blocks+' checks='+checks);
   }
  }

  // Beach sambo: confirm the revised result/disqualification lesson is deployed and rendered.
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
   let beachReady=false,beachStatus='not fetched';
   for(let attempt=0;attempt<6;attempt++){
    try{
     const response=await livePage.request.get('https://sambo-academy.pages.dev/judge-program-beach.js',{timeout:12000,failOnStatusCode:false});
     beachStatus=String(response.status());
     beachReady=response.ok()&&(await response.text()).includes('Медицинское снятие отдельно от дисквалификации');
     if(beachReady)break;
    }catch(e){beachStatus=String(e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,5000));
   }
   check('LIVE beach results arts 53–55 lesson source published',beachReady,beachStatus);
   if(beachReady){
    await livePage.evaluate(()=>openCourse('judge'));
    const beachCard=livePage.locator('#lessons .sambo-module-card').nth(9);
    await beachCard.locator('summary').click();
    await beachCard.locator('.sambo-topic-link').nth(3).click();
    const title=await livePage.locator('.judge-prime h2').first().textContent();
    const blocks=await livePage.locator('.judge-prime .jp-part').count();
    const checks=await livePage.locator('.judge-prime .jp-question').count();
    check('LIVE beach results lesson editorial depth',
      title.includes('Результат, дисквалификация и запрещённые действия')&&blocks>=9&&checks>=7,
      'blocks='+blocks+' checks='+checks);
   }
  }

  // Verify article 28 as well as the previously published articles 29–34 on Cloudflare.
  for(const [lessonIndex,headingText,minBlocks] of [
   [0,'Положения спортсменов: стоя, лёжа и варианты приземления',8],
   [1,'Бросок и контрбросок: установить инициатора',9],
   [2,'Болевые приёмы и удержания: критерии начала и остановки',10],
   [3,'Выход на ковёр, начало и окончание схватки',8],
   [4,'Чистое время, перерывы и отдых',9],
   [5,'Результат схватки и связь с оцениванием',8],
   [6,'Определение активности в середине встречи',10]
  ]){
   await livePage.evaluate(()=>openCourse('judge'));
   const boutCard=livePage.locator('#lessons .sambo-module-card').nth(4);
   await boutCard.locator('summary').click();
   await boutCard.locator('.sambo-topic-link').nth(lessonIndex).click();
   const title=await livePage.locator('.judge-prime h2').first().textContent();
   const blocks=await livePage.locator('.judge-prime .jp-part').count();
   const checks=await livePage.locator('.judge-prime .jp-question').count();
   check('LIVE bout lesson '+(lessonIndex+1)+' revised editorial depth',
    title.includes(headingText)&&blocks>=minBlocks&&checks===5,
    'blocks='+blocks+' checks='+checks);
  }

  // Verify the revised scoring lessons on the deployed version, not only in checkout.
  for(const [lessonIndex,headingText] of [
   [0,'Досрочная чистая победа: пять оснований'],
   [1,'Оценка броска: матрица без и с падением'],
   [2,'Удержания и общая сумма оценок'],
   [3,'Как определить победителя после времени'],
   [4,'Граница ковра и оцениваемые действия']
  ]){
   await livePage.evaluate(()=>openCourse('judge'));
   const scoringCard=livePage.locator('#lessons .sambo-module-card').nth(5);
   await scoringCard.locator('summary').click();
   await scoringCard.locator('.sambo-topic-link').nth(lessonIndex).click();
   const heading=await livePage.locator('.judge-prime h2').first().textContent();
   const blocks=await livePage.locator('.judge-prime .jp-part').count();
   const checks=await livePage.locator('.judge-prime .jp-question').count();
   check('LIVE scoring lesson '+(lessonIndex+1)+' revised editorial depth',
    heading.includes(headingText)&&blocks>=(lessonIndex===3?11:lessonIndex===4?10:9)&&checks===(lessonIndex===3||lessonIndex===4?7:5),
    'blocks='+blocks+' checks='+checks);
  }

  await livePage.evaluate(()=>openCourse('judge'));
  const practicumCard=livePage.locator('#lessons .sambo-module-card').nth(11);
  await practicumCard.locator('summary').click();
  await practicumCard.locator('.sambo-topic-link').first().click();
  check('LIVE integrated practicum lesson has at least five teaching blocks',await livePage.locator('.judge-prime .jp-part').count()>=5);
  check('LIVE integrated practicum has five self-check questions',await livePage.locator('.judge-prime .jp-question').count()===5);
    check('LIVE judge typography stylesheet loaded',(await livePage.locator('.judge-prime').evaluate(el=>getComputedStyle(el).borderRadius))!=='0px');
  check('LIVE browser no uncaught errors',liveErrors.length===0,liveErrors.slice(0,4).join(' | '));
  await livePage.setViewportSize({width:390,height:844});
  check('LIVE mobile lesson within viewport',await livePage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));
  await liveCtx.close();
 }catch(e){check('LIVE interactive browser smoke',false,String(e.stack||e).slice(0,550));}
 // Supabase anonymous API must not return student records.
 try {
  const anonKey='sb_publishable_ejURt14DFSQ56wP9IzOSKw_xhH6-BgP';
  const api='https://nabdooqbunipkwkmdufn.supabase.co';
  const health=await page.request.get(api+'/auth/v1/health',{headers:{apikey:anonKey},timeout:12000,failOnStatusCode:false});
  check('Supabase Auth API responds',health.status()>=200&&health.status()<500,health.status().toString());
  const progress=await page.request.get(api+'/rest/v1/lesson_progress?select=user_id,course_key,lesson_index',{headers:{apikey:anonKey},timeout:12000,failOnStatusCode:false});
  check('anonymous progress table not readable',progress.status()===401||progress.status()===403,progress.status().toString());
  const guardians=await page.request.get(api+'/rest/v1/guardian_applications?select=user_id,status',{headers:{apikey:anonKey},timeout:12000,failOnStatusCode:false});
  check('anonymous guardian applications not readable',guardians.status()===401||guardians.status()===403,guardians.status().toString());
 }catch(e){check('Supabase external API connectivity',false,String(e).slice(0,250));}

 // The published URL is inspected separately from the checkout, without using test credentials.
 try {
   const response=await page.request.get('https://sambo-academy.pages.dev/',{timeout:12000,failOnStatusCode:false});
   const liveHtml=await response.text();
   check('Cloudflare Pages responds',response.ok()&&liveHtml.includes('САМБО'),response.status().toString());
   if(response.ok()) {
     check('Cloudflare Pages has latest topic routing',liveHtml.includes('sections.findIndex(x=>x.topicIndex===topicIndex)'), 'code-marker in published HTML');
     const pr=await page.request.get('https://sambo-academy.pages.dev/progress.js',{timeout:12000,failOnStatusCode:false});
     const liveProgress=await pr.text();
     check('Cloudflare Pages has latest progress saving',pr.ok()&&liveProgress.includes('return true;'),pr.status().toString());
     const examAsset=await page.request.get('https://sambo-academy.pages.dev/judge-exam-independent.js',{timeout:12000,failOnStatusCode:false});
     const examBody=await examAsset.text();
     check('Cloudflare Pages serves audited independent exam bank',examAsset.ok()&&examBody.includes('Сам рецепт не подменяет соответствующее разрешение.'),examAsset.status().toString());
     check('Cloudflare Pages includes participant safety feedback',examAsset.ok()&&examBody.includes('тугую косу или хвост длиной не более 20 см'),examAsset.status().toString());
     check('Cloudflare Pages serves officials venue-acceptance explanation',examAsset.ok()&&examBody.includes('акт приёма места соревнований (приложение № 11)'),examAsset.status().toString());
     if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
       let publishedTimer=false,publishedBout=false,liveExamStatus='not fetched';
       for(let attempt=0;attempt<10;attempt++){
         try{
           const fresh=await page.request.get('https://sambo-academy.pages.dev/judge-exam-independent.js',{timeout:12000,failOnStatusCode:false});
           const source=await fresh.text();
           liveExamStatus=String(fresh.status());
           publishedTimer=fresh.ok()&&source.includes('Это два голоса из трёх');
           publishedBout=fresh.ok()&&source.includes('Различие сводного текста и документа разъяснений 2026 года')&&source.includes('параллельные отсчёты удержания');
           if(publishedTimer&&publishedBout)break;
         }catch(e){liveExamStatus=String(e).slice(0,120);}
         await new Promise(resolve=>setTimeout(resolve,5000));
       }
       check('Cloudflare Pages publishes reconciled VFS submission timer key',publishedTimer,liveExamStatus);
       check('Cloudflare Pages publishes audited independent bout questions 25–32',publishedBout,liveExamStatus);
     }
   }
 }catch(e){check('Cloudflare Pages reachable from CI',false,String(e).slice(0,220));}
} catch(e) {check('smoke test execution',false,e.stack||String(e));} finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
console.log('\nSUMMARY '+results.filter(x=>x.ok).length+'/'+results.length+' passed');
if(process.exitCode)process.exit(process.exitCode);
