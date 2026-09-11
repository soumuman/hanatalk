import {APP_VERSION} from './version.js';
import {logCount,logTargetId,totalTalkCount,recordType,nextTalkCount} from './records.js';
import {createPerson,suggestions} from './people.js';
import {historyFor,dateKey,assertRecordableDate} from './calendar.js';
let opening;
export function openDB(){return opening??=new Promise((resolve,reject)=>{
  const r=indexedDB.open('talk-flower',2);
  r.onupgradeneeded=event=>{
    const db=r.result,tx=r.transaction;
    if(event.oldVersion===0){
      db.createObjectStore('people',{keyPath:'id'});
      const logs=db.createObjectStore('dailyLogs',{keyPath:'id'});
      logs.createIndex('date_person',['date','personId'],{unique:true});
      logs.createIndex('personId','personId');logs.createIndex('date','date');
      db.createObjectStore('settings',{keyPath:'key'});
    }
    const people=tx.objectStore('people'),logs=tx.objectStore('dailyLogs');
    logs.createIndex('date_target',['date','targetId'],{unique:true});
    logs.createIndex('targetId','targetId');
    const peopleCursor=people.openCursor();
    peopleCursor.onsuccess=()=>{const c=peopleCursor.result;if(!c)return;const p=c.value;if(!p.type)c.update({...p,type:'person'});c.continue();};
    const logsCursor=logs.openCursor();
    logsCursor.onsuccess=()=>{const c=logsCursor.result;if(!c)return;const log=c.value;c.update({...log,targetId:logTargetId(log),personId:logTargetId(log),count:logCount(log),recordType:log.recordType||'person'});c.continue();};
    // Existing installations must never gain starter cards during a migration.
    if(event.oldVersion>0)tx.objectStore('settings').put({key:'starterCardsSeeded',value:true});
  };
  r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();opening=null;};resolve(r.result);};
  r.onerror=()=>{opening=null;reject(r.error);};
  r.onblocked=()=>{opening=null;reject(new Error('別のタブを閉じて、もう一度開いてください'));};
});}
const request=r=>new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});
export async function transact(stores,mode,fn){const db=await openDB();const tx=db.transaction(stores,mode);const done=new Promise((ok,no)=>{tx.oncomplete=ok;tx.onerror=()=>no(tx.error);tx.onabort=()=>no(tx.error||new Error('保存できませんでした'));});try{const result=await fn(tx);await done;return result;}catch(e){try{tx.abort();}catch{}await done.catch(()=>{});throw e;}}
export const all=store=>transact([store],'readonly',tx=>request(tx.objectStore(store).getAll()));
export const put=(store,value)=>transact([store],'readwrite',tx=>request(tx.objectStore(store).put(value)));
export const setting=async key=>(await all('settings')).find(s=>s.key===key)?.value;
export async function quickAddPerson(name,category='other',type='person'){
  if(!['person','group'].includes(type))throw new Error('相手の種類を選んでください');
  name=name.trim();
  if(!name||name.length>40)throw new Error('名前は1〜40文字で入力してください');
  return transact(['people'],'readwrite',async tx=>{
    const store=tx.objectStore('people');
    const people=await request(store.getAll());
    const existing=people.find(p=>p.displayName===name&&p.isActive)||people.find(p=>p.displayName===name);
    if(existing){
      if(existing.isActive)return 'existing';
      store.put({...existing,isActive:true});
      return 'restored';
    }
    const sortOrder=people.reduce((max,p)=>Math.max(max,p.sortOrder),-1)+1;
    store.add(createPerson(name,category,sortOrder,type));
    return 'added';
  });
}
// Atomic read-if-absent: subsequent visits and concurrent tabs never overwrite it.
export async function ensureAppStartedAt(today=dateKey()){
  return transact(['settings','people','dailyLogs'],'readwrite',async tx=>{
    const settings=tx.objectStore('settings');
    const existing=await request(settings.get('appStartedAt'));
    if(existing)return existing.value;
    const people=await request(tx.objectStore('people').getAll());
    const logs=await request(tx.objectStore('dailyLogs').getAll());
    const candidates=[today];
    for(const record of [...people,...logs]){
      if(record.createdAt){const date=new Date(record.createdAt);if(!Number.isNaN(date.getTime()))candidates.push(dateKey(date));}
    }
    for(const log of logs)if(/^\d{4}-\d{2}-\d{2}$/.test(log.date))candidates.push(log.date);
    const value=candidates.filter(date=>date<=today).sort()[0];
    settings.add({key:'appStartedAt',value});
    return value;
  });
}
export async function initialize(people){await transact(['people','settings'],'readwrite',tx=>{people.forEach(p=>tx.objectStore('people').put(p));tx.objectStore('settings').put({key:'initialized',value:true});tx.objectStore('settings').put({key:'appVersion',value:APP_VERSION});});}
export async function changeTalk(date,targetId,action='toggle'){
  assertRecordableDate(date);
  return transact(['people','dailyLogs'],'readwrite',async tx=>{
    const store=tx.objectStore('dailyLogs'),people=tx.objectStore('people');
    const person=await request(people.get(targetId));
    if(!person)throw new Error('相手が見つかりません');
    if(!person.isActive)throw new Error('一覧に戻してから記録してください');
    const old=await request(store.index('date_target').get([date,targetId]));
    const before=old?logCount(old):0,type=recordType(person,old);
    const count=nextTalkCount(before,type,action);
    const dateLogs=await request(store.index('date').getAll(date));
    const totalBefore=totalTalkCount(dateLogs),total=totalBefore-before+count;
    if(!Number.isSafeInteger(total))throw new Error('人数を確認してください');
    const id=old?.id||`${date}:${targetId}`;
    if(count===0){if(old)store.delete(id);}
    else store.put({id,date,targetId,personId:targetId,count,recordType:type,createdAt:old?.createdAt||new Date().toISOString()});
    const history=await request(store.index('targetId').getAll(targetId));
    people.put({...person,...historyFor(history)});
    return {before,count,totalBefore,total,added:count>before};
  });
}
export async function toggleTalk(date,targetId){return (await changeTalk(date,targetId)).count>0;}
export async function updatePerson(id,changes){
  return transact(['people'],'readwrite',async tx=>{
    const store=tx.objectStore('people'),person=await request(store.get(id));
    if(!person)throw new Error('相手が見つかりません');
    if(changes.type&&!['person','group'].includes(changes.type))throw new Error('相手の種類を確認してください');
    if(changes.displayName!==undefined&&(!changes.displayName.trim()||changes.displayName.trim().length>40))throw new Error('名前は1〜40文字で入力してください');
    store.put({...person,...changes,displayName:(changes.displayName??person.displayName).trim(),id:person.id});
  });
}
export async function ensureStarterCards(){
  return transact(['people','settings','dailyLogs'],'readwrite',async tx=>{
    const settings=tx.objectStore('settings');
    if(await request(settings.get('starterCardsSeeded')))return;
    const initialized=await request(settings.get('initialized'));
    const people=tx.objectStore('people');
    const count=await request(people.count()),logTotal=await request(tx.objectStore('dailyLogs').count());
    if(!initialized?.value&&count===0&&logTotal===0)suggestions.forEach(([name,category,type],i)=>people.add(createPerson(name,category,i,type)));
    settings.put({key:'starterCardsSeeded',value:true});
  });
}
export async function reorder(people){return transact(['people'],'readwrite',tx=>people.forEach((p,i)=>tx.objectStore('people').put({...p,sortOrder:i})));}
export async function reorderIds(ids){
  return transact(['people'],'readwrite',async tx=>{
    const store=tx.objectStore('people');
    const people=await request(store.getAll());
    const byId=new Map(people.map(p=>[p.id,p]));
    const ordered=[...new Set(ids)].filter(id=>byId.has(id));
    people.sort((a,b)=>a.sortOrder-b.sortOrder).forEach(p=>{if(!ordered.includes(p.id))ordered.push(p.id);});
    ordered.forEach((id,sortOrder)=>store.put({...byId.get(id),sortOrder}));
  });
}
