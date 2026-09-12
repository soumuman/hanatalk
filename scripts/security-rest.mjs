// Run only against a dedicated test project. Tokens stay in environment variables.
import assert from 'node:assert/strict';
const {SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:key,TEST_A_ACCESS_TOKEN:a,TEST_B_ACCESS_TOKEN:b}=process.env;
if(!url||!key||!a||!b)throw Error('Set URL, public key and two test access tokens in .env.security');
async function call(path,token,method='GET',body){const response=await fetch(url+path,{method,headers:{apikey:key,...(token?{Authorization:`Bearer ${token}`}:{ }),'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})});return {ok:response.ok,status:response.status,data:await response.json().catch(()=>null)};}
const user=async token=>{const r=await call('/auth/v1/user',token);assert.equal(r.ok,true,'test session must be valid');return r.data.id;};
const A=await user(a),B=await user(b);assert.notEqual(A,B,'Use distinct accounts');
const pa=crypto.randomUUID(),pb=crypto.randomUUID(),time=new Date().toISOString();
const person=(id,user)=>({id,user_id:user,display_name:'Security test fixture',type:'person',sort_order:0,is_active:false,created_at:time,updated_at:time,mutation_id:crypto.randomUUID(),deleted_at:null});
for(const [token,id,uid] of [[a,pa,A],[b,pb,B]]){const r=await call('/rest/v1/rpc/sync_people',token,'POST',{payload:person(id,uid)});assert.equal(r.ok,true,'own insert allowed');}
const bLog={id:crypto.randomUUID(),user_id:B,date:'2026-01-01',target_id:pb,count:1,record_type:'person',created_at:time,updated_at:time,mutation_id:crypto.randomUUID(),deleted_at:null};
assert.equal((await call('/rest/v1/rpc/sync_daily_logs',b,'POST',{payload:bLog})).ok,true);
assert.equal((await call('/rest/v1/rpc/sync_settings',b,'POST',{payload:{id:crypto.randomUUID(),user_id:B,key:'theme',value:'green',created_at:time,updated_at:time,mutation_id:crypto.randomUUID(),deleted_at:null}})).ok,true);
assert.equal((await call(`/rest/v1/people?id=eq.${pa}`,a)).data.length,1);
assert.equal((await call(`/rest/v1/people?id=eq.${pb}`,a)).data.length,0);
for(const t of ['people','daily_logs','settings','profiles']){
 const foreign=await call(`/rest/v1/${t}?user_id=eq.${B}`,a);assert.equal(foreign.ok,true);assert.deepEqual(foreign.data,[]);
 const anon=await call(`/rest/v1/${t}`,null);assert.ok([401,403].includes(anon.status),'anon must be denied');
 const patch=await call(`/rest/v1/${t}?user_id=eq.${B}`,a,'PATCH',{updated_at:time});assert.ok(!patch.ok||patch.data.length===0);
 const del=await call(`/rest/v1/${t}?user_id=eq.${B}`,a,'DELETE');assert.ok(!del.ok||del.data.length===0);
}
assert.equal((await call('/rest/v1/people',a,'POST',person(crypto.randomUUID(),B))).ok,false);
const log={id:crypto.randomUUID(),user_id:A,date:'2026-01-01',target_id:pb,count:1,record_type:'person',created_at:time,updated_at:time,mutation_id:crypto.randomUUID()};
assert.equal((await call('/rest/v1/daily_logs',a,'POST',log)).ok,false);
assert.equal((await call(`/rest/v1/people?id=eq.${pa}`,a,'PATCH',{user_id:B})).ok,false);
console.log('PASS: own access, A/B isolation, forged ownership, foreign target and anonymous REST denial');
