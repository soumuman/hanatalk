import test from 'node:test';import assert from 'node:assert/strict';
import {selectedFlower,setMonths,flowerConfirmation,setConfirmation,wallpaperPhotoLabel,hasWallpaperPhoto,wallpaperPhotoActive} from '../js/appearance-model.js';
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
test('wallpaper photo field shows the file name itself in place of the no-file text',()=>{
 assert.equal(wallpaperPhotoLabel([]),'ファイル未選択');
 const photo={key:'localWallpaperPhoto',value:'data:image/jpeg;base64,AAAA'};
 assert.equal(wallpaperPhotoLabel([photo]),'写真を設定済み');
 assert.equal(wallpaperPhotoLabel([photo,{key:'localWallpaperPhotoName',value:'IMG_4083.jpeg'}]),'IMG_4083.jpeg');
 assert.equal(wallpaperPhotoLabel([{key:'localWallpaperPhoto',value:''},{key:'localWallpaperPhotoName',value:'IMG_4083.jpeg'}]),'ファイル未選択');
 assert.equal(hasWallpaperPhoto([photo]),true);
 assert.equal(hasWallpaperPhoto([{key:'localWallpaperPhoto',value:''}]),false);
 assert.equal(hasWallpaperPhoto([]),false);
 // A stored photo is not the wallpaper until re-applied; another wallpaper choice turns it off without deleting it.
 assert.equal(wallpaperPhotoActive([photo]),false);
 assert.equal(wallpaperPhotoActive([photo,{key:'localWallpaperPhotoEnabled',value:true}]),true);
 assert.equal(wallpaperPhotoActive([photo,{key:'localWallpaperPhotoEnabled',value:false}]),false);
 assert.equal(wallpaperPhotoActive([{key:'localWallpaperPhotoEnabled',value:true}]),false);
});
