// Copia personale dei dati (art. 15 e 20 GDPR, decisione di Matteo del 22/10/2026): un file JSON con le foto incluse,
// leggibile anche da altri programmi. Con un profilo il file arriva dal server (GET /api/community/export);
// senza profilo si scarica il taccuino conservato su questo dispositivo.
export const EXPORT_FORMAT = 'fronda-export-v1';
const day = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
export const exportFilename = (kind, date = new Date()) => `fronda-${kind}-${day(date)}.json`;

// Il server chiude il file con complete:true: un download interrotto non viene salvato come se fosse completo.
export const completeExport = (text) => typeof text === 'string' && text.startsWith(`{"format":"${EXPORT_FORMAT}"`) && /,"complete":true\}\s*$/.test(text);

// Taccuino del dispositivo: le voci con le foto già lette da IndexedDB e la conferma degli avvisi, se presente.
export function deviceNotebookExport({ entries, legalAcceptance = null, exportedAt = new Date().toISOString() }) {
  return {
    format: EXPORT_FORMAT, exportedAt, scope: 'device',
    description: 'Copia del taccuino salvato su questo dispositivo, senza profilo: voci, foto (JPEG in base64) e conferma degli avvisi.',
    account: null, entries: entries.map(({ photoUnavailable, ...entry }) => (photoUnavailable ? { ...entry, photo: null, photoMissing: true } : entry)),
    legalAcceptances: legalAcceptance ? [legalAcceptance] : [], complete: true,
  };
}

export async function saveJsonFile(filename, text) {
  const downloads = typeof globalThis.claude?.use === 'function' ? await Promise.resolve(globalThis.claude.use('downloads')).catch(() => null) : null;
  if (downloads) { await downloads.save({ filename, data: text }); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = filename; a.hidden = true; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
}

export async function downloadAccountData({ signal } = {}) {
  const res = await fetch('/api/community/export', { credentials: 'same-origin', cache: 'no-store', signal });
  if (!res.ok) {
    let out = {}; try { out = await res.json(); } catch { /* risposta non JSON */ }
    throw Object.assign(new Error(out.error || 'Download non riuscito. Riprova.'), { status: res.status });
  }
  const text = await res.text();
  if (!completeExport(text)) throw new Error('Il file è arrivato incompleto. Riprova.');
  const named = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') || '')?.[1];
  await saveJsonFile(named && /^fronda-dati-\d{4}-\d{2}-\d{2}\.json$/.test(named) ? named : exportFilename('dati'), text);
}

export async function downloadDeviceNotebook(store, { legalAcceptance = null } = {}) {
  const entries = await store.list();
  await saveJsonFile(exportFilename('taccuino'), JSON.stringify(deviceNotebookExport({ entries, legalAcceptance })));
  return entries.length;
}
