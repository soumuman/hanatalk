import {cleanCallbackURL} from './auth-link.js';
import {showDiagnostics} from './diagnostics.js';
import {APP_VERSION} from '../version.js';
import * as db from '../db.js';
import {client,sendLink,verifyLink,authLinkAttempt} from './client.js';
import {createSyncEngine} from './sync.js';
import {stableUUID} from './model.js';
import {escapeHTML as esc} from '../people.js';
let operations=Promise.resolve();
const enqueue=fn=>{const task=operations.then(fn);operations=task.catch(()=>{});return task;};
let engine,session=null,status='端末内に保存しています',email='',hooks={},switching=false;
export function cloudPanel(){return '<div id="cloud-panel" class="info-box cloud-panel"></div>';}
export function paintCloud(){
 const el=document.querySelector('#cloud-panel');if(!el)return;
 el.innerHTML=`<h2>クラウド同期</h2><p role="status">${esc(status)}</p><button type="button" data-storage-diagnostics>保存データを確認</button>`;
 if(!client){el.insertAdjacentHTML('beforeend','<p>クラウド接続の準備中です。これまでどおり端末内で利用できます。</p>');return;}
 if(session){el.insertAdjacentHTML('beforeend',`<p>ログイン済み</p>${db.currentAccount()?'<button data-cloud="sync">今すぐ同期</button>':'<button data-cloud="enable">クラウド同期を有効にする</button>'}<button data-cloud="logout">ログアウト</button><p class="small">ログアウトすると、ログイン前の端末内データに戻ります。</p>`);}
 else el.insertAdjacentHTML('beforeend',`<form id="cloud-email"><label>メールアドレス<input name="email" type="email" autocomplete="email" required value="${esc(email)}"></label><button>ログイン用メールを送る</button></form><p class="small">届いたメールの「Confirm email address」または「Log In」を押してください。確認コードの入力は不要です。</p><details class="guide"><summary>ホーム画面版・別のブラウザが開く場合</summary><p>メールの確認リンクを長押ししてコピーし、この画面に戻って貼り付けてください。まだ開いていないリンクを使います。</p><form id="cloud-link"><label>確認リンク<input name="link" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" required placeholder="メールのリンクを貼り付け"></label><button>この画面でログイン</button></form><p class="small">確認リンクはログイン用です。他の人へ送らないでください。</p></details><p class="small">ブラウザとホーム画面版の保存先は別です。元のブラウザでクラウドに引き継いだあと、ホーム画面版では「クラウド側データを使う」を選びます。</p><p class="small">メールアドレスは認証のためSupabase Authで管理します。人物・会話の記録には保存しません。</p>`);
}
function setStatus(s){status=s;paintCloud();}
async function chooseMigration(){
 const rows=await db.all('dailyLogs'),people=await db.all('people');
 return new Promise(resolve=>{
 const d=document.createElement('dialog');d.innerHTML=`<h2>この端末のデータをクラウドに引き継ぎますか？</h2><p>このブラウザの記録：人物 ${people.length}件・会話 ${rows.length}件（${new Set(rows.map(r=>r.date)).size}日分）</p><p>引き継ぐとクラウドの記録と合わせます。同じ記録がある場合は、この端末の内容を優先します。ログイン前の端末データは残します。</p><div class="cloud-options"><button data-choice="import">引き継ぐ</button><button data-choice="remote">クラウド側データを使う</button><button data-choice="cancel">キャンセル</button></div>`;document.body.append(d);d.showModal();let result='cancel';d.addEventListener('click',e=>{const b=e.target.closest('[data-choice]');if(b){result=b.dataset.choice;d.close();}});d.addEventListener('close',()=>{d.remove();resolve(result);});
});}
async function withSwitch(fn){
 if(switching)return;switching=true;
 await hooks.lock?.();
 try{await fn();}finally{switching=false;hooks.unlock?.();await hooks.render?.();paintCloud();}
}
function start(){
 engine=createSyncEngine({db,client,user:session.user.id,onStatus:setStatus,onPull:()=>{if(!switching)return hooks.refresh?.();}});
}
async function enable(){
 if(!session||db.currentAccount())return;
 const user=session.user.id,choice=await chooseMigration();if(choice==='cancel')return;
 await withSwitch(async()=>{
  const {data,error}=await client.auth.getUser();if(error||data.user?.id!==user)throw Error('session');
  const snapshot={people:await db.all('people'),dailyLogs:await db.all('dailyLogs'),settings:await db.all('settings')};
  const {error:profileError}=await client.from('profiles').upsert({user_id:user},{onConflict:'user_id',ignoreDuplicates:true});if(profileError)throw profileError;
  await db.useAccount(user);
  try{
   start();if(!await engine.run())throw Error('initial sync');
   if(choice==='import'){
    const ids=new Map();for(const p of snapshot.people)ids.set(p.id,await stableUUID(`${user}:person:${p.id}`));
    snapshot.people=snapshot.people.map(p=>({...p,id:ids.get(p.id)}));
    snapshot.dailyLogs=snapshot.dailyLogs.map(l=>({...l,targetId:ids.get(l.targetId||l.personId),personId:ids.get(l.targetId||l.personId)}));
    await db.importGuest(snapshot);
   }
   if(!(await db.all('people')).length)await db.ensureStarterCards();
   await db.put('settings',{key:'initialized',value:true});
   await db.put('settings',{key:'starterCardsSeeded',value:true});
   await db.put('settings',{key:'cloudEnrolled',value:true});
   localStorage.setItem(`talk-flower-enrolled-${user}`,'true');localStorage.setItem('talk-flower-active-account',user);engine.schedule(0);
  }catch(e){await engine?.stop();engine=null;await db.useAccount(null);throw e;}
 });
}
async function adopt(next){
 const user=next?.user?.id||null;session=next;if(!user)localStorage.removeItem('talk-flower-active-account');
 if(db.currentAccount()===user){paintCloud();return;}
 await withSwitch(async()=>{
  await engine?.stop();engine=null;await db.useAccount(null);
  if(user&&localStorage.getItem(`talk-flower-enrolled-${user}`)==='true'){
   await db.useAccount(user);
   if(await db.setting('cloudEnrolled')){localStorage.setItem('talk-flower-active-account',user);start();engine.schedule(0);}else await db.useAccount(null);
  }
  if(!db.currentAccount())setStatus(user?'同期するデータを選んでください':'端末内に保存しています');
 });
}
export async function bootCloud(callbacks){
 hooks=callbacks;
 document.addEventListener('click',e=>{if(e.target.closest('[data-storage-diagnostics]'))showDiagnostics({account:db.currentAccount(),version:APP_VERSION,loggedIn:!!session,origin:location.origin,standalone:!!navigator.standalone||matchMedia('(display-mode: standalone)').matches});});
 if(!client){paintCloud();return;}
 db.changes.addEventListener('change',()=>engine?.schedule());
 window.addEventListener('online',()=>engine?.schedule(0));
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')engine?.schedule(0);});
 setInterval(()=>{if(document.visibilityState==='visible')engine?.schedule(0);},30000);
 document.addEventListener('submit',async e=>{
  if(!['cloud-email','cloud-link'].includes(e.target.id))return;e.preventDefault();
  const form=e.target,b=form.querySelector('button');b.disabled=true;
  if(form.id==='cloud-link'){
   let value=form.elements.link.value;form.elements.link.value='';
   try{const next=await verifyLink(value);value='';await enqueue(()=>adopt(next));setStatus('ログインできました。クラウド同期を有効にして、使うデータを選んでください。');}
   catch{setStatus('リンクを確認できませんでした。新しいメールの、まだ開いていない確認リンクをコピーしてください。');}finally{value='';b.disabled=false;}return;
  }
  try{const address=new FormData(form).get('email').trim();await sendLink(address);email=address;setStatus('メールを送りました。届いたメールのリンクを、このブラウザで開いてください。');}
  catch{setStatus('メールを送れませんでした。入力内容と通信状態を確認し、少し待ってからお試しください。');}finally{b.disabled=false;}
 });
 document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-cloud]');if(!b||switching)return;b.disabled=true;
  try{if(b.dataset.cloud==='enable')await enqueue(enable);else if(b.dataset.cloud==='sync')await engine?.run();else await enqueue(async()=>{await engine?.stop();engine=null;const {error}=await client.auth.signOut({scope:'local'});if(error){start();engine.schedule();throw error;}await adopt(null);});}
  catch{setStatus('クラウドに接続できませんでした。端末の記録は残っています。');}finally{b.disabled=false;}
 });
 const remembered=localStorage.getItem('talk-flower-active-account');
 if(!navigator.onLine&&/^[a-f0-9-]{36}$/.test(remembered||'')){await enqueue(()=>adopt({user:{id:remembered}}));setStatus('オフラインです。端末に保存しています。');}
 client.auth.onAuthStateChange((_event,next)=>{if(_event==='INITIAL_SESSION'&&!next&&!navigator.onLine&&remembered)return;setTimeout(()=>{enqueue(()=>adopt(next)).catch(()=>setStatus('認証状態を確認できませんでした。端末には保存されています。'));},0);});
 const initialization=authLinkAttempt?await client.auth.initialize():null;
 const {data}=await client.auth.getSession();if(data.session||navigator.onLine||!remembered)await enqueue(()=>adopt(data.session));
 if(authLinkAttempt){
  cleanCallbackURL(location,history);
  await hooks.render?.();
  setStatus(!initialization?.error&&data.session?(db.currentAccount()?'ログインできました。クラウド同期を再開します。':'ログインできました。クラウド同期は、引き継ぐデータを選んでから開始します。'):'ログインリンクを確認できませんでした。新しいメールを送り直してください。');
 }
 paintCloud();
}
