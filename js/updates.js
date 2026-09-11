let registration;
export function registerUpdates(onNotice){
  if(!('serviceWorker' in navigator))return;
  registration=navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});
  registration.catch(()=>onNotice('オフラインの準備ができませんでした。オンラインで開き直してください。'));
}
// Only reload after an explicit action on settings, never during record editing.
export async function loadLatest(){
  if(!navigator.onLine)throw new Error('オンラインで、もう一度お試しください');
  if(!registration)throw new Error('このブラウザでは更新確認に対応していません');
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
  location.reload();
}
