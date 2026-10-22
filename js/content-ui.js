// Presentazione dei dati esistenti, senza deduzioni botaniche o modifiche ai testi delle fonti.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
  leaf:'<path d="M20 4C9 2 3 8 6 15s15 3 14-11Z"/><path d="M5 21c1-6 4-10 10-13"/>',
  pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  // cautele: scudo con «!»; la spunta resta solo dove non si parla di consumo o preparazione
  caution:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="M12 8v5M12 16h.01"/>',
};
export const contentIcon = (name='leaf') => `<svg class="content-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.leaf}</svg>`;

export function factCards(facts, {glossary=''}={}) {
  const valid = facts.filter(f=>f && (f.value || f.html || f.items?.length));
  return valid.length ? `<dl class="content-facts">${valid.map(f=>`<div class="content-fact${f.wide?' content-fact-wide':''}${f.tone==='caution'?' content-fact-caution':''}"><dt>${contentIcon(f.tone==='caution'?'caution':f.icon)}<span>${esc(f.label)}</span></dt><dd${glossary?` data-glossary="${esc(glossary)}"`:''}>${f.items?`<ul class="content-values">${f.items.filter(Boolean).map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`:f.html||esc(f.value)}</dd></div>`).join('')}</dl>` : '';
}
const monthsShort = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
const monthsLong = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
export function monthCalendar(months, {label='Periodo indicativo'}={}) {
  const active = [...new Set((Array.isArray(months)?months:[]).filter(m=>Number.isInteger(m)&&m>=1&&m<=12))].sort((a,b)=>a-b);
  if (!active.length) return '';
  const ranges=[];
  for (const month of active) {
    const range=ranges[ranges.length-1];
    if (range && month===range[1]+1) range[1]=month;
    else ranges.push([month,month]);
  }
  const summary=active.length===12?'Tutto l’anno':ranges.map(([a,b])=>a===b?monthsShort[a-1]:`${monthsShort[a-1]}–${monthsShort[b-1]}`).join(' · ');
  return `<section class="content-calendar" aria-label="${esc(label)}"><div class="content-calendar-heading"><span>${contentIcon('calendar')}${esc(label)}</span><b>${summary}</b></div>${active.length===12?'':`<ol class="content-months" aria-label="Mesi indicati nella fonte">${monthsShort.map((m,i)=>`<li class="${active.includes(i+1)?'is-active':'is-inactive'}" aria-label="${monthsLong[i]}: ${active.includes(i+1)?'indicato nella fonte':'fuori dal periodo indicato'}">${m}</li>`).join('')}</ol>`}</section>`;
}

// I periodi editoriali diventano punti leggibili conservando testo, link ed enfasi originali.
export function enhanceContentReading(root) {
  if (!root) return;
  root.classList.add('content-reading');
  for (const list of root.querySelectorAll('ul')) {
    if (list.closest('.content-points,.src-list')) continue;
    if ([...list.children].some(li=>li.firstElementChild?.matches('strong,b'))) list.classList.add('content-rule-list');
  }
  if (!globalThis.Intl?.Segmenter) return;
  const segmenter = new Intl.Segmenter('it', {granularity:'sentence'});
  for (const paragraph of [...root.querySelectorAll('p')]) {
    if (paragraph.closest('li,figcaption,summary,nav,.content-facts,.notice,.attention,.content-points') || paragraph.matches('.small,.muted,.article-lede') || paragraph.querySelector('.btn,button,img')) continue;
    const text=paragraph.textContent;
    if (text.length<180) continue;
    const segments=[];
    for (const part of segmenter.segment(text)) {
      const previous=segments.at(-1);
      // Nei testi tecnici una breve frase di raccordo resta con la successiva.
      // Nelle guide i caratteri descritti mantengono invece la propria riga.
      if (!root.matches('.editorial-article') && previous?.segment.trim().length<70) previous.segment+=part.segment;
      else segments.push({segment:part.segment,index:part.index});
    }
    if (segments.length<3) continue;
    const nodes=[];let length=0;
    const walker=document.createTreeWalker(paragraph,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()) { const node=walker.currentNode; nodes.push({node,start:length,end:length+node.length}); length+=node.length; }
    const list=document.createElement('ul');list.className='content-points';
    if(paragraph.id)list.id=paragraph.id;
    if(paragraph.dataset.glossary)list.dataset.glossary=paragraph.dataset.glossary;
    for(const {segment,index} of segments) {
      const start=nodes.find(n=>n.end>index), end=nodes.find(n=>n.end>=index+segment.length);
      if(!start||!end)continue;
      const range=document.createRange();range.setStart(start.node,index-start.start);range.setEnd(end.node,index+segment.length-end.start);
      const item=document.createElement('li');item.append(range.cloneContents());list.append(item);
    }
    if(list.childElementCount===segments.length)paragraph.replaceWith(list);
  }
}

// Enfasi editoriali esplicite: soltanto parole già presenti, una volta per voce.
// Non modifica titoli, link, citazioni, fonti o avvisi di sicurezza.
export function emphasizeContent(root, phrases = []) {
  if (!root) return;
  for (const phrase of phrases) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode(node) {
      return node.parentElement.closest('p,li') && !node.parentElement.closest('a,b,strong,summary,figcaption,.eyebrow,.article-lede,.small,.muted,.attention,.notice')
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }});
    while (walker.nextNode()) {
      const node = walker.currentNode, index = node.data.toLocaleLowerCase('it').indexOf(phrase.toLocaleLowerCase('it'));
      if (index < 0) continue;
      const bold = document.createElement('strong');
      const match = node.splitText(index);
      match.splitText(phrase.length);
      match.replaceWith(bold); bold.append(match);
      break;
    }
  }
}

// Titoli tecnici: un accesso discreto al glossario, distinto dai termini nel testo.
export function glossaryHeading(id,label) {
  if(!/^[a-z0-9-]+$/.test(id||''))return esc(label);
  return `<a class="glossary-link glossary-heading" data-term="${id}" href="#/glossario/${id}" aria-haspopup="dialog" aria-label="${esc(label)}: apri il glossario">${esc(label)}<span class="glossary-heading-mark" aria-hidden="true">?</span></a>`;
}
