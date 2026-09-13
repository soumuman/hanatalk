import 'fake-indexeddb/auto';
import test from 'node:test';import assert from 'node:assert/strict';
import * as db from '../js/db.js';
import {fetchRestoreSnapshot,applyRestoreSnapshot,restoreRequested,requestRestore,clearRestore} from '../js/cloud/restore.js';
const user='11111111-1111-4111-8111-111111111111',person='22222222-2222-4222-8222-222222222222';
const common={user_id:user,created_at:'2026-09-01T00:00:00Z',updated_at:'2026-09-12T00:00:00Z',mutation_id:person,deleted_at:null};
const rows={people:[{...common,id:person,display_name:'テスト相手',type:'group',sort_order:0,is_active:true}],daily_logs:[{...common,id:person,target_id:person,date:'2026-09-12',count:3,record_type:'group'}],settings:[]};
function client(data=rows,fail){return {auth:{getUser:async()=>({data:{user:{id:user}},error:null})},from(table){return {select(){return this;},eq(_key,id){assert.equal(id,user);return this;},order(){return this;},range:async()=>table===fail?{error:Error('network')}:{data:data[table],error:null}};}};}
test('returning user download is idempotent and leaves guest records untouched',async()=>{
 await db.useAccount(null);await db.quickAddPerson('端末の相手','other','person');const guest=await db.all('people');
 const snapshot=await fetchRestoreSnapshot(client(),user);await db.useAccount(user);
 assert.equal(await applyRestoreSnapshot(db,snapshot),true);assert.equal(await applyRestoreSnapshot(db,snapshot),true);
 assert.equal((await db.all('people')).length,1);assert.equal((await db.all('dailyLogs')).length,1);assert.equal((await db.all('dailyLogs'))[0].count,3);assert.equal(await db.setting('initialized'),true);
 await db.useAccount(null);assert.deepEqual(await db.all('people'),guest);
});
test('partial download and wrong ownership fail before local application',async()=>{
 await assert.rejects(fetchRestoreSnapshot(client(rows,'daily_logs'),user));
 await assert.rejects(fetchRestoreSnapshot(client(),person),/session/);
 await assert.rejects(fetchRestoreSnapshot(client({...rows,people:[{...rows.people[0],user_id:person}]}),user),/owner/);
});
test('pending account data is preserved; empty cloud remains a new-user flow',async()=>{
 await db.useAccount(user);await db.updatePerson(person,{displayName:'端末で編集中'});
 const before=await db.all('people');await assert.rejects(applyRestoreSnapshot(db,await fetchRestoreSnapshot(client(),user)),/pending_local/);assert.deepEqual(await db.all('people'),before);
 await db.useAccount(person);assert.equal(await applyRestoreSnapshot(db,{user:person,metas:[]}),false);assert.equal(await db.setting('initialized'),false);
});
test('restore intent is explicit, expires and can be cancelled without credentials',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 assert.equal(restoreRequested(storage),false);requestRestore(storage);assert.equal(restoreRequested(storage),true);assert.ok([...map.values()].every(v=>/^\d+$/.test(v)));clearRestore(storage);assert.equal(restoreRequested(storage),false);
 storage.setItem('talk-flower-restore-intent',String(Date.now()-31*60*1000));assert.equal(restoreRequested(storage),false);
});
