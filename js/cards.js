import {escapeHTML as esc} from './people.js';
import {logCount,recordType} from './records.js';
export function entryCard(person,log){
  const count=log?logCount(log):0,type=recordType(person,log);
  return `<div class="talk-card kind-${type} ${count?'is-selected':''}" data-card="${person.id}"><button data-person="${person.id}" class="talk-card-body" aria-pressed="${count>0}" aria-label="${esc(person.displayName)}${count?'、選択済み、'+count+'人':''}"><span class="person-check">${count?'✓':'＋'}</span><span>${esc(person.displayName)}${!person.isActive?'<small>非表示の相手</small>':''}</span></button>${type==='group'&&count>0?`<div class="count-controls" aria-label="${esc(person.displayName)}の人数"><button data-count-target="${person.id}" data-count-action="decrement" aria-label="${esc(person.displayName)}を1人減らす">−</button><output aria-label="人数">${count}</output><button data-count-target="${person.id}" data-count-action="increment" aria-label="${esc(person.displayName)}を1人増やす">＋</button></div>`:''}</div>`;
}
export function settingsCard(person){
  return `<div class="person-tile kind-${person.type||'person'} ${!person.isActive?'inactive':''}" data-order-id="${person.id}"><button data-edit="${person.id}" class="person-tile-name"><strong>${esc(person.displayName)}</strong>${!person.isActive?'<small>非表示</small>':''}</button><button data-edit="${person.id}" class="card-menu" aria-label="${esc(person.displayName)}の設定">…</button><button class="drag-handle" data-drag-handle aria-label="${esc(person.displayName)}を並び替え。矢印キーでも移動できます">⠿</button></div>`;
}
