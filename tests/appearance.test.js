import test from 'node:test';import assert from 'node:assert/strict';
import {selectedFlower,setMonths,flowerConfirmation,setConfirmation,wallpaperPhotoLabel,wallpaperPhotoSource} from '../js/appearance-model.js';
test('monthly choices preserve historical flowers after revocation, but future reservations return to basic',()=>{
 const settings=[{key:'flowerMonth:2026-10',value:'sakura'},{key:'flowerMonth:2026-11',value:'sakura'}];
 const free={premium:false,preservedThrough:'2026-10'};
 assert.equal(selectedFlower('2026-10-01',settings,free).id,'sakura');
 assert.equal(selectedFlower('2026-10-31',settings,free).id,'sakura');
 assert.equal(selectedFlower('2026-11-01',settings,free).id,'chrysanthemum');
 assert.equal(selectedFlower('2026-11-01',settings,{premium:true}).id,'sakura');
 assert.equal(selectedFlower('2025-10-01',settings,free).id,'osmanthus');
 assert.equal(selectedFlower('2026-11-01',settings,{premium:true,freePeriods:[{from:'2026-11',to:'2026-11'}]}).id,'chrysanthemum');
});
test('sets never write past months; explicit confirmations explain current month backdating',()=>{
 assert.deepEqual(Object.keys(setMonths(2026,'2026-10-22')),['2026-10','2026-11','2026-12']);
 assert.equal(Object.keys(setMonths(2027,'2026-10-22')).length,12);
 assert.match(flowerConfirmation('2026-10','2026-10-22'),/今月1日/);
 assert.doesNotMatch(flowerConfirmation('2026-10','2026-10-01'),/途中/);
 assert.match(setConfirmation(2026,'2026-10-22'),/先月以前/);
});
test('wallpaper photo status shows the selected file name instead of no-file after re-render',()=>{
 assert.equal(wallpaperPhotoLabel([]),'ファイル未選択');
 const photo={key:'localWallpaperPhoto',value:'data:image/jpeg;base64,AAAA'};
 assert.equal(wallpaperPhotoLabel([photo,{key:'localWallpaperPhotoEnabled',value:true}]),'選択中：写真を設定済み');
 assert.equal(wallpaperPhotoLabel([photo,{key:'localWallpaperPhotoEnabled',value:true},{key:'localWallpaperPhotoName',value:'IMG_1234.jpg'}]),'選択中：IMG_1234.jpg');
 assert.equal(wallpaperPhotoLabel([photo,{key:'localWallpaperPhotoEnabled',value:false},{key:'localWallpaperPhotoName',value:'IMG_1234.jpg'}]),'保存済み：IMG_1234.jpg');
});
test('wallpaper photo preview only accepts the stored JPEG data URL format',()=>{
 assert.equal(wallpaperPhotoSource([{key:'localWallpaperPhoto',value:'data:image/jpeg;base64,AAAA'}]),'data:image/jpeg;base64,AAAA');
 assert.equal(wallpaperPhotoSource([{key:'localWallpaperPhoto',value:'https://example.com/photo.jpg'}]),'');
 assert.equal(wallpaperPhotoSource([]),'');
});
