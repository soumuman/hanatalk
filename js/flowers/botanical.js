// All renderers use the same 100 × 108 coordinate system and progress in [0, 1].
const clamp=p=>Math.max(0,Math.min(1,p));
const visible=(p,n)=>Math.ceil(clamp(p)*n);
const path=(d,fill,stroke='none',width=.8,extra='')=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
const circle=(x,y,r,fill)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const turn=(angle,body,x=50,y=43)=>`<g transform="rotate(${angle} ${x} ${y})">${body}</g>`;
const ring=(n,p,petal,offset=0)=>Array.from({length:visible(p,n)},(_,i)=>turn(offset+i*360/n,petal)).join('');
const leaf=(d)=>path(d,'#a9bf93','#78966d',.8);
const stem=()=>path('M50 51 Q47 76 51 103','none','#809b73',1.8);
const leaves=()=>leaf('M49 89 Q31 89 26 74 Q42 71 49 89Z')+leaf('M49 80 Q56 65 73 68 Q70 83 49 80Z');
const bud=()=>stem()+leaves()+path('M50 50 C38 41 41 27 50 24 C59 27 62 41 50 50Z','#cfdbc1','#8fa67e');
const pink='var(--bloom-main)',light='var(--bloom-light)',dark='var(--bloom-dark)';
const stamens=(n,r,color='#d8ad59')=>Array.from({length:n},(_,i)=>{const a=i*2*Math.PI/n;return circle((50+Math.cos(a)*r).toFixed(2),(43+Math.sin(a)*r).toFixed(2),1.2,color);}).join('');

export function renderUme(progress){
  if(!progress)return bud();
  const branch=path('M34 104 Q45 78 49 47 M42 81 L66 87','none','#9b8772',2.6);
  const petal=path('M50 44 C32 39 30 20 39 15 C48 9 61 13 64 23 C66 32 60 39 50 44Z',pink,dark);
  return branch+ring(5,progress,petal)+circle(50,43,6,light)+stamens(10,7)+circle(50,43,2.5,'#d5ad56');
}
export function renderSuisen(progress){
  if(!progress)return bud();
  const foliage=path('M41 104 Q31 85 35 57 Q43 80 43 102 M53 104 Q66 81 63 55 Q52 81 53 104','#9eb28b','#78966d');
  const petal=path('M50 45 Q31 34 35 11 Q49 16 55 29 Q59 38 50 45Z','#fff9dc','#d4c995');
  const trumpet=path('M40 40 Q50 31 61 39 L59 51 Q49 58 41 50Z',pink,dark)+path('M39 39 Q42 34 46 38 Q50 32 54 38 Q60 33 63 40 Q60 47 51 48 Q43 47 39 39Z',light,dark)+circle(51,41,4,'#d89e3c');
  return stem()+foliage+ring(6,progress,petal,15)+trumpet;
}
export function renderSakura(progress){
  if(!progress)return bud();
  const branch=path('M65 104 Q48 79 49 46 M57 89 L32 91','none','#9b8779',2);
  const petal=path('M49 43 C35 32 31 15 41 8 L49 15 L55 7 C70 17 66 32 51 43Z',pink,dark);
  return branch+ring(5,progress,petal)+circle(50,43,5,light)+stamens(7,6,'#bd7993');
}
export function renderTulip(progress){
  const p=clamp(progress),w=10+20*p,top=27-13*p;
  const foliage=leaf('M49 103 Q26 88 27 58 Q42 71 49 103Z')+leaf('M51 100 Q70 79 73 59 Q78 90 51 100Z');
  const back=path(`M${50-w} ${top+4} Q50 ${top+17} ${50+w} ${top+4} Q${50+w+2} 63 50 72 Q${48-w} 64 ${50-w} ${top+4}Z`,dark,dark);
  const center=path(`M50 ${17+8*(1-p)} Q${70+6*p} 42 50 72 Q${30-6*p} 42 50 ${17+8*(1-p)}Z`,light,dark);
  const front=path(`M${50-w} ${top+4} Q${50+8*p} ${33+6*p} 50 72 Q${48-w} 67 ${50-w} ${top+4}Z`,pink,dark)+path(`M${50+w} ${top+4} Q${50-8*p} ${33+6*p} 50 72 Q${52+w} 67 ${50+w} ${top+4}Z`,pink,dark);
  return stem()+foliage+back+center+front;
}
export function renderNemophila(progress){
  if(!progress)return bud();
  const petal=path('M50 45 C32 38 29 21 38 16 C48 9 61 14 64 24 C65 33 59 41 50 45Z',pink,dark)+path('M50 45 Q41 34 44 27 Q50 29 54 27 Q59 34 50 45Z','#faf7e9');
  return stem()+leaves()+ring(5,progress,petal,12)+circle(50,43,5,'#faf7e9')+stamens(5,4,'#596f86');
}
function floret(x,y,size,color,center='#ece2ab',lobes=4){
  return `<g class="floret" transform="translate(${x} ${y}) scale(${size})">${Array.from({length:lobes},(_,i)=>`<ellipse cx="0" cy="-3" rx="2.6" ry="3.8" fill="${color}" stroke="${dark}" stroke-width=".35" transform="rotate(${i*360/lobes})"/>`).join('')}<circle r="1.1" fill="${center}"/></g>`;
}
export function renderHydrangea(progress){
  const foliage=leaf('M47 91 L39 94 L31 87 L25 80 L30 77 L28 72 L36 73 L44 78Z')+leaf('M52 83 L61 72 L68 68 L70 73 L78 73 L74 80 L77 83 L68 89 L59 89Z');
  const positions=[[50,43],[35,42],[63,43],[44,28],[58,28],[44,57],[59,57],[25,30],[29,54],[72,29],[76,52],[36,17],[57,15],[47,70],[67,68]];
  return stem()+foliage+positions.slice(0,visible(progress,positions.length)).map(([x,y],i)=>floret(x,y,1.05,[pink,light,'#b5b9da'][i%3])).join('')+(!progress?floret(50,43,.8,'#cbd7bd'):'');
}
export function renderMorningGlory(progress){
  const p=clamp(progress),scale=.28+.72*p;
  const vine=path('M50 62 Q34 80 53 96 Q61 104 54 107','none','#819b75',1.8);
  const foliage=leaf('M44 82 C28 68 24 88 43 98 C60 86 57 72 44 82Z');
  const trumpet=path('M42 43 L53 74 L65 43Z',light,dark);
  const mouth=path('M50 9 C59 11 68 18 77 23 C79 33 81 45 83 51 C74 60 64 63 57 70 C44 69 35 63 26 60 C21 48 20 36 20 28 C31 20 40 14 50 9Z',pink,dark);
  const star=path('M50 44 L50 12 L54 38 L75 25 L57 45 L80 52 L55 50 L57 67 L48 52 L28 59 L43 46 L23 30 L46 39Z','#faf3e7');
  return vine+foliage+trumpet+`<g transform="translate(50 43) scale(${scale.toFixed(3)} ${(0.68+.32*p).toFixed(3)}) translate(-50 -43)">${mouth}${star}${circle(50,44,3,'#ead3aa')}</g>`;
}
export function renderSunflower(progress){
  if(!progress)return bud();
  const foliage=leaf('M49 89 L31 92 L22 78 L39 75Z')+leaf('M51 77 L68 62 L78 76 L62 84Z');
  const petal=path('M50 37 C41 30 43 14 50 6 C57 14 59 30 50 37Z',pink,dark);
  const seeds=Array.from({length:13},(_,i)=>{const a=i*2.4,r=3+Math.sqrt(i)*2.8;return circle((50+Math.cos(a)*r).toFixed(2),(43+Math.sin(a)*r).toFixed(2),1.2,'#c59856');}).join('');
  return stem()+foliage+ring(20,progress,petal)+circle(50,43,15,'#876444')+circle(50,43,11,'#715439')+seeds;
}
export function renderCosmos(progress){
  if(!progress)return bud();
  const foliage=path('M50 96 L29 80 M39 88 L30 89 M39 88 L38 77 M50 87 L72 71 M60 80 L62 69 M60 80 L73 81','none','#8da47a',1.3);
  const petal=path('M47 43 C40 35 36 18 39 11 L44 13 L47 8 L51 12 L55 8 L59 13 C60 24 56 36 53 43Z',pink,dark);
  return stem()+foliage+ring(8,progress,petal)+circle(50,43,7,'#ddbd61')+stamens(7,4,'#ad944b');
}
export function renderOsmanthus(progress){
  const branch=path('M46 103 L48 60 M48 72 L28 46 M48 65 L68 37 M48 60 L49 26','none','#9b9276',1.8);
  const foliage=leaf('M48 89 Q25 89 22 67 Q41 67 48 89Z')+leaf('M50 78 Q54 56 77 58 Q74 77 50 78Z');
  const positions=[[48,45],[34,46],[59,42],[46,30],[65,28],[27,31],[39,17],[57,16],[23,58],[64,57]];
  return branch+foliage+positions.slice(0,visible(progress,positions.length)).map(([x,y],i)=>floret(x,y,.90,i%3===0?light:pink,'#b58341')).join('')+(!progress?circle(48,45,3,'#bdcbab'):'');
}
export function renderChrysanthemum(progress){
  if(!progress)return bud();
  const foliage=leaf('M49 94 L39 94 L34 87 L26 85 L30 79 L26 74 L37 73 L44 80Z')+leaf('M51 82 L57 73 L68 69 L69 76 L76 79 L68 85 L61 86Z');
  const outer=path('M49 44 C38 35 36 17 45 8 Q51 9 50 17 Q44 28 52 42Z',pink,dark,.5);
  const middle=path('M49 44 C40 37 40 23 48 18 Q55 20 50 27 Q48 35 53 43Z',light,dark,.5);
  const inner=path('M49 44 Q40 32 48 28 Q55 29 52 43Z',pink,dark,.5);
  return stem()+foliage+ring(16,progress,outer)+ring(12,progress,middle,15)+ring(8,progress,inner,25)+circle(50,43,4,'#d6ae57');
}
export function renderPoinsettia(progress){
  const p=clamp(progress),n=visible(p,8);
  const bract='M50 44 Q32 35 36 10 Q53 13 56 28Z';
  const lower=ring(5,1,path('M50 50 Q31 59 28 82 Q49 74 50 50Z','#9bad83','#738a67'),10);
  const outer=Array.from({length:8},(_,i)=>turn(i*45,path(bract,i<n?pink:'#b7c5a2',i<n?dark:'#8b9f7e'))).join('');
  const inner=ring(5,p,path('M50 44 Q40 33 47 22 Q59 30 50 44Z',light,dark),20);
  return stem()+lower+outer+inner+circle(50,43,5,'#a6a962')+stamens(5,3,'#e4c773');
}

export const flowerCatalog=[
  {id:'ume',name:'梅',hue:343,saturation:48,lightness:72,render:renderUme},
  {id:'suisen',name:'水仙',hue:47,saturation:78,lightness:65,render:renderSuisen},
  {id:'sakura',name:'桜',hue:343,saturation:60,lightness:83,render:renderSakura},
  {id:'tulip',name:'チューリップ',hue:5,saturation:62,lightness:73,render:renderTulip},
  {id:'nemophila',name:'ネモフィラ',hue:210,saturation:59,lightness:73,render:renderNemophila},
  {id:'hydrangea',name:'紫陽花',hue:254,saturation:38,lightness:72,render:renderHydrangea},
  {id:'morning-glory',name:'朝顔',hue:267,saturation:48,lightness:72,render:renderMorningGlory},
  {id:'sunflower',name:'ひまわり',hue:43,saturation:85,lightness:63,render:renderSunflower},
  {id:'cosmos',name:'コスモス',hue:335,saturation:53,lightness:73,render:renderCosmos},
  {id:'osmanthus',name:'金木犀',hue:30,saturation:83,lightness:65,render:renderOsmanthus},
  {id:'chrysanthemum',name:'菊',hue:42,saturation:69,lightness:73,render:renderChrysanthemum},
  {id:'poinsettia',name:'ポインセチア',hue:355,saturation:54,lightness:65,render:renderPoinsettia}
];
