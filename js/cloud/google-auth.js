import {emailLinkRequest} from './auth-link.js';
export async function beginGoogleLogin({client,projectURL,key,origin,request=fetch,navigate}){
 const response=await request(projectURL+'/auth/v1/settings',{headers:{apikey:key}});
 if(!response.ok)throw Error('connection');
 const settings=await response.json();
 if(settings.external?.google!==true)throw Error('google_not_configured');
 const {data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:emailLinkRequest('',origin).options.emailRedirectTo,skipBrowserRedirect:true,queryParams:{prompt:'select_account'}}});
 if(error)throw error;
 const url=new URL(data.url);
 if(url.origin!==new URL(projectURL).origin||url.pathname!=='/auth/v1/authorize'||url.searchParams.get('provider')!=='google')throw Error('invalid_redirect');
 navigate(url.href);
}
