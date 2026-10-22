"""Prova di scarica_meteo.py con un server finto su 127.0.0.1 (nessuna richiesta a Open-Meteo).

Controlla: pausa dopo 429 ed errore 5xx, ripresa automatica, punto di ripiego quando il suolo manca, tetti orari,
cache (nessuna richiesta ripetuta, anche rilanciando), chiusura pulita con SIGTERM, comando --stato.

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
regole = {'429_iniziali': 1, '503_lat': '45.0500', 'mare_lat': '44.0000'}
gia_503 = set()
rifiutati = set()


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
        self.rispondi(200, {
            'latitude': float(q['latitude']), 'longitude': float(q['longitude']), 'elevation': 0.0 if mare else 500.0,
            'utc_offset_seconds': 7200, 'timezone': 'Europe/Rome',
            'daily': {'time': giorni, **{v: [1.0] * len(giorni) for v in q['daily'].split(',')}},
            'hourly': {'time': ore, **{v: [None if mare else 0.3] * len(ore) for v in q['hourly'].split(',')}},
        })


def richiesta_meteo(k, lat, lon, giorni, ripiego=(46.1, 11.2)):
    inizio = dt.date(2024, 1, 1)
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
    srv.shutdown()
    falliti = [t for c, t in esito if not c]
    print(f'\n{len(esito) - len(falliti)}/{len(esito)} controlli superati')
    return 1 if falliti else 0


if __name__ == '__main__':
    sys.exit(main())
