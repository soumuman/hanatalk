import 'fake-indexeddb/auto';
import test from 'node:test';import assert from 'node:assert/strict';
import * as db from '../js/db.js';import {stableUUID} from '../js/cloud/model.js';
import {inspectDatabase,collectDiagnostics} from '../js/cloud/diagnostics.js';
const A='33333333-3333-4333-8333-333333333333';
test('read-only diagnostics reproduce hidden legacy records and verify complete import without source changes',async()=>{
 const absent=await inspectDatabase('talk-flower');assert.equal(absent.state,'absent');assert.equal((await indexedDB.databases()).length,0);
 await db.quickAddPerson('非公開のテスト名','family','group');const p=(await db.all('people'))[0];
 await db.changeTalk('2026-01-01',p.id);await db.changeTalk('2026-01-01',p.id,'increment');await db.changeTalk('2026-01-02',p.id);
 await db.updatePerson(p.id,{isActive:false});
 const source={people:await db.all('people'),dailyLogs:await db.all('dailyLogs'),settings:await db.all('settings')};
 await db.useAccount(A);await db.openDB();
 const report=await collectDiagnostics({account:A,version:'c015',loggedIn:true,origin:'https://example.test'});
 assert.equal(report.legacy.logRows,2);assert.equal(report.legacy.talkDays,2);assert.equal(report.current.logRows,0);assert.match(report.message,/残っています/);
 assert.ok(!JSON.stringify(report).includes(p.displayName));assert.ok(!JSON.stringify(report).includes(A));assert.equal(db.currentAccount(),A);
 // Reproduce the existing c014 import transformation, including legacy personId aliases.
 const snapshot=structuredClone(source),ids=new Map();for(const p of snapshot.people)ids.set(p.id,await stableUUID(`${A}:person:${p.id}`));
 snapshot.people=snapshot.people.map(p=>({...p,id:ids.get(p.id)}));snapshot.dailyLogs=snapshot.dailyLogs.map(l=>({...l,targetId:ids.get(l.targetId||l.personId),personId:ids.get(l.targetId||l.personId)}));
 await db.importGuest(snapshot);await db.applyRemote([]);
 assert.equal((await db.all('dailyLogs')).length,2);assert.equal((await db.all('dailyLogs')).reduce((sum,l)=>sum+l.count,0),3);
 assert.equal((await db.all('people'))[0].isActive,false);
 assert.equal((await collectDiagnostics({account:A})).current.logRows,2);
 await db.useAccount(null);
 assert.deepEqual(await db.all('people'),source.people);assert.deepEqual(await db.all('dailyLogs'),source.dailyLogs);assert.deepEqual(await db.all('settings'),source.settings);
});
test('inspection never upgrades an old database',async()=>{
 const c=await new Promise((resolve,reject)=>{const r=indexedDB.open('diagnostic-old',1);r.onupgradeneeded=()=>{r.result.createObjectStore('people',{keyPath:'id'});r.result.createObjectStore('dailyLogs',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});c.close();
 assert.equal((await inspectDatabase('diagnostic-old')).version,1);
 const info=(await indexedDB.databases()).find(d=>d.name==='diagnostic-old');assert.equal(info.version,1);
});
