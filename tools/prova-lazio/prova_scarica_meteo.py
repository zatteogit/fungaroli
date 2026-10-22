"""Prova di scarica_meteo.py con un server finto su 127.0.0.1 (nessuna richiesta a Open-Meteo).

Controlla: pausa dopo 429 ed errore 5xx, ripresa automatica, punto di ripiego quando il suolo manca, tetti orari,
cache (nessuna richiesta ripetuta, anche rilanciando), chiusura pulita con SIGTERM, comando --stato.
Dal 22/10/2026 (deviazioni.md, D11, D14, D16): sospensione che resta dopo il riavvio e --riprova-sospese, 6 errori di
fila su una richiesta, 403 del proxy come errore transitorio, arresto dopo N rifiuti di fila, suolo nullo in parte e
controllo 5.3, ordine (prima le richieste dal 25/11/2022, gemella C-BM subito dopo la sua P1 e con il suo punto,
priorità 5 in coda).

Uso: python3 -I prova_scarica_meteo.py
"""
import datetime as dt
import json
import os
import signal
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

QUI = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(QUI, 'scarica_meteo.py')
colpi = Counter()
regole = {'429_iniziali': 1, '503_lat': '45.0500', 'mare_lat': '44.0000', 'tutto_403': False}
gia_503 = set()
rifiutati = set()
# latitudine -> [codice, quante volte ancora (None = sempre)]
errori_lat = {'41.0000': [400, 1], '41.5000': [500, None], '42.0000': [403, 1]}
# latitudine -> ore con suolo nullo (dall'inizio della serie)
suolo_parziale = {'43.5000': 48, '43.6000': 1}


class Finto(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def rispondi(self, codice, corpo):
        b = json.dumps(corpo).encode()
        self.send_response(codice)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        u = urllib.parse.urlsplit(self.path)
        q = dict(urllib.parse.parse_qsl(u.query))
        colpi[self.path] += 1
        if regole['tutto_403']:
            return self.rispondi(403, {'error': True, 'reason': 'finto 403 del proxy'})
        lat = q.get('latitude', '')
        if lat in errori_lat and errori_lat[lat][1] != 0:
            codice, volte = errori_lat[lat]
            if volte is not None:
                errori_lat[lat][1] -= 1
            return self.rispondi(codice, {'error': True, 'reason': f'finto {codice}'})
        if regole['429_iniziali'] > 0:
            regole['429_iniziali'] -= 1
            rifiutati.add(self.path)
            return self.rispondi(429, {'error': True, 'reason': 'Daily API request limit exceeded. Please try again tomorrow.'})
        if u.path.endswith('/elevation'):
            n = len(q['latitude'].split(','))
            return self.rispondi(200, {'elevation': [100.0 + k for k in range(n)]})
        if q['latitude'] == regole['503_lat'] and q['latitude'] not in gia_503:
            gia_503.add(q['latitude'])
            rifiutati.add(self.path)
            return self.rispondi(503, {'error': True, 'reason': 'finto 503'})
        d0, d1 = dt.date.fromisoformat(q['start_date']), dt.date.fromisoformat(q['end_date'])
        giorni = [(d0 + dt.timedelta(k)).isoformat() for k in range((d1 - d0).days + 1)]
        ore = [f'{g}T{h:02d}:00' for g in giorni for h in range(24)]
        mare = q['latitude'] == regole['mare_lat']
        nulle = suolo_parziale.get(q['latitude'], 0)
        orarie = {v: [None if mare or k < nulle else 0.3 for k in range(len(ore))] for v in q['hourly'].split(',')}
        self.rispondi(200, {
            'latitude': float(q['latitude']), 'longitude': float(q['longitude']), 'elevation': 0.0 if mare else 500.0,
            'utc_offset_seconds': 7200, 'timezone': 'Europe/Rome',
            'daily': {'time': giorni, **{v: [1.0] * len(giorni) for v in q['daily'].split(',')}},
            'hourly': {'time': ore, **orarie},
        })


def richiesta_meteo(k, lat, lon, giorni, ripiego=(46.1, 11.2), inizio=dt.date(2024, 1, 1)):
    return {'tipo': 'meteo', 'modello': 'icon_seamless', 'lat': lat, 'lon': lon, 'inizio': inizio.isoformat(),
            'fine': (inizio + dt.timedelta(giorni - 1)).isoformat(), 'giorni': giorni,
            'daily': ['precipitation_sum', 'temperature_2m_mean', 'temperature_2m_min', 'temperature_2m_max'],
            'hourly': ['soil_moisture_3_to_9cm', 'soil_temperature_6cm'], 'chiave': f'prova{k:03d}', 'priorita': 1,
            'cella': f'c{k}', 'anno': 2024, 'peso': max(1, giorni / 14), 'ripiego': list(ripiego)}


def lancia(dati, porta, *extra, attendi=True):
    cmd = [sys.executable, '-I', SCRIPT, '--dati', dati, '--url-meteo', f'http://127.0.0.1:{porta}/v1/forecast',
           '--url-quota', f'http://127.0.0.1:{porta}/v1/elevation', *extra]
    if attendi:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    return subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)


def eventi(dati):
    with open(os.path.join(dati, 'meteo.log')) as f:
        return Counter(r.split('\t')[1] for r in f.read().splitlines()[1:])


def righe_log(dati):
    with open(os.path.join(dati, 'meteo.log')) as f:
        return [dict(zip(['ora', 'evento', 'chiave', 'tipo', 'priorita', 'peso', 'http', 'secondi', 'nota'], r.split('\t')))
                for r in f.read().splitlines()[1:]]


def scrivi_elenco(dati, el):
    with open(os.path.join(dati, 'richieste.json'), 'w') as f:
        json.dump({'richieste': el}, f)


def colpi_lat(lat, modello=None):
    return sum(n for p, n in colpi.items() if f'latitude={lat}' in p and (modello is None or f'models={modello}' in p))


VELOCE = ('--scala-tempo', '0.001', '--backoff', '1,1,1,1,1,1', '--intervallo', '1')


def prove_nuove(porta, verifica):
    # sospensione (400) che resta dopo il riavvio; --riprova-sospese la rimette in coda
    with tempfile.TemporaryDirectory() as dati:
        scrivi_elenco(dati, [richiesta_meteo(201, 41.0, 10.0, 14), richiesta_meteo(202, 41.1, 10.0, 14)])
        r = lancia(dati, porta, *VELOCE)
        ev = eventi(dati)
        verifica(r.returncode == 0 and ev['sospesa'] == 1 and ev['ok'] == 1, f'400: richiesta sospesa, l\'altra salvata ({dict(ev)})')
        prima = colpi_lat('41.0000')
        r = lancia(dati, porta, *VELOCE)
        s = lancia(dati, porta, '--stato')
        verifica(r.returncode == 0 and colpi_lat('41.0000') == prima and 'in sospeso 1' in s.stdout,
                 'dopo il riavvio la sospesa resta sospesa (nessuna nuova richiesta, --stato la mostra)')
        r = lancia(dati, porta, *VELOCE, '--riprova-sospese')
        ev = eventi(dati)
        verifica(r.returncode == 0 and ev['riattivata'] == 1 and os.path.exists(os.path.join(dati, 'meteo', 'prova201.json')),
                 '--riprova-sospese: rimessa in coda e salvata')
    # 6 errori di fila sulla stessa richiesta: sospesa, le altre proseguono
    with tempfile.TemporaryDirectory() as dati:
        scrivi_elenco(dati, [richiesta_meteo(211, 41.5, 10.0, 14), richiesta_meteo(212, 41.6, 10.0, 14)])
        r = lancia(dati, porta, *VELOCE)
        rs = righe_log(dati)
        sosp = [x for x in rs if x['evento'] == 'sospesa']
        verifica(r.returncode == 0 and colpi_lat('41.5000') == 6 and len(sosp) == 1 and '6 errori' in sosp[0]['nota']
                 and sum(x['evento'] == 'ok' for x in rs) == 1,
                 f'6 errori 500 di fila: sospesa dopo 6 tentativi ({colpi_lat("41.5000")}), l\'altra salvata')
    # 403 del proxy: errore transitorio, pausa e nuovo tentativo, nessuna sospensione
    with tempfile.TemporaryDirectory() as dati:
        scrivi_elenco(dati, [richiesta_meteo(221, 42.0, 10.0, 14)])
        r = lancia(dati, porta, *VELOCE)
        ev = eventi(dati)
        rs = righe_log(dati)
        verifica(r.returncode == 0 and ev['ok'] == 1 and ev['sospesa'] == 0 and ev['pausa'] == 1
                 and any(x['evento'] == 'errore-http' and x['http'] == '403' for x in rs),
                 '403 del proxy: pausa, nuovo tentativo, salvata senza sospensione')
    # rifiuti di fila su tutte le richieste: arresto con messaggio, nessuna sospensione a catena
    with tempfile.TemporaryDirectory() as dati:
        scrivi_elenco(dati, [richiesta_meteo(231 + k, 42.5 + k / 100, 10.0, 14) for k in range(3)])
        regole['tutto_403'] = True
        r = lancia(dati, porta, *VELOCE, '--max-rifiuti-di-fila', '4')
        regole['tutto_403'] = False
        rs = righe_log(dati)
        verifica(r.returncode == 2 and rs[-1]['evento'] == 'fermato' and 'rifiuti di fila' in rs[-1]['nota']
                 and not any(x['evento'] == 'sospesa' for x in rs) and sum(x['evento'] == 'errore-http' for x in rs) == 4,
                 f'4 rifiuti di fila: arresto (uscita {r.returncode}) con messaggio, nessuna sospesa')
    # suolo nullo in parte: niente ripiego, giorni senza suolo nel log, blocco 5.3 sopra il 5%
    with tempfile.TemporaryDirectory() as dati:
        scrivi_elenco(dati, [richiesta_meteo(241, 43.6, 10.0, 30), richiesta_meteo(242, 43.5, 10.0, 30),
                             richiesta_meteo(243, 43.7, 10.0, 30)])
        r = lancia(dati, porta, *VELOCE)
        rs = righe_log(dati)
        ok = {x['chiave']: x['nota'] for x in rs if x['evento'] == 'ok'}
        blocchi = [x for x in rs if x['evento'] == 'blocco']
        verifica(r.returncode == 3 and 'prova242' in ok and 'suolo_mancante=2/30' in ok['prova242']
                 and not any(x['evento'] == 'ripiego' for x in rs) and len(blocchi) == 1 and 'prova242' in blocchi[0]['nota'],
                 f'suolo nullo in parte: salvata senza ripiego, 2/30 giorni senza suolo, blocco 5.3 (uscita {r.returncode})')
        verifica('prova241' not in ok or 'suolo_mancante=1/30' in ok['prova241'],
                 'un solo giorno su 30 senza suolo (3%) non blocca')
        prima = sum(colpi.values())
        r = lancia(dati, porta, *VELOCE)
        verifica(r.returncode == 3 and sum(colpi.values()) == prima, 'riavvio: il blocco 5.3 resta, nessuna richiesta')
        s = lancia(dati, porta, '--stato')
        verifica('NON superato' in s.stdout and 'giorni senza suolo 1' in s.stdout, '--stato riporta il controllo 5.3 e il suolo')
        r = lancia(dati, porta, *VELOCE, '--ignora-controllo-5-3')
        verifica(r.returncode == 0 and eventi(dati)['ok'] == 3, '--ignora-controllo-5-3: lo scaricamento finisce')
    # ordine: prima le richieste dal 25/11/2022; la gemella C-BM subito dopo la sua P1 e con il suo punto di ripiego;
    # le quote di priorità 5 in coda
    with tempfile.TemporaryDirectory() as dati:
        el = [richiesta_meteo(251 + k, 39.0 + k / 100, 10.0, 14) for k in range(6)]
        el.append(richiesta_meteo(260, 39.5, 10.0, 14, inizio=dt.date(2022, 11, 25)))
        mare = richiesta_meteo(261, 44.0, 10.0, 14, ripiego=(46.3, 11.3))
        el.append(mare)
        gem = dict(mare, modello='best_match', chiave='prova261bm', priorita=2, gemella=mare['chiave'])
        el.append({'tipo': 'quota', 'coordinate': [[40.0, 10.0]], 'chiave': 'prova-q5', 'priorita': 5, 'n': 1})
        el.append({'tipo': 'quota', 'coordinate': [[40.1, 10.0]], 'chiave': 'prova-q3', 'priorita': 3, 'n': 1})
        el.append(gem)
        scrivi_elenco(dati, el)
        r = lancia(dati, porta, *VELOCE)
        seq = [x['chiave'] for x in righe_log(dati) if x['evento'] == 'ok']
        verifica(r.returncode == 0 and seq[0] == 'prova260', f'prima la richiesta dal 25/11/2022 ({seq[:2]})')
        verifica(seq.index('prova261bm') == seq.index('prova261') + 1, 'gemella C-BM subito dopo la sua P1')
        verifica(colpi_lat('46.3000', 'best_match') == 1 and colpi_lat('44.0000', 'best_match') == 0,
                 'la gemella usa il punto di ripiego della sua P1, senza un ripiego proprio')
        verifica(seq[-2:] == ['prova-q3', 'prova-q5'], 'quote: priorità 3, poi 5 in coda')
        o1 = [q['chiave'] for q in json.loads(subprocess.run(
            [sys.executable, '-I', '-c', 'import sys,json; sys.path.insert(0, sys.argv[1]); import scarica_meteo as M; '
             'import argparse; a=argparse.Namespace(richieste=sys.argv[2], priorita="1,2,3,4,5"); '
             'print(json.dumps(M.carica_richieste(a)))', QUI, os.path.join(dati, 'richieste.json')],
            capture_output=True, text=True).stdout)]
        verifica([k for k in o1 if k.startswith('prova25')] != sorted(k for k in o1 if k.startswith('prova25'))
                 and len(o1) == len(el), 'ordine P1 mescolato con seme fisso (non per chiave)')


def main():
    srv = ThreadingHTTPServer(('127.0.0.1', 0), Finto)
    porta = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    esito = []

    def verifica(cond, testo):
        esito.append((bool(cond), testo))
        print(('ok  ' if cond else 'NO  ') + testo)

    with tempfile.TemporaryDirectory() as dati:
        el = [richiesta_meteo(1, 46.0, 11.0, 30), richiesta_meteo(2, 45.05, 9.0, 120), richiesta_meteo(3, 44.0, 8.0, 10),
              richiesta_meteo(4, 43.0, 12.0, 200)]
        el.append({'tipo': 'quota', 'coordinate': [[46.0, 11.0], [45.0, 9.0], [44.0, 8.0]], 'chiave': 'prova-quota', 'priorita': 3, 'n': 3})
        with open(os.path.join(dati, 'richieste.json'), 'w') as f:
            json.dump({'richieste': el}, f)
        # tempo scalato: 20 s -> 0,02 s; 15 min -> 0,9 s; finestra oraria 3,6 s; tetto orario 20 chiamate pesate
        t0 = time.time()
        r = lancia(dati, porta, '--scala-tempo', '0.001', '--max-ora', '20')
        verifica(r.returncode == 0, f'prima esecuzione: uscita 0 in {time.time() - t0:.1f} s')
        ev = eventi(dati)
        print('   eventi:', dict(ev))
        verifica(len([n for n in os.listdir(os.path.join(dati, 'meteo')) if n.endswith('.json')]) == 5, 'cinque risposte salvate')
        verifica(ev['429'] == 1 and ev['pausa'] >= 2, '429 e 503 seguiti da una pausa, poi ripresa')
        verifica(ev['errore-http'] == 1, 'errore 503 registrato una volta')
        verifica(ev['ripiego'] == 1, 'suolo assente: un nuovo tentativo con il punto di ripiego')
        verifica(ev['attesa'] >= 1, 'tetto orario rispettato con un\'attesa')
        with open(os.path.join(dati, 'meteo', 'prova003.json')) as f:
            verifica(json.load(f)['punto'] == 'ripiego', 'la richiesta 3 è salvata con il punto di ripiego')
        ripetuti = {p for p, n in colpi.items() if n > 1}
        verifica(ripetuti <= rifiutati and all(colpi[p] == 2 for p in ripetuti),
                 'ripetuti solo gli URL rifiutati (429, 503), una volta ciascuno' if ripetuti <= rifiutati else f'URL ripetuti: {ripetuti - rifiutati}')
        prima = sum(colpi.values())
        r = lancia(dati, porta, '--scala-tempo', '0.001')
        verifica(r.returncode == 0 and sum(colpi.values()) == prima and eventi(dati)['finito'] == 2,
                 'seconda esecuzione: nessuna nuova richiesta, «finito»')
        s = lancia(dati, porta, '--stato', '--max-giorno', '1500')
        print('   ' + s.stdout.replace('\n', '\n   '))
        verifica(s.returncode == 0 and 'fatte 4, mancanti 0' in s.stdout and 'ultimo 429' in s.stdout, '--stato')

    with tempfile.TemporaryDirectory() as dati:
        el = [richiesta_meteo(100 + k, 40.0 + k / 100, 10.0, 14) for k in range(20)]
        with open(os.path.join(dati, 'richieste.json'), 'w') as f:
            json.dump({'richieste': el}, f)
        p = lancia(dati, porta, '--intervallo', '2', attendi=False)
        time.sleep(3)
        p.send_signal(signal.SIGTERM)
        t0 = time.time()
        p.wait(timeout=30)
        ev = eventi(dati)
        verifica(p.returncode == 0 and ev['fermato'] == 1 and time.time() - t0 < 5,
                 f'SIGTERM: uscita {p.returncode} in {time.time() - t0:.1f} s, «fermato» nel log, {ev["ok"]} salvate')
        r = lancia(dati, porta, '--intervallo', '0.01', '--max-richieste', '3')
        ev2 = eventi(dati)
        verifica(r.returncode == 0 and ev2['ok'] == ev['ok'] + 3, 'ripresa dopo SIGTERM da dove si era fermato (--max-richieste 3)')
        r2 = lancia(dati, porta, attendi=False)
        time.sleep(1)
        r3 = lancia(dati, porta)
        verifica(r3.returncode != 0 and 'già in corso' in r3.stderr, 'un secondo processo sulla stessa cartella si rifiuta')
        r2.send_signal(signal.SIGTERM)
        r2.wait(timeout=30)
    prove_nuove(porta, verifica)
    srv.shutdown()
    falliti = [t for c, t in esito if not c]
    print(f'\n{len(esito) - len(falliti)}/{len(esito)} controlli superati')
    return 1 if falliti else 0


if __name__ == '__main__':
    sys.exit(main())
