import {flowerCatalog} from './flowers/botanical.js';
// Stable baseline: adding/reordering catalog entries must never change historical defaults.
export const basicFlowers=['ume','suisen','sakura','tulip','nemophila','hydrangea','morning-glory','sunflower','cosmos','osmanthus','chrysanthemum','poinsettia'];
export const flowerSets=[{id:'basic',name:'基本',flowers:basicFlowers}];
export const wallpapers=[{id:'ivory',name:'生成り',color:'#f7f5ef'},{id:'leaf',name:'若葉',color:'#eef4ec'},{id:'sakura',name:'桜霞',color:'#faf0f2'},...['river','mountains','temple'].map((id,i)=>({id,name:['川辺','山並み','お寺の境内'][i],color:'#f7f5ef',image:`icons/wallpapers/${id}.svg`}))];
export const monthKey=date=>date.slice(0,7);
export const flowerSetting=month=>`flowerMonth:${month}`;
export const isFlowerSetting=key=>/^flowerMonth:\d{4}-(0[1-9]|1[0-2])$/.test(key);
export function selectedFlower(date,settings,access={}){
 const month=monthKey(date),base=flowerCatalog.find(f=>f.id===basicFlowers[Number(date.slice(5,7))-1])||flowerCatalog[0];
 const value=settings.find(s=>s.key===flowerSetting(month))?.value;
 if((access.freePeriods||[]).some(period=>month>=period.from&&month<=period.to))return base;
 // Revocation freezes all months through the end of the last paid month.
 if(!access.premium&&month>(access.preservedThrough||''))return base;
 return flowerCatalog.find(f=>f.id===value)||base;
}
export function setMonths(year,today,setId='basic'){
 const set=flowerSets.find(s=>s.id===setId);if(!set)throw Error('Unknown set');
 return Object.fromEntries(set.flowers.map((id,i)=>[`${year}-${String(i+1).padStart(2,'0')}`,id]).filter(([month])=>month>=monthKey(today)));
}
export function flowerConfirmation(month,today){
 return month===monthKey(today)?(today.slice(8)!=='01'?'月の途中です。今月1日までさかのぼって、花の種類が変わります。変更しますか？':'今月の花の種類を変更しますか？'):`${month.replace('-','年')}月の花を変更しますか？`;
}
export function setConfirmation(year,today){return `${year}年の今月以降の花を、このセットに変更します。先月以前の花は変更されません。${String(year)===today.slice(0,4)&&today.slice(8)!=='01'?' 今月の花は、1日までさかのぼって変更されます。':''}`;}
