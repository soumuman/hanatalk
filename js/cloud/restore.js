import {tableFor,fromRemote} from './model.js';
const intentKey='talk-flower-restore-intent';
export function restoreRequested(storage=localStorage){
 try{const at=Number(storage.getItem(intentKey));return at>0&&Date.now()-at>=0&&Date.now()-at<30*60*1000;}catch{return false;}
}
export function requestRestore(storage=localStorage){storage.setItem(intentKey,String(Date.now()));}
export function clearRestore(storage=localStorage){storage.removeItem(intentKey);}

// Auth identifies the principal. Future server-side entitlement checks belong
// between this verification and the storage adapter; no client plan flags.
export async function fetchRestoreSnapshot(client,expectedUser){
 const {data,error}=await client.auth.getUser();
 if(error||!data.user||data.user.id!==expectedUser)throw Error('session');
 const user=data.user.id,metas=[];
 for(const [store,table] of Object.entries(tableFor)){
  for(let offset=0;;offset+=500){
   const {data:rows,error}=await client.from(table).select('*').eq('user_id',user).order('id').range(offset,offset+499);
   if(error)throw error;
   if(!Array.isArray(rows)||rows.some(r=>r.user_id!==user))throw Error('owner');
   metas.push(...rows.map(r=>fromRemote(store,r)));
   if(rows.length<500)break;
  }
 }
 return {user,metas};
}

export async function applyRestoreSnapshot(db,snapshot){
 if(db.currentAccount()!==snapshot.user)throw Error('owner');
 // Do not silently replace or upload edits left on a previously used account.
 await db.applyRemote(snapshot.metas,{protectPending:true});
 const hasRecords=(await db.all('people')).length>0||(await db.all('dailyLogs')).length>0;
 // Preserve archived cards too; an empty cloud goes through new-user setup.
 await db.put('settings',{key:'initialized',value:hasRecords});
 if(hasRecords)await db.put('settings',{key:'starterCardsSeeded',value:true});
 return hasRecords;
}
