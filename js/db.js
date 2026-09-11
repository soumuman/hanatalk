import {APP_VERSION} from './version.js';
import {historyFor,dateKey} from './calendar.js';
let opening;
export function openDB(){return opening??=new Promise((resolve,reject)=>{const r=indexedDB.open('talk-flower',1);r.onupgradeneeded=()=>{const db=r.result;db.createObjectStore('people',{keyPath:'id'});const logs=db.createObjectStore('dailyLogs',{keyPath:'id'});logs.createIndex('date_person',['date','personId'],{unique:true});logs.createIndex('personId','personId');logs.createIndex('date','date');db.createObjectStore('settings',{keyPath:'key'});};r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();opening=null;};resolve(r.result);};r.onerror=()=>{opening=null;reject(r.error);};r.onblocked=()=>reject(new Error('別のタブを閉じて、もう一度開いてください'));});}
const request=r=>new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});
export async function transact(stores,mode,fn){const db=await openDB();const tx=db.transaction(stores,mode);const done=new Promise((ok,no)=>{tx.oncomplete=ok;tx.onerror=()=>no(tx.error);tx.onabort=()=>no(tx.error||new Error('保存できませんでした'));});try{const result=await fn(tx);await done;return result;}catch(e){try{tx.abort();}catch{}await done.catch(()=>{});throw e;}}
export const all=store=>transact([store],'readonly',tx=>request(tx.objectStore(store).getAll()));
export const put=(store,value)=>transact([store],'readwrite',tx=>request(tx.objectStore(store).put(value)));
export const setting=async key=>(await all('settings')).find(s=>s.key===key)?.value;
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
export async function toggleTalk(date,personId){return transact(['people','dailyLogs'],'readwrite',async tx=>{const store=tx.objectStore('dailyLogs');const id=`${date}:${personId}`;const old=await request(store.get(id));if(old)store.delete(id);else store.add({id,date,personId,createdAt:new Date().toISOString()});const person=await request(tx.objectStore('people').get(personId));if(!person)throw new Error('人物が見つかりません');const logs=await request(store.index('personId').getAll(personId));tx.objectStore('people').put({...person,...historyFor(logs)});return !old;});}
export async function reorder(people){return transact(['people'],'readwrite',tx=>people.forEach((p,i)=>tx.objectStore('people').put({...p,sortOrder:i})));}
