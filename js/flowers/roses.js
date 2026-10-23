import {main,light,dark,path,dot,ring,foliage} from './drawing.js';
export function renderRose(p){
 const outer=path('M50 44C25 48 18 34 24 23Q28 14 38 17Q46 8 56 17Q73 12 77 26C82 42 64 49 50 44Z');
 const middle=path('M50 44C33 46 28 33 36 25Q46 19 53 25Q67 21 68 34Q66 45 50 44Z',light);
 const inner=path('M50 44Q36 37 44 30Q55 25 61 36Q61 46 50 44Z');
 return foliage()+ring(5,p,outer)+ring(5,p,middle,36)+ring(3,p,inner,15)+path('M43 41Q45 34 53 36Q60 39 53 46Q45 49 43 41Z',light)+path('M46 40Q54 36 55 42Q52 46 48 43','none',dark,.8);
}
const shades=[['ivory','アイボリー',48,32,88],['blush','淡桃',349,48,86],['pink','ピンク',338,51,76],['apricot','アプリコット',26,65,77],['yellow','黄色',47,69,72],['coral','コーラル',10,59,74],['red','赤',354,48,62],['lavender','ラベンダー',269,32,76],['mauve','モーヴ',306,27,68],['tea','紅茶色',24,35,64],['burgundy','ワイン色',340,34,52],['white','白',65,18,93]];
export const roseFlowers=shades.map(([id,color,hue,saturation,lightness])=>({id:'rose-'+id,name:`バラ〈${color}〉`,hue,saturation,lightness,render:renderRose,set:'grayson',viewBox:'8 3 84 84'}));
// One quiet aside per month. Never judges the user's conversations or count.
export const graysonAsides=[
 '「庭は休んでいます、私の予定表は働き者ですがね」',
 '「棘まで愛でる必要はありませんよ」',
 '「バラは無口だが、手はかかる」',
 '「名前は優雅です、剪定は重労働ですがね」',
 '「庭は整いました、私の机は別ですが」',
 '「雨の日くらい、水やり係も休暇です」',
 '「日陰の席は、先に私が予約しました」',
 '「涼しい顔をしていますな、水は私が運ぶのに」',
 '「落ち葉は、掃いた場所がお好きらしい」',
 '「一輪で十分です、花瓶を洗うのは私ですから」',
 '「手袋を新調しました、棘には内緒です」',
 '「来年の庭ですか、まずはお茶にしましょう」'
];
