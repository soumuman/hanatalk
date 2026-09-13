import test from 'node:test';import assert from 'node:assert/strict';
import {linkAuthOptions,isAuthCallback,emailLinkRequest} from '../js/cloud/auth-link.js';
function browser(url){let value=new URL(url);return {location:{get href(){return value.href;},get hash(){return value.hash;},set hash(v){value.hash=v;},get origin(){return value.origin;}},history:{state:null,replaceState(_state,_title,next){value=new URL(next,value);}}};}
test('email redirects stay on app origin and ordinary app hashes are untouched',()=>{
 const request=emailLinkRequest('test@example.test','https://app.example.test/#settings');assert.equal(request.options.emailRedirectTo,'https://app.example.test/');
 assert.throws(()=>emailLinkRequest('test@example.test','javascript:alert(1)'));
 const b=browser('https://app.example.test/#day/2026-09-11'),options=linkAuthOptions(b.location,b.history);
 assert.equal(options.detectSessionInUrl(new URL(b.location.href),{}),false);assert.equal(b.location.hash,'#day/2026-09-11');assert.equal(isAuthCallback(b.location.href),false);
});
test('official Auth SDK validates a link, persists the session and removes URL credentials',async()=>{
 const b=browser('https://app.example.test/#access_token=test-access&refresh_token=test-refresh&expires_in=3600&token_type=bearer&type=signup');
 globalThis.window={location:b.location,history:b.history,addEventListener(){},removeEventListener(){}};
 globalThis.document={visibilityState:'visible',addEventListener(){},removeEventListener(){}};
 const {GoTrueClient}=await import('@supabase/auth-js');
 const map=new Map(),storage={getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};
 let validated=false;
 const auth=new GoTrueClient({...linkAuthOptions(b.location,b.history),url:'https://auth.example.test/auth/v1',autoRefreshToken:false,storage,fetch:async(input,options)=>{
  assert.ok(String(input).endsWith('/user'));assert.equal(new Headers(options.headers).get('Authorization'),'Bearer test-access');validated=true;
  return new Response(JSON.stringify({id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'test@example.test'}),{status:200,headers:{'Content-Type':'application/json'}});
 }});
 const result=await auth.initialize();assert.equal(result.error,null);assert.equal(validated,true);
 assert.equal((await auth.getSession()).data.session.user.id,'11111111-1111-4111-8111-111111111111');
 assert.ok(!b.location.href.includes('test-access'));assert.ok(!b.location.href.includes('test-refresh'));assert.ok(map.has('talk-flower-auth'));
 await auth.dispose();delete globalThis.window;delete globalThis.document;
});
test('expired callback is cleaned and cannot establish a new session',async()=>{
 const b=browser('https://app.example.test/#error=access_denied&error_code=otp_expired&error_description=Expired');
 globalThis.window={location:b.location,history:b.history,addEventListener(){},removeEventListener(){}};
 globalThis.document={visibilityState:'visible',addEventListener(){},removeEventListener(){}};
 const {GoTrueClient}=await import('@supabase/auth-js');
 const auth=new GoTrueClient({...linkAuthOptions(b.location,b.history),url:'https://auth.example.test/auth/v1',autoRefreshToken:false,persistSession:false,storageKey:'expired-test',fetch:async()=>{throw Error('Unexpected request');}});
 assert.ok((await auth.initialize()).error);assert.equal((await auth.getSession()).data.session,null);assert.equal(b.location.hash,'#settings');
 await auth.dispose();delete globalThis.window;delete globalThis.document;
});

import {confirmationRequest} from '../js/cloud/auth-link.js';
test('copied links accept only this project email verification, never an arbitrary destination',()=>{
 const root='https://example.supabase.co',token='abc123'.repeat(10);
 assert.deepEqual(confirmationRequest(`${root}/auth/v1/verify?token=${token}&type=signup`,root),{token_hash:token,type:'email'});
 for(const link of [`https://attacker.test/auth/v1/verify?token=${token}&type=email`,`${root}/auth/v1/verify?token=${token}&type=recovery`,`${root}/other?token=${token}&type=email`,`${root}/auth/v1/verify?token=short&type=email`])assert.throws(()=>confirmationRequest(link,root));
});
test('copied confirmation is verified by SDK in the current storage without navigation',async()=>{
 const {GoTrueClient}=await import('@supabase/auth-js');const map=new Map();
 const auth=new GoTrueClient({url:'https://example.supabase.co/auth/v1',storageKey:'paste-test',autoRefreshToken:false,detectSessionInUrl:false,storage:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)},fetch:async(url,options)=>{
  assert.ok(String(url).endsWith('/verify'));const body=JSON.parse(options.body);assert.equal(body.type,'email');assert.equal(body.token_hash,'a'.repeat(64));
  return new Response(JSON.stringify({access_token:'access',refresh_token:'refresh',expires_in:3600,token_type:'bearer',user:{id:'11111111-1111-4111-8111-111111111111'}}),{status:200,headers:{'Content-Type':'application/json'}});
 }});
 try{const {data,error}=await auth.verifyOtp(confirmationRequest('https://example.supabase.co/auth/v1/verify?token='+ 'a'.repeat(64)+'&type=magiclink','https://example.supabase.co'));assert.equal(error,null);assert.ok(data.session);assert.ok(map.has('paste-test'));}finally{await auth.dispose();}
});

test('authentication redirects retain Pages subpaths and discard callback fragments/query',()=>{
 assert.equal(emailLinkRequest('test@example.test','https://soumuman.github.io/hanatalk/').options.emailRedirectTo,'https://soumuman.github.io/hanatalk/');
 assert.equal(emailLinkRequest('test@example.test','https://soumuman.github.io/hanatalk/index.html#settings').options.emailRedirectTo,'https://soumuman.github.io/hanatalk/');
 assert.equal(emailLinkRequest('test@example.test','https://soumuman.github.io/hanatalk/?code=secret#settings').options.emailRedirectTo,'https://soumuman.github.io/hanatalk/');
});
