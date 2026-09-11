// One quiet seasonal observation for each month; no behavioral prompts.
export const seasonalNotes = [
  '澄んだ空気に、冬の光。',
  '日差しに、かすかな春の気配。',
  'やわらかな風が吹くころ。',
  '街にも色が増えてきました。',
  '若葉の緑が深まるころ。',
  '雨粒に、花の色が映ります。',
  '朝の光に、夏の気配。',
  '木陰を、夏の風が通ります。',
  '風に、少し秋の気配。',
  'ふと、香りに気づく季節。',
  '落ち葉が、道を彩るころ。',
  '冬の空に、光が澄むころ。'
];
export const getSeasonalNote = date => seasonalNotes[Number(date.slice(5,7))-1];
