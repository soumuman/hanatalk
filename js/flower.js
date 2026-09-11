import {flowerCatalog} from './flowers/botanical.js';
export function getFlowerForDate(date){return flowerCatalog[Number(date.slice(5,7))-1]||flowerCatalog[0];}
export const getFlowerType=getFlowerForDate;
export const progressForCount=count=>Math.min(1,Math.max(0,Number(count)||0)/5);
export function sproutSVG(){return '<svg viewBox="0 0 36 36" class="sprout" aria-hidden="true"><path d="M18 30 Q19 23 17 17" fill="none" stroke="#a7b89a" stroke-width="1.5" stroke-linecap="round"/><path d="M17 21 C8 22 5 17 6 12 C13 11 18 15 17 21Z M18 20 C18 12 24 9 30 10 C30 17 25 22 18 20Z" fill="#d1dec5" stroke="#a7b89a" stroke-width="1" stroke-linejoin="round"/></svg>';}

export function flowerSVG(date,count,{large=false,animate=false}={}){
  const flower=getFlowerForDate(date),progress=progressForCount(count);
  const level=count>=15?3:count>=10?2:count>=6?1:0;
  const saturation=Math.min(95,flower.saturation+level*4),lightness=flower.lightness-level*4;
  const palette=`--bloom-main:hsl(${flower.hue} ${saturation}% ${lightness}%);--bloom-light:hsl(${flower.hue} ${saturation}% ${Math.min(93,lightness+12)}%);--bloom-dark:hsl(${flower.hue} ${Math.max(20,saturation-18)}% ${lightness-15}%)`;
  return `<svg viewBox="0 0 100 108" class="flower ${large?'large':''} ${animate?'bloom':''}" style="${palette}" data-flower="${flower.id}" data-progress="${progress}" role="img" aria-label="${flower.name}、${count}人と話しました、開花${Math.round(progress*100)}%">${flower.render(progress)}</svg>`;
}
