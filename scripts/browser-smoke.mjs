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
   }
 }catch(e){check('Cloudflare Pages reachable from CI',false,String(e).slice(0,220));}
} catch(e) {check('smoke test execution',false,e.stack||String(e));} finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
console.log('\nSUMMARY '+results.filter(x=>x.ok).length+'/'+results.length+' passed');
if(process.exitCode)process.exit(process.exitCode);
