export const categories={family:'家族',friend:'友人',work:'仕事',neighborhood:'近所',shop:'お店',other:'その他'};
export const suggestions=[['妻','family'],['夫','family'],['子ども','family'],['父','family'],['母','family'],['親','family'],['友人','friend'],['同僚','work'],['上司','work'],['近所の人','neighborhood'],['店員さん','shop'],['その他','other']];
export function createPerson(displayName,category='other',sortOrder=0){return {id:crypto.randomUUID(),displayName:displayName.trim(),category,createdAt:new Date().toISOString(),sortOrder,isActive:true,firstTalkDate:null,lastTalkDate:null,totalTalkDays:0,currentMonthTalkDays:0};}
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
