import {main,light,dark,path,ellipse,dot,rotate,count} from './drawing.js';
export const kusaPosition=date=>Math.floor((Number(date.slice(8,10))-1)/7);
function head(id){
 if(id==='horsetail')return path('M39 43Q31 23 43 9Q50 2 57 9Q69 23 61 43Z','#c7b48a','#a99a78')+[15,24,33].map(y=>path(`M39 ${y}Q50 ${y+5} 61 ${y}`,'none','#a99a78',.8)).join('')+path('M43 45L39 38L50 42L61 38L57 45Z','#b5a17c','#a19070');
 if(id==='asparagus')return path('M39 44Q38 22 50 6Q63 22 61 44Z',main)+[15,24,33].map((y,i)=>path(`M${45+i%2*5} ${y+8}l-3-8 8 4Z`,i%2?light:'#ab9ab3')).join('');
 if(id==='bamboo'||id==='black-bamboo')return path('M50 38Q30 25 20 15M50 35Q72 22 81 12','none',dark,1.2)+path('M32 26Q19 26 17 12Q30 14 32 26Z M66 26Q67 10 81 9Q78 23 66 26Z',light);
 if(id==='scouring-rush')return path('M45 39L44 19L50 9L56 19L55 39Z','#c3b48b','#9da080');
 if(id==='wheat'||id==='barley')return Array.from({length:5},(_,i)=>{const y=12+i*6;return ellipse(45,y,4,6,light)+ellipse(55,y+3,4,6,main)+(id==='barley'?path(`M42 ${y}L32 ${y-14}M58 ${y+3}L70 ${y-13}`,'none',dark,.7):'');}).join('');
 if(id==='rice')return path('M50 44Q44 8 70 14Q80 17 76 34','none',dark,1.2)+Array.from({length:7},(_,i)=>ellipse(56+i*3,15+i*3,2.6,4,'#d8c88e')).join('');
 if(id==='silver-grass')return Array.from({length:9},(_,i)=>path(`M50 46Q${25+i*6} 27 ${30+i*5} ${9+Math.abs(4-i)*3}`,'none',i%2?'#ded8bc':'#c7c4a8',2.5)).join('');
 if(id==='foxtail')return rotate(-12,ellipse(50,25,9,22,light)+Array.from({length:8},(_,i)=>path(`M40 ${10+i*4}L36 ${6+i*4}M60 ${10+i*4}L64 ${6+i*4}`,'none',dark,.8)).join(''));
 if(id==='sugarcane')return path('M50 46Q18 8 8 28Q30 19 50 46M50 46Q75 2 92 20Q69 15 50 46M50 46Q41 13 50 5Q57 19 50 46Z',light);
 return path('M50 46V8M50 23L32 10M50 31L69 13M50 38L25 22M50 42L78 25','none','#c2b27b',2.3);
}
export function renderKusa(id,p,{date='2000-01-01',preview=false}={}){
 const position=preview?0:kusaPosition(date),tip=position===0,w=3+9*Math.min(1,Math.max(0,p)),top=tip?38:0;
 const stem=path(`M${50-w/2} ${top}L${50+w/2} ${top}L${50+w/2} 108L${50-w/2} 108Z`,main,dark,.65);
 let node=path(`M${48-w/2} 65Q50 69 ${52+w/2} 65L${52+w/2} 71Q50 74 ${48-w/2} 71Z`,dark,dark,.5);
 if(id==='horsetail')node=path(`M${48-w/2} 73L${46-w/2} 57L49 64L50 55L53 64L${54+w/2} 57L${52+w/2} 73Z`,'#b4a181','#98886e');
 if(id==='asparagus')node=path(`M${50-w/2} 65l1-12 7 7Z`,light,dark,.6);
 if(['wheat','barley','rice','silver-grass','foxtail','corn','sugarcane'].includes(id))node+=path(`M50 76Q${id==='corn'?18:30} 48 19 41Q39 45 50 76Z`,light,dark,.65);
 const tipWidth=.6+.4*p;
 return `<g data-kusa-position="${position}" data-kusa-part="${tip?'tip':'stem'}" data-stem-width="${w}">${stem}${node}${tip?`<g transform="translate(50 0) scale(${tipWidth} 1) translate(-50 0)">${head(id)}</g>`:''}</g>`;
}
const plants=[
 ['horsetail','ツクシ',82,25,70,'春の土手に、すっと伸びる姿。'],
 ['asparagus','アスパラガス',98,31,67,'穂先の下は、すらりとした茎。'],
 ['bamboo','青竹',103,27,65,'節をつないで、空へまっすぐ。'],
 ['black-bamboo','黒竹',45,11,42,'落ち着いた色の茎に、細い葉。'],
 ['scouring-rush','トクサ',114,24,64,'緑の茎に、小さな輪のリズム。'],
 ['wheat','小麦',44,48,72,'穂の下に続く、細い金色。'],
 ['barley','大麦',57,39,72,'長いのぎが、風をとらえます。'],
 ['rice','稲',73,36,69,'穂がゆれて、茎が支えます。'],
 ['silver-grass','ススキ',69,22,73,'銀色の穂に、風の通り道。'],
 ['foxtail','エノコログサ',83,35,70,'丸い穂が、少しだけおじぎ。'],
 ['sugarcane','サトウキビ',330,19,64,'太い茎に、節をひとつずつ。'],
 ['corn','トウモロコシ',91,34,64,'広い葉の間に、しっかりした茎。']
];
export const kusaFlowers=plants.map(([id,name,hue,saturation,lightness,note])=>({id:'kusa-'+id,name,hue,saturation,lightness,note,set:'kusa',kind:'kusa',viewBox:'0 0 100 108',render:(p,context)=>renderKusa(id,p,context)}));
