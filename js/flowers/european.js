import {main,light,dark,path,ellipse,dot,rotate,ring,scale,foliage,floret,count} from './drawing.js';
export function renderSnowdrop(p){return foliage()+scale(p,path('M50 51Q50 13 65 21Q74 27 65 34','none','#869d77',2)+ellipse(65,40,6,14,'#faf9e9')+path('M64 28Q41 35 50 58Q61 51 64 28Z','#fffdf1','#b6c3a6')+path('M66 28Q87 38 78 59Q67 51 66 28Z','#fffdf1','#b6c3a6')+dot(65,29,4,'#aabd92'));}
export function renderCrocus(p){return foliage()+scale(p,path('M29 29Q28 68 50 70Q74 68 71 29Q60 32 50 22Q40 31 29 29Z')+ellipse(50,42,11,26,light)+path('M29 29Q49 40 50 70Q28 62 29 29Z')+path('M71 29Q51 39 50 70Q72 62 71 29Z')+path('M47 39L48 29M52 39L54 28','none','#d6aa55',2));}
export function renderGardenTulip(p){return foliage()+scale(p,path('M22 23Q38 30 50 18Q65 30 78 23Q81 67 50 72Q20 65 22 23Z',dark)+path('M50 15Q73 38 50 72Q26 37 50 15Z',light)+path('M22 23Q53 34 50 72Q22 63 22 23Z')+path('M78 23Q48 34 50 72Q78 62 78 23Z'));}
export function renderIris(p){const upright=path('M50 43C30 34 37 11 50 10C65 14 66 33 50 43Z',light);const fall=path('M50 42C31 40 23 53 27 67C42 74 52 58 50 42Z')+path('M48 45Q37 48 33 61','none','#dfc675',3);return foliage()+scale(p,ring(3,p,upright)+ring(3,p,fall,25)+dot(50,43,4));}
export function renderPeony(p){return foliage()+ring(9,p,path('M50 44C27 45 18 27 27 18Q32 12 38 17Q42 6 50 14Q61 9 66 20C72 34 63 44 50 44Z'))+ring(7,p,path('M50 44C32 43 30 27 38 23Q45 18 49 24Q60 18 64 31Q62 43 50 44Z',light),20)+ring(5,p,path('M50 44Q36 34 46 28Q57 27 58 38Z'),35)+dot(50,43,3);}
export function renderDelphinium(p){const pts=[[50,16],[43,28],[57,35],[39,45],[54,53],[40,64],[58,72],[48,82]];return foliage()+path('M50 15L50 92','none','#839c78',1.5)+pts.slice(0,count(p,pts.length)).map(([x,y],i)=>floret(x,y,1,.37,i%2?main:light)).join('');}
export function renderLavender(p){return foliage()+[[-14,13],[0,0],[14,18]].map(([dx,dy])=>`<g transform="translate(${dx} ${dy})">${path('M50 27L50 82','none','#91a384',1.3)}${Array.from({length:count(p,6)},(_,i)=>ellipse(47+(i%2)*6,20+i*6,4,5,i%2?main:light)).join('')}</g>`).join('');}
export function renderPoppy(p){return foliage()+scale(p,ring(4,p,path('M50 44C25 48 17 28 25 17C35 8 49 17 52 28C62 11 78 17 75 31C73 45 60 49 50 44Z'))+dot(50,43,9,'#6e7769')+ring(9,1,dot(50,36,1.1,'#d8ca95')));}
export function renderDahlia(p){return foliage()+[ [14,35,0],[11,26,15],[8,17,5] ].map(([n,r,o],j)=>ring(n,p,path(`M48 44Q35 ${43-r/2} 50 ${43-r}Q64 ${43-r/2} 52 44Z`,j%2?light:main),o)).join('')+dot(50,43,4);}
export function renderAnemone(p){return foliage()+ring(7,p,path('M50 44C31 44 25 28 34 18C48 10 64 18 63 30Q61 42 50 44Z'))+dot(50,43,8,'#657085')+ring(12,1,dot(50,33,1.2,'#697283'));}
export function renderCyclamen(p){const petal=path('M50 54C25 47 30 17 46 11Q42 38 55 48Z');return foliage()+scale(p,ring(5,1,petal,15)+dot(50,47,4,dark));}
export function renderHellebore(p){return foliage()+ring(5,p,path('M50 45C28 40 27 20 39 15C53 10 67 20 63 32Q61 43 50 45Z',light))+ring(12,1,path('M50 43L50 34','none','#b1b786',.7)+dot(50,33,1.2,'#cbbb6e'))+dot(50,43,4,'#b6bd85');}
const data=[
 ['snowdrop','スノードロップ',85,23,86,renderSnowdrop,'うつむく白い花に、冬のやわらかな光。'],
 ['crocus','クロッカス',275,40,73,renderCrocus,'小さな杯に、春の色をひとしずく。'],
 ['garden-tulip','チューリップ〈杏色〉',25,64,76,renderGardenTulip,'杏色の花びらが、庭を明るく。'],
 ['iris','アイリス',245,38,68,renderIris,'ひらりと重なる、青紫の花びら。'],
 ['peony','シャクヤク',340,47,79,renderPeony,'幾重もの花びらに、やわらかな光。'],
 ['delphinium','デルフィニウム',214,50,70,renderDelphinium,'小さな青い花が、空へ連なります。'],
 ['lavender','ラベンダー',265,30,70,renderLavender,'紫の穂が、庭の風に揺れています。'],
 ['poppy','ポピー',8,65,72,renderPoppy,'薄い花びらに、風がひと休み。'],
 ['dahlia','ダリア',317,43,69,renderDahlia,'花びらを重ねた、小さな幾何学。'],
 ['anemone','アネモネ',5,54,72,renderAnemone,'花の真ん中に、小さな深い色。'],
 ['cyclamen','シクラメン',331,47,75,renderCyclamen,'反り返る花びらが、軽やかに。'],
 ['hellebore','クリスマスローズ',90,22,83,renderHellebore,'静かな庭に、うつむく花の姿。']
];
export const europeanFlowers=data.map(([id,name,hue,saturation,lightness,render,note])=>({id:'eu-'+id,name,hue,saturation,lightness,render,note,set:'european',viewBox:'8 3 84 88'}));
