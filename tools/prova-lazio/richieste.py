"""Elenco delle richieste a Open-Meteo per la prova sull'Italia (preregistrazione-italia.md, 4.3, 4.6 e 6).

Legge le osservazioni scaricate da scarica_osservazioni.py e scrive dati/richieste.json. Non scarica nulla e non
calcola nessun punteggio: usa solo date e celle delle unità caso e, per le quote, i punti delle unità.

- Priorità 1, meteo P1/P2: una richiesta per cella di 0,1° e anno con almeno un'unità caso nel 2023–2025,
  `models=icon_seamless`. Intervallo per ogni caso del giorno d dell'anno y: da max(d − 30, 01/01/y) − 62 giorni a
  min(d + 30, 31/12/y); intervalli uniti se lo spazio scoperto è meno di 63 giorni; mai prima del 25/11/2022.
  Punto = media dei punti delle unità caso della cella, arrotondata a 0,01°; ripiego = punto dell'unità caso con
  l'identificativo più basso.
- Priorità 2, C-BM: il 10% delle richieste di priorità 1, estratte con random.Random(20261022), con
  `models=best_match`.
- Priorità 3, quote dei punti delle unità caso; priorità 4, quote dei punti delle unità controllo delle celle dei casi,
  stesso anno e a non più di 30 giorni da un caso. API Elevation, fino a 100 coordinate per richiesta.
- Priorità 5, in coda (deviazioni.md, D17): quote di tutti gli altri punti delle unità 2015–2025 (casi di ogni specie
  in prova e controlli P1, tutta l'Italia) per l'analisi descrittiva per fascia di quota.

Sinonimi ed esclusioni da comune.py (deviazioni.md, D10). L'ordine di scaricamento lo decide scarica_meteo.py.

Uso: python3 -I richieste.py [--dati CARTELLA] [--lotto-quote 100]
"""
import argparse
import datetime as dt
import hashlib
import json
import os
import random
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comune as C  # noqa: E402

DAILY = ['precipitation_sum', 'temperature_2m_mean', 'temperature_2m_min', 'temperature_2m_max']
HOURLY = ['soil_moisture_3_to_9cm', 'soil_temperature_6cm']


def chiave(d):
    return hashlib.sha256(json.dumps(d, sort_keys=True).encode()).hexdigest()[:24]


def peso_meteo(giorni, variabili=len(DAILY) + len(HOURLY)):
    """Regola di Open-Meteo (pagina Pricing): max(1, variabili/10) × max(1, giorni/14) per punto."""
    return round(max(1.0, variabili / 10) * max(1.0, giorni / 14), 4)


def intervalli(date_casi):
    pezzi = []
    for d in sorted(date_casi):
        y = d.year
        lo = max(d - dt.timedelta(C.FINESTRA_ABBINAMENTO), dt.date(y, 1, 1)) - dt.timedelta(C.GIORNI_PRIMA)
        hi = min(d + dt.timedelta(C.FINESTRA_ABBINAMENTO), dt.date(y, 12, 31))
        pezzi.append([max(lo, C.INIZIO_ICON), hi])
    pezzi.sort()
    uniti = [pezzi[0]]
    for lo, hi in pezzi[1:]:
        if (lo - uniti[-1][1]).days - 1 < 63:
            uniti[-1][1] = max(uniti[-1][1], hi)
        else:
            uniti.append([lo, hi])
    return uniti


def costruisci(records, geometria, sin, lotto_quote=100):
    validi = []
    for r in records:
        if not C.passa_filtri_base(r, geometria):
            continue
        d = C.data_singola(r)
        r = dict(r, data=d.isoformat(), cella=C.cella(r['lat'], r['lon']))
        validi.append(r)
    nel_periodo = lambda r: C.PERIODO[0] <= dt.date.fromisoformat(r['data']) <= C.PERIODO[1]
    casi_tutti = [r for r in validi if C.specie_del_caso(r, sin)]
    controlli_tutti = [r for r in validi if not C.escluso_dai_controlli(r, sin)
                       and (r['fonte'] == 'gbif' or r.get('qualita') in ('research', 'needs_id'))]
    casi = [r for r in casi_tutti if nel_periodo(r)]
    controlli = [r for r in controlli_tutti if nel_periodo(r)]
    # unità caso: uscite per specie (un'uscita con due specie è un'unità per ciascuna)
    unita_casi = []
    for sp in C.ORDINE_SPECIE:
        rs = [r for r in casi if C.specie_del_caso(r, sin) == sp]
        for u in C.uscite(rs):
            u['specie'] = sp
            unita_casi.append(u)
    per_cella = defaultdict(list)
    for u in unita_casi:
        per_cella[u['cella']].append(u)
    richieste = []
    for cel in sorted(per_cella):
        us = per_cella[cel]
        uniche = {u['chiave']: u for u in us}.values()
        lat = round(sum(float(u['punto'][0]) for u in uniche) / len(uniche), 2)
        lon = round(sum(float(u['punto'][1]) for u in uniche) / len(uniche), 2)
        primo = min(us, key=lambda u: (u['chiave'][0], int(u['record'][0])))
        ripiego = [round(float(primo['punto'][0]), 4), round(float(primo['punto'][1]), 4)]
        per_anno = defaultdict(list)
        for u in us:
            d = dt.date.fromisoformat(u['data'])
            per_anno[d.year].append(d)
        for anno in sorted(per_anno):
            for lo, hi in intervalli(per_anno[anno]):
                giorni = (hi - lo).days + 1
                base = {'tipo': 'meteo', 'modello': 'icon_seamless', 'lat': lat, 'lon': lon, 'inizio': lo.isoformat(),
                        'fine': hi.isoformat(), 'daily': DAILY, 'hourly': HOURLY}
                richieste.append(dict(base, chiave=chiave(base), priorita=1, cella=cel, anno=anno, giorni=giorni,
                                      peso=peso_meteo(giorni), ripiego=ripiego,
                                      unita_caso=sum(1 for d in per_anno[anno] if lo <= d <= hi)))
    richieste.sort(key=lambda q: (q['cella'], q['inizio']))
    rng = random.Random(20261022)
    campione = sorted(rng.sample(range(len(richieste)), round(0.10 * len(richieste)))) if richieste else []
    cbm = []
    for k in campione:
        q = richieste[k]
        base = {'tipo': 'meteo', 'modello': 'best_match', 'lat': q['lat'], 'lon': q['lon'], 'inizio': q['inizio'],
                'fine': q['fine'], 'daily': DAILY, 'hourly': HOURLY}
        cbm.append(dict(base, chiave=chiave(base), priorita=2, cella=q['cella'], anno=q['anno'], giorni=q['giorni'],
                        peso=q['peso'], ripiego=q['ripiego'], gemella=q['chiave']))
    # quote
    punti_casi = sorted({(round(float(u['punto'][0]), 5), round(float(u['punto'][1]), 5)) for u in unita_casi})
    finestre = defaultdict(list)
    for u in unita_casi:
        finestre[u['cella']].append(dt.date.fromisoformat(u['data']))
    unita_ctrl = [u for u in C.uscite([r for r in controlli if r['cella'] in finestre])
                  if any(abs((dt.date.fromisoformat(u['data']) - d).days) <= C.FINESTRA_ABBINAMENTO and d.year == int(u['data'][:4])
                         for d in finestre[u['cella']])]
    punti_ctrl = sorted({(round(float(u['punto'][0]), 5), round(float(u['punto'][1]), 5)) for u in unita_ctrl} - set(punti_casi))
    # priorità 5: tutti gli altri punti delle unità 2015–2025 (D17 di deviazioni.md)
    unita_tutte = []
    for sp in C.ORDINE_SPECIE:
        unita_tutte.extend(C.uscite([r for r in casi_tutti if C.specie_del_caso(r, sin) == sp]))
    unita_tutte.extend(C.uscite(controlli_tutti))
    punti_desc = sorted({(round(float(u['punto'][0]), 5), round(float(u['punto'][1]), 5)) for u in unita_tutte}
                        - set(punti_casi) - set(punti_ctrl))
    quote = []
    for prio, punti in ((3, punti_casi), (4, punti_ctrl), (5, punti_desc)):
        for k in range(0, len(punti), lotto_quote):
            coord = [list(p) for p in punti[k:k + lotto_quote]]
            base = {'tipo': 'quota', 'coordinate': coord}
            quote.append(dict(base, chiave=chiave(base), priorita=prio, n=len(coord)))
    riepilogo = {
        'record_validi': len(validi), 'record_caso': len(casi), 'record_controllo': len(controlli),
        'unita_caso': len(unita_casi), 'unita_controllo_nelle_finestre': len(unita_ctrl),
        'celle_con_casi': len(per_cella), 'richieste_meteo': len(richieste), 'peso_meteo': round(sum(q['peso'] for q in richieste), 1),
        'giorni_punto': sum(q['giorni'] for q in richieste), 'richieste_cbm': len(cbm), 'peso_cbm': round(sum(q['peso'] for q in cbm), 1),
        'richieste_quota_casi': sum(1 for q in quote if q['priorita'] == 3), 'coordinate_quota_casi': len(punti_casi),
        'richieste_quota_controlli': sum(1 for q in quote if q['priorita'] == 4), 'coordinate_quota_controlli': len(punti_ctrl),
        'richieste_quota_descrittiva': sum(1 for q in quote if q['priorita'] == 5), 'coordinate_quota_descrittiva': len(punti_desc),
        'unita_caso_per_specie': {sp: sum(1 for u in unita_casi if u['specie'] == sp) for sp in C.ORDINE_SPECIE},
        'celle_per_specie': {sp: len({u['cella'] for u in unita_casi if u['specie'] == sp}) for sp in C.ORDINE_SPECIE},
    }
    return richieste + cbm + quote, riepilogo


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dati', default=C.DATI)
    ap.add_argument('--lotto-quote', type=int, default=100)
    a = ap.parse_args()
    oss = os.path.join(a.dati, 'osservazioni')
    records = []
    for nome in ('inat.jsonl', 'gbif.jsonl'):
        fp = os.path.join(oss, nome)
        if os.path.exists(fp):
            records.extend(C.leggi_jsonl(fp))
    if not records:
        raise SystemExit(f'nessuna osservazione in {oss}: lancia prima scarica_osservazioni.py')
    fg = os.path.join(a.dati, 'geometria-italia.json')
    geometria = json.load(open(fg)) if os.path.exists(fg) else None
    elenco, riepilogo = costruisci(records, geometria, C.tabella_sinonimi(os.path.join(a.dati, 'taxa.json')), a.lotto_quote)
    out = {'creato': C.adesso_iso(), 'riepilogo': riepilogo, 'richieste': elenco}
    C.scrivi_atomico(os.path.join(a.dati, 'richieste.json'), json.dumps(out, ensure_ascii=False, indent=0, sort_keys=True))
    print(json.dumps(riepilogo, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
