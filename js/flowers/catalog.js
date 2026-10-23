import {flowerCatalog as basic} from './botanical.js';
import {europeanFlowers} from './european.js';
import {roseFlowers,graysonAsides} from './roses.js';
import {kusaFlowers} from './kusa.js';
import {getSeasonalNote} from '../seasons.js';
export const flowerCatalog=[...basic,...europeanFlowers,...roseFlowers,...kusaFlowers];
export const addedSets=[{id:'european',name:'ヨーロピアンガーデン',flowers:europeanFlowers.map(f=>f.id)},{id:'grayson',name:'グレイソンのバラ園',flowers:roseFlowers.map(f=>f.id)},{id:'kusa',name:'Kusa',flowers:kusaFlowers.map(f=>f.id)}];
export function monthCaption(date,flower){return {title:flower.name+(flower.set==='grayson'?'':'の月'),note:flower.set==='grayson'?graysonAsides[Number(date.slice(5,7))-1]:(flower.note||getSeasonalNote(date)),portrait:flower.set==='grayson'};}
