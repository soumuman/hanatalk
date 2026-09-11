import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as db from '../js/db.js';
import {totalTalkCount} from '../js/records.js';
test('v1 migration preserves ids, order, hidden state, dates and all counts',async()=>{
  const legacy=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('talk-flower',1);
    r.onupgradeneeded=()=>{
      const d=r.result;d.createObjectStore('people',{keyPath:'id'});d.createObjectStore('settings',{keyPath:'key'});
      const l=d.createObjectStore('dailyLogs',{keyPath:'id'});l.createIndex('date_person',['date','personId'],{unique:true});l.createIndex('personId','personId');l.createIndex('date','date');
    };
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  const old={id:'old-wife',displayName:'妻',category:'family',createdAt:'2025-02-01T12:00:00Z',sortOrder:6,isActive:false,totalTalkDays:2};
  await new Promise((resolve,reject)=>{
    const tx=legacy.transaction(['people','dailyLogs','settings'],'readwrite');
    tx.objectStore('people').put(old);
    tx.objectStore('people').put({...old,id:'typed',displayName:'仲間',type:'group',sortOrder:2});
    for(const date of ['2025-02-01','2026-09-01'])tx.objectStore('dailyLogs').put({id:date+':old-wife',date,personId:old.id,createdAt:'2026-09-01T01:00:00Z'});
    tx.objectStore('settings').put({key:'initialized',value:true});tx.objectStore('settings').put({key:'appStartedAt',value:'2025-02-01'});
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });legacy.close();
  const connection=await db.openDB();assert.equal(connection.version,2);
  const people=await db.all('people');assert.equal(people.length,2);
  assert.deepEqual(people.find(p=>p.id===old.id),{...old,type:'person'});
  assert.equal(people.find(p=>p.id==='typed').type,'group');
  const logs=await db.all('dailyLogs');assert.equal(logs.length,2);assert.equal(totalTalkCount(logs),2);
  assert.ok(logs.every(l=>l.targetId===old.id&&l.personId===old.id&&l.count===1));
  assert.equal(await db.setting('appStartedAt'),'2025-02-01');
  await db.ensureStarterCards();assert.equal((await db.all('people')).length,2);
  await db.updatePerson(old.id,{type:'group'});
  await db.changeTalk('2026-09-01',old.id,'increment');
  assert.equal((await db.all('dailyLogs')).find(l=>l.date==='2026-09-01').count,2);
  assert.equal((await db.all('dailyLogs')).find(l=>l.date==='2025-02-01').count,1);
  connection.onversionchange();assert.equal(totalTalkCount(await db.all('dailyLogs')),3);
});
