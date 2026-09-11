import {parseDate} from './calendar.js';
export function commentGroup(logs,date){const dates=[...new Set(logs.filter(l=>l.date<date).map(l=>l.date))].sort();if(!dates.length)return 'first';const gap=Math.round((parseDate(date)-parseDate(dates.at(-1)))/86400000);if(gap>=30)return 'long';if(gap>=7)return 'again';if(dates.filter(d=>d.startsWith(date.slice(0,7))).length>=8)return 'month';return dates.length>=4?'often':'early';}
// Describe records, not the quality of a conversation or feelings toward someone.
const messages={
  first:['はじめての記録です 🌱','この人との最初の記録です','記録に加わりました'],
  early:['ひとつ、記録されました','声を交わした記録を残しました','この日の記録に追加しました'],
  often:['何度か記録されている相手です','声を交わした記録が増えました','この日も記録されました'],
  again:['少し久しぶりの記録です','久しぶりに記録されました','前の記録から少し間が空きました'],
  long:['お久しぶりですね','ずいぶん久しぶりの記録です','前の記録から間が空きました'],
  month:['今月よく登場しています','今月も何度か記録されています','今月の記録に加わりました']
};
let previous='';
export function pickComment(logs,date,count){
  if(count===5)return previous='今日の花が咲きました 🌸';
  const group=commentGroup(logs,date);
  // A completed flower keeps five petals, including when a new person is first recorded.
  const pool=group==='early'&&count<5
    ? ['花びらがひとつ色づきました','この日の花に一枚追加です','ひとつ、記録されました']
    : messages[group];
  const options=pool.filter(m=>m!==previous);
  previous=options[Math.floor(Math.random()*options.length)];
  return previous;
}
