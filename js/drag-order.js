// Pointer Events support both touch handles and a mouse without native HTML drag/drop.
export function enableDragOrder(root,{canStart,onStart,onFinish,onCancel}){
  let drag,frame;
  const rows=()=>[...drag.list.querySelectorAll('[data-order-id]')];
  function move(){
    if(!drag)return;
    const height=window.innerHeight;
    if(drag.y<75)window.scrollBy(0,-7);
    else if(drag.y>height-75)window.scrollBy(0,7);
    const others=rows().filter(row=>row!==drag.row);
    const target=others.find(row=>drag.y<row.getBoundingClientRect().top+row.getBoundingClientRect().height/2);
    if(drag.row.nextElementSibling!==(target||null)){
      drag.list.insertBefore(drag.row,target||null);
      try{drag.handle.setPointerCapture(drag.pointer);}catch{}
    }
    frame=requestAnimationFrame(move);
  }
  function finish(cancel=false){
    if(!drag)return;
    cancelAnimationFrame(frame);
    const current=drag;const ids=rows().map(row=>row.dataset.orderId);
    drag=null;current.row.classList.remove('dragging');
    try{current.handle.releasePointerCapture(current.pointer);}catch{}
    if(cancel){for(const id of current.original){const row=[...current.list.children].find(r=>r.dataset.orderId===id);if(row)current.list.append(row);}onCancel();}
    else onFinish(ids,current.row.dataset.orderId);
  }
  root.addEventListener('pointerdown',event=>{
    const handle=event.target.closest('[data-drag-handle]');
    if(!handle||event.button!==0||!event.isPrimary||drag||!canStart())return;
    const row=handle.closest('[data-order-id]'),list=row.parentElement;
    event.preventDefault();
    drag={handle,row,list,pointer:event.pointerId,y:event.clientY,original:[...list.children].map(r=>r.dataset.orderId)};
    handle.setPointerCapture(event.pointerId);row.classList.add('dragging');onStart();
    frame=requestAnimationFrame(move);
  });
  root.addEventListener('pointermove',event=>{if(drag&&event.pointerId===drag.pointer){drag.y=event.clientY;event.preventDefault();}});
  root.addEventListener('pointerup',event=>{if(drag&&event.pointerId===drag.pointer)finish();});
  root.addEventListener('pointercancel',()=>finish(true));
  root.addEventListener('lostpointercapture',()=>{if(drag&&!drag.handle.hasPointerCapture(drag.pointer))finish(true);});
  window.addEventListener('keydown',event=>{if(event.key==='Escape')finish(true);});
  window.addEventListener('hashchange',()=>finish(true));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(true);});
}
