let registration;
export function registerUpdates(onNotice){
  if(!('serviceWorker' in navigator))return;
  registration=navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});
  registration.catch(()=>onNotice('オフラインの準備ができませんでした。オンラインで開き直してください。'));
}
const FROM_KEY='hanatalk-update-from',APPLIED_KEY='hanatalk-update-applied';
export function updateResultNotice(fromVersion,applied,currentVersion){
  if(!fromVersion)return null;
  if(applied&&currentVersion!==fromVersion)return {title:`バージョン ${currentVersion} に更新しました`,body:`${fromVersion} から ${currentVersion} へ更新しました。`};
  return {title:'すでに最新版です',body:`現在のバージョンは ${currentVersion} です。`};
}
export function readUpdateResult(currentVersion){
  try{
    const from=sessionStorage.getItem(FROM_KEY),applied=sessionStorage.getItem(APPLIED_KEY)==='1';
    sessionStorage.removeItem(FROM_KEY);sessionStorage.removeItem(APPLIED_KEY);
    return updateResultNotice(from,applied,currentVersion);
  }catch{return null;}
}
// Only reload after an explicit action on settings, never during record editing.
export async function loadLatest(fromVersion){
  if(!navigator.onLine)throw new Error('オンラインで、もう一度お試しください');
  if(!registration)throw new Error('このブラウザでは更新確認に対応していません');
  try{sessionStorage.setItem(FROM_KEY,fromVersion||'');}catch{}
  try{
    const reg=await registration;
    await reg.update();
    const worker=reg.installing||reg.waiting;
    if(worker){
      await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>{cleanup();reject(new Error('更新を準備しています。少し待ってもう一度お試しください'));},15000);
        const cleanup=()=>{clearTimeout(timer);worker.removeEventListener('statechange',check);};
        const check=()=>{
          if(worker.state==='installed')worker.postMessage({type:'ACTIVATE_UPDATE'});
          if(worker.state==='activated'){cleanup();resolve();}
          if(worker.state==='redundant'){cleanup();reject(new Error('更新できませんでした。もう一度お試しください'));}
        };
        worker.addEventListener('statechange',check);check();
      });
    }
    try{sessionStorage.setItem(APPLIED_KEY,worker?'1':'0');}catch{}
  }catch(error){
    try{sessionStorage.removeItem(FROM_KEY);sessionStorage.removeItem(APPLIED_KEY);}catch{}
    throw error;
  }
  location.reload();
}
