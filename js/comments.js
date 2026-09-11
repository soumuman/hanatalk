import {parseDate} from './calendar.js';
export function commentGroup(logs,date){const dates=[...new Set(logs.filter(l=>l.date<date).map(l=>l.date))].sort();if(!dates.length)return 'first';const gap=Math.round((parseDate(date)-parseDate(dates.at(-1)))/86400000);if(gap>=30)return 'long';if(gap>=7)return 'again';if(dates.filter(d=>d.startsWith(date.slice(0,7))).length>=8)return 'month';return dates.length>=4?'often':'early';}
const messages={first:['これからよろしくね 🌱','小さなつながりが生まれました 🌱'],early:['今日もおしゃべりできました','ひとこと交わせましたね'],often:['いつもありがとう ❤️','いつものつながりを大切に'],again:['なんだか久しぶり 😀','またお話しできましたね'],long:['お久しぶり！','久しぶりの声を聞けましたね'],month:['今月よくお話ししています','今月もつながっていますね']};
let previous='';
export function pickComment(logs,date){const options=messages[commentGroup(logs,date)].filter(m=>m!==previous);previous=options[Math.floor(Math.random()*options.length)];return previous;}
