import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as db from '../js/db.js';
test('new installations get starter cards exactly once with editable defaults',async()=>{
  await Promise.all([db.ensureStarterCards(),db.ensureStarterCards()]);
  const people=await db.all('people');assert.equal(people.length,11);
  assert.equal(people.find(p=>p.displayName==='妻').type,'person');
  const group=people.find(p=>p.displayName==='同僚');assert.equal(group.type,'group');
  await db.updatePerson(group.id,{type:'person',isActive:false});
  await db.ensureStarterCards();assert.equal((await db.all('people')).find(p=>p.id===group.id).type,'person');
  assert.equal((await db.all('people')).length,11);
});
