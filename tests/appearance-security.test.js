import {flowerCatalog} from '../js/flowers/catalog.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('appearance SQL: owner isolation, admin-only premium, immutable past, atomic set and revocation',async()=>{
 const pg=new PGlite(),A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
 try{
  await pg.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${A}'),('${B}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
  await pg.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
  const migration=await readFile(new URL('../supabase/c028-appearance.sql',import.meta.url),'utf8');await pg.exec(migration);await pg.exec(migration);
  const extra=await readFile(new URL('../supabase/c030-flower-sets.sql',import.meta.url),'utf8');await pg.exec(extra);await pg.exec(extra);
  const dates=(await pg.query("select to_char(now() at time zone 'Asia/Tokyo','YYYY-MM') current, to_char((now() at time zone 'Asia/Tokyo')-interval '1 month','YYYY-MM') past")).rows[0];
  const login=async user=>pg.exec(`reset role;select set_config('request.jwt.claim.sub','${user}',false);set role authenticated;`);
  const save=months=>pg.query('select * from public.set_flower_months($1::jsonb)',[JSON.stringify(months)]);
  await pg.query('insert into entitlements(user_id,premium) values($1,false),($2,true)',[A,B]);
  await login(A);
  assert.equal((await pg.query('select * from entitlements')).rows.length,1);
  await assert.rejects(pg.query('update entitlements set premium=true'));
  await assert.rejects(pg.query('insert into entitlements(user_id,premium) values($1,true)',[A]));
  await assert.rejects(save({[dates.current]:'sakura'}));
  await pg.exec('reset role');await pg.query('update entitlements set premium=true where user_id=$1',[A]);await login(A);
  for(const flower of flowerCatalog)assert.equal((await save({[dates.current]:flower.id})).rows[0].value,flower.id);
  assert.equal((await save({[dates.current]:'sakura'})).rows[0].value,'sakura');
  await assert.rejects(save({[dates.current]:'tulip',[dates.past]:'ume'}));
  assert.equal((await pg.query('select value from settings')).rows[0].value,'sakura');
  await assert.rejects(save({[dates.current]:null}));
  await assert.rejects(pg.query("update settings set user_id=$1",[B]));
  await login(B);assert.equal((await pg.query('select * from settings')).rows.length,0);
  await pg.exec('reset role');await pg.query('update entitlements set premium=false where user_id=$1',[A]);
  assert.equal((await pg.query('select preserved_through from entitlements where user_id=$1',[A])).rows[0].preserved_through,dates.current);
  await login(A);assert.equal((await pg.query('select value from settings')).rows[0].value,'sakura');
  await assert.rejects(save({[dates.current]:'tulip'}));
  await assert.rejects(pg.query("update settings set value='\"tulip\"'::jsonb"));
  await pg.exec("reset role;select set_config('request.jwt.claim.sub','',false);set role anon;");
  await assert.rejects(pg.query('select * from entitlements'));await assert.rejects(save({[dates.current]:'sakura'}));
 }finally{await pg.close();}
});
