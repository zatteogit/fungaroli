// Archivio editoriale separato dai dati scientifici e dalle osservazioni.
export function thoughtErrors(database) {
  const errors = [], ids = new Set(), texts = new Set();
  if (database?.schemaVersion !== 1 || !Array.isArray(database.items)) return ['Archivio frasi non valido.'];
  const vocab = {
    tones: ['curioso','riflessivo','caldo','leggero','ironico','poetico'],
    contexts: ['home','taccuino','uscita'],
    moments: ['pausa','prima-di-uscire','rientro','mattina','sera'],
    seasons: ['tutte','primavera','estate','autunno','inverno'],
  };
  for (const item of database.items) {
    const name = item?.id || 'Frase';
    if (!item || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(item.id || '') || ids.has(item.id)) errors.push(`${name}: ID mancante o duplicato.`);
    ids.add(item?.id);
    if (typeof item?.text !== 'string' || !item.text.trim() || item.text.length > 160 || texts.has(item.text.trim().toLowerCase())) errors.push(`${name}: testo mancante, duplicato o oltre 160 caratteri.`);
    texts.add(item?.text?.toLowerCase?.().trim());
    if (!['citazione','aforisma','battuta','barzelletta'].includes(item?.type) || !['draft','published','archived'].includes(item?.status) || item?.language !== 'it') errors.push(`${name}: tipo, stato o lingua non validi.`);
    for (const key of ['tags',...Object.keys(vocab)]) {
      const values = item?.[key];
      if (!Array.isArray(values) || !values.length || values.some(v => typeof v !== 'string' || !v.trim() || (vocab[key] && !vocab[key].includes(v))) || new Set(values).size !== values.length) errors.push(`${name}: ${key} non validi.`);
    }
    if (item?.type === 'citazione') {
      if (typeof item.author !== 'string' || !item.author.trim() || item.rights !== 'pubblico-dominio' || !/^https:\/\/[^\s"'<>]+$/.test(item.source?.url || '') || !item.source?.title || !/^\d{4}-\d{2}-\d{2}$/.test(item.source?.verifiedOn || '') || (item.status === 'published' && item.source?.verified !== true)) errors.push(`${name}: citazione senza attribuzione, fonte o verifica.`);
    } else if (item?.rights !== 'originale-fronda' || item?.author !== 'Fronda') errors.push(`${name}: distinguere il testo originale dalle citazioni.`);
  }
  return errors;
}

export function romeDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = type => parts.find(p => p.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function seasonOf(day) {
  const month = Number(day.slice(5, 7));
  return ['inverno', 'primavera', 'estate', 'autunno'][Math.floor(month % 12 / 3)];
}

export function findThoughts(database, filters = {}) {
  return (database?.items || []).filter(item => {
    if (typeof item.id !== 'string' || item.status !== 'published' || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 160) return false;
    if (!['originale-fronda', 'pubblico-dominio'].includes(item.rights)) return false;
    if (item.type === 'citazione' && (!item.author || item.source?.verified !== true || !/^https:\/\//.test(item.source.url))) return false;
    return Object.entries(filters).every(([key, wanted]) => {
      if (!wanted?.length) return true;
      const values = [].concat(item[key] || []);
      return values.includes('tutte') || wanted.some(value => values.includes(value));
    });
  });
}

export function selectDailyThought(database, day = romeDay(), context = 'home') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const ordinal = Date.parse(`${day}T12:00:00Z`) / 86400000;
  if (!Number.isFinite(ordinal) || new Date(ordinal * 86400000).toISOString().slice(0, 10) !== day) return null;
  const items = findThoughts(database, { contexts: [context], seasons: [seasonOf(day)] })
    .sort((a, b) => a.id.localeCompare(b.id, 'en'));
  if (!items.length) return null;
  return items[Math.floor(ordinal) % items.length];
}

export async function initDailyThought({ root = document.querySelector('#daily-thought'), embedded } = {}) {
  if (!root) return;
  let database = embedded;
  try {
    if (!database) {
      const response = await fetch('data/daily-thoughts.json', { signal: AbortSignal.timeout(5000) });
      if (!response.ok) return;
      database = await response.json();
    }
    if (database?.schemaVersion !== 1 || !Array.isArray(database.items)) return;
    let shownDay;
    const render = () => {
      const day = romeDay();
      if (day === shownDay) return;
      const item = selectDailyThought(database, day);
      root.replaceChildren();
      root.hidden = !item;
      if (!item) return;
      const label = document.createElement('span');
      label.className = 'daily-thought-label';
      label.textContent = 'La frase del giorno';
      const copy = document.createElement('div');
      const text = document.createElement('p');
      text.className = 'daily-thought-text';
      text.textContent = item.text.replace(/,\s*$/u, '');
      const credit = document.createElement(item.type === 'citazione' ? 'a' : 'span');
      credit.className = 'daily-thought-credit';
      credit.textContent = item.author || 'Fronda';
      if (item.type === 'citazione') {
        credit.href = item.source.url;
        credit.target = '_blank';
        credit.rel = 'noopener noreferrer';
        credit.title = `${item.source.title} · fonte della citazione`;
        credit.setAttribute('aria-label', `${credit.textContent}. Fonte: ${item.source.title}`);
      }
      copy.append(text, credit);
      root.append(label, copy);
      root.dataset.thoughtId = item.id;
      root.dataset.day = day;
      shownDay = day;
    };
    render();
    // Nessun carosello: cambia soltanto al giorno successivo, anche dopo standby.
    const checkDay = () => { if (!document.hidden) render(); };
    document.addEventListener('visibilitychange', checkDay);
    const timer = setInterval(checkDay, 60000);
    window.addEventListener('pagehide', event => {
      if (event.persisted) return;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', checkDay);
    });
  } catch {
    // Il contenuto facoltativo non deve mai bloccare uscite, meteo o filtri.
    root.hidden = true;
  }
}
