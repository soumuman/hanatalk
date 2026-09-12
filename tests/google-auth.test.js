import test from 'node:test';import assert from 'node:assert/strict';
import {beginGoogleLogin} from '../js/cloud/google-auth.js';
test('Google disabled stops before redirect; enabled uses only Google and same app return URL',async()=>{
 let called=false,href='';const args={projectURL:'https://project.supabase.co',key:'public',origin:'https://app.example.test',navigate:u=>href=u,client:{auth:{signInWithOAuth:async options=>{called=true;assert.equal(options.provider,'google');assert.equal(options.options.redirectTo,'https://app.example.test/');assert.equal(options.options.skipBrowserRedirect,true);assert.equal(options.options.queryParams.prompt,'select_account');return {data:{url:'https://project.supabase.co/auth/v1/authorize?provider=google'},error:null};}}}};
 await assert.rejects(beginGoogleLogin({...args,request:async()=>new Response(JSON.stringify({external:{google:false}}))}),/google_not_configured/);assert.equal(called,false);assert.equal(href,'');
 await beginGoogleLogin({...args,request:async()=>new Response(JSON.stringify({external:{google:true}}))});assert.ok(href.startsWith(args.projectURL));
 args.client.auth.signInWithOAuth=async()=>({data:{url:'https://untrusted.test/'},error:null});href='';await assert.rejects(beginGoogleLogin({...args,request:async()=>new Response(JSON.stringify({external:{google:true}}))}),/invalid_redirect/);assert.equal(href,'');
});
