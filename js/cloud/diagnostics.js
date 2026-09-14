// Read-only inspection of the legacy database and CURRENT account only.
// Never reads auth storage, account identifiers, names, or raw record content into the report.
export async function inspectDatabase(name){
 return new Promise(resolve=>{
  let absent=false,settled=false;
  const finish=value=>{if(!settled){settled=true;resolve(value);}};
  const req=indexedDB.open(name); // No version: do not upgrade an existing database.
  req.onupgradeneeded=()=>{absent=true;req.transaction.abort();}; // Do not create an absent DB.
  req.onerror=()=>finish({state:absent?'absent':'unavailable'});
  req.onblocked=()=>finish({state:'unavailable'});
  req.onsuccess=()=>{
   const connection=req.result;if(settled){connection.close();return;}
   const stores=['people','dailyLogs','syncState'].filter(s=>connection.objectStoreNames.contains(s));
   if(!stores.includes('dailyLogs')){connection.close();finish({state:'unsupported'});return;}
   const result={state:'ready',version:connection.version,people:0,logRows:0,talkDays:0,pending:0,tombstones:0};
   const days=new Set(),tx=connection.transaction(stores,'readonly');
   if(stores.includes('people')){const r=tx.objectStore('people').count();r.onsuccess=()=>{result.people=r.result;};}
   const cursor=tx.objectStore('dailyLogs').openCursor();cursor.onsuccess=()=>{const c=cursor.result;if(c){result.logRows++;if(c.value.date)days.add(c.value.date);c.continue();}};
   if(stores.includes('syncState')){const r=tx.objectStore('syncState').openCursor();r.onsuccess=()=>{const c=r.result;if(c){if(c.value.sync_status==='pending')result.pending++;if(c.value.deleted)result.tombstones++;c.continue();}};}
   tx.oncomplete=()=>{result.talkDays=days.size;connection.close();finish(result);};
   tx.onabort=tx.onerror=()=>{connection.close();finish({state:'unavailable'});};
  };
 });
}
export function diagnoseStorage(legacy,current,accountActive){
 if(legacy.state!=='ready'||current.state!=='ready')return '保存先の一部を確認できませんでした。データが消えたとは判断できません。';
 if(accountActive&&legacy.logRows>0&&current.logRows===0)return 'ログイン前の保存先に記録が残っています。現在は別の保存先を表示しています。';
 if(current.logRows>0)return '現在の保存先に会話記録があります。表示している月や、同期の状態を確認します。';
 return 'この開き方では会話記録を確認できませんでした。以前使っていたホーム画面アプリ・Safari・Chromeでも確認してください。';
}
export async function collectDiagnostics({account=null,version='',loggedIn=false,origin='',standalone=false}={}){
 const legacy=await inspectDatabase('talk-flower');
 const current=account?await inspectDatabase(`talk-flower-user-${account}`):legacy;
 return {version,origin,launch:standalone?'ホーム画面アプリ':'ブラウザ',loggedIn,display:account?'ログイン後の保存先':'ログイン前の保存先',legacy,current,message:diagnoseStorage(legacy,current,!!account)};
}
export async function showDiagnostics(context={}){
 const d=document.createElement('dialog');
 const heading=document.createElement('h2');heading.textContent='保存データの確認';
 const content=document.createElement('div');content.textContent='この端末の記録件数を確認しています…';
 const close=document.createElement('button');close.textContent='閉じる';close.onclick=()=>d.close();
 d.append(heading,content,close);document.body.append(d);d.addEventListener('close',()=>d.remove());d.showModal();
 const report=await collectDiagnostics(context).catch(()=>null);if(!d.isConnected)return;
 content.replaceChildren();
 const line=text=>{const p=document.createElement('p');p.textContent=text;content.append(p);};
 if(!report){line('確認できませんでした。データが消えたとは判断できません。');return;}
 line(`バージョン ${report.version} ／ ${report.launch}`);line(`アプリの場所：${report.origin}`);if(context.email)line(`Googleアカウント：${context.email}`);
 line(`${report.loggedIn?'アプリでログイン済み':'アプリでは未ログイン'} ／ 表示中：${report.display}`);
 for(const [label,result] of [['ログイン前の保存先',report.legacy],['現在表示中の保存先',report.current]]){
  line(result.state==='ready'?`${label}：人物 ${result.people}件 ／ 会話記録 ${result.logRows}件（${result.talkDays}日分） ／ 未同期 ${result.pending}件 ／ 取消情報 ${result.tombstones}件`:`${label}：${result.state==='absent'?'このブラウザにはありません':'確認できませんでした'}`);
 }
 line(report.message);line('この確認では記録の変更・削除・引き継ぎ・送信は行いません。別ブラウザの保存先は確認できません。');
}
