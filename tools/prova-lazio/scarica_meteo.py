"""Scaricamento lento del meteo storico da Open-Meteo (preregistrazione-italia.md, sezione 7).

Legge dati/richieste.json (scritto da richieste.py) e scarica, una richiesta alla volta:
- tipo «meteo»: Historical Forecast API (`/v1/forecast` su historical-forecast-api.open-meteo.com);
- tipo «quota»: Elevation API (fino a 100 coordinate per richiesta).

Ordine (deviazioni.md, D11, D14, D16, D17): dentro ogni priorità le richieste sono mescolate con
random.Random(20261022); in priorità 1 vengono prima le 7 richieste che cominciano il 25/11/2022; ogni gemella C-BM
(priorità 2) segue subito la sua richiesta P1 e ne eredita il punto (anche quello di ripiego); le gemelle di P1 già
salvate passano per prime. Priorità 5 = quote 2015–2025 per la descrittiva, in coda.

Regole:
- cache per richiesta in dati/meteo/<chiave>.json, scrittura atomica; una richiesta salvata non si ripete e si
  riparte da dove ci si è fermati;
- al massimo una richiesta ogni --intervallo secondi (20) e tetti di chiamate pesate --max-ora (150) e
  --max-giorno (1500), su finestre mobili di 1 e 24 ore; peso meteo = max(1, variabili/10) × max(1, giorni/14),
  peso quota = coordinate × --peso-quota-coordinata (1: prudente, il peso reale non è documentato);
- su 429, 5xx, 4xx diversi da 400 e 404 (per esempio un 403 del proxy) o errore di rete: pausa crescente --backoff
  (15, 30, 60, 120, 240, 360 minuti; dopo l'ultimo resta 360), poi riparte da solo; una risposta buona riporta la
  pausa a 15. Un 429 non conta fra i tentativi della richiesta; 6 errori di altro tipo la mettono «in sospeso»,
  come subito un 400 o un 404. Le sospese restano tali anche dopo un riavvio; --riprova-sospese le rimette in coda;
- dopo --max-rifiuti-di-fila (8) esiti negativi consecutivi, 429 esclusi, lo scaricamento si ferma (uscita 2) con
  un messaggio nel log, invece di sospendere una richiesta dopo l'altra;
- controllo di disponibilità 5.3 (D14): se una delle prime 20 risposte P1 salvate ha più del 5% dei giorni dal
  01/12/2022 senza suolo (meno di 24 valori orari validi di umidità 3–9 cm o temperatura a 6 cm), lo scaricamento si
  ferma (uscita 3); una risposta senza suolo in nessun giorno è il caso del punto in mare (4.6) e non blocca.
  --ignora-controllo-5-3 lo salta (solo dopo una voce in deviazioni.md). Ogni risposta meteo registra nel log i
  giorni senza suolo; --stato li riassume per tutte;
- log semplice dati/meteo.log (una riga per evento, separata da tabulazioni): ora UTC, evento, chiave, tipo,
  priorità, peso stimato, codice HTTP, durata, nota. Il log serve anche a ricostruire i conti alla ripartenza;
- SIGTERM o SIGINT: chiude pulito (finisce di salvare, scrive «fermato» ed esce con 0);
- tetti su finestre mobili (il «giorno» è una finestra di 24 ore, non il giorno UTC: D16);
- un solo processo alla volta (dati/meteo.lock).

Uso:
  nohup python3 -I scarica_meteo.py >> dati/meteo.out 2>&1 &
  python3 -I scarica_meteo.py --stato
  seconda macchina (D18): python3 -I scarica_meteo.py --al-contrario --max-giorno 8000 --max-ora 1500 --intervallo 3
"""
import argparse
import datetime as dt
import json
import os
import random
import signal
import sys
import threading
import time
import urllib.parse

try:
    import fcntl
except ImportError:  # Windows
    fcntl = None
    import msvcrt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comune as C  # noqa: E402

URL_METEO = 'https://historical-forecast-api.open-meteo.com/v1/forecast'
URL_QUOTA = 'https://api.open-meteo.com/v1/elevation'
EVENTI_INVIATI = {'ok', 'ripiego', '429', 'errore-http', 'errore-rete', 'rifiutata'}
CAMPI_LOG = ['ora', 'evento', 'chiave', 'tipo', 'priorita', 'peso', 'http', 'secondi', 'nota']
MAX_ERRORI = 6
SEME_ORDINE = 20261022
INIZIO_CONTROLLO = '2022-12-01'
SOGLIA_SUOLO = 0.05
PRIME_CONTROLLO = 20
NOMI_PRIORITA = {1: 'meteo P1/P2', 2: 'C-BM (best match)', 3: 'quote dei casi', 4: 'quote dei controlli',
                 5: 'quote 2015–2025 (descrittiva)'}


def blocca(fd):
    """Lucchetto non bloccante su dati/meteo.lock (fcntl su Linux e macOS, msvcrt su Windows). OSError se è già preso."""
    if fcntl:
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    else:
        msvcrt.locking(fd, msvcrt.LK_NBLCK, 1)


def sblocca(fd):
    if fcntl:
        fcntl.flock(fd, fcntl.LOCK_UN)
    else:
        os.lseek(fd, 0, os.SEEK_SET)
        msvcrt.locking(fd, msvcrt.LK_UNLCK, 1)


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
        self.ok_p1 = []            # chiavi P1 salvate, nell'ordine del log (controllo 5.3)
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
            elif r['priorita'] == '1' and k not in self.ok_p1:
                self.ok_p1.append(k)
        elif ev == '429':
            self.ultimo_429 = t
            self.n429.append(t)
        elif ev in ('errore-http', 'errore-rete'):
            self.errori[k] = self.errori.get(k, 0) + 1
        elif ev == 'sospesa':
            self.sospese[k] = r['nota']
        elif ev == 'riattivata':
            self.sospese.pop(k, None)
            self.errori.pop(k, None)
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

    def salvata(self, k):
        try:
            with open(os.path.join(self.cache, k + '.json')) as f:
                return json.load(f)
        except (OSError, ValueError):
            return None


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


def giorni_senza_suolo(risposta, dal=INIZIO_CONTROLLO):
    """(giorni dal `dal` in poi, giorni con meno di 24 valori orari validi di umidità 3–9 cm o temperatura a 6 cm)."""
    h = (risposta or {}).get('hourly') or {}
    tempi = h.get('time') or []
    sm = h.get('soil_moisture_3_to_9cm') or []
    st = h.get('soil_temperature_6cm') or []
    conti = {}
    for k, t in enumerate(tempi):
        g = str(t)[:10]
        if g < dal:
            continue
        c = conti.setdefault(g, [0, 0])
        c[0] += k < len(sm) and sm[k] is not None
        c[1] += k < len(st) and st[k] is not None
    return len(conti), sum(1 for a, b in conti.values() if a < 24 or b < 24)


def problema_suolo(n, senza):
    """Vero se la risposta viola la soglia di 5.3 (senza contare il punto in mare, tutto mancante)."""
    return n > 0 and 0 < senza < n and senza / n > SOGLIA_SUOLO


def controllo_53(st, memo):
    """Controllo di disponibilità sulle prime PRIME_CONTROLLO risposte P1 salvate. Restituisce il problema o None."""
    for k in st.ok_p1[:PRIME_CONTROLLO]:
        if k not in memo:
            d = st.salvata(k)
            memo[k] = giorni_senza_suolo(d['risposta']) if d else (0, 0)
        n, senza = memo[k]
        if problema_suolo(n, senza):
            return f'{k}: {senza} giorni su {n} dal {INIZIO_CONTROLLO} senza suolo (soglia {SOGLIA_SUOLO:.0%})'
    return None


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


def prossima(richieste, st):
    """La prossima richiesta da fare: prima le gemelle C-BM con la P1 già salvata, poi l'ordine dell'elenco.
    Una gemella aspetta la sua P1; se la P1 è sospesa, la gemella è sospesa anche lei. Restituisce (q, in_attesa)."""
    libera = lambda q: not st.fatta(q['chiave']) and q['chiave'] not in st.sospese
    for q in richieste:
        if q.get('gemella') and libera(q) and st.fatta(q['gemella']):
            return q, 0
    in_attesa = 0
    for q in richieste:
        if not libera(q):
            continue
        if q.get('gemella'):
            if q['gemella'] in st.sospese:
                st.registra('sospesa', q, nota=f'gemella P1 {q["gemella"]} sospesa')
                continue
            if not st.fatta(q['gemella']):
                in_attesa += 1
                continue
        return q, in_attesa
    return None, in_attesa


def ciclo(a, st, richieste, ferma):
    s = a.scala_tempo
    passi = [float(x) * 60 for x in a.backoff.split(',')]
    salvate = 0
    di_fila = 0
    memo53 = {}

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

    def troppi_rifiuti():
        if di_fila >= a.max_rifiuti_di_fila:
            st.registra('fermato', nota=f'{di_fila} rifiuti di fila (429 esclusi): controlla rete e proxy (curl -sS "$HTTPS_PROXY/__agentproxy/status"), '
                                        'poi rilancia; le richieste sospese in questa serie tornano in coda con --riprova-sospese')
            return True
        return False

    def blocco_53():
        if a.ignora_controllo_5_3:
            return False
        problema = controllo_53(st, memo53)
        if problema:
            st.registra('blocco', nota=f'controllo 5.3: {problema}')
            st.registra('fermato', nota='controllo di disponibilità 5.3 non superato: il seguito è una deviazione '
                                        '(poi --ignora-controllo-5-3)')
            return True
        return False

    st.registra('avvio', nota=f'richieste={len(richieste)} max_ora={a.max_ora} max_giorno={a.max_giorno} intervallo={a.intervallo} '
                               f'priorita={a.priorita} pid={os.getpid()}' + (' al_contrario' if a.al_contrario else ''))
    if a.riprova_sospese:
        for k in sorted(st.sospese):
            q0 = next((q for q in richieste if q['chiave'] == k), {'chiave': k})
            st.registra('riattivata', q0, nota='--riprova-sospese')
    if blocco_53():
        return 3
    while not ferma.is_set():
        q, in_attesa = prossima(richieste, st)
        if q is None:
            st.registra('finito', nota='nessuna richiesta mancante' + (f'; {in_attesa} gemelle C-BM aspettano la loro P1' if in_attesa else ''))
            return 0
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
        gemella = q.get('gemella') if q['tipo'] == 'meteo' else None
        if gemella:
            # D11: la gemella C-BM usa lo stesso punto della sua P1, anche quello di ripiego
            rip = ((st.salvata(gemella) or {}).get('punto') == 'ripiego')
        else:
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
            elif e.codice in (400, 404):
                st.registra('rifiutata', q, w, e.codice, dur, e.corpo[:150])
                st.registra('sospesa', q, nota=f'HTTP {e.codice}: {e.corpo[:150]}')
                di_fila += 1
                if troppi_rifiuti():
                    return 2
            else:
                # 5xx e 4xx transitori (403 del proxy, 408, 425…)
                st.registra('errore-http', q, w, e.codice, dur, e.corpo[:150])
                di_fila += 1
                if st.errori.get(q['chiave'], 0) >= MAX_ERRORI:
                    st.registra('sospesa', q, nota=f'{MAX_ERRORI} errori, ultimo HTTP {e.codice}')
                if troppi_rifiuti():
                    return 2
                pausa(q, f'HTTP {e.codice}')
            continue
        except (OSError, ValueError) as e:
            dur = time.time() - t0
            st.registra('errore-rete', q, w, '', dur, repr(e)[:150])
            di_fila += 1
            if st.errori.get(q['chiave'], 0) >= MAX_ERRORI:
                st.registra('sospesa', q, nota=f'{MAX_ERRORI} errori di rete')
            if troppi_rifiuti():
                return 2
            pausa(q, 'rete')
            continue
        dur = time.time() - t0
        problema = controlla(q, risposta)
        if problema:
            st.registra('rifiutata', q, w, codice, dur, problema)
            st.registra('sospesa', q, nota=problema)
            di_fila += 1
            if troppi_rifiuti():
                return 2
            continue
        di_fila = 0
        if q['tipo'] == 'meteo' and not rip and not gemella and q.get('ripiego') and suolo_assente(risposta):
            st.registra('ripiego', q, w, codice, dur, 'umidità del suolo assente nel punto: si riprova con il ripiego')
            continue
        nota = 'punto di ripiego' if rip else ''
        if q['tipo'] == 'meteo':
            n, senza = giorni_senza_suolo(risposta)
            if suolo_assente(risposta):
                nota += ' suolo assente'
            nota += f' suolo_mancante={senza}/{n} utc_offset={risposta.get("utc_offset_seconds")}'
        dati = {'chiave': q['chiave'], 'richiesta': q, 'url': url, 'scaricato': C.adesso_iso(), 'http': codice,
                'punto': 'ripiego' if rip else 'cella', 'risposta': risposta}
        C.scrivi_atomico(os.path.join(st.cache, q['chiave'] + '.json'), json.dumps(dati, ensure_ascii=False))
        st.registra('ok', q, w, codice, dur, nota.strip())
        salvate += 1
        if q['priorita'] == 1 and len(st.ok_p1) <= PRIME_CONTROLLO and blocco_53():
            return 3
        if a.max_richieste and salvate >= a.max_richieste:
            st.registra('fermato', nota=f'raggiunto --max-richieste {a.max_richieste}')
            return 0
    st.registra('fermato', nota='segnale di chiusura')
    return 0


def mescola(el):
    el = sorted(el, key=lambda q: q['chiave'])
    random.Random(SEME_ORDINE).shuffle(el)
    return el


def carica_richieste(a):
    """Ordine di scaricamento (D11, D14, D16): priorità crescente, ognuna mescolata con random.Random(20261022) a
    partire dall'ordine delle chiavi; in priorità 1 prima le richieste che cominciano il 25/11/2022; le gemelle
    C-BM subito dopo la loro P1."""
    with open(a.richieste) as f:
        el = json.load(f)['richieste']
    prio = {int(x) for x in a.priorita.split(',')}
    el = [q for q in el if q['priorita'] in prio]
    per_p = {}
    for q in el:
        per_p.setdefault(q['priorita'], []).append(q)
    inizio = C.INIZIO_ICON.isoformat()
    gemelle = {}
    for q in mescola(per_p.pop(2, [])):
        gemelle.setdefault(q.get('gemella'), []).append(q)
    out = []
    p1 = per_p.pop(1, [])
    prime = sorted((q for q in p1 if q.get('inizio') == inizio), key=lambda q: q['chiave'])
    for q in prime + mescola([q for q in p1 if q.get('inizio') != inizio]):
        out.append(q)
        out.extend(gemelle.pop(q['chiave'], []))
    for k in sorted(gemelle, key=str):
        out.extend(gemelle[k])
    for p in sorted(per_p):
        out.extend(mescola(per_p[p]))
    if getattr(a, 'al_contrario', False):
        # D18: seconda macchina. Stesso elenco percorso dal fondo dentro ogni priorità, gemelle C-BM sempre subito
        # dopo la loro P1: le due macchine si incontrano a metà invece di scaricare le stesse richieste.
        gruppi = []
        for q in out:
            if q.get('gemella') and gruppi and gruppi[-1][0]['chiave'] == q['gemella']:
                gruppi[-1].append(q)
            else:
                gruppi.append([q])
        gruppi.sort(key=lambda g: g[0]['priorita'])  # stabile: l'ordine dentro la priorità resta
        per_prio = {}
        for g in gruppi:
            per_prio.setdefault(g[0]['priorita'], []).append(g)
        out = [q for p in sorted(per_prio) for g in reversed(per_prio[p]) for q in g]
    return out


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
        righe.append(f'  priorità {p} ({NOMI_PRIORITA.get(p, "?")}): fatte {len(fatte)}, mancanti {len(manc)}, in sospeso {len(sosp)}, '
                     f'peso mancante {wm:.0f}')
    try:
        fd = os.open(os.path.join(a.dati, 'meteo.lock'), os.O_RDWR | os.O_CREAT)
        blocca(fd)
        attivo = 'no'
        sblocca(fd)
    except OSError:
        attivo = 'sì'
    w_oggi = sum(w for t, w in st.inviati if t >= inizio_oggi)
    w24 = st.peso_finestra(86400, adesso)
    w1 = st.peso_finestra(3600, adesso)
    print(f'Scaricamento del meteo ({a.richieste})')
    print(f'  processo attivo: {attivo}')
    print('\n'.join(righe))
    print(f'  chiamate pesate: ultime 24 h {w24:.1f} su {a.max_giorno:g} (finestra mobile); oggi UTC {oggi} {w_oggi:.1f}; '
          f'ultima ora {w1:.1f} su {a.max_ora:g}')
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
    # suolo e scarto orario su tutte le risposte meteo salvate (D11, D14)
    meteo = [q for q in tutte if q['tipo'] == 'meteo' and st.fatta(q['chiave'])]
    oltre, assenti, scarti = [], 0, {}
    for q in meteo:
        d = st.salvata(q['chiave']) or {}
        r = d.get('risposta') or {}
        n, senza = giorni_senza_suolo(r)
        if n and senza == n:
            assenti += 1
        elif problema_suolo(n, senza):
            oltre.append(q['chiave'])
        scarti[r.get('utc_offset_seconds')] = scarti.get(r.get('utc_offset_seconds'), 0) + 1
    print(f'  suolo (dal {INIZIO_CONTROLLO}): risposte meteo {len(meteo)}, con più del {SOGLIA_SUOLO:.0%} di giorni senza suolo '
          f'{len(oltre)}{" (" + ", ".join(oltre[:5]) + ")" if oltre else ""}, senza suolo in nessun giorno {assenti}')
    print('  scarto orario: ' + ', '.join(f'{k}: {v}' for k, v in sorted(scarti.items(), key=lambda kv: str(kv[0]))))
    prime = [q for q in tutte if q['priorita'] == 1 and q.get('inizio') == C.INIZIO_ICON.isoformat()]
    if prime:
        print(f'  richieste dal {C.INIZIO_ICON:%d/%m/%Y}: {sum(st.fatta(q["chiave"]) for q in prime)} fatte su {len(prime)}')
    p53 = controllo_53(st, {})
    print(f'  controllo 5.3 sulle prime {PRIME_CONTROLLO} risposte P1: {min(len(st.ok_p1), PRIME_CONTROLLO)} controllate, '
          + (f'NON superato: {p53}' if p53 else 'nessun problema'))
    if st.sospese:
        print(f'  in sospeso: {len(st.sospese)} (motivi nel log, evento «sospesa»; --riprova-sospese le rimette in coda)')
        for k, motivo in sorted(st.sospese.items())[:10]:
            print(f'    {k}: {motivo[:100]}')
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dati', default=C.DATI)
    ap.add_argument('--richieste', default=None, help='predefinito: <dati>/richieste.json')
    ap.add_argument('--stato', action='store_true', help='stampa lo stato ed esce')
    ap.add_argument('--max-ora', type=float, default=150)
    ap.add_argument('--max-giorno', type=float, default=1500, help='tetto su una finestra mobile di 24 ore')
    ap.add_argument('--intervallo', type=float, default=20, help='secondi minimi fra due richieste')
    ap.add_argument('--backoff', default='15,30,60,120,240,360', help='minuti')
    ap.add_argument('--priorita', default='1,2,3,4,5')
    ap.add_argument('--peso-quota-coordinata', type=float, default=1.0,
                    help='peso di una coordinata Elevation: 1 = prudente (il peso reale non è misurabile, D17)')
    ap.add_argument('--max-richieste', type=int, default=0, help='si ferma dopo N richieste salvate (prove)')
    ap.add_argument('--max-rifiuti-di-fila', type=int, default=8, help='si ferma dopo N esiti negativi di fila (429 esclusi)')
    ap.add_argument('--riprova-sospese', action='store_true', help='rimette in coda le richieste in sospeso')
    ap.add_argument('--ignora-controllo-5-3', action='store_true', help='salta il controllo di disponibilità 5.3 (deviazione)')
    ap.add_argument('--timeout', type=float, default=120)
    ap.add_argument('--url-meteo', default=URL_METEO)
    ap.add_argument('--url-quota', default=URL_QUOTA)
    ap.add_argument('--al-contrario', action='store_true',
                    help='seconda macchina (D18): percorre l\'elenco dal fondo dentro ogni priorità')
    ap.add_argument('--scala-tempo', type=float, default=1.0, help='solo per le prove con il server finto')
    a = ap.parse_args()
    a.richieste = a.richieste or os.path.join(a.dati, 'richieste.json')
    if min(a.intervallo, a.max_ora, a.max_giorno, a.max_rifiuti_di_fila) <= 0:
        raise SystemExit('intervallo, tetti e --max-rifiuti-di-fila devono essere positivi')
    if a.stato:
        return stato(a)
    os.makedirs(a.dati, exist_ok=True)
    fd = os.open(os.path.join(a.dati, 'meteo.lock'), os.O_RDWR | os.O_CREAT)
    try:
        blocca(fd)
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
