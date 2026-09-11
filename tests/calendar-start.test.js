import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as db from '../js/db.js';
import {calendarDayState} from '../js/calendar.js';
import {getSeasonalNote,seasonalNotes} from '../js/seasons.js';
import {sproutSVG} from '../js/flower.js';
test('start date is created before onboarding and remains unchanged across visits',async()=>{
  assert.equal(await db.setting('initialized'),undefined);
  assert.deepEqual(await Promise.all([db.ensureAppStartedAt('2026-09-11'),db.ensureAppStartedAt('2026-09-12')]),['2026-09-11','2026-09-11']);
  assert.equal(await db.ensureAppStartedAt('2027-01-01'),'2026-09-11');
  await db.initialize([]);
  assert.equal(await db.setting('appStartedAt'),'2026-09-11');
});
test('legacy migration retains old logs and chooses earliest available date',async()=>{
  await db.transact(['settings'],'readwrite',tx=>tx.objectStore('settings').delete('appStartedAt'));
  await db.put('people',{id:'p',createdAt:'2026-08-20T12:00:00+09:00'});
  await db.put('dailyLogs',{id:'old',personId:'p',date:'2026-08-05',createdAt:'2026-09-11T12:00:00+09:00'});
  assert.equal(await db.ensureAppStartedAt('2026-09-11'),'2026-08-05');
  assert.equal((await db.all('dailyLogs')).length,1);
  assert.equal(await db.ensureAppStartedAt('2026-09-12'),'2026-08-05');
});
test('calendar displays empty before start, sprouts for zero/future, and flowers for actual counts',()=>{
  const start='2026-09-11',today='2026-09-20';
  assert.equal(calendarDayState('2026-09-10',0,start,today),'empty');
  assert.equal(calendarDayState('2026-09-10',2,start,today),'flower');
  assert.equal(calendarDayState(start,0,start,today),'sprout');
  assert.equal(calendarDayState(today,0,start,today),'sprout');
  assert.equal(calendarDayState('2026-09-21',4,start,today),'flower');
  for(const date of ['2026-09-10',start,today,'2026-09-21'])for(const count of [1,2,3,4,5,6,15])assert.equal(calendarDayState(date,count,start,today),'flower');
  assert.equal(calendarDayState('2026-09-21',0,start,today),'sprout');
  assert.match(sproutSVG(),/<svg/);assert.doesNotMatch(sproutSVG(),/🌱/);
  assert.equal(seasonalNotes.length,12);
  assert.equal(getSeasonalNote('2026-09-11'),'風に、少し秋の気配。');
});
