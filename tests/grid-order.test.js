import test from 'node:test';
import assert from 'node:assert/strict';
import {closestItemIndex} from '../js/drag-order.js';
test('drag resolves horizontal and vertical targets in a three-column grid',()=>{
  const rects=Array.from({length:6},(_,i)=>({left:i%3*110,top:Math.floor(i/3)*120,width:100,height:110}));
  assert.equal(closestItemIndex(rects,50,50),0);
  assert.equal(closestItemIndex(rects,270,50),2);
  assert.equal(closestItemIndex(rects,160,175),4);
  assert.equal(closestItemIndex(rects,270,300),5);
});
