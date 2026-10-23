// Shared flat botanical language: thin outlines, restrained pastel fills.
export const main='var(--bloom-main)',light='var(--bloom-light)',dark='var(--bloom-dark)';
export const path=(d,fill=main,stroke=dark,w=.7)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
export const ellipse=(x,y,rx,ry,fill=main)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${dark}" stroke-width=".55"/>`;
export const dot=(x,y,r,fill='#ddc67e')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
export const rotate=(angle,body,x=50,y=43)=>`<g transform="rotate(${angle} ${x} ${y})">${body}</g>`;
export const count=(p,n)=>Math.ceil(Math.max(0,Math.min(1,p))*n);
export const ring=(n,p,body,offset=0)=>Array.from({length:count(p,n)},(_,i)=>rotate(offset+i*360/n,body)).join('');
export const scale=(p,body)=>`<g transform="translate(50 43) scale(${.35+.65*p}) translate(-50 -43)">${body}</g>`;
export const foliage=()=>`<g class="flower-foliage">${path('M50 48 Q47 78 50 104','none','#809b73',1.8)}${path('M49 84Q27 84 26 69Q44 69 49 84Z M50 91Q71 88 74 73Q57 72 50 91Z','#afc59c','#829c75')}</g>`;
export const floret=(x,y,p=1,size=1,fill=main)=>`<g transform="translate(${x-50*size} ${y-43*size}) scale(${size})">${ring(5,p,path('M50 44C34 38 36 21 46 22C57 17 65 33 50 44Z',fill))}${dot(50,43,3)}</g>`;
