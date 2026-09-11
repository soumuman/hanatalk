const flowers=[['梅',345,56,'round'],['水仙',48,75,'point'],['桜',345,65,'notch'],['チューリップ',8,64,'cup'],['ネモフィラ',207,65,'round'],['紫陽花',263,45,'point'],['朝顔',272,57,'cup'],['ひまわり',42,87,'point'],['コスモス',337,55,'notch'],['金木犀',28,85,'round'],['菊',46,68,'slim'],['ポインセチア',355,66,'point']];
export function getFlowerType(date){const [name,hue,saturation,shape]=flowers[Number(date.slice(5,7))-1];return {name,hue,saturation,shape};}
// Separated petals leave a small, open center, like a pressed-flower emblem.
const paths={
  round:'M49 45 C40 36 34 26 37 16 C39 7 47 6 50 9 C53 6 61 7 63 16 C66 26 60 36 51 45 Q50 46 49 45Z',
  point:'M49 45 C40 35 35 25 40 14 Q44 7 50 4 Q56 7 60 14 C65 25 60 35 51 45 Q50 46 49 45Z',
  notch:'M49 45 C42 36 36 26 38 17 C39 11 42 6 46 4 Q47 3.5 48 5 L50 9 L53 4.5 Q54 3.5 55 4.5 C61 9 64 18 62 26 C60 34 55 41 51 45 Q50 46 49 45Z',
  cup:'M49 45 C39 35 35 24 38 13 Q39 9 42 7 L47 12 L50 7 L53 12 L58 7 Q61 9 62 13 C65 24 61 35 51 45 Q50 46 49 45Z',
  slim:'M49 45 C43 34 40 24 43 15 Q46 8 50 4 Q54 8 57 15 C60 24 57 34 51 45 Q50 46 49 45Z'
};
export function flowerSVG(date,count,{large=false,animate=false}={}){
  const f=getFlowerType(date);
  const level=count>=15?3:count>=10?2:count>=6?1:0;
  const saturation=Math.min(85,f.saturation+level*5);
  const color=`hsl(${f.hue} ${saturation}% ${81-level*7}%)`;
  const outline=`hsl(${f.hue} ${Math.round(saturation*.55)}% ${62-level*6}%)`;
  return `<svg viewBox="0 0 100 100" class="flower ${large?'large':''} ${animate?'bloom':''}" role="img" aria-label="${f.name}、${count}人と話しました">${Array.from({length:5},(_,i)=>`<path class="petal ${i<count?'colored':''}" d="${paths[f.shape]}" transform="rotate(${i*72} 50 50)" fill="${i<count?color:'#faf9f5'}" stroke="${i<count?outline:'#c9c8bd'}" stroke-width="${large?.85:1.05}" stroke-linejoin="round"/>`).join('')}</svg>`;
}
