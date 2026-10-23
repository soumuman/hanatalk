import {flowerSVG} from './flower.js';
import * as db from './db.js';
import {client} from './cloud/client.js';
import {fromRemote} from './cloud/model.js';
import {dateKey} from './calendar.js';
import {flowerCatalog} from './flowers/catalog.js';
import {wallpapers,flowerSets,selectedFlower,setMonths,flowerConfirmation,setConfirmation,wallpaperPhotoLabel,hasWallpaperPhoto,wallpaperPhotoActive} from './appearance-model.js';
import {escapeHTML} from './people.js';
let settings=[],access={premium:false,preservedThrough:''},owner=null,checkedAt=0,ready=false;
let selectedSet='basic';
let selectedYear=new Date().getFullYear();
export const chosenFlower=date=>selectedFlower(date,settings,access);
export async function refreshAppearance(force=false){
 const account=db.currentAccount();
 if(owner!==account){owner=account;checkedAt=0;ready=false;access={premium:false,preservedThrough:''};}
 settings=await db.all('settings');
 if(!ready){const saved=settings.find(s=>s.key==='appearanceAccess')?.value;access={premium:false,preservedThrough:saved?.preservedThrough||'',freePeriods:saved?.freePeriods||[]};ready=true;}
 if(account&&client&&(force||Date.now()-checkedAt>30000)){
  checkedAt=Date.now();
  try{
   const {data,error}=await client.from('entitlements').select('premium,preserved_through,free_periods').eq('user_id',account).maybeSingle();
   if(error)throw error;if(db.currentAccount()!==account)return;
   access={premium:data?.premium===true,preservedThrough:data?.premium?dateKey().slice(0,7):(data?.preserved_through||''),freePeriods:data?.free_periods||[]};
   await db.put('settings',{key:'appearanceAccess',value:{preservedThrough:access.preservedThrough,freePeriods:access.freePeriods}});
  }catch{access={...access,premium:false};}
 }
 applyWallpaper();
}
function applyWallpaper(){
 const saved=settings.find(s=>s.key==='theme')?.value;
 const wallpaper=wallpapers.find(w=>w.id===saved)||wallpapers[0];
 document.documentElement.style.setProperty('--bg',wallpaper.color);
 document.documentElement.style.setProperty('--surface',wallpaper.color);
 document.documentElement.style.setProperty('--wallpaper-scene',wallpaper.image?`url("${new URL('../'+wallpaper.image,import.meta.url).href}")`:'none');
 const photo=settings.find(s=>s.key==='localWallpaperPhoto')?.value;
 const usePhoto=settings.find(s=>s.key==='localWallpaperPhotoEnabled')?.value===true&&access.premium;
 document.documentElement.style.setProperty('--wallpaper-photo',usePhoto&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo||'')?`url("${photo}")`:'none');
}
const preview=flower=>`<span class="flower-preview" role="img" aria-label="${flower.name}の完成イメージ"><span aria-hidden="true">${flowerSVG('2000-01-01',5,{calendar:true,preview:true,flower})}</span></span>`;
const setPreview=id=>flowerSets.find(s=>s.id===id).flowers.map(id=>{const flower=flowerCatalog.find(f=>f.id===id);return `<span class="set-sample">${preview(flower)}<small>${flower.name}</small></span>`;}).join('');
const lock=()=>access.premium?'':`<p class="small">花の選択・写真の壁紙はサブスクで利用できます。${db.currentAccount()?'':'「その他」でログインし、クラウド同期を有効にしてください。'}</p><button data-unlock>ロック解除</button>`;
export function appearancePanel(tab){
 if(tab==='flowers'){
  const today=dateKey(),disabled=access.premium?'':'disabled';
  return `<h2>花</h2><p class="small">今月・未来月は、決定後も何度でも変更できます。先月以前の花はそのまま残ります。</p><label>設定する年<select data-flower-year>${Array.from({length:3},(_,i)=>new Date().getFullYear()+i).map(y=>`<option ${y===selectedYear?'selected':''}>${y}</option>`).join('')}</select></label><form data-flower-set><label>セット<select name="set" ${disabled}>${flowerSets.map(s=>`<option value="${s.id}" ${s.id===selectedSet?'selected':''}>${s.name}</option>`).join('')}</select></label><button ${disabled}>決定</button></form><details class="set-preview"><summary>セットの見本</summary><div class="set-preview-grid">${setPreview(selectedSet)}</div></details><div class="month-flowers">${Array.from({length:12},(_,i)=>{
   const month=`${selectedYear}-${String(i+1).padStart(2,'0')}`,flower=chosenFlower(month+'-01'),past=month<today.slice(0,7);
   return `<form data-flower-month="${month}"><label for="flower-${month}">${i+1}月</label>${preview(flower)}<select id="flower-${month}" name="flower" ${past||!access.premium?'disabled':''}>${flowerSets.map(set=>`<optgroup label="${set.name}">${set.flowers.map(id=>flowerCatalog.find(f=>f.id===id)).map(f=>`<option value="${f.id}" ${f.id===flower.id?'selected':''}>${f.name}</option>`).join('')}</optgroup>`).join('')}</select><button ${past||!access.premium?'disabled':''}>${past?'確定済み':'決定'}</button></form>`;
  }).join('')}</div>${lock()}`;
 }
 const current=settings.find(s=>s.key==='theme')?.value||'ivory';
 const hasPhoto=hasWallpaperPhoto(settings),photoActive=wallpaperPhotoActive(settings);
 return `<h2>壁紙</h2><p class="small">選ぶとすぐに反映されます。</p><div class="wallpaper-options">${wallpapers.map(w=>`<button data-wallpaper="${w.id}" aria-pressed="${current===w.id&&!photoActive}" style="background:${w.color}"><span class="wallpaper-swatch" style="background:${w.color};${w.image?`background-image:url('${w.image}')`:``}"></span>${w.name}</button>`).join('')}</div><span class="wallpaper-photo-title">自分の写真</span><div class="wallpaper-photo-row${photoActive?' is-active':''}"><label class="wallpaper-photo-picker">ファイルを選択<input data-wallpaper-photo type="file" accept="image/jpeg,image/png,image/webp" ${access.premium?'':'disabled'}></label>${hasPhoto?`<button type="button" class="wallpaper-photo-name" data-wallpaper-photo-apply data-wallpaper-photo-status aria-pressed="${photoActive}" ${access.premium?'':'disabled'}>${escapeHTML(wallpaperPhotoLabel(settings))}</button>`:`<span class="wallpaper-photo-name" data-wallpaper-photo-status>${escapeHTML(wallpaperPhotoLabel(settings))}</span>`}${hasPhoto?`<button type="button" data-wallpaper-photo-delete>削除</button>`:''}</div>${hasPhoto&&!photoActive?`<p class="small">ファイル名をタップすると、この写真を壁紙にできます。</p>`:''}<p class="small">写真はこの端末だけに保存します。花が見やすいよう、薄く表示します。</p>${lock()}`;
}
async function saveFlowers(months){
 await refreshAppearance(true);
 if(!access.premium||!db.currentAccount())throw Error('権限を確認できませんでした。オンラインでサブスク状態を確認してください。');
 const user=db.currentAccount();
 const {data,error}=await client.rpc('set_flower_months',{months});
 if(error)throw Error('花を変更できませんでした。通信状態と利用権限を確認してください。');
 if(db.currentAccount()!==user)throw Error('アカウントが切り替わりました。');
 await db.applyRemote(data.map(r=>fromRemote('settings',r)));
 await refreshAppearance();
}
async function readPhoto(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file?.type)||file.size>12*1024*1024)throw Error('12MB以内のJPEG・PNG・WebP画像を選んでください。');
 const url=await new Promise((ok,no)=>{const reader=new FileReader();reader.onload=()=>ok(reader.result);reader.onerror=no;reader.readAsDataURL(file);});
 const image=new Image();image.src=url;await image.decode();
 const scale=Math.min(1,1200/Math.max(image.width,image.height)),canvas=document.createElement('canvas');
 canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
 return canvas.toDataURL('image/jpeg',.8);
}
export function bindAppearance(root,{confirm,notify,render,run}){
 root.addEventListener('submit',e=>{
  if(!e.target.matches('[data-flower-month],[data-flower-set]'))return;
  e.preventDefault();run(async()=>{
   const form=e.target,today=dateKey(),month=form.dataset.flowerMonth;
   const months=month?{[month]:form.elements.flower.value}:setMonths(selectedYear,today,form.elements.set.value);
   if(!await confirm(month?flowerConfirmation(month,today):setConfirmation(selectedYear,today)))return;
   await saveFlowers(months);await render();notify('花の設定を保存しました');
  });
 });
 root.addEventListener('click',e=>{
  const unlock=e.target.closest('[data-unlock]');
  if(unlock){notify('サブスクの申し込みは準備中です。現在は管理者が利用権限を設定します。');return;}
  const applyPhoto=e.target.closest('[data-wallpaper-photo-apply]');
  if(applyPhoto){run(async()=>{await refreshAppearance(true);if(!access.premium)throw Error('オンラインで利用権限を確認してください。');await db.put('settings',{key:'localWallpaperPhotoEnabled',value:true});await refreshAppearance();await render();notify('写真を壁紙にしました');});return;}
  const deletePhoto=e.target.closest('[data-wallpaper-photo-delete]');
  if(deletePhoto){run(async()=>{await db.put('settings',{key:'localWallpaperPhoto',value:''});await db.put('settings',{key:'localWallpaperPhotoName',value:''});await db.put('settings',{key:'localWallpaperPhotoEnabled',value:false});await refreshAppearance();await render();notify('写真を削除しました');});return;}
  const button=e.target.closest('[data-wallpaper]');if(!button)return;
  run(async()=>{await db.put('settings',{key:'theme',value:button.dataset.wallpaper});await db.put('settings',{key:'localWallpaperPhotoEnabled',value:false});await refreshAppearance();await render();});
 });
 root.addEventListener('change',e=>{
  if(e.target.matches('[data-flower-set] select')){selectedSet=e.target.value;const sample=root.querySelector('.set-preview');sample.open=true;sample.querySelector('.set-preview-grid').innerHTML=setPreview(selectedSet);}
  if(e.target.matches('[data-flower-month] select')){const flower=flowerCatalog.find(f=>f.id===e.target.value);if(flower)e.target.closest('form').querySelector('.flower-preview').outerHTML=preview(flower);}
  if(e.target.matches('[data-flower-year]')){selectedYear=Number(e.target.value);render();}
  if(e.target.matches('[data-wallpaper-photo]')){const file=e.target.files[0];if(!file)return;run(async()=>{
   await refreshAppearance(true);if(!access.premium)throw Error('オンラインで利用権限を確認してください。');
   const photo=await readPhoto(file);
   await db.put('settings',{key:'localWallpaperPhoto',value:photo});await db.put('settings',{key:'localWallpaperPhotoName',value:String(file.name||'').slice(0,200)});await db.put('settings',{key:'localWallpaperPhotoEnabled',value:true});await refreshAppearance();await render();
  });}
 });
}
