// The SDK owns token validation and session storage. Keep only a boolean here.
export function isAuthCallback(href){
 const url=new URL(href),hash=new URLSearchParams(url.hash.slice(1));
 return ['access_token','refresh_token','error','error_description','error_code','code'].some(k=>hash.has(k)||url.searchParams.has(k));
}
export function cleanCallbackURL(location,history){
 const url=new URL(location.href);
 for(const key of ['access_token','refresh_token','token_type','expires_in','expires_at','provider_token','provider_refresh_token','error','error_code','error_description','code','type'])url.searchParams.delete(key);
 url.hash='settings';history.replaceState(history.state,'',url.pathname+url.search+url.hash);
}
export function linkAuthOptions(location,history){return {
 persistSession:true,autoRefreshToken:true,flowType:'implicit',storageKey:'talk-flower-auth',
 detectSessionInUrl:(_url,params)=>{
  const callback=!!(params.access_token||params.refresh_token||params.error||params.error_description||params.error_code);
  // SDK has already parsed the callback parameters before invoking this function.
  // Replace the history entry immediately, including for invalid/expired links.
  if(callback)cleanCallbackURL(location,history);
  return callback;
 }
};}
export function emailLinkRequest(email,origin){
 const url=new URL(origin);
 if(url.protocol!=='https:'&&!(['localhost','127.0.0.1'].includes(url.hostname)&&url.protocol==='http:'))throw Error('HTTPS is required');
 return {email,options:{emailRedirectTo:url.origin+'/'}};
}
// A copied, unused confirmation link can authenticate the current Home Screen app.
// Never follow a supplied URL or persist it; verification is handled by the SDK.
export function confirmationRequest(value,projectURL){
 if(typeof value!=='string'||value.length>4096)throw Error('Invalid link');
 const url=new URL(value.trim()),project=new URL(projectURL);
 if(url.origin!==project.origin||url.protocol!=='https:'||url.pathname!=='/auth/v1/verify'||url.username||url.password||url.hash)throw Error('Invalid link');
 const type=url.searchParams.get('type');
 const token=url.searchParams.get('token_hash')||url.searchParams.get('token');
 if(!['signup','magiclink','email'].includes(type)||!token||! /^[a-zA-Z0-9_-]{16,512}$/.test(token))throw Error('Invalid link');
 return {token_hash:token,type:'email'};
}
