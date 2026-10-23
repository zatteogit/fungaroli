// Vecchio diario sincronizzato con un codice condiviso (Workers KV): dismesso il 22/10/2026 (decisione di Matteo).
//
// L'API non legge, non scrive e non cancella più nulla: ogni richiesta riceve 410. Le voci 'entry:' già salvate
// restano nel namespace finché il gestore non le esporta e poi le cancella con Wrangler, secondo la procedura in
// docs/legale.md, §6.5. Il binding KV DIARIO resta in wrangler.jsonc perché ospita anche la cache meteo condivisa
// (worker/index.js). Il segreto DIARIO_TOKEN non serve più a questo codice.

const GONE = {
  error: 'Servizio dismesso: il vecchio taccuino con codice non è più disponibile. Usa il taccuino di Fronda; per una copia delle voci salvate scrivi al gestore indicato in «Privacy e dati».',
  code: 'diario_dismesso',
};

const gone = () => new Response(JSON.stringify(GONE), {
  status: 410,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
});

// Pages Functions: functions/api/diario/[[path]].js
export function onRequest() {
  return gone();
}

// Usata anche dal Worker (worker/index.js) per /api/diario e /api/diario/<id>.
export async function handleDiario() {
  return gone();
}
