import test from 'node:test';
import assert from 'node:assert/strict';
import {flowerSVG,getFlowerForDate,progressForCount} from '../js/flower.js';
const names=['梅','水仙','桜','チューリップ','ネモフィラ','紫陽花','朝顔','ひまわり','コスモス','金木犀','菊','ポインセチア'];
const art=svg=>svg.slice(svg.indexOf('>')+1,svg.lastIndexOf('</svg>'));
test('every month has its own flower and five distinct growth stages shared across sizes',()=>{
  const completed=new Set();
  names.forEach((name,i)=>{
    const date=`2026-${String(i+1).padStart(2,'0')}-01`;
    assert.equal(getFlowerForDate(date).name,name);
    const stages=new Set();
    for(let count=1;count<=5;count++){
      const small=flowerSVG(date,count),large=flowerSVG(date,count,{large:true});
      assert.equal(art(small),art(large));
      assert.match(small,new RegExp(`data-progress="${count/5}"`));
      stages.add(art(small));
    }
    assert.equal(stages.size,5,name);
    completed.add(art(flowerSVG(date,5)));
    for(const count of [6,10,15,30]){
      assert.equal(art(flowerSVG(date,count)),art(flowerSVG(date,5)),name);
      assert.notEqual(flowerSVG(date,count).match(/style="([^"]+)/)[1],flowerSVG(date,5).match(/style="([^"]+)/)[1]);
    }
  });
  assert.equal(completed.size,12);
});
test('progress is clamped; clustered flowers add florets instead of generic petals',()=>{
  assert.equal(progressForCount(-1),0);assert.equal(progressForCount(100),1);
  for(const month of ['06','10']){
    const first=art(flowerSVG(`2026-${month}-01`,1));
    const full=art(flowerSVG(`2026-${month}-01`,5));
    assert.ok((first.match(/class="floret"/g)||[]).length>0);
    assert.ok((full.match(/class="floret"/g)||[]).length>(first.match(/class="floret"/g)||[]).length);
  }
});
