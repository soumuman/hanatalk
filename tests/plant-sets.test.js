import test from 'node:test';import assert from 'node:assert/strict';
import {flowerCatalog,addedSets,monthCaption} from '../js/flowers/catalog.js';
import {flowerSVG} from '../js/flower.js';import {kusaPosition} from '../js/flowers/kusa.js';
import {selectedFlower,setMonths} from '../js/appearance-model.js';
test('48 stable plant IDs, 3 sets of 12, historical choice retained',()=>{
 assert.equal(flowerCatalog.length,48);assert.equal(new Set(flowerCatalog.map(f=>f.id)).size,48);
 for(const set of addedSets){assert.equal(set.flowers.length,12);assert.equal(Object.keys(setMonths(2026,'2026-10-23',set.id)).length,3);}
 assert.equal(selectedFlower('2026-10-04',[{key:'flowerMonth:2026-10',value:'kusa-horsetail'}],{preservedThrough:'2026-10'}).id,'kusa-horsetail');
});
test('all flowers render finite progressive SVG; 6+ people change color, not geometry',()=>{
 for(const flower of flowerCatalog){
  for(let n=0;n<=5;n++){const svg=flowerSVG('2026-10-08',n,{flower});assert.doesNotMatch(svg,/NaN|undefined/);assert.match(svg,/<svg/);}
  const geometry=n=>flowerSVG('2026-10-08',n,{flower}).slice(flowerSVG('2026-10-08',n,{flower}).indexOf('>')+1);
  assert.equal(geometry(5),geometry(6));
  if(flower.set)for(let n=1;n<5;n++)assert.notEqual(geometry(n),geometry(n+1),flower.id+' stage '+n);
  assert.notEqual(flowerSVG('2026-10-08',1,{flower}),flowerSVG('2026-10-08',5,{flower}));
 }
});
test('Kusa date contexts match entry/calendar and leave zero as sprout',()=>{
 for(const flower of flowerCatalog.filter(f=>f.kind==='kusa')){
  for(let d=1;d<=31;d++){
   const date='2026-10-'+String(d).padStart(2,'0');
   assert.equal(kusaPosition(date),Math.floor((d-1)/7));
   for(const calendar of [true,false])assert.match(flowerSVG(date,3,{flower,calendar}),new RegExp('data-kusa-position="'+Math.floor((d-1)/7)+'"'));
  }
  assert.match(flowerSVG('2026-10-08',0,{flower}),/class="sprout"/);
  assert.match(flowerSVG('2026-10-08',5,{flower,preview:true}),/data-kusa-part="tip"/);
 }
});
test('rose month caption has portrait and fixed aside',()=>{
 const rose=flowerCatalog.find(f=>f.set==='grayson');
 assert.equal(monthCaption('2026-10-01',rose).note,monthCaption('2026-10-31',rose).note);
 assert.equal(monthCaption('2026-10-01',rose).portrait,true);
});
