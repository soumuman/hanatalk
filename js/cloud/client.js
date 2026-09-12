import {createClient} from '../vendor/supabase.js';
import {config} from './config.js';
async function timedFetch(input,options={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{return await fetch(input,{...options,signal:controller.signal});}finally{clearTimeout(timer);}}
export const client=config.url&&config.key?createClient(config.url,config.key,{global:{fetch:timedFetch},auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'talk-flower-auth'}}):null;
export async function sendCode(email){const {error}=await client.auth.signInWithOtp({email});if(error)throw error;}
export async function verifyCode(email,token){const {data,error}=await client.auth.verifyOtp({email,token,type:'email'});if(error)throw error;return data.session;}
