import {tableFor,toRemote,fromRemote} from './model.js';
export function createSyncEngine({db,client,user,onStatus=()=>{},onPull=()=>{}}){
 let stopped=false,running=null,timer,retry=2000;
 const valid=()=>!stopped&&db.currentAccount()===user;
 async function work(){
  if(!valid())return;
  onStatus('同期しています');
  try{
   const {data,error}=await client.auth.getUser();if(error||data.user?.id!==user)throw Error('session');
   for(const store of ['people','dailyLogs','settings']){
    const pending=(await db.all('syncState')).filter(r=>r.store===store&&r.sync_status==='pending');
    for(const item of pending){
     if(!valid())return;
     const payload=await toRemote(item,user);
     const {error}=await client.rpc(`sync_${tableFor[store]}`,{payload});if(error)throw error;
     if(!valid())return;
     await db.markSent(item.id,item.mutation_id);
    }
   }
   // Full paginated reconciliation includes tombstones, without a fragile timestamp cursor.
   for(const [store,table] of Object.entries(tableFor)){
    let offset=0;
    for(;;){
     if(!valid())return;
     const {data,error}=await client.from(table).select('*').eq('user_id',user).order('id').range(offset,offset+499);
     if(error)throw error;if(!valid())return;
     if(data.some(r=>r.user_id!==user))throw Error('owner');
     await db.applyRemote(data.map(r=>fromRemote(store,r)));
     if(data.length<500)break;offset+=500;
    }
   }
   retry=2000;onStatus('同期しました');await onPull();return true;
  }catch{if(valid()){onStatus('クラウド同期できませんでした。端末には保存されています。');schedule(retry);retry=Math.min(60000,retry*2);}}
 }
 function run(){if(running)return running;running=(async()=>{if(globalThis.navigator?.locks)return navigator.locks.request(`talk-flower-sync-${user}`,work);return work();})().finally(()=>{running=null;});return running;}
 function schedule(delay=800){clearTimeout(timer);if(valid())timer=setTimeout(()=>run(),delay);}
 return {run,schedule,async stop(){stopped=true;clearTimeout(timer);await running;}};
}
