import test from 'node:test';import assert from 'node:assert/strict';
import {updateResultNotice} from '../js/updates.js';
test('update result dialog names the new version after an applied update',()=>{
 assert.deepEqual(updateResultNotice('c034',true,'c035'),{title:'バージョン c035 に更新しました',body:'c034 から c035 へ更新しました。'});
});
test('update result dialog says already latest when nothing was applied or version is unchanged',()=>{
 assert.deepEqual(updateResultNotice('c035',false,'c035'),{title:'すでに最新版です',body:'現在のバージョンは c035 です。'});
 assert.deepEqual(updateResultNotice('c035',true,'c035'),{title:'すでに最新版です',body:'現在のバージョンは c035 です。'});
});
test('no update dialog without a recorded update attempt',()=>{
 assert.equal(updateResultNotice('',true,'c035'),null);
 assert.equal(updateResultNotice(null,true,'c035'),null);
});
