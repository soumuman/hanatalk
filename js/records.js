export const logTargetId = log => log.targetId ?? log.personId;
export const logCount = log => Number.isSafeInteger(log.count) && log.count >= 0 ? log.count : 1;
export const totalTalkCount = logs => logs.reduce((sum,log)=>sum+logCount(log),0);
// Keep historical multi-person counts editable without silently reducing them to one.
// One-person records can immediately use a newly chosen group type.
export const recordType = (person,log) => log && logCount(log)>1 ? 'group' : person.type || 'person';
export function nextTalkCount(previous,type,action){
  if(action==='toggle')return previous>0?0:1;
  if(type!=='group')throw new Error('人数調整は複数人のカードで利用できます');
  if(action==='increment'){
    if(previous>=Number.MAX_SAFE_INTEGER)throw new Error('これ以上は追加できません');
    return previous+1;
  }
  if(action==='decrement')return Math.max(0,previous-1);
  throw new Error('操作を確認してください');
}
