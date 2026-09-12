export const syncedSettings=new Set(['appStartedAt','soundEnabled','theme']);
export const tableFor={people:'people',dailyLogs:'daily_logs',settings:'settings'};
export function resolveConflict(local,remote){
 if(!local)return remote;if(!remote)return local;
 const a=Date.parse(local.updated_at),b=Date.parse(remote.updated_at);
 return b>a||b===a&&String(remote.mutation_id)>String(local.mutation_id)?remote:local;
}
export function project(store,r){
 if(store==='people')return {id:r.id,displayName:r.displayName,type:r.type,sortOrder:r.sortOrder,isActive:r.isActive,createdAt:r.createdAt};
 if(store==='dailyLogs')return {id:r.id,date:r.date,targetId:r.targetId||r.personId,count:r.count||1,recordType:r.recordType||'person',createdAt:r.createdAt};
 return {key:r.key,value:r.value};
}
export async function stableUUID(text){const a=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));a[6]=(a[6]&15)|80;a[8]=(a[8]&63)|128;const h=[...a.slice(0,16)].map(x=>x.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
export async function toRemote(meta,user){
 const r=meta.record;const base={user_id:user,updated_at:meta.updated_at,mutation_id:meta.mutation_id,created_at:r.createdAt||meta.updated_at,deleted_at:meta.deleted?meta.updated_at:null};
 if(meta.store==='people')return {...base,id:r.id,display_name:r.displayName,type:r.type,sort_order:r.sortOrder,is_active:r.isActive};
 if(meta.store==='dailyLogs')return {...base,id:await stableUUID(`${user}:log:${r.date}:${r.targetId}`),date:r.date,target_id:r.targetId,count:r.count,record_type:r.recordType};
 return {...base,id:await stableUUID(`${user}:setting:${r.key}`),key:r.key,value:r.value};
}
export function fromRemote(store,r){
 let record;if(store==='people')record={id:r.id,displayName:r.display_name,type:r.type,category:'other',sortOrder:r.sort_order,isActive:r.is_active&&!r.deleted_at,createdAt:r.created_at};
 else if(store==='dailyLogs')record={id:`${r.date}:${r.target_id}`,date:r.date,targetId:r.target_id,personId:r.target_id,count:r.count,recordType:r.record_type,createdAt:r.created_at};
 else record={key:r.key,value:r.value};
 return {id:`${store}:${record.id||record.key}`,store,record,updated_at:r.updated_at,mutation_id:r.mutation_id,deleted:!!r.deleted_at,sync_status:'synced'};
}
