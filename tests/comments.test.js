import test from 'node:test';
import assert from 'node:assert/strict';
import {pickComment,commentGroup} from '../js/comments.js';
test('completion takes priority over every person history',()=>{
  for(const history of [[],[{date:'2026-09-10'}],[{date:'2026-09-01'}],[{date:'2026-01-01'}]])
    assert.equal(pickComment(history,'2026-09-11',5),'今日の花が咲きました 🌸');
});
test('all comment branches stay neutral and completed flowers never gain petals',()=>{
  const histories=[[],[{date:'2026-09-10'}],[{date:'2026-09-04'}],[{date:'2026-08-12'}],Array.from({length:4},(_,i)=>({date:`2026-09-0${i+6}`})),Array.from({length:9},(_,i)=>({date:`2026-09-0${i+1}`}))];
  assert.deepEqual(histories.map(h=>commentGroup(h,'2026-09-11')),['first','early','again','long','often','month']);
  for(const history of histories)for(const count of [1,4,6,10,15])for(let i=0;i<10;i++){
    const message=pickComment(history,'2026-09-11',count);
    assert.doesNotMatch(message,/ありがとう|うれし|嬉し|楽しく|素敵|仲良く|大切に|よろしく|❤️/);
    if(count>5)assert.doesNotMatch(message,/一枚|花びら/);
    assert.doesNotMatch(message,/\d+回/);
  }
});
