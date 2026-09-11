export const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const parseDate=s=>new Date(Number(s.slice(0,4)),Number(s.slice(5,7))-1,Number(s.slice(8,10)),12);
export const formatDate=s=>new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(parseDate(s));
export function monthCells(year,month){const start=new Date(year,month,1,12).getDay();const days=new Date(year,month+1,0,12).getDate();return Array.from({length:Math.ceil((start+days)/7)*7},(_,i)=>i<start||i>=start+days?null:dateKey(new Date(year,month,i-start+1,12)));}
export function historyFor(logs,month=dateKey().slice(0,7)){const dates=[...new Set(logs.map(l=>l.date))].sort();return {firstTalkDate:dates[0]||null,lastTalkDate:dates.at(-1)||null,totalTalkDays:dates.length,currentMonthTalkDays:dates.filter(d=>d.startsWith(month)).length,historyMonth:month};}
