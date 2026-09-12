import {cloudPanel,paintCloud,bootCloud} from './cloud/ui.js';
import * as db from './db.js';
import {entryCard,settingsCard} from './cards.js';
import {logTargetId,logCount,totalTalkCount} from './records.js';
import {enableDragOrder} from './drag-order.js';
import {registerUpdates,loadLatest} from './updates.js';
import {APP_VERSION} from './version.js';
import {prepareSound,playAddition,setSoundEnabled,stopSounds} from './sound.js';
let cloudSwitching=false;
let soundEnabled=true;let appStartedAt;let firstRegistration=false;
import {getSeasonalNote} from './seasons.js';
import {dateKey,formatDate,monthCells,calendarDayState,isFutureDate,FUTURE_DATE_MESSAGE} from './calendar.js';
import {createPerson,suggestions,categories,escapeHTML as esc} from './people.js';
import {flowerSVG,getFlowerType,sproutSVG} from './flower.js';
import {pickComment} from './comments.js';
const app=document.querySelector('#app');let people=[],logs=[],viewMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1,12),busy=false,noticeTimer;
const button=(text,action,cls='')=>`<button class="${cls}" data-action="${action}">${text}</button>`;
function notify(text){document.querySelector('#notice').textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>document.querySelector('#notice').textContent='',5000);}
async function refresh(){[people,logs]=await Promise.all([db.all('people'),db.all('dailyLogs')]);people.sort((a,b)=>a.sortOrder-b.sortOrder);soundEnabled=(await db.setting('soundEnabled'))!==false;setSoundEnabled(soundEnabled);}
function footer(){return `<nav class="bottom"><a class="primary" href="#day/${dateKey()}">＋ 今日の会話</a><a class="settings-link" href="#settings" aria-label="設定・人物編集">⚙ <span>人物・設定</span></a></nav>`;}
function onboarding(){addPeople(true);}
function calendar(){
  document.body.classList.add('calendar-view');
  const y=viewMonth.getFullYear(),m=viewMonth.getMonth(),month=dateKey(viewMonth),today=dateKey();
  const counts=new Map();logs.forEach(l=>counts.set(l.date,(counts.get(l.date)||0)+logCount(l)));
  app.innerHTML=`<section class="calendar" aria-label="月間カレンダー"><div class="month-nav">${button('‹ <span>先月</span>','prev')}<button data-action="month" class="month-title" aria-label="${y}年${m+1}月、年月を選択">${y} <span>/</span> ${m+1} <small>⌄</small></button>${button('<span>来月</span> ›','next')}</div><div class="month-sub"><div class="season"><span>${getFlowerType(month).name}の月</span><span class="season-note">${getSeasonalNote(month)}</span></div>${button('今月','today-month','text-link')}</div><div class="calendar-grid"><div class="week sunday">日</div>${['月','火','水','木','金','土'].map(w=>`<div class="week">${w}</div>`).join('')}${monthCells(y,m).map(date=>{
    if(!date)return '<div class="day blank"></div>';
    const count=counts.get(date)||0,state=calendarDayState(date,count,appStartedAt,today);
    const visual=state==='flower'?flowerSVG(date,count,{calendar:true}):state==='sprout'?sproutSVG():'';
    const label=state==='flower'?`、${count}人と話しました`:state==='sprout'?'、双葉':'';
    return `<a class="day ${date===today?'today':''}" href="#day/${date}" aria-label="${formatDate(date)}${label}" ${date===today?'aria-current="date"':''}><span>${Number(date.slice(8))}</span><div class="day-visual">${visual}</div></a>`;
  }).join('')}</div></section>${footer()}`;
}
function currentDate(){const s=location.hash.split('/')[1];return /^\d{4}-\d{2}-\d{2}$/.test(s||'')&&dateKey(new Date(`${s}T12:00:00`))===s?s:dateKey();}
function day(){
  const date=currentDate();
  if(isFutureDate(date)){app.innerHTML=`<section class="entry"><a href="#calendar" class="back">‹ カレンダー</a><p class="date-label">${formatDate(date)}</p><h1>この日はまだ未来の日付です。</h1><p>記録は当日以降に登録できます。</p></section>`;return;}
  const dayLogs=logs.filter(l=>l.date===date),selected=new Map(dayLogs.map(l=>[logTargetId(l),l]));
  const shown=people.filter(p=>p.isActive),total=totalTalkCount(dayLogs);
  app.innerHTML=`<section class="entry"><a href="#calendar" class="back">‹ カレンダー</a><p class="date-label">${formatDate(date)}</p><h1>今日、誰としゃべった？</h1><p>話した相手をタップしてください。</p><div class="people-grid">${shown.map(p=>entryCard(p,selected.get(p.id))).join('')}</div><a class="add-person" href="#settings">＋ 相手を追加・編集する</a><div id="flower-stage" class="flower-stage">${flowerSVG(date,total,{large:true})}<p class="count">${date===dateKey()?'今日':'この日'} ${total}人と話しました</p><p class="bloom-message">${total>=5?'今日の花が咲きました 🌸':'ひとことのつながりを、少しずつ。'}</p></div>${dayLogs.some(l=>!people.find(p=>p.id===logTargetId(l))?.isActive)?'<p class="small">一覧から外した相手の記録も、花に含めています。</p>':''}<p class="saved">✓ 操作するたびに自動保存します</p><p class="small">カードをもう一度押すと、その相手の選択を取り消せます。</p></section>`;
}
function settings(){app.innerHTML=`<section class="settings"><a href="#calendar" class="back">‹ カレンダー</a><span class="eyebrow">あなたのつながり</span><h1>人物・設定</h1><p>「…」で設定、つまみで並び替えできます。</p><div class="person-settings-grid">${people.filter(p=>p.isActive).map(settingsCard).join('')}</div><div class="choices setting-candidates">${suggestions.map(([name],i)=>people.some(p=>p.displayName===name)?'':`<button data-quick-person="${i}">${esc(name)}<small>＋ 追加</small></button>`).join('')}</div><form id="quick-add"><label for="quick-name">名前を入力して追加</label><div class="input-row"><input id="quick-name" name="name" maxlength="40" placeholder="例：平井さん、長男" autocomplete="off" required><button type="submit">追加</button></div></form><p class="small">追加・並び替えは自動で保存します。</p><div class="info-box sound-setting"><h2>効果音</h2><button data-action="sound" role="switch" aria-checked="${soundEnabled}" aria-label="効果音">効果音 ${soundEnabled?'ON':'OFF'}</button><p>花が色づくときに、柔らかな音を鳴らします。</p></div>${cloudPanel()}<div class="info-box"><h2>会話内容は保存しません</h2><p>保存するのは相手の名前・種類・関係カテゴリ・話した日・人数と、アプリの管理情報です。会話内容や音声、位置情報は保存しません。</p><p>端末内保存のみでも利用できます。クラウド同期はログインして有効にした場合だけ使います。</p></div><details class="guide"><summary>この花カレンダーについて</summary><p>ひとりと声を交わすごとに、その月の花が少しずつ開きます。5人で花が完成し、そのあとは色合いが少し変わります。</p><p>小さな双葉は、これから育つ花のスタート地点です。話さない日も、そのままで大丈夫。</p><p>店員さんへの「お願いします」も記録できます。AI・テレビ・独り言は含めません。複数人をまとめたカードでは、選んだあとに＋－で人数を調整できます。個別カードで選んだ人は、その人数に含めません。</p></details><details class="guide"><summary>ホーム画面に追加する</summary><p>iPhoneのSafariでこのアプリを開き、共有メニューから「ホーム画面に追加」を選んでください。一度読み込むとオフラインでも使えます。</p></details><details class="guide archived-cards"><summary>一覧から外したカード</summary><p class="small">戻しても、過去の記録はそのままです。</p>${people.filter(p=>!p.isActive).map(p=>`<div class="restore-row"><span>${esc(p.displayName)}</span><button data-restore="${p.id}">一覧に戻す</button></div>`).join('')||'<p class="small">一覧から外したカードはありません。</p>'}</details><p class="small">今日、誰としゃべった？ · バージョン ${APP_VERSION}</p><button data-action="update-app">最新版を読み込む</button></section>`;paintCloud();}
function addPeople(first=firstRegistration){
  app.innerHTML=`<section class="add-people">${first?'':'<a class="back" href="#settings">‹ 人物・設定</a>'}<h1>${first?'人物を登録':'人物を追加'}</h1><p>基本のカードを用意しました。名前を入力して追加もできます。</p><div class="choices">${suggestions.map(([name],i)=>{
    const active=people.some(p=>p.displayName===name&&p.isActive);
    const hidden=!active&&people.some(p=>p.displayName===name);
    return `<button class="kind-${people.find(p=>p.displayName===name)?.type||suggestions[i][2]}" data-quick-person="${i}" ${active?'disabled':''}>${esc(name)}${active?'<small>登録済み</small>':hidden?'<small>再表示する</small>':''}</button>`;
  }).join('')}</div><form id="quick-add"><label for="quick-name">名前を入力して追加</label><div class="input-row"><input id="quick-name" name="name" maxlength="40" placeholder="例：平井さん、長男" autocomplete="off" required><button type="submit">追加</button></div></form><div class="registered-names">${people.filter(p=>p.isActive&&!suggestions.some(([name])=>name===p.displayName)).map(p=>`<span>${esc(p.displayName)} <small>登録済み</small></span>`).join('')}</div><p class="small">カードの種類や名前は、あとから「…」で変更できます。</p>${first?button('完了','initialize','primary wide'):'<a class="primary wide" href="#settings">完了</a>'}</section>`;
}
async function saveQuickPerson(name,category='other',type='person'){
  const result=await db.quickAddPerson(name,category,type);
  await refresh();
  if(firstRegistration||location.hash==='#add-people')addPeople();else if(location.hash==='#settings')settings();
  notify(result==='existing'?'この名前は登録済みです':result==='restored'?'人物を再表示しました':'人物を追加しました');
}
let renderCount=0;
async function render(){if(cloudSwitching)return;renderCount++;try{await renderView();}finally{renderCount--;}}
async function renderView(){document.body.classList.remove('calendar-view');appStartedAt=await db.ensureAppStartedAt();await db.ensureStarterCards();await refresh();if(await db.setting('appVersion')!==APP_VERSION)await db.put('settings',{key:'appVersion',value:APP_VERSION});firstRegistration=!await db.setting('initialized');if(firstRegistration)return onboarding();if(location.hash.startsWith('#day/'))day();else if(location.hash==='#add-people')addPeople();else if(location.hash==='#settings')settings();else calendar();}
function dialog(content){const el=document.createElement('dialog');el.innerHTML=content;document.body.append(el);el.addEventListener('close',()=>el.remove());el.showModal();el.querySelector('[data-close]')?.addEventListener('click',()=>el.close());return el;}
function chooseType(name){
  return new Promise(resolve=>{
    const el=dialog(`<h2>「${esc(name)}」はどちらですか？</h2><div class="type-options"><button data-type-choice="person">1人の相手</button><button data-type-choice="group">複数人のグループ</button></div><div class="dialog-actions"><button data-close>戻る</button></div>`);
    let selected=null;
    el.querySelectorAll('[data-type-choice]').forEach(button=>button.addEventListener('click',()=>{selected=button.dataset.typeChoice;el.close();}));
    el.addEventListener('close',()=>resolve(selected),{once:true});
  });
}
function editPerson(id){
  const p=people.find(p=>p.id===id);if(!p)return;
  const el=dialog(`<form id="person-form"><h2>${esc(p.displayName)}の設定</h2><fieldset class="type-options"><legend>このカードは</legend><label><input type="radio" name="type" value="person" ${(p.type||'person')==='person'?'checked':''}> 1人の相手</label><label><input type="radio" name="type" value="group" ${p.type==='group'?'checked':''}> 複数人のグループ</label></fieldset><label for="person-name">名前変更</label><input id="person-name" name="name" value="${esc(p.displayName)}" maxlength="40" required><button type="button" class="remove-card" data-remove-card>一覧から外す</button><p class="small">過去の記録と花は残ります。設定の「一覧から外したカード」から戻せます。</p><p class="small">過去に記録した複数人の人数は、そのまま残します。</p><details><summary>関係カテゴリ</summary><select name="category" aria-label="関係カテゴリ">${Object.entries(categories).map(([k,v])=>`<option value="${k}" ${p.category===k?'selected':''}>${v}</option>`).join('')}</select></details><div class="dialog-actions"><button type="button" data-close>戻る</button><button class="primary" type="submit">保存</button></div><p class="form-status" role="status"></p></form>`);
  el.querySelector('[data-remove-card]').onclick=async e=>{
    e.currentTarget.disabled=true;
    try{await db.updatePerson(id,{isActive:false});el.close();await render();notify('一覧から外しました。過去の花はそのままです');}
    catch{el.querySelector('.form-status').textContent='変更できませんでした。もう一度お試しください。';el.querySelector('[data-remove-card]').disabled=false;}
  };
  el.querySelector('form').onsubmit=async e=>{
    e.preventDefault();const form=new FormData(e.target),name=form.get('name').trim();if(!name)return;
    const submit=e.target.querySelector('[type=submit]');submit.disabled=true;
    try{await db.updatePerson(id,{displayName:name,type:form.get('type'),category:form.get('category')});el.close();await render();notify('カードを保存しました');}
    catch{el.querySelector('.form-status').textContent='保存できませんでした。もう一度お試しください。';submit.disabled=false;}
  };
}
async function handleTalk(targetId,action){
  const date=currentDate();if(isFutureDate(date)){notify(FUTURE_DATE_MESSAGE);return;}
  busy=true;
  const previous=logs.filter(l=>logTargetId(l)===targetId),old=previous.find(l=>l.date===date);
  if(action==='increment'||(action==='toggle'&&!old))prepareSound();
  const result=await db.changeTalk(date,targetId,action);
  await refresh();day();
  const selector=action==='toggle'||result.count===0?`[data-person="${targetId}"]`:`[data-count-target="${targetId}"][data-count-action="${action}"]`;
  app.querySelector(selector)?.focus({preventScroll:true});
  if(result.added){playAddition(result.total);notify(result.total===5?'今日の花が咲きました 🌸':action==='increment'?'人数を1人追加しました':pickComment(previous,date,result.total));app.querySelector('.flower-stage .flower')?.classList.add('bloom');}
  else notify(result.count===0?'この日の選択を取り消しました':'人数を変更しました');
}
app.addEventListener('submit',async e=>{if(e.target.id==='quick-add'){e.preventDefault();if(busy||cloudSwitching)return;const name=e.target.elements.name.value.trim();if(!name)return;busy=true;try{const type=await chooseType(name);if(type)await saveQuickPerson(name,'other',type);}catch{notify('保存できませんでした。もう一度お試しください。');}finally{busy=false;}return;}});
app.addEventListener('click',async e=>{const dayLink=e.target.closest('a.day');if(dayLink&&isFutureDate(dayLink.getAttribute('href').split('/')[1])){e.preventDefault();dialog('<h2>この日はまだ未来の日付です。</h2><p>記録は当日以降に登録できます。</p><div class="dialog-actions"><button data-close>閉じる</button></div>');return;}const b=e.target.closest('button');if(!b||busy||cloudSwitching)return;try{if(b.dataset.restore){busy=true;await db.updatePerson(b.dataset.restore,{isActive:true});await render();notify('一覧に戻しました');return;}if(b.dataset.quickPerson!==undefined){busy=true;const [name,category,type]=suggestions[Number(b.dataset.quickPerson)];await saveQuickPerson(name,category,type);return;}if(b.dataset.countTarget){e.stopPropagation();await handleTalk(b.dataset.countTarget,b.dataset.countAction);return;}if(b.dataset.person){await handleTalk(b.dataset.person,'toggle');return;}if(b.dataset.edit)return editPerson(b.dataset.edit);if(b.dataset.move){busy=true;const index=people.findIndex(p=>p.id===b.dataset.move),next=index+Number(b.dataset.dir);if(next>=0&&next<people.length){[people[index],people[next]]=[people[next],people[index]];await db.reorderIds(people.map(p=>p.id));await render();}return;}switch(b.dataset.action){case 'update-app':busy=true;b.disabled=true;b.textContent='更新を確認しています…';try{await loadLatest();}catch(error){notify(error.message);b.disabled=false;b.textContent='最新版を読み込む';}break;case 'sound':{busy=true;const next=!soundEnabled;await db.put('settings',{key:'soundEnabled',value:next});soundEnabled=next;setSoundEnabled(next);settings();app.querySelector('[data-action=sound]')?.focus({preventScroll:true});notify(`効果音を${next?'ON':'OFF'}にしました`);break;}case 'initialize':busy=true;await db.initialize([]);firstRegistration=false;location.hash='#calendar';await render();break;case 'prev':viewMonth.setMonth(viewMonth.getMonth()-1);calendar();break;case 'next':viewMonth.setMonth(viewMonth.getMonth()+1);calendar();break;case 'today-month':viewMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1,12);calendar();break;case 'add-person':location.hash='#add-people';break;case 'month':{const el=dialog(`<form><h2>表示する年月</h2><label for="year">年</label><input id="year" name="year" type="number" min="1900" max="2200" value="${viewMonth.getFullYear()}" required><label for="month">月</label><select id="month" name="month">${Array.from({length:12},(_,i)=>`<option value="${i}" ${i===viewMonth.getMonth()?'selected':''}>${i+1}月</option>`).join('')}</select><div class="dialog-actions"><button type="button" data-close>戻る</button><button class="primary">表示</button></div></form>`);el.querySelector('form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);viewMonth=new Date(Number(f.get('year')),Number(f.get('month')),1,12);el.close();calendar();};break;}}}catch(error){notify('保存・読み込みができませんでした。もう一度お試しください。');}finally{busy=false;}});
window.addEventListener('hashchange',()=>render().catch(()=>notify('記録を読み込めませんでした')));
window.addEventListener('pageshow',()=>{if(!busy)render().catch(()=>{});});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')stopSounds();if(document.visibilityState==='visible'&&!busy)render().catch(()=>{});});
render().then(()=>bootCloud({render,refresh:async()=>{if(!busy&&!cloudSwitching&&!document.querySelector('dialog')&&!['INPUT','SELECT'].includes(document.activeElement?.tagName))await render();},lock:async()=>{cloudSwitching=true;app.inert=true;while(busy||renderCount||document.querySelector('dialog'))await new Promise(r=>setTimeout(r,20));},unlock:()=>{cloudSwitching=false;app.inert=false;}}).catch(()=>notify('クラウドに接続できませんでした。端末には保存されています。'))).catch(()=>{app.innerHTML='<section><h1>記録を開けませんでした</h1><p>ブラウザの保存領域を確認し、再読み込みしてください。</p><button data-action="update-app">再読み込み</button></section>';});
registerUpdates(notify);

enableDragOrder(app,{
  canStart:()=>!busy&&!cloudSwitching,
  onStart:()=>{busy=true;},
  onCancel:()=>{busy=false;},
  onFinish:async(ids,id)=>{
    try{await db.reorderIds(ids);await render();app.querySelector(`[data-order-id="${id}"] [data-drag-handle]`)?.focus({preventScroll:true});notify('並び順を保存しました');}
    catch{await render().catch(()=>{});notify('並び順を保存できませんでした。もう一度お試しください。');}
    finally{busy=false;}
  }
});
