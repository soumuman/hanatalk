import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('PostgreSQL RLS: A/B CRUD isolation, anonymous denial, foreign owner rejection and atomic LWW',async()=>{
 const pg=new PGlite();
 const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',PA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',PB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 try{
 await pg.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${A}'),('${B}');create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
 await pg.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
 await pg.exec(await readFile(new URL('../supabase/indexes.sql',import.meta.url),'utf8'));
 const login=async user=>{await pg.exec(`reset role;select set_config('request.jwt.claim.sub','${user}',false);set role authenticated;`);};
 const person=(id,user,name='test',time='2026-01-01T00:00:00Z')=>({id,user_id:user,display_name:name,type:'person',sort_order:0,is_active:true,created_at:time,updated_at:time,mutation_id:id,deleted_at:null});
 const rpc=async(t,r)=>pg.query(`select * from public.sync_${t}($1::jsonb)`,[JSON.stringify(r)]);
 const log=(user,target,id)=>({id,user_id:user,date:'2026-01-01',target_id:target,count:1,record_type:'person',created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z',mutation_id:id,deleted_at:null});
 await login(B);await rpc('people',person(PB,B));await rpc('daily_logs',log(B,PB,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc'));await pg.query('insert into profiles(user_id) values($1)',[B]);
 await rpc('settings',{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbd',user_id:B,key:'theme',value:'green',created_at:'2026-01-01',updated_at:'2026-01-01',mutation_id:PB,deleted_at:null});
 await login(A);await rpc('people',person(PA,A));
 assert.equal((await pg.query('select * from people')).rows.length,1);
 for(const t of ['profiles','people','daily_logs','settings']){
  assert.equal((await pg.query(`select * from ${t} where user_id=$1`,[B])).rows.length,0);
  assert.equal((await pg.query(`update ${t} set updated_at=now() where user_id=$1 returning *`,[B])).rows.length,0);
  await assert.rejects(pg.query(`delete from ${t} where user_id=$1`,[B]));
 }
 await assert.rejects(rpc('people',person('cccccccc-cccc-4ccc-8ccc-cccccccccccc',B)));
 await assert.rejects(pg.query('insert into people select * from jsonb_populate_record(null::people,$1::jsonb)',[JSON.stringify(person('cccccccc-cccc-4ccc-8ccc-cccccccccccc',B))]));
 await assert.rejects(pg.query('insert into daily_logs select * from jsonb_populate_record(null::daily_logs,$1::jsonb)',[JSON.stringify(log(B,PB,'cccccccc-cccc-4ccc-8ccc-cccccccccccc'))]));
 await assert.rejects(pg.query('insert into settings(id,user_id,key,value,updated_at,mutation_id) values($1,$2,\'theme\',\'null\',now(),$1)',[PA,B]));
 await assert.rejects(pg.query('insert into profiles(user_id) values($1)',[B]));
 await assert.rejects(rpc('daily_logs',log(A,PB,'cccccccc-cccc-4ccc-8ccc-cccccccccccd')));
 await assert.rejects(pg.query('update people set user_id=$1 where id=$2',[B,PA]));
 await rpc('people',person(PA,A,'new','2026-02-01T00:00:00Z'));await rpc('people',person(PA,A,'old'));
 assert.equal((await pg.query('select display_name from people where id=$1',[PA])).rows[0].display_name,'new');
 await rpc('daily_logs',log(A,PA,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab'));
 await pg.query('update people set is_active=false where id=$1',[PA]);assert.equal((await pg.query('select * from daily_logs')).rows.length,1);
 await pg.exec("reset role;select set_config('request.jwt.claim.sub','',false);set role anon;");
 for(const t of ['profiles','people','daily_logs','settings'])await assert.rejects(pg.query(`select * from ${t}`));
 await assert.rejects(rpc('people',person(PA,A)));
 }finally{await pg.close();}
});
