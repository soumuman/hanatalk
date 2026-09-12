import {isAuthCallback,linkAuthOptions,emailLinkRequest,confirmationRequest} from './auth-link.js';
import {createClient} from '../vendor/supabase.js';
import {config} from './config.js';
async function timedFetch(input,options={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{return await fetch(input,{...options,signal:controller.signal});}finally{clearTimeout(timer);}}
export const authLinkAttempt=typeof location!=='undefined'&&isAuthCallback(location.href);
export const client=config.url&&config.key?createClient(config.url,config.key,{global:{fetch:timedFetch},auth:linkAuthOptions(location,history)}):null;
export async function sendLink(email){const {error}=await client.auth.signInWithOtp(emailLinkRequest(email,location.origin));if(error)throw error;}
export async function verifyLink(value){const {data,error}=await client.auth.verifyOtp(confirmationRequest(value,config.url));if(error||!data.session)throw error||Error('Missing session');return data.session;}
