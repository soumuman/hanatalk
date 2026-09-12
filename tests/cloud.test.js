import 'fake-indexeddb/auto';
import test from 'node:test';import assert from 'node:assert/strict';
import * as db from '../js/db.js';
import {fromRemote,toRemote,resolveConflict} from '../js/cloud/model.js';
import {createSyncEngine} from '../js/cloud/sync.js';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
test('cloud account isolation, atomic pending writes, tombstones and racing acknowledgements',async()=>{
 await db.quickAddPerson('端末の相手');const guest=await db.all('people');
 await db.useAccount(A);assert.equal((await db.all('people')).length,0);
 await db.quickAddPerson('同期の相手');const p=(await db.all('people'))[0];
 await db.changeTalk('2026-01-01',p.id);
 let metas=await db.all('syncState');assert.equal(metas.filter(r=>r.sync_status==='pending').length,2);
 const first=metas.find(r=>r.store==='dailyLogs');
 await db.changeTalk('2026-01-01',p.id);
 let removed=(await db.all('syncState')).find(r=>r.store==='dailyLogs');
 assert.equal(removed.deleted,true);assert.ok(removed.updated_at>first.updated_at);
 await db.markSent(removed.id,first.mutation_id);assert.equal((await db.all('syncState')).find(r=>r.id===removed.id).sync_status,'pending');
 await db.applyRemote([{...first,sync_status:'synced'}]);assert.equal((await db.all('dailyLogs')).length,0);
 await db.updatePerson(p.id,{isActive:false});assert.equal((await db.all('people'))[0].isActive,false);
 const remote=await toRemote(removed,A);assert.equal(remote.user_id,A);assert.ok(remote.deleted_at);assert.match(remote.id,/^[a-f0-9-]{36}$/);
 assert.equal(fromRemote('dailyLogs',remote).deleted,true);
 await db.put('settings',{key:'appVersion',value:'x'});assert.equal((await db.all('syncState')).some(r=>r.record.key==='appVersion'),false);
 await db.useAccount(B);assert.equal((await db.all('people')).length,0);
 await db.useAccount(null);assert.deepEqual(await db.all('people'),guest);
 await db.useAccount(A);assert.equal((await db.all('people'))[0].id,p.id);
});
test('failed network retains pending data and later retry drains it',async()=>{
 await db.useAccount(A);let fail=true;
 const client={auth:{getUser:async()=>({data:{user:{id:A}}})},rpc:async()=>({error:fail?new Error('offline'):null}),from:()=>({select(){return this;},eq(){return this;},order(){return this;},range:async()=>({data:[],error:null})})};
 const engine=createSyncEngine({db,client,user:A});await engine.run();
 assert.ok((await db.all('syncState')).some(r=>r.sync_status==='pending'));
 fail=false;await engine.run();assert.ok((await db.all('syncState')).every(r=>r.sync_status==='synced'));await engine.stop();
});
test('conflict resolution is deterministic including timestamp ties',()=>{
 const a={updated_at:'2026-01-01T00:00:00Z',mutation_id:'a'},b={...a,mutation_id:'b'};
 assert.equal(resolveConflict(a,b),b);assert.equal(resolveConflict(b,a),b);
});

test('failed local transaction never leaves a partial record or pending entry',async()=>{
 await db.useAccount(B);const old=await db.all('syncState');
 await assert.rejects(db.transact(['settings'],'readwrite',tx=>{tx.objectStore('settings').put({key:'theme',value:'pink'});throw Error('interrupted');}));
 assert.equal(await db.setting('theme'),undefined);assert.deepEqual(await db.all('syncState'),old);
 let changes=0;const listener=()=>changes++;db.changes.addEventListener('change',listener);
 await db.ensureAppStartedAt('2026-01-01');const after=changes;await db.ensureAppStartedAt('2026-01-01');assert.equal(changes,after);db.changes.removeEventListener('change',listener);
});
