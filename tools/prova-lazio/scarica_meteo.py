"""Scaricamento lento del meteo storico da Open-Meteo (preregistrazione-italia.md, sezione 7).

Legge dati/richieste.json (scritto da richieste.py) e scarica, una richiesta alla volta:
- tipo «meteo»: Historical Forecast API (`/v1/forecast` su historical-forecast-api.open-meteo.com);
- tipo «quota»: Elevation API (fino a 100 coordinate per richiesta).

Regole:
- cache per richiesta in dati/meteo/<chiave>.json, scrittura atomica; una richiesta salvata non si ripete e si
  riparte da dove ci si è fermati;
- al massimo una richiesta ogni --intervallo secondi (20) e tetti di chiamate pesate --max-ora (150) e
  --max-giorno (1500), su finestre mobili di 1 e 24 ore; peso meteo = max(1, variabili/10) × max(1, giorni/14),
  peso quota = coordinate × --peso-quota-coordinata (1: prudente, il peso reale non è documentato);
- su 429, 5xx o errore di rete: pausa crescente --backoff (15, 30, 60, 120, 240, 360 minuti; dopo l'ultimo resta
  360), poi riparte da solo; una risposta buona riporta la pausa a 15. Un 429 non conta fra i tentativi della
  richiesta; 6 errori di altro tipo, o un 4xx diverso da 429, la mettono «in sospeso» (non si riprova);
- log semplice dati/meteo.log (una riga per evento, separata da tabulazioni): ora UTC, evento, chiave, tipo,
  priorità, peso stimato, codice HTTP, durata, nota. Il log serve anche a ricostruire i conti alla ripartenza;
- SIGTERM o SIGINT: chiude pulito (finisce di salvare, scrive «fermato» ed esce con 0);
- un solo processo alla volta (dati/meteo.lock).

Uso:
  nohup python3 -I scarica_meteo.py >> dati/meteo.out 2>&1 &
  python3 -I scarica_meteo.py --stato
"""
import argparse
import datetime as dt
import fcntl
import json
import os
import signal
import sys
import threading
import time
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comune as C  # noqa: E402

URL_METEO = 'https://historical-forecast-api.open-meteo.com/v1/forecast'
URL_QUOTA = 'https://api.open-meteo.com/v1/elevation'
EVENTI_INVIATI = {'ok', 'ripiego', '429', 'errore-http', 'errore-rete', 'rifiutata'}
CAMPI_LOG = ['ora', 'evento', 'chiave', 'tipo', 'priorita', 'peso', 'http', 'secondi', 'nota']
MAX_ERRORI = 6


class Stato:
    """Ciò che serve per ripartire, ricostruito dal log e dalla cache."""

    def __init__(self, cartella):
        self.cartella = cartella
        self.cache = os.path.join(cartella, 'meteo')
        self.log_fp = os.path.join(cartella, 'meteo.log')
        self.inviati = []          # (epoch, peso)
        self.errori = {}           # chiave -> errori non 429
        self.sospese = {}          # chiave -> motivo
        self.ripiego = set()       # chiavi da rifare con il punto di ripiego
        self.livello = 0           # gradino della pausa
        self.ultimo_429 = None
        self.n429 = []
        self.pausa_fino = 0.0
        self.ultimo_invio = 0.0
        os.makedirs(self.cache, exist_ok=True)
        self._leggi_log()

    def _leggi_log(self):
        if not os.path.exists(self.log_fp):
            return
        with open(self.log_fp) as f:
            for riga in f:
                v = riga.rstrip('\n').split('\t')
                if len(v) < len(CAMPI_LOG) or v[0] == 'ora':
                    continue
                r = dict(zip(CAMPI_LOG, v))
                try:
                    t = dt.datetime.strptime(r['ora'], '%Y-%m-%dT%H:%M:%S.%fZ').replace(tzinfo=dt.timezone.utc).timestamp()
                except ValueError:
                    continue
                self._applica(t, r)

    def _applica(self, t, r):
        ev, k = r['evento'], r['chiave']
        if ev in EVENTI_INVIATI:
            self.inviati.append((t, float(r['peso'] or 0)))
            self.ultimo_invio = max(self.ultimo_invio, t)
        if ev in ('ok', 'ripiego'):
            self.livello = 0
            self.pausa_fino = 0.0
            self.errori.pop(k, None)
            if ev == 'ripiego':
                self.ripiego.add(k)
        elif ev == '429':
            self.ultimo_429 = t
            self.n429.append(t)
        elif ev in ('errore-http', 'errore-rete'):
            self.errori[k] = self.errori.get(k, 0) + 1
        elif ev == 'sospesa':
            self.sospese[k] = r['nota']
        elif ev == 'pausa':
            # nota = "livello=N fino=EPOCH"
            parti = dict(x.split('=', 1) for x in r['nota'].split() if '=' in x)
            self.livello = int(parti.get('livello', self.livello))
            self.pausa_fino = float(parti.get('fino', self.pausa_fino))

    def registra(self, evento, q=None, peso='', http='', secondi='', nota=''):
        ora = dt.datetime.now(dt.timezone.utc)
        r = {'ora': ora.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z', 'evento': evento,
             'chiave': (q or {}).get('chiave', ''), 'tipo': (q or {}).get('tipo', ''),
             'priorita': str((q or {}).get('priorita', '')), 'peso': str(peso), 'http': str(http),
             'secondi': secondi if isinstance(secondi, str) else f'{secondi:.1f}', 'nota': str(nota).replace('\t', ' ').replace('\n', ' ')}
        nuovo = not os.path.exists(self.log_fp)
        with open(self.log_fp, 'a') as f:
            if nuovo:
                f.write('\t'.join(CAMPI_LOG) + '\n')
            f.write('\t'.join(r[c] for c in CAMPI_LOG) + '\n')
            f.flush()
            os.fsync(f.fileno())
        # «ora» ha i millesimi: si rilegge come nel log
        self._applica(dt.datetime.strptime(r['ora'], '%Y-%m-%dT%H:%M:%S.%fZ').replace(tzinfo=dt.timezone.utc).timestamp(), r)

    def fatta(self, k):
        return os.path.exists(os.path.join(self.cache, k + '.json'))

    def peso_finestra(self, secondi, adesso):
        return sum(w for t, w in self.inviati if adesso - t < secondi)


def peso(q, peso_coord):
    if q['tipo'] == 'quota':
        return round(len(q['coordinate']) * peso_coord, 4)
    variabili = len(q['daily']) + len(q['hourly'])
    return round(max(1.0, variabili / 10) * max(1.0, q['giorni'] / 14), 4)


def url_di(q, a, ripiego=False):
    if q['tipo'] == 'quota':
        lat = ','.join(f'{c[0]:.5f}' for c in q['coordinate'])
        lon = ','.join(f'{c[1]:.5f}' for c in q['coordinate'])
        return a.url_quota + '?' + urllib.parse.urlencode({'latitude': lat, 'longitude': lon})
    lat, lon = (q['ripiego'] if ripiego else (q['lat'], q['lon']))
    p = {'latitude': f'{lat:.4f}', 'longitude': f'{lon:.4f}', 'daily': ','.join(q['daily']), 'hourly': ','.join(q['hourly']),
         'timezone': 'Europe/Rome', 'start_date': q['inizio'], 'end_date': q['fine'], 'models': q['modello']}
    return a.url_meteo + '?' + urllib.parse.urlencode(p)


def attesa_tetto(inviati, w, tetto, finestra, adesso):
    """Secondi da aspettare perché la somma dei pesi nella finestra mobile più w resti entro il tetto."""
    ev = sorted((t, x) for t, x in inviati if adesso - t < finestra)
    somma = sum(x for _, x in ev)
    if somma + w <= tetto or not ev:
        return 0.0
    for t, x in ev:
        somma -= x
        if somma + w <= tetto:
            return max(0.0, t + finestra - adesso)
    return max(0.0, ev[-1][0] + finestra - adesso)


def suolo_assente(risposta):
    h = (risposta or {}).get('hourly') or {}
    return not any(v is not None for v in (h.get('soil_moisture_3_to_9cm') or []))


def controlla(q, risposta):
    if not isinstance(risposta, dict) or risposta.get('error'):
        return f"risposta con errore: {(risposta or {}).get('reason') if isinstance(risposta, dict) else 'non JSON'}"
    if q['tipo'] == 'quota':
        el = risposta.get('elevation')
        return None if isinstance(el, list) and len(el) == len(q['coordinate']) else 'quote mancanti'
    d = risposta.get('daily') or {}
    if not d.get('time'):
        return 'serie giornaliera mancante'
    return None


def ciclo(a, st, richieste, ferma):
    s = a.scala_tempo
    passi = [float(x) * 60 for x in a.backoff.split(',')]
    salvate = 0

    def dormi(secondi, motivo, q=None):
        if secondi <= 0:
            return
        if secondi >= 60:
            st.registra('attesa', q, nota=f'{motivo}: {secondi / 60:.1f} min')
        ferma.wait(secondi * s)

    def pausa(q, motivo):
        attesa = passi[min(st.livello, len(passi) - 1)]
        livello = min(st.livello + 1, len(passi) - 1)
        st.registra('pausa', q, nota=f'livello={livello} fino={time.time() + attesa * s:.3f} motivo={motivo} minuti={attesa / 60:g}')
        ferma.wait(attesa * s)

    st.registra('avvio', nota=f'richieste={len(richieste)} max_ora={a.max_ora} max_giorno={a.max_giorno} intervallo={a.intervallo} '
                               f'priorita={a.priorita} pid={os.getpid()}')
    while not ferma.is_set():
        prossima = next((q for q in richieste if not st.fatta(q['chiave']) and q['chiave'] not in st.sospese), None)
        if prossima is None:
            st.registra('finito', nota='nessuna richiesta mancante')
            return 0
        q = prossima
        w = peso(q, a.peso_quota_coordinata)
        adesso = time.time()
        attese = {
            'pausa dopo errore': (st.pausa_fino - adesso) / s if st.pausa_fino > adesso else 0.0,
            'intervallo': a.intervallo - (adesso - st.ultimo_invio) / s,
            'tetto orario': attesa_tetto(st.inviati, w, a.max_ora, 3600 * s, adesso) / s,
            'tetto giornaliero': attesa_tetto(st.inviati, w, a.max_giorno, 86400 * s, adesso) / s,
        }
        motivo, secondi = max(attese.items(), key=lambda kv: kv[1])
        if secondi > 0:
            dormi(secondi, motivo, q)
            continue
        rip = q['chiave'] in st.ripiego and q['tipo'] == 'meteo'
        url = url_di(q, a, ripiego=rip)
        t0 = time.time()
        try:
            codice, risposta = C.http_json(url, timeout=a.timeout)
        except C.ErroreHTTP as e:
            dur = time.time() - t0
            if e.codice == 429:
                st.registra('429', q, w, 429, dur, e.corpo[:150])
                pausa(q, '429')
            elif e.codice >= 500:
                st.registra('errore-http', q, w, e.codice, dur, e.corpo[:150])
                if st.errori.get(q['chiave'], 0) >= MAX_ERRORI:
                    st.registra('sospesa', q, nota=f'{MAX_ERRORI} errori, ultimo HTTP {e.codice}')
                pausa(q, f'HTTP {e.codice}')
            else:
                st.registra('rifiutata', q, w, e.codice, dur, e.corpo[:150])
                st.registra('sospesa', q, nota=f'HTTP {e.codice}: {e.corpo[:150]}')
            continue
        except (OSError, ValueError) as e:
            dur = time.time() - t0
            st.registra('errore-rete', q, w, '', dur, repr(e)[:150])
            if st.errori.get(q['chiave'], 0) >= MAX_ERRORI:
                st.registra('sospesa', q, nota=f'{MAX_ERRORI} errori di rete')
            pausa(q, 'rete')
            continue
        dur = time.time() - t0
        problema = controlla(q, risposta)
        if problema:
            st.registra('rifiutata', q, w, codice, dur, problema)
            st.registra('sospesa', q, nota=problema)
            continue
        if q['tipo'] == 'meteo' and not rip and q.get('ripiego') and suolo_assente(risposta):
            st.registra('ripiego', q, w, codice, dur, 'umidità del suolo assente nel punto: si riprova con il ripiego')
            continue
        nota = 'punto di ripiego' if rip else ''
        if q['tipo'] == 'meteo' and suolo_assente(risposta):
            nota = (nota + ' suolo assente').strip()
        dati = {'chiave': q['chiave'], 'richiesta': q, 'url': url, 'scaricato': C.adesso_iso(), 'http': codice,
                'punto': 'ripiego' if rip else 'cella', 'risposta': risposta}
        C.scrivi_atomico(os.path.join(st.cache, q['chiave'] + '.json'), json.dumps(dati, ensure_ascii=False))
        st.registra('ok', q, w, codice, dur, nota)
        salvate += 1
        if a.max_richieste and salvate >= a.max_richieste:
            st.registra('fermato', nota=f'raggiunto --max-richieste {a.max_richieste}')
            return 0
    st.registra('fermato', nota='segnale di chiusura')
    return 0


def carica_richieste(a):
    with open(a.richieste) as f:
        el = json.load(f)['richieste']
    prio = {int(x) for x in a.priorita.split(',')}
    el = [q for q in el if q['priorita'] in prio]
    ordine = {q['chiave']: k for k, q in enumerate(el)}
    el.sort(key=lambda q: (q['priorita'], ordine[q['chiave']]))
    return el


def stato(a):
    st = Stato(a.dati)
    try:
        tutte = carica_richieste(a)
    except FileNotFoundError:
        print(f'manca {a.richieste}: lancia richieste.py')
        return 1
    adesso = time.time()
    oggi = dt.datetime.now(dt.timezone.utc).date()
    inizio_oggi = dt.datetime.combine(oggi, dt.time(), dt.timezone.utc).timestamp()
    righe = []
    mancante = 0.0
    for p in sorted({q['priorita'] for q in tutte}):
        qs = [q for q in tutte if q['priorita'] == p]
        fatte = [q for q in qs if st.fatta(q['chiave'])]
        sosp = [q for q in qs if q['chiave'] in st.sospese and not st.fatta(q['chiave'])]
        manc = [q for q in qs if not st.fatta(q['chiave']) and q['chiave'] not in st.sospese]
        wm = sum(peso(q, a.peso_quota_coordinata) for q in manc)
        mancante += wm
        nome = {1: 'meteo P1/P2', 2: 'C-BM (best match)', 3: 'quote dei casi', 4: 'quote dei controlli'}.get(p, '?')
        righe.append(f'  priorità {p} ({nome}): fatte {len(fatte)}, mancanti {len(manc)}, in sospeso {len(sosp)}, '
                     f'peso mancante {wm:.0f}')
    try:
        fd = os.open(os.path.join(a.dati, 'meteo.lock'), os.O_RDWR | os.O_CREAT)
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        attivo = 'no'
        fcntl.flock(fd, fcntl.LOCK_UN)
    except OSError:
        attivo = 'sì'
    w_oggi = sum(w for t, w in st.inviati if t >= inizio_oggi)
    w24 = st.peso_finestra(86400, adesso)
    w1 = st.peso_finestra(3600, adesso)
    print(f'Scaricamento del meteo ({a.richieste})')
    print(f'  processo attivo: {attivo}')
    print('\n'.join(righe))
    print(f'  chiamate pesate oggi (UTC {oggi}): {w_oggi:.1f} su {a.max_giorno:g}; ultime 24 h {w24:.1f}; ultima ora {w1:.1f} su {a.max_ora:g}')
    if st.ultimo_429:
        n_oggi = sum(1 for t in st.n429 if t >= inizio_oggi)
        print(f'  ultimo 429: {dt.datetime.fromtimestamp(st.ultimo_429, dt.timezone.utc):%Y-%m-%d %H:%M} UTC; 429 oggi: {n_oggi}')
    else:
        print('  ultimo 429: nessuno')
    if st.pausa_fino > adesso:
        print(f'  in pausa fino alle {dt.datetime.fromtimestamp(st.pausa_fino, dt.timezone.utc):%Y-%m-%d %H:%M} UTC (gradino {st.livello})')
    giorni_teo = mancante / a.max_giorno if a.max_giorno else float('inf')
    print(f'  stima dei giorni rimanenti: {giorni_teo:.1f} al tetto di {a.max_giorno:g}/giorno', end='')
    if w24 > 0 and st.inviati and adesso - min(t for t, _ in st.inviati) >= 86400:
        print(f'; {mancante / w24:.1f} al ritmo delle ultime 24 h')
    else:
        print()
    if st.sospese:
        print(f'  in sospeso: {len(st.sospese)} (motivi nel log, evento «sospesa»)')
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dati', default=C.DATI)
    ap.add_argument('--richieste', default=None, help='predefinito: <dati>/richieste.json')
    ap.add_argument('--stato', action='store_true', help='stampa lo stato ed esce')
    ap.add_argument('--max-ora', type=float, default=150)
    ap.add_argument('--max-giorno', type=float, default=1500)
    ap.add_argument('--intervallo', type=float, default=20, help='secondi minimi fra due richieste')
    ap.add_argument('--backoff', default='15,30,60,120,240,360', help='minuti')
    ap.add_argument('--priorita', default='1,2,3,4')
    ap.add_argument('--peso-quota-coordinata', type=float, default=1.0)
    ap.add_argument('--max-richieste', type=int, default=0, help='si ferma dopo N richieste salvate (prove)')
    ap.add_argument('--timeout', type=float, default=120)
    ap.add_argument('--url-meteo', default=URL_METEO)
    ap.add_argument('--url-quota', default=URL_QUOTA)
    ap.add_argument('--scala-tempo', type=float, default=1.0, help='solo per le prove con il server finto')
    a = ap.parse_args()
    a.richieste = a.richieste or os.path.join(a.dati, 'richieste.json')
    if min(a.intervallo, a.max_ora, a.max_giorno) <= 0:
        raise SystemExit('intervallo e tetti devono essere positivi')
    if a.stato:
        return stato(a)
    os.makedirs(a.dati, exist_ok=True)
    fd = os.open(os.path.join(a.dati, 'meteo.lock'), os.O_RDWR | os.O_CREAT)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        raise SystemExit('un altro scarica_meteo.py è già in corso su questa cartella')
    ferma = threading.Event()
    for sig in (signal.SIGTERM, signal.SIGINT):
        signal.signal(sig, lambda *_: ferma.set())
    st = Stato(a.dati)
    richieste = carica_richieste(a)
    return ciclo(a, st, richieste, ferma)


if __name__ == '__main__':
    sys.exit(main())
