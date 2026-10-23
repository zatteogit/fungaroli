"""Prova retrospettiva sull'Italia: abbinamento, punteggi, metriche, intervalli e verdetti.

Protocollo: preregistrazione.md (Lazio), preregistrazione-italia.md (Italia), deviazioni.md (D1–D19). Dove divergono
fa fede l'ultimo. Questo script non sceglie nulla guardando gli esiti: applica le regole scritte lì.

Passi:
 1. controlli bloccanti 1–4 (moduli, istantanea, taxa, filtri e deduplica; 12 del Lazio e D9);
 2. record → unità (uscite) per casi, controlli P1, controlli P2 e varianti S-PREC e S-LIC;
 3. abbinamento (4.3 del Lazio) e varianti S-CELLA, S-FIN, S-QUOTA, S-GEN, S-CC;
 4. elenco delle voci da calcolare → `node fattori.mjs` → punteggi (0), (1), (1b), (A), arrotondato, componenti;
 5. climatologia (2) per macro-area, un anno escluso alla volta (D5, 4.7 dell'Italia);
 6. completezza e blocco al 20% (5.5 del Lazio, D1);
 7. AUC abbinata, bootstrap B-cella, B-osservatore e B-regione×anno (8 del Lazio, D4), p-value e Holm (D3);
 8. verdetti (9 del Lazio, D3, D4) e secondarie (10 del Lazio, 4.9 dell'Italia, D1, D7, D13, D19);
 9. controlli 5 (allineamento JS–Python), C-BM, descrittiva, controllo 7 (nessun identificativo nei file versionati).

Uso: python3 -I valuta.py [--dati CARTELLA] [--b 5000] [--node node]
Scrive dati/esiti.json (completo, resta in dati/) ed esiti-riepilogo.json accanto a questo file (solo aggregati).
"""
import argparse
import collections
import datetime as dt
import hashlib
import json
import math
import os
import platform
import subprocess
import sys

import numpy as np

QUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, QUI)
import comune as C  # noqa: E402

RADICE = os.path.abspath(os.path.join(QUI, '..', '..'))
SEME = 20261021
DELTA_Q1, DELTA = 0.05, 0.03
ETICHETTATE = ['edulis', 'aereus', 'aestivalis', 'caesarea', 'cibarius', 'cornucopioides', 'procera', 'mellea',
               'virescens', 'suillus']  # D3
HASH_MODULI = {  # 12 del Lazio, controllo 1
    'js/model.js': '2f9a8a540eca4a4bbc248231f8dd97ac963de6c2ede8d21c28874addc5458bcc',
    'js/species.js': '10f451b8867f7ed1f156a2a1073d699bd5925896335b8c13a8922cfbb1817907',
    'js/botanical-model.js': '75466dcd22524be0472443bb1f54559c4401d8b88dbc3de0075cf5ff5e558a64',
    'js/external-observation.js': 'ef04cf5202df0dda514f4ee26c6d38cab0a8698ad5a1991b3dca1cd6798fb954',
    'js/weather.js': '73dd78c53a742fe0bdaeed7dfea082b86b782c48a1ce1477fb051b6c4b17869d',
    'js/weather-data.js': '13c30d25462a44d5a77bff14047bf6751a99e101c8e2b4b12fdef65196eaf0e4',
}
# D19: risposte scaricate il 23/10/2026 (pioggia di un'altra versione del servizio)
D19_P1 = {'2b43f63ab9e7b74b0fca3c39', '2bb454859585af820946cd55', '3bb78fd55a0edce56b81c9dd', '57e442127fb23a439bcf204d',
          '6113eb3df9e4ff34f1425cb2', '7b9f09f695095e2af781cb26', '90fafa8a52e33fb34b37aa83', '9745feff8e14f121e1b0e368',
          'b9f8340303812e93a40229d9', 'cf1bfe9cca1884e2d86c57ab'}
D19_CBM = '8d646499d69718a7ee71945b'
FASCE = [(None, 500, '< 500 m'), (500, 1000, '500–999 m'), (1000, 1400, '1000–1399 m'), (1400, None, '≥ 1400 m')]
SOTTO_GENERE = {'species', 'subspecies', 'variety', 'form', 'hybrid', 'genus', 'genushybrid', 'subgenus', 'section',
                'subsection', 'series', 'complex', 'infrahybrid', 'subvariety', 'subform'}
PUNTEGGI = ['f0', 'f1', 'f1b', 'f2', 'arr', 'c_S', 'c_rain', 'c_temp', 'c_moist', 'c_fh', 'c_rtm']
DOMANDE = {'Q1': ('f1', None, DELTA_Q1), 'Q2': ('f1', 'f0', DELTA), 'Q3': ('f1', 'f2', DELTA), 'Q4': ('f1', 'f1b', DELTA)}


class Blocco(Exception):
    pass


def sha256_file(fp):
    h = hashlib.sha256()
    with open(fp, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def giorno(s):
    return dt.date.fromisoformat(s[:10])


def doy(d):
    """Giorno dell'anno da 1 a 365; il 29/02 vale come il 28/02 (6, (2) del Lazio)."""
    if d.month == 2 and d.day == 29:
        d = d.replace(day=28)
    return dt.date(2023, d.month, d.day).timetuple().tm_yday


def dist_m(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a['lat'], a['lon'], b['lat'], b['lon']))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))


def cella2(lat, lon):
    return C.cella(lat, lon, passo=5)


def fascia(q):
    if q is None:
        return None
    for lo, hi, nome in FASCE:
        if (lo is None or q >= lo) and (hi is None or q < hi):
            return nome
    return None


# --- 1. dati e controlli bloccanti ----------------------------------------------------------------------------

def controlli_moduli():
    esito = {}
    for rel, atteso in HASH_MODULI.items():
        h = sha256_file(os.path.join(RADICE, rel))
        esito[rel] = h
        if h != atteso:
            raise Blocco(f'controllo 1: {rel} ha SHA-256 {h}, atteso {atteso}')
    return esito


def istantanea(dati):
    """SHA-256 dei file d'ingresso (controllo 2): osservazioni con gli hash dello scaricamento, poi un hash dell'elenco
    ordinato (nome, SHA-256) delle risposte meteo e quote usate."""
    sc = json.load(open(os.path.join(dati, 'osservazioni', 'scaricamento.json')))
    out = {}
    for nome in ('inat.jsonl', 'gbif.jsonl'):
        h = sha256_file(os.path.join(dati, 'osservazioni', nome))
        if h != sc['sha256_' + nome]:
            raise Blocco(f'controllo 2: {nome} ha SHA-256 {h}, diverso da quello dello scaricamento')
        out[nome] = h
    g = sha256_file(os.path.join(dati, 'geometria-italia.json'))
    if g != sc['geometria_sha256']:
        raise Blocco('controllo 2: geometria-italia.json cambiata')
    out['geometria-italia.json'] = g
    out['richieste.json'] = sha256_file(os.path.join(dati, 'richieste.json'))
    hm = hashlib.sha256()
    nomi = sorted(n for n in os.listdir(os.path.join(dati, 'meteo')) if n.endswith('.json'))
    for n in nomi:
        hm.update(f'{n} {sha256_file(os.path.join(dati, "meteo", n))}\n'.encode())
    out['meteo/'] = {'file': len(nomi), 'sha256_elenco': hm.hexdigest()}
    out['scaricamento_osservazioni'] = sc['scaricato']
    # istantanea congelata: alla prima esecuzione si scrive dati/istantanea.json; poi ogni file deve coincidere
    manifesto = {'osservazioni/inat.jsonl': out['inat.jsonl'], 'osservazioni/gbif.jsonl': out['gbif.jsonl'],
                 'geometria-italia.json': g, 'richieste.json': out['richieste.json'],
                 'taxa.json': sha256_file(os.path.join(dati, 'taxa.json'))}
    for n in nomi:
        manifesto['meteo/' + n] = sha256_file(os.path.join(dati, 'meteo', n))
    fp = os.path.join(dati, 'istantanea.json')
    if os.path.exists(fp):
        salvato = json.load(open(fp))['file']
        diversi = sorted(k for k in set(salvato) | set(manifesto) if salvato.get(k) != manifesto.get(k))
        # le quote della priorità 5 possono arrivare dopo: un file meteo nuovo di tipo quota non blocca
        nuovi_quota = [k for k in diversi if k not in salvato and json.load(open(os.path.join(dati, k)))['richiesta']['tipo'] == 'quota']
        diversi = [k for k in diversi if k not in nuovi_quota]
        if diversi:
            raise Blocco(f'controllo 2: istantanea cambiata in {len(diversi)} file (per esempio {diversi[0]})')
        out['istantanea_quote_aggiunte'] = len(nuovi_quota)
    else:
        C.scrivi_atomico(fp, json.dumps({'creata': C.adesso_iso(), 'file': manifesto}, sort_keys=True, indent=0))
    out['istantanea.json'] = sha256_file(fp)
    return out


def carica_record(dati, sin, geo):
    recs = C.leggi_jsonl(os.path.join(dati, 'osservazioni', 'inat.jsonl')) + \
        C.leggi_jsonl(os.path.join(dati, 'osservazioni', 'gbif.jsonl'))
    validi = []
    fuori_inat = 0
    for r in recs:
        if not C.passa_filtri_base(r, geo):
            continue
        # 2.1 dell'Italia: la geometria vale per entrambe le fonti (comune.py la applica solo a GBIF; D21)
        if r['fonte'] == 'inat' and not C.punto_in_geojson(r['lat'], r['lon'], geo):
            fuori_inat += 1
            continue
        d = C.data_singola(r)
        if not (dt.date(2015, 1, 1) <= d <= dt.date(2025, 12, 31)):
            continue
        lat, lon = float(r['lat']), float(r['lon'])
        validi.append(dict(r, data=d.isoformat(), lat=lat, lon=lon, cella=C.cella(r['lat'], r['lon']),
                           cella2=cella2(r['lat'], r['lon'])))
    # deduplica 2 e 3 (D9)
    def chiave_taxon(r):
        sp = C.specie_del_caso(dict(r, qualita='research'), sin)
        return 'app:' + sp if sp else 'nome:' + C.nome_canonico(r.get('nome'))
    gb = [r for r in validi if r['fonte'] == 'gbif']
    via = set()
    gruppi = collections.defaultdict(list)
    for r in gb:
        if r.get('in_cluster'):
            gruppi[(chiave_taxon(r), r['data'])].append(r)
    tolti2 = 0
    for g in gruppi.values():
        if len(g) > 1:
            g.sort(key=lambda r: int(r['id']))
            for r in g[1:]:
                via.add(('gbif', r['id']))
                tolti2 += 1
    inat_per = collections.defaultdict(list)
    for r in validi:
        if r['fonte'] == 'inat':
            inat_per[(chiave_taxon(r), r['data'])].append(r)
    tolti3 = 0
    for r in gb:
        if ('gbif', r['id']) in via:
            continue
        if any(dist_m(r, x) < 1000 for x in inat_per.get((chiave_taxon(r), r['data']), [])):
            via.add(('gbif', r['id']))
            tolti3 += 1
    validi = [r for r in validi if (r['fonte'], r['id']) not in via]
    for r in validi:
        r['taxon_chiave'] = chiave_taxon(r)
    # controllo bloccante di D9
    rimasti = collections.defaultdict(list)
    for r in validi:
        if r['fonte'] == 'gbif' and r.get('in_cluster'):
            rimasti[(r['taxon_chiave'], r['data'])].append(r)
    if any(len(v) > 1 for v in rimasti.values()):
        raise Blocco('controllo D9: restano record GBIF isInCluster con lo stesso taxon e la stessa data')
    inat_per = collections.defaultdict(list)
    for r in validi:
        if r['fonte'] == 'inat':
            inat_per[(r['taxon_chiave'], r['data'])].append(r)
    for r in validi:
        if r['fonte'] == 'gbif' and any(dist_m(r, x) < 1000 for x in inat_per.get((r['taxon_chiave'], r['data']), [])):
            raise Blocco('controllo D9: resta una coppia GBIF–iNaturalist entro 1000 m')
    return validi, {'record_letti': len(recs), 'record_validi': len(validi), 'deduplica_2': tolti2, 'deduplica_3': tolti3,
                    'inat_fuori_geometria': fuori_inat}


def controllo_record(validi, sin, geo):
    """Controllo 4 di 12 del Lazio."""
    for r in validi:
        if not C.punto_in_geojson(r['lat'], r['lon'], geo):
            raise Blocco('controllo 4: record fuori dalla geometria dell\'Italia')
        if r.get('incertezza') is None or r['incertezza'] > 1000:
            raise Blocco('controllo 4: record con incertezza assente o > 1000 m')
        if r['fonte'] == 'inat' and (r.get('oscurato') or r.get('qualita') == 'casual'):
            raise Blocco('controllo 4: record iNaturalist oscurato o casual')
        if r['fonte'] == 'gbif' and (r.get('dataset') == C.INAT_SU_GBIF or r.get('link_inat')):
            raise Blocco('controllo 4: record del dataset iNaturalist dentro GBIF')
        if r['data'] > '2025-12-31' or r['data'] < '2015-01-01':
            raise Blocco('controllo 4: record fuori periodo')


# Tabella 2.2 del Lazio (id iNaturalist e chiavi del Backbone) e lista P2 di 4.2 dell'Italia, trascritte dai documenti.
TABELLA_22 = {'edulis': ([48701], [5954958]), 'pinophilus': ([335942], [5954949]), 'aereus': ([333772], [8733688]),
              'aestivalis': ([350216], [5954691]), 'caesarea': ([204588], [5240269]), 'cibarius': ([47347], [5249504]),
              'cornucopioides': ([48607], [2554662]), 'repandum': ([48641], [2554716]), 'procera': ([63401], [8914748]),
              'mellea': ([55950], [2536891]), 'virescens': ([125720, 194437], [2551423, 2551542]),
              'suillus': ([53488, 179065, 363592], [7777157, 8146046, 9104622]), 'terreum': ([341797], [5241808]),
              'nuda': ([1525548], [5242048])}
LISTA_P2 = {127511, 118087, 352247, 328266, 118086, 1098280, 48473, 63509, 781305}


def controllo_taxa():
    """Controllo 3 di 12 del Lazio: taxa del codice uguali a quelli dei documenti."""
    for sp, (inat, gbif) in TABELLA_22.items():
        v = C.SPECIE.get(sp)
        if not v or sorted(v['inat']) != sorted(inat) or sorted(v['gbif']) != sorted(gbif):
            raise Blocco(f'controllo 3: {sp} diverso dalla tabella 2.2')
    if set(C.SPECIE) != set(TABELLA_22) or set(C.P2_INAT.values()) != LISTA_P2:
        raise Blocco('controllo 3: elenco delle specie o lista P2 diversi dai documenti')
    return {'specie': len(TABELLA_22), 'taxa_P2': len(LISTA_P2)}


def controllo_controlli(validi, sin, unita):
    """Controllo 3: nessun record di un'unità controllo è un caso possibile o un taxon escluso (2.2 del Lazio)."""
    per_id = {(r['fonte'], r['id']): r for r in validi}
    n = 0
    for u in unita:
        for i in u['record']:
            r = per_id[(u['fonte'], i)]
            if C.escluso_dai_controlli(r, sin) or C.specie_del_caso(dict(r, qualita='research'), sin):
                n += 1
    if n:
        raise Blocco(f'controllo 3: {n} record di controlli con un taxon escluso')
    return n


def unita_regioni_diverse(validi, sin):
    """Uscite (casi e controlli, 2015–2025) con record in regioni diverse: la regione è quella del primo record (D21)."""
    g = collections.defaultdict(set)
    for r in validi:
        oss = r.get('osservatore')
        if oss:
            g[(r['fonte'], oss, r['data'], r['cella'])].add(C.regione(r.get('regione')) or 'ignota')
    return sum(1 for v in g.values() if len(v) > 1)


# --- 2. unità ----------------------------------------------------------------------------------------------------

def costruisci_unita(validi, sin, filtro=None):
    """Unità caso per specie (2015–2025), unità controllo P1 e P2. `filtro` toglie record (S-PREC, S-LIC)."""
    rs = [r for r in validi if filtro is None or filtro(r)]
    per_id = {(r['fonte'], r['id']): r for r in rs}
    qual_ok = lambda r: r['fonte'] == 'gbif' or r.get('qualita') in ('research', 'needs_id')

    def arricchisci(u):
        rec = [per_id[(u['chiave'][0], i)] for i in u['record']]
        r0 = rec[0]
        u['fonte'] = u['chiave'][0]
        u['lat'], u['lon'] = float(u['punto'][0]), float(u['punto'][1])
        u['cella2'] = cella2(u['punto'][0], u['punto'][1])
        u['regione'] = C.regione(r0.get('regione')) or 'ignota'
        u['macro'] = C.REGIONE_MACRO.get(u['regione'], 'ignota')
        u['anno'] = int(u['data'][:4])
        u['d'] = giorno(u['data'])
        u['doy'] = doy(u['d'])
        u['oss_cluster'] = u['osservatore'] if not str(u['osservatore']).startswith('rec:') else 'solo:' + u['fonte'] + str(u['record'][0])
        u['solo_sopra_genere'] = all((r.get('rango') or '').lower() not in SOTTO_GENERE for r in rec)
        u['punto_q'] = (round(u['lat'], 5), round(u['lon'], 5))
        return u

    casi = []
    for sp in C.ORDINE_SPECIE:
        for u in C.uscite([r for r in rs if C.specie_del_caso(r, sin) == sp]):
            u['specie'] = sp
            casi.append(arricchisci(u))
    ctrl_rec = [r for r in rs if qual_ok(r) and not C.escluso_dai_controlli(r, sin)]
    ctrl = [arricchisci(u) for u in C.uscite(ctrl_rec)]
    p2 = [arricchisci(u) for u in C.uscite([r for r in ctrl_rec if C.e_p2(r)])]
    return casi, ctrl, p2


def indice(unita, campo='cella'):
    idx = collections.defaultdict(list)
    for k, u in enumerate(unita):
        idx[(u[campo], u['anno'])].append(k)
    return idx


def abbina(caso, unita, idx, campo='cella', finestra=30):
    out = []
    for k in idx.get((caso[campo], caso['anno']), []):
        u = unita[k]
        if abs((u['d'] - caso['d']).days) > finestra:
            continue
        if u['osservatore'] == caso['osservatore'] and u['data'] == caso['data']:
            continue
        out.append(k)
    return out


# --- 3. serie meteo ----------------------------------------------------------------------------------------------

def mappa_richieste(dati):
    el = json.load(open(os.path.join(dati, 'richieste.json')))['richieste']
    p1 = collections.defaultdict(list)
    gemelle = {}
    quote = {}
    for q in el:
        if q['tipo'] == 'meteo' and q['priorita'] == 1:
            p1[(q['cella'], q['anno'])].append(q)
        elif q['tipo'] == 'meteo' and q['priorita'] == 2:
            gemelle[q['gemella']] = q['chiave']
    for fn in os.listdir(os.path.join(dati, 'meteo')):
        x = json.load(open(os.path.join(dati, 'meteo', fn)))
        q = x['richiesta']
        if q['tipo'] != 'quota':
            continue
        for c, e in zip(q['coordinate'], x['risposta']['elevation']):
            quote[(round(c[0], 5), round(c[1], 5))] = e
    return p1, gemelle, quote


def richiesta_di(p1, cella, d):
    for q in p1.get((cella, d.year), []):
        if q['inizio'] <= d.isoformat() <= q['fine']:
            return q['chiave']
    return None


# --- 4. climatologia (2) -------------------------------------------------------------------------------------

class Climatologia:
    """c_k(t) = casi di X negli anni di training a ≤ 15 giorni da t / unità controllo del disegno negli stessi anni e
    giorni, per macro-area; sotto 10 casi di X negli anni di training nella macro-area si usa l'Italia (D5, 4.7)."""

    def __init__(self, casi, controlli):
        self.num = collections.defaultdict(lambda: np.zeros(366))  # (specie, macro, anno)
        self.den = collections.defaultdict(lambda: np.zeros(366))  # (macro, anno)
        for u in casi:
            for m in (u['macro'], 'Italia'):
                self.num[(u['specie'], m, u['anno'])][u['doy']] += 1
        for u in controlli:
            for m in (u['macro'], 'Italia'):
                self.den[(m, u['anno'])][u['doy']] += 1
        self.cache = {}
        self.ripieghi = collections.Counter()

    @staticmethod
    def finestra(h, t):
        idx = [((t - 1 + k) % 365) + 1 for k in range(-15, 16)]
        return h[idx].sum()

    def valore(self, specie, macro, anno, t):
        chiave = (specie, macro, anno, t)
        if chiave in self.cache:
            return self.cache[chiave]
        anni = [y for y in range(2015, 2026) if y != anno]
        usa = macro
        if macro == 'ignota' or sum(self.num[(specie, macro, y)].sum() for y in anni) < 10:
            usa = 'Italia'
            self.ripieghi[(specie, macro)] += 1
        n = sum(self.finestra(self.num[(specie, usa, y)], t) for y in anni)
        dd = sum(self.finestra(self.den[(usa, y)], t) for y in anni)
        v = float(n / dd) if dd > 0 else 0.0
        self.cache[chiave] = v
        return v


# --- 5. bootstrap e metriche -----------------------------------------------------------------------------------

def u_caso(xc, xs):
    xs = np.asarray(xs, dtype=float)
    return float(np.mean((xc > xs) + 0.5 * (xc == xs)))


def pari(xc, xs):
    return float(np.mean(np.asarray(xs, dtype=float) == xc))


def bootstrap(casi, colonne, B, tipi=('cella', 'oss', 'regione_anno'), per_specie=False):
    """Repliche di B per ogni tipo di cluster, stesso generatore per tutte le colonne (differenze appaiate).
    Ritorna {tipo: matrice B × colonne} delle medie (o delle medie delle specie, per S-SPEC)."""
    rng = np.random.default_rng(SEME)
    U = np.array([[c['U'][k] for k in colonne] for c in casi], dtype=float)
    specie = sorted({c['specie'] for c in casi})
    sp_idx = np.array([specie.index(c['specie']) for c in casi])
    out = {}
    for tipo in tipi:
        etichette = [c['cluster'][tipo] for c in casi]
        uniche = sorted(set(etichette))
        ci = np.array([uniche.index(e) for e in etichette])
        K = len(uniche)
        draws = rng.integers(0, K, size=(B, K))
        Cm = np.zeros((B, K))
        for b in range(B):
            Cm[b] = np.bincount(draws[b], minlength=K)
        if not per_specie:
            sums = np.zeros((K, len(colonne)))
            np.add.at(sums, ci, U)
            cnt = np.bincount(ci, minlength=K).astype(float)
            num = Cm @ sums
            den = Cm @ cnt
            out[tipo] = num / den[:, None]
        else:
            S = len(specie)
            sums = np.zeros((K, S, len(colonne)))
            np.add.at(sums, (ci, sp_idx), U)
            cnt = np.zeros((K, S))
            np.add.at(cnt, (ci, sp_idx), 1)
            num = np.einsum('bk,ksc->bsc', Cm, sums)
            den = Cm @ cnt
            with np.errstate(invalid='ignore', divide='ignore'):
                medie = num / den[:, :, None]
            out[tipo] = np.nanmean(medie, axis=1)
    return out


def stima(casi, colonne, per_specie=False):
    U = np.array([[c['U'][k] for k in colonne] for c in casi], dtype=float)
    if not per_specie:
        return U.mean(axis=0)
    specie = sorted({c['specie'] for c in casi})
    return np.mean([U[[c['specie'] == s for c in casi]].mean(axis=0) for s in specie], axis=0)


def p_boot(rep, r):
    B = len(rep)
    return min(1.0, 2 * min(1 + np.sum(rep <= r), 1 + np.sum(rep >= r)) / (B + 1))


def domande_da(est, reps, colonne, domande):
    """Stima, tre intervalli e p per ogni domanda (differenza di colonne o colonna − 0,5)."""
    out = {}
    j = {c: k for k, c in enumerate(colonne)}
    for nome, (a, b, delta) in domande.items():
        if a not in j or (b is not None and b not in j):
            continue
        rif = 0.0
        th = est[j[a]] - (0.5 if b is None else est[j[b]])
        intervalli, ps = {}, []
        for tipo, rep in reps.items():
            v = rep[:, j[a]] - (0.5 if b is None else rep[:, j[b]])
            lo, hi = np.percentile(v, [2.5, 97.5], method='linear')
            intervalli[tipo] = [float(lo), float(hi)]
            ps.append(p_boot(v, rif))
        out[nome] = {'stima': float(th), 'auc': float(est[j[a]]) if b is None else None, 'intervalli': intervalli,
                     'p': float(max(ps)), 'p_per_intervallo': [float(x) for x in ps], 'delta': delta}
    return out


def verdetto(d, nome):
    th, delta = d['stima'], d['delta']
    iv = list(d['intervalli'].values())
    sopra = all(lo > 0 for lo, hi in iv)
    sotto = all(hi < 0 for lo, hi in iv)
    q1 = nome == 'Q1'
    if sopra:
        return ('più alta nei giorni di ritrovamento' if q1 else 'meglio') if th >= delta else 'meglio, ma trascurabile (sotto δ)'
    if sotto:
        return ('più bassa nei giorni di ritrovamento' if q1 else 'peggio') if th <= -delta else 'peggio, ma trascurabile (sotto δ)'
    v = 'non distinguibile'
    if all(-delta < lo and hi < delta for lo, hi in iv):
        v += '; la differenza resta sotto δ in tutto l\'intervallo'
    return v


def holm(pvals):
    """p corretti di Holm (passo in giù) per una famiglia: dizionario nome → p."""
    nomi = sorted(pvals, key=lambda k: (pvals[k], k))
    m = len(nomi)
    out, corrente = {}, 0.0
    for i, k in enumerate(nomi):
        corrente = max(corrente, min(1.0, (m - i) * pvals[k]))
        out[k] = corrente
    return out


def eff(lista):
    c = collections.Counter(lista)
    n = sum(c.values())
    return 1 / sum((v / n) ** 2 for v in c.values()) if n else 0.0


# --- 6. analisi --------------------------------------------------------------------------------------------------

class Valutazione:
    def __init__(self, a):
        self.a = a
        self.dati = a.dati
        self.voci = {}  # (chiave, giorno, specie) -> indice
        self.lista_voci = []

    def voce(self, chiave, d, specie):
        k = (chiave, d.isoformat(), specie)
        if k not in self.voci:
            self.voci[k] = len(self.lista_voci)
            self.lista_voci.append(list(k))
        return k

    def calcola_fattori(self):
        fp = os.path.join(self.dati, 'da-calcolare.json')
        C.scrivi_atomico(fp, json.dumps({'voci': self.lista_voci}))
        r = subprocess.run([self.a.node, os.path.join(QUI, 'fattori.mjs'), self.dati], capture_output=True, text=True)
        if r.returncode != 0:
            raise Blocco('fattori.mjs: ' + (r.stderr or r.stdout).strip()[:500])
        self.fattori = json.load(open(os.path.join(self.dati, 'fattori.json')))
        if len(self.fattori['righe']) != len(self.lista_voci):
            raise Blocco('fattori.mjs: numero di righe diverso dalle voci')
        return r.stdout.strip()

    def riga(self, k):
        return self.fattori['righe'][self.voci[k]]


def punteggi(riga, f2):
    """Punteggi di un'unità per una specie; None se il meteo non è completo."""
    if not riga['complete']:
        return None
    return {'f0': riga['S'], 'f1': riga['f1'], 'f1b': riga['f1b'], 'f2': f2, 'arr': float(riga['f1_app']),
            'c_S': riga['S'], 'c_rain': riga['rain'], 'c_temp': riga['temp'], 'c_moist': riga['moist'],
            'c_fh': riga['frost'] * riga['heat'], 'c_rtm': riga['rain'] * riga['temp'] * riga['moist']}


def costruisci_casi(V, casi_unita, controlli, abbinati, clima, p1, chiave_serie=None, cc=False, distinti=None):
    """Casi pronti per le metriche: U per punteggio, quote di pari, cluster; più i conteggi di esclusione.
    `abbinati[i]` = indici dei controlli del caso i; con cc=True i «controlli» sono i giorni del case-crossover."""
    pronti, conto = [], collections.Counter()
    per_anno = collections.Counter()
    for i, c in enumerate(casi_unita):
        key = richiesta_di(p1, c['cella'], c['d']) if chiave_serie is None else chiave_serie(c)
        if key is None:
            conto['senza_richiesta'] += 1
            continue
        if not abbinati[i]:
            conto['senza_controlli'] += 1
            continue
        rc = V.riga((key, c['d'].isoformat(), c['specie']))
        sc = punteggi(rc, clima.valore(c['specie'], c['macro'], c['anno'], c['doy']) if clima else 0.0)
        if sc is None:
            conto['caso_senza_meteo'] += 1
            per_anno[('caso', c['specie'], c['anno'])] += 1
            continue
        ctrl_sc = []
        for m in abbinati[i]:
            if cc:
                dm = m
                rm = V.riga((key, dm.isoformat(), c['specie']))
                smm = punteggi(rm, 0.0)
            else:
                u = controlli[m]
                rm = V.riga((key, u['d'].isoformat(), c['specie']))
                smm = punteggi(rm, clima.valore(c['specie'], u['macro'], u['anno'], u['doy']) if clima else 0.0)
            if smm is None:
                conto['coppie_senza_meteo'] += 1
                per_anno[('controllo', c['specie'], c['anno'])] += 1
                continue
            conto['coppie_valide'] += 1
            ctrl_sc.append(smm)
        if not ctrl_sc:
            conto['caso_senza_controlli_con_meteo'] += 1
            continue
        if distinti is not None:
            for x in [sc] + ctrl_sc:
                for k in ('f0', 'f1', 'f1b', 'f2'):
                    distinti[(c['specie'], k)].add(x[k])
        U = {k: u_caso(sc[k], [x[k] for x in ctrl_sc]) for k in PUNTEGGI}
        T = {k: pari(sc[k], [x[k] for x in ctrl_sc]) for k in PUNTEGGI}
        pronti.append({'specie': c['specie'], 'cella': c['cella'], 'anno': c['anno'], 'macro': c['macro'],
                       'regione': c['regione'], 'm': len(ctrl_sc), 'U': U, 'pari': T, 'chiave': key,
                       'uscita': c['chiave'], 'quota': c.get('quota'), 'd': c['d'],
                       'cluster': {'cella': c.get('cluster_cella', c['cella']), 'oss': c['oss_cluster'],
                                   'regione_anno': f"{c['regione']}|{c['anno']}"},
                       'controlli_id': [] if cc else list(abbinati[i])})
    return pronti, conto, per_anno


def riassunto_casi(casi):
    n = len(casi)
    if not n:
        return {'n': 0}
    return {'n': n, 'celle': len({c['cluster']['cella'] for c in casi}), 'anni': sorted({c['anno'] for c in casi}),
            'm_mediana': float(np.median([c['m'] for c in casi])),
            'controlli_unici': len({x for c in casi for x in c['controlli_id']}),
            'eff_cella': eff([c['cluster']['cella'] for c in casi]),
            'eff_oss': eff([c['cluster']['oss'] for c in casi]),
            'eff_regione_anno': eff([c['cluster']['regione_anno'] for c in casi]),
            'pari': {k: round(float(np.mean([c['pari'][k] for c in casi])), 4) for k in ('f0', 'f1', 'f1b', 'f2', 'arr')}}


def analizza(casi, B, domande, colonne=('f0', 'f1', 'f1b', 'f2'), per_specie=False, tipi=('cella', 'oss', 'regione_anno')):
    if not casi:
        return {'casi': {'n': 0}}
    colonne = list(colonne)
    est = stima(casi, colonne, per_specie)
    reps = bootstrap(casi, colonne, B, tipi, per_specie)
    return {'casi': riassunto_casi(casi), 'auc': {k: float(v) for k, v in zip(colonne, est)},
            'domande': domande_da(est, reps, colonne, domande)}


def soglia_specie(r):
    c = r['casi']
    return c.get('n', 0) >= 30 and c.get('celle', 0) >= 5 and c.get('eff_cella', 0) >= 15 and c.get('eff_oss', 0) >= 15


def soglia_complessiva(r):
    c = r['casi']
    return c.get('n', 0) >= 50 and c.get('celle', 0) >= 10 and c.get('eff_cella', 0) >= 15 and c.get('eff_oss', 0) >= 15


def per_anni(casi, B, domande):
    """D4: stima e intervallo B-cella dentro ogni anno; stima togliendo un anno."""
    out = {}
    for y in sorted({c['anno'] for c in casi}):
        sub = [c for c in casi if c['anno'] == y]
        r = analizza(sub, B, domande, tipi=('cella',))
        senza = [c for c in casi if c['anno'] != y]
        est_senza = stima(senza, ['f0', 'f1', 'f1b', 'f2']) if senza else None
        out[str(y)] = {'n': len(sub), 'domande': r.get('domande', {}),
                       'senza_anno': None if est_senza is None else {k: float(v) for k, v in zip(['f0', 'f1', 'f1b', 'f2'], est_senza)}}
    return out


def applica_anni(dom, anni, nome):
    """«eterogeneo fra anni» e «non stabile fra anni» (D4)."""
    a, b, _ = DOMANDE[nome]
    th = dom['stima']
    note = []
    for y, v in anni.items():
        dy = v['domande'].get(nome)
        if dy and np.sign(dy['stima']) != np.sign(th) and dy['stima'] != 0 and th != 0:
            lo, hi = dy['intervalli']['cella']
            if lo > 0 or hi < 0:
                note.append(('eterogeneo', y))
        if v['senza_anno'] is not None:
            ts = v['senza_anno'][a] - (0.5 if b is None else v['senza_anno'][b])
            if th != 0 and np.sign(ts) != np.sign(th):
                note.append(('instabile', y))
    return note


def contraddice(principale, secondaria, nome):
    """D13: tutti e tre gli intervalli della secondaria dalla parte opposta del riferimento rispetto alla stima del
    principale. Se il principale è «non distinguibile» la frase è «va nella direzione opposta»."""
    p = principale['domande'].get(nome)
    s = secondaria.get('domande', {}).get(nome)
    if not p or not s or p['stima'] == 0:
        return None
    iv = list(s['intervalli'].values())
    if p['stima'] > 0 and all(hi < 0 for lo, hi in iv):
        return 'opposta'
    if p['stima'] < 0 and all(lo > 0 for lo, hi in iv):
        return 'opposta'
    return None


def verdetti_completi(pronti_x, B):
    """Verdetti della complessiva e delle dieci specie (9 del Lazio, D3, D4, D20.8) e Q4 (famiglia di due).
    Usata per il principale e, con gli stessi criteri, per S-D19 (D19)."""
    dom3 = {k: v for k, v in DOMANDE.items() if k != 'Q4'}
    out = {'specie': {}}
    n_sp = collections.Counter(c['specie'] for c in pronti_x)
    incluse = [sp for sp in C.ORDINE_SPECIE if n_sp[sp] >= 5]
    out['incluse'] = incluse
    tot = [c for c in pronti_x if c['specie'] in incluse]
    out['complessiva'] = analizza(tot, B, dom3, PUNTEGGI)
    for sp in C.ORDINE_SPECIE:
        sub = [c for c in pronti_x if c['specie'] == sp]
        out['specie'][sp] = analizza(sub, B, dom3) if len(sub) >= 5 else {'casi': riassunto_casi(sub)}
    out['anni_complessiva'] = per_anni(tot, B, dom3)
    valut = soglia_complessiva(out['complessiva'])
    out['complessiva']['valutabile'] = valut
    out['complessiva']['verdetti'] = {}
    for nome, d in out['complessiva']['domande'].items():
        v = verdetto(d, nome) if valut else 'non valutabile'
        note = applica_anni(d, out['anni_complessiva'], nome) if valut else []
        if any(n[0] == 'eterogeneo' for n in note) and not v.startswith('non '):
            v = 'eterogeneo fra anni'
        out['complessiva']['verdetti'][nome] = {'verdetto': v, 'note_anni': note}
    out['holm'] = {}
    for nome in ('Q1', 'Q2', 'Q3'):
        pv = {sp: (out['specie'][sp]['domande'][nome]['p'] if 'domande' in out['specie'][sp] and soglia_specie(out['specie'][sp]) else 1.0)
              for sp in ETICHETTATE}
        corr = holm(pv)
        out['holm'][nome] = {'p': pv, 'p_holm': corr}
        for sp in ETICHETTATE:
            r = out['specie'][sp]
            r.setdefault('verdetti', {})
            if 'domande' not in r or not soglia_specie(r):
                r['verdetti'][nome] = 'non valutabile'
                continue
            v = verdetto(r['domande'][nome], nome)
            if corr[sp] <= 0.05:
                if not v.startswith('non '):
                    anni = per_anni([c for c in pronti_x if c['specie'] == sp], B, {nome: DOMANDE[nome]})
                    note = applica_anni(r['domande'][nome], anni, nome)
                    if any(n[0] == 'eterogeneo' for n in note):
                        v = 'eterogeneo fra anni'
                    r.setdefault('note_anni', {})[nome] = note
                r['verdetti'][nome] = v
            else:
                nota = '; la differenza resta sotto δ in tutto l\'intervallo' if 'sotto δ in tutto' in v else ''
                r['verdetti'][nome] = 'non distinguibile (dopo la correzione di Holm)' + nota
    q4 = {'Q4': DOMANDE['Q4']}
    gruppi = {'edulis': [c for c in pronti_x if c['specie'] == 'edulis'],
              'porcini_insieme': [c for c in pronti_x if c['specie'] in ('edulis', 'pinophilus')]}
    ris = {k: analizza(v, B, q4) for k, v in gruppi.items()}
    pv = {k: (r['domande']['Q4']['p'] if soglia_complessiva(r) else 1.0) for k, r in ris.items()}
    corr = holm(pv)
    for k, r in ris.items():
        if not soglia_complessiva(r):
            r['verdetto'] = 'non valutabile'
        else:
            v = verdetto(r['domande']['Q4'], 'Q4')
            if corr[k] <= 0.05:
                if not v.startswith('non '):
                    note = applica_anni(r['domande']['Q4'], per_anni(gruppi[k], B, q4), 'Q4')
                    if any(n[0] == 'eterogeneo' for n in note):
                        v = 'eterogeneo fra anni'
                    r['note_anni'] = note
                r['verdetto'] = v
            else:
                nota = '; la differenza resta sotto δ in tutto l\'intervallo' if 'sotto δ in tutto' in v else ''
                r['verdetto'] = 'non distinguibile (dopo la correzione di Holm)' + nota
        r['p_holm'] = corr[k]
    out['Q4'] = ris
    return out, tot


def esegui(a):
    esiti = {'versioni': {'python': platform.python_version(), 'numpy': np.__version__, 'sistema': platform.platform()}}
    esiti['controllo_1_moduli'] = controlli_moduli()
    esiti['controllo_2_istantanea'] = istantanea(a.dati)
    esiti['controllo_3_taxa'] = controllo_taxa()
    sin = C.tabella_sinonimi(os.path.join(a.dati, 'taxa.json'))
    geo = json.load(open(os.path.join(a.dati, 'geometria-italia.json')))
    validi, info = carica_record(a.dati, sin, geo)
    controllo_record(validi, sin, geo)
    esiti['record'] = info
    esiti['licenze'] = dict(collections.Counter((r['fonte'], r.get('licenza') or 'nessuna') for r in validi
                                                if C.specie_del_caso(r, sin)).most_common())
    esiti['licenze'] = {f'{k[0]}:{k[1]}': v for k, v in esiti['licenze'].items()}
    p1, gemelle, quote = mappa_richieste(a.dati)

    nel_periodo = lambda u: 2023 <= u['anno'] <= 2025
    V = Valutazione(a)

    def prepara(filtro=None):
        casi_t, ctrl_t, p2_t = costruisci_unita(validi, sin, filtro)
        for u in casi_t + ctrl_t + p2_t:
            u['quota'] = quote.get(u['punto_q'])
        return casi_t, ctrl_t, p2_t

    casi_t, ctrl_t, p2_t = prepara()
    casi = [u for u in casi_t if nel_periodo(u)]
    ctrl = [u for u in ctrl_t if nel_periodo(u)]
    p2 = [u for u in p2_t if nel_periodo(u)]
    esiti['controllo_3_taxa']['controlli_esclusi_trovati'] = controllo_controlli(validi, sin, ctrl_t + p2_t)

    def disegni_per(controlli):
        idx, idx2 = indice(controlli), indice(controlli, 'cella2')
        d = {'base': [abbina(c, controlli, idx) for c in casi]}
        d['S-FIN'] = [abbina(c, controlli, idx, finestra=15) for c in casi]
        d['S-CELLA'] = [abbina(c, controlli, idx2, campo='cella2') for c in casi]
        d['S-QUOTA'] = [[k for k in m if c['quota'] is not None and controlli[k]['quota'] is not None
                         and abs(controlli[k]['quota'] - c['quota']) <= 300] for c, m in zip(casi, d['base'])]
        return d

    dis = {'P1': disegni_per(ctrl), 'P2': disegni_per(p2)}
    dis['P1']['S-GEN'] = [[k for k in m if not ctrl[k]['solo_sopra_genere']] for m in dis['P1']['base']]
    # esplorative (D21): controlli dello stesso osservatore del caso, oppure di altri osservatori
    dis['P1']['E-STESSO-OSS'] = [[k for k in m if ctrl[k]['osservatore'] == c['osservatore']] for c, m in zip(casi, dis['P1']['base'])]
    dis['P1']['E-ALTRI-OSS'] = [[k for k in m if ctrl[k]['osservatore'] != c['osservatore']] for c, m in zip(casi, dis['P1']['base'])]
    cc = []
    for c in casi:
        giorni = [c['d'] + dt.timedelta(k) for k in (-28, -14, 14, 28)]
        cc.append([g for g in giorni if g.year == c['anno']])

    # varianti sui record: (unità caso 2015–2025, controlli P1, controlli P2, casi nel periodo, ab. P1, ab. P2)
    varianti = {}
    for nome, filtro in (('S-PREC', lambda r: r['incertezza'] <= 250),
                         ('S-LIC', lambda r: not (r['fonte'] == 'inat' and not r.get('licenza')))):
        ct, kt, pt = prepara(filtro)
        cv = [u for u in ct if nel_periodo(u)]
        kv = [u for u in kt if nel_periodo(u)]
        pv = [u for u in pt if nel_periodo(u)]
        ik, ip = indice(kv), indice(pv)
        varianti[nome] = {'ct': ct, 'kt': kt, 'pt': pt, 'cv': cv, 'kv': kv, 'pv': pv,
                          'ab1': [abbina(c, kv, ik) for c in cv], 'ab2': [abbina(c, pv, ip) for c in cv]}

    def registra(casi_u, controlli, abbinati, cc_=False):
        for i, c in enumerate(casi_u):
            key = richiesta_di(p1, c['cella'], c['d'])
            if key is None or not abbinati[i]:
                continue
            V.voce(key, c['d'], c['specie'])
            for m in abbinati[i]:
                V.voce(key, m if cc_ else controlli[m]['d'], c['specie'])

    for k, v in dis['P1'].items():
        registra(casi, ctrl, v)
    for k, v in dis['P2'].items():
        registra(casi, p2, v)
    registra(casi, None, cc, cc_=True)
    for v in varianti.values():
        registra(v['cv'], v['kv'], v['ab1'])
        registra(v['cv'], v['pv'], v['ab2'])
    principali = list(V.lista_voci)
    for key, d, sp in principali:
        if key in gemelle:
            V.voce(gemelle[key], giorno(d), sp)
    esiti['fattori'] = V.calcola_fattori()
    esiti['model_version'] = V.fattori['model_version']
    esiti['versioni']['node'] = V.fattori['node']
    esiti['controllo_5'] = controllo_5(V, a.dati)

    clima_p1 = Climatologia(casi_t, ctrl_t)
    clima_p2 = Climatologia(casi_t, p2_t)
    clima_gen = Climatologia(casi_t, [u for u in ctrl_t if not u['solo_sopra_genere']])

    distinti = collections.defaultdict(set)
    pronti, conto, per_anno = costruisci_casi(V, casi, ctrl, dis['P1']['base'], clima_p1, p1, distinti=distinti)
    esiti['completezza_P1'] = dict(conto)
    abbinati_tot = sum(1 for m in dis['P1']['base'] if m)
    quota_casi = (conto['caso_senza_meteo'] + conto['caso_senza_controlli_con_meteo']) / max(1, abbinati_tot)
    coppie = conto['coppie_valide'] + conto['coppie_senza_meteo']
    quota_coppie = conto['coppie_senza_meteo'] / max(1, coppie)
    esiti['completezza_P1']['quota_casi_senza_meteo'] = quota_casi
    esiti['completezza_P1']['quota_coppie_senza_meteo'] = quota_coppie
    esiti['completezza_P1']['per_specie_anno'] = {f'{k[0]}|{k[1]}|{k[2]}': v for k, v in sorted(per_anno.items())}
    if quota_casi > 0.20 or quota_coppie > 0.20:
        raise Blocco(f'blocco al 20%: casi senza meteo {quota_casi:.1%}, coppie senza meteo {quota_coppie:.1%}')

    B = a.b
    risultati = {}
    princ, tot = verdetti_completi(pronti, B)
    risultati['P1'] = princ
    dom3 = {k: v for k, v in DOMANDE.items() if k != 'Q4'}

    def blocco(pronti_x, conto_x=None, colonne=('f0', 'f1', 'f1b', 'f2'), domande=dom3, rif=None):
        n_sp = collections.Counter(c['specie'] for c in pronti_x)
        incluse = [sp for sp in C.ORDINE_SPECIE if n_sp[sp] >= 5]
        sub = [c for c in pronti_x if c['specie'] in incluse]
        r = {'incluse': incluse, 'complessiva': analizza(sub, B, domande, colonne), 'specie': {}}
        for sp in C.ORDINE_SPECIE:
            ss = [c for c in pronti_x if c['specie'] == sp]
            r['specie'][sp] = analizza(ss, B, domande, colonne) if len(ss) >= 5 else {'casi': riassunto_casi(ss)}
        if conto_x is not None:
            r['completezza'] = dict(conto_x)
        if rif is not None:
            r['contraddice'] = {q: contraddice(rif, r['complessiva'], q) for q in domande}
        return r, sub

    def famiglia(nome_d, controlli, d, clima, rif, variante=None):
        """Secondarie di un disegno (P1 o P2): 10 del Lazio e 4.9 dell'Italia."""
        out = {}
        for nome in ('S-FIN', 'S-QUOTA') + (('S-GEN',) if nome_d == 'P1' else ()):
            pr, cn, _ = costruisci_casi(V, casi, controlli, d[nome], clima_gen if nome == 'S-GEN' else clima, p1)
            out[nome] = blocco(pr, cn, rif=rif)[0]
        for c in casi:
            c['cluster_cella'] = cella2(c['lat'], c['lon'])
        pr, cn, _ = costruisci_casi(V, casi, controlli, d['S-CELLA'], clima, p1)
        out['S-CELLA'] = blocco(pr, cn, rif=rif)[0]
        for c in casi:
            c.pop('cluster_cella', None)
        for nome, v in varianti.items():
            ctr, ab = (v['kv'], v['ab1']) if nome_d == 'P1' else (v['pv'], v['ab2'])
            pr, cn, _ = costruisci_casi(V, v['cv'], ctr, ab, Climatologia(v['ct'], v['kt'] if nome_d == 'P1' else v['pt']), p1)
            out[nome] = blocco(pr, cn, rif=rif)[0]
        return out

    sec = {}
    # S-CC (uguale per P1 e P2: non usa controlli)
    pr, cn, _ = costruisci_casi(V, casi, None, cc, None, p1, cc=True)
    sec['S-CC'] = blocco(pr, cn, colonne=('f0', 'f1', 'f1b'), domande={'Q1': DOMANDE['Q1'], 'Q2': DOMANDE['Q2']}, rif=princ['complessiva'])[0]
    sec.update(famiglia('P1', ctrl, dis['P1'], clima_p1, princ['complessiva']))
    incl = princ['incluse']
    spec = analizza([c for c in pronti if c['specie'] in incl], B, dom3, per_specie=True)
    sec['S-SPEC'] = {'complessiva': spec, 'contraddice': {q: contraddice(princ['complessiva'], spec, q) for q in dom3}}
    comp_cols = ('c_S', 'c_rain', 'c_temp', 'c_moist', 'c_fh', 'c_rtm', 'arr')
    comp = analizza(tot, B, {k: (k, None, DELTA_Q1) for k in comp_cols}, colonne=comp_cols)
    sec['S-COMP'] = comp
    sec['S-ARR'] = {'auc_arrotondato': princ['complessiva']['auc']['arr'], 'auc_continuo': princ['complessiva']['auc']['f1'],
                    'pari_arrotondato': princ['complessiva']['casi']['pari']['arr'], 'Q1_arrotondato': comp['domande']['arr'],
                    'contraddice': contraddice(princ['complessiva'], {'domande': {'Q1': comp['domande']['arr']}}, 'Q1')}
    strati = {}
    for m in ('Nord', 'Centro', 'Sud e isole'):
        strati['macro:' + m] = analizza([c for c in tot if c['macro'] == m], B, dom3)
    for _, _, f in FASCE:
        strati['quota:' + f] = analizza([c for c in tot if fascia(c['quota']) == f], B, dom3)
    strati['quota:ignota'] = {'casi': {'n': sum(1 for c in tot if c['quota'] is None)}}
    sec['S-MACRO'] = strati
    sec['Lazio'] = analizza([c for c in tot if c['regione'] == 'Lazio'], B, dom3)
    # S-D19 con gli stessi verdetti del principale
    d19, _ = verdetti_completi([c for c in pronti if c['chiave'] not in D19_P1], B)
    d19['casi_tolti'] = sum(1 for c in pronti if c['chiave'] in D19_P1)
    d19['contraddice'] = {q: contraddice(princ['complessiva'], d19['complessiva'], q) for q in dom3}
    sec['S-D19'] = d19
    risultati['secondarie'] = sec

    # P2 (D1): descrittiva, con le sue secondarie (4.9 dell'Italia)
    pr2, cn2, _ = costruisci_casi(V, casi, p2, dis['P2']['base'], clima_p2, p1)
    p2r, tot2 = blocco(pr2, cn2, rif=princ['complessiva'])
    chiavi_p2 = {c['uscita'] + (c['specie'],) for c in pr2}
    p2r['P1_sugli_stessi_casi'] = blocco([c for c in pronti if c['uscita'] + (c['specie'],) in chiavi_p2])[0]
    p2r['secondarie'] = famiglia('P2', p2, dis['P2'], clima_p2, None)
    p2r['secondarie']['S-SPEC'] = {'complessiva': analizza([c for c in pr2 if c['specie'] in p2r['incluse']], B, dom3, per_specie=True)}
    p2r['secondarie']['S-COMP'] = analizza(tot2, B, {k: (k, None, DELTA_Q1) for k in comp_cols}, colonne=comp_cols)
    p2r['secondarie']['S-MACRO'] = {'macro:' + m: analizza([c for c in tot2 if c['macro'] == m], B, dom3) for m in ('Nord', 'Centro', 'Sud e isole')}
    p2r['secondarie']['S-MACRO'].update({'quota:' + f: analizza([c for c in tot2 if fascia(c['quota']) == f], B, dom3) for _, _, f in FASCE})
    risultati['P2'] = p2r

    # esplorative, dopo aver visto i risultati (D21): stesso osservatore contro altri osservatori
    esp = {}
    for nome in ('E-STESSO-OSS', 'E-ALTRI-OSS'):
        pr, cn, _ = costruisci_casi(V, casi, ctrl, dis['P1'][nome], clima_p1, p1)
        esp[nome] = blocco(pr, cn)[0]
    risultati['esplorative'] = esp

    struttura = {}
    for sp in C.ORDINE_SPECIE:
        cs = [c for c in casi if c['specie'] == sp]
        ab = [m for c, m in zip(casi, dis['P1']['base']) if c['specie'] == sp]
        struttura[sp] = {'unita_caso_2023_2025': len(cs), 'con_controlli': sum(1 for m in ab if m),
                         'senza_controlli': sum(1 for m in ab if not m),
                         'bordo_anno': sum(1 for c, m in zip(cs, ab) if m and ((c['d'] - dt.date(c['anno'], 1, 1)).days < 30
                                                                             or (dt.date(c['anno'], 12, 31) - c['d']).days < 30)),
                         'valori_distinti': {k: len(distinti[(sp, k)]) for k in ('f0', 'f1', 'f1b', 'f2')}}
    usc = collections.Counter(c['uscita'] for c in pronti)
    struttura['uscite_con_piu_specie'] = {'uscite': sum(1 for v in usc.values() if v > 1), 'unita_in_piu': sum(v - 1 for v in usc.values() if v > 1)}
    struttura['controlli_P1_nel_periodo'] = len(ctrl)
    struttura['controlli_P1_abbinati'] = len({k for m in dis['P1']['base'] for k in m})
    struttura['climatologia_ripieghi_italia'] = {f'{k[0]}|{k[1]}': v for k, v in sorted(clima_p1.ripieghi.items())}
    struttura['punti_ripiego'] = conta_ripieghi(a.dati, {c['chiave'] for c in pronti})
    struttura['scarto_orario'] = scarti(V)
    struttura['quote_mancanti'] = {'casi': sum(1 for c in casi if c['quota'] is None),
                                   'controlli_abbinati': sum(1 for k in {k for m in dis['P1']['base'] for k in m} if ctrl[k]['quota'] is None)}
    struttura['unita_con_regioni_diverse'] = unita_regioni_diverse(validi, sin)
    risultati['struttura'] = struttura
    risultati['C-BM'] = cbm(V, gemelle, pronti, ctrl)
    risultati['descrittiva'] = descrittiva(casi_t, ctrl_t)
    risultati['descrittiva']['pesi_months'] = {sp: V.fattori['profili'][sp]['months'] for sp in C.ORDINE_SPECIE}
    esiti['risultati'] = risultati
    esiti['parametri'] = {'B': B, 'seme': SEME, 'delta_Q1': DELTA_Q1, 'delta': DELTA, 'etichettate': ETICHETTATE}
    return esiti


def conta_ripieghi(dati, chiavi):
    n = 0
    for k in chiavi:
        x = json.load(open(os.path.join(dati, 'meteo', k + '.json')))
        n += x.get('punto') == 'ripiego'
    return {'richieste_usate': len(chiavi), 'con_punto_di_ripiego': n}


def scarti(V):
    return dict(collections.Counter(str(v.get('utc')) for v in json.load(open(os.path.join(V.dati, 'serie-giornaliere.json'))).values()))


def controllo_5(V, dati):
    """Predittori ricalcolati in Python dalla serie di toDaily e dalla risposta grezza (tolleranza 1e-9);
    peso stagionale ai giorni 15 uguale ai pesi mensili."""
    serie = json.load(open(os.path.join(dati, 'serie-giornaliere.json')))
    prof = V.fattori['profili']
    tol, n, maxdiff = 1e-9, 0, 0.0
    # toDaily rifatto in Python sulla risposta grezza
    for key, s in serie.items():
        r = json.load(open(os.path.join(dati, 'meteo', key + '.json')))['risposta']
        d, h = r['daily'], r['hourly']
        per = collections.defaultdict(lambda: [0.0, 0, 0.0, 0])
        for t, sm, st in zip(h['time'], h['soil_moisture_3_to_9cm'], h['soil_temperature_6cm']):
            b = per[t[:10]]
            if isinstance(sm, (int, float)) and 0 <= sm <= 1:
                b[0] += sm
                b[1] += 1
            if isinstance(st, (int, float)):
                b[2] += st
                b[3] += 1
        for k, g in enumerate(d['time']):
            p = d['precipitation_sum'][k]
            pp = p if isinstance(p, (int, float)) and p >= 0 else None
            sm = per[g][0] / per[g][1] if per[g][1] >= 24 else None
            st = per[g][2] / per[g][3] if per[g][3] >= 24 else None
            for a, b in ((pp, s['p'][k]), (sm, s['soilm'][k]), (st, s['soilt'][k]), (d['temperature_2m_mean'][k], s['tmean'][k])):
                if (a is None) != (b is None) or (a is not None and abs(a - b) > tol):
                    raise Blocco(f'controllo 5: toDaily diverso in {key} al {g}')
    for (key, g, sp), j in V.voci.items():
        r = V.fattori['righe'][j]
        if not r['complete']:
            continue
        s = serie[key]
        i = s['dates'].index(g)
        lo, hi = prof[sp]['lag'][1], prof[sp]['lag'][0]
        fin = lambda arr, a, b: [x for x in arr[max(0, a):b + 1] if x is not None]
        eff_rain = sum(fin(s['p'], i - lo, i - hi))
        max_ev = max([0.0] + fin(s['p'], i - lo, i - hi))
        r30 = sum(fin(s['p'], i - 30, i - 1))
        t20 = np.mean(fin(s['tmean'], i - 20, i - 1))
        sm = np.mean(fin(s['soilm'], i - 3, i - 1))
        for a, b in ((eff_rain, r['effRain']), (max_ev, r['maxEvent']), (r30, r['r30']), (t20, r['t20']), (sm, r['sm'])):
            maxdiff = max(maxdiff, abs(a - b))
            if abs(a - b) > tol:
                raise Blocco(f'controllo 5: predittore diverso in {key} {g} {sp}: {a} contro {b}')
        n += 1
    for sp, valori in V.fattori['stagione15'].items():
        for m, v in enumerate(valori):
            if abs(v - prof[sp]['months'][m]) > tol:
                raise Blocco(f'controllo 5: seasonWeight({sp}, 15/{m + 1}) = {v}, atteso {prof[sp]["months"][m]}')
    return {'voci_controllate': n, 'serie': len(serie), 'differenza_massima': maxdiff}


def cbm(V, gemelle, pronti, ctrl):
    """C-BM (4.3 dell'Italia, D11, D19): differenze best match − icon_seamless sui predittori (r30, t20, umidità media a
    3 giorni) dei giorni valutati nel principale (casi e controlli P1), un giorno per richiesta contato una volta."""
    serie = json.load(open(os.path.join(V.dati, 'serie-giornaliere.json')))
    cella_di = {q['chiave']: q.get('cella') for q in json.load(open(os.path.join(V.dati, 'richieste.json')))['richieste']}
    giorni = {}
    for c in pronti:
        for d in [c['d']] + [ctrl[k]['d'] for k in c['controlli_id']]:
            giorni.setdefault((c['chiave'], d.isoformat()), (c['specie'], c['macro']))
    righe = collections.defaultdict(list)
    escluse = 0
    for (key, g), (sp, macro) in sorted(giorni.items()):
        if key not in gemelle:
            continue
        kg = gemelle[key]
        if serie.get(key, {}).get('utc') != serie.get(kg, {}).get('utc'):
            escluse += 1
            continue
        a, b = V.riga((key, g, sp)), V.riga((kg, g, sp))
        if not (a['complete'] and b['complete']):
            continue
        for tag in ('tutte', 'senza_D19'):
            if tag == 'senza_D19' and (key in D19_P1 or kg == D19_CBM):
                continue
            righe[(tag, g[:4], macro)].append((b['r30'] - a['r30'], b['t20'] - a['t20'], b['sm'] - a['sm']))
    out = {'coppie_escluse_scarto_diverso': escluse, 'richieste_con_gemella': len({k for k, _ in giorni if k in gemelle}), 'gruppi': {}}
    for k in sorted(righe):
        v = np.array(righe[k])
        q = lambda x: [float(np.percentile(x, p, method='linear')) for p in (25, 50, 75)]
        out['gruppi']['|'.join(k)] = {'giorni': len(v), 'r30_mm': q(v[:, 0]), 't20_C': q(v[:, 1]), 'sm3': q(v[:, 2])}
    return out


def descrittiva(casi_t, ctrl_t):
    """11 del Lazio, 4.9 dell'Italia, D17: mese × fascia di quota, per tutta l'Italia e per macro-area, 2015–2025,
    sulle unità con quota. q(m) = unità caso di X / tutte le unità (uscite distinte: caso di qualsiasi specie in prova
    o controllo P1). Celle con meno di 10 unità: «pochi dati», senza q. Accanto i pesi mensili `months` dell'app."""
    out = {'unita_con_quota': 0, 'unita_senza_quota': 0, 'tabelle': {}}
    uscite = {}
    for u in ctrl_t + casi_t:
        uscite.setdefault(u['chiave'], u)
    out['unita_con_quota'] = sum(1 for u in uscite.values() if u.get('quota') is not None)
    out['unita_senza_quota'] = sum(1 for u in uscite.values() if u.get('quota') is None)
    for area in ('Italia', 'Nord', 'Centro', 'Sud e isole'):
        dentro = lambda u: area == 'Italia' or u['macro'] == area
        den = collections.Counter((u['d'].month, fascia(u['quota'])) for u in uscite.values() if u.get('quota') is not None and dentro(u))
        tab_area = {}
        for sp in C.ORDINE_SPECIE:
            num = collections.Counter((u['d'].month, fascia(u['quota'])) for u in casi_t
                                      if u['specie'] == sp and u.get('quota') is not None and dentro(u))
            tab = {}
            for _, _, f in FASCE:
                riga = []
                for m in range(1, 13):
                    tot = den[(m, f)]
                    riga.append({'casi': num[(m, f)], 'totale': tot, 'q': (num[(m, f)] / tot) if tot >= 10 else None})
                qmax = max((x['q'] for x in riga if x['q'] is not None), default=None)
                for x in riga:
                    x['q_rel'] = (x['q'] / qmax) if x['q'] is not None and qmax else None
                tab[f] = riga
            tab_area[sp] = tab
        out['tabelle'][area] = tab_area
    return out


def riepilogo_versionabile(esiti):
    """Solo aggregati. Oggi esiti.json contiene già solo aggregati: il riepilogo è la sua copia, e il controllo 7 lo
    verifica su tutte le forme di identificativo che potrebbero entrarci per errore."""
    return json.loads(json.dumps(esiti, default=str))


def controllo_7(testo, dati, validi_ids, osservatori):
    """Nessun identificativo di osservatore, record, richiesta meteo o cella, né serie meteo giornaliere."""
    import re
    if any(o and o in testo for o in osservatori):
        raise Blocco('controllo 7: un identificativo di osservatore compare nel riepilogo')
    numeri = set(re.findall(r'(?<![\d.])\d{6,}(?![\d.])', testo))
    if numeri & validi_ids:
        raise Blocco('controllo 7: un identificativo di record compare nel riepilogo')
    el = json.load(open(os.path.join(dati, 'richieste.json')))['richieste']
    if any(q['chiave'] in testo for q in el):
        raise Blocco('controllo 7: una chiave di richiesta meteo compare nel riepilogo')
    if any(f'"{q["cella"]}"' in testo for q in el if q.get('cella')):
        raise Blocco('controllo 7: un identificativo di cella compare nel riepilogo')
    for campo in ('"dates"', '"tmean"', '"soilm"', '"soilt"', '"precipitation_sum"'):
        if campo in testo:
            raise Blocco('controllo 7: una serie meteo compare nel riepilogo')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dati', default=C.DATI)
    ap.add_argument('--b', type=int, default=5000)
    ap.add_argument('--node', default='node')
    ap.add_argument('--uscita', default=os.path.join(QUI, 'esiti-riepilogo.json'))
    a = ap.parse_args()
    try:
        esiti = esegui(a)
    except Blocco as e:
        print('BLOCCO:', e, file=sys.stderr)
        return 2
    testo = json.dumps(esiti, ensure_ascii=False, sort_keys=True, indent=1, default=str)
    C.scrivi_atomico(os.path.join(a.dati, 'esiti.json'), testo)
    rie = riepilogo_versionabile(esiti)
    t2 = json.dumps(rie, ensure_ascii=False, sort_keys=True, indent=1, default=str)
    recs = C.leggi_jsonl(os.path.join(a.dati, 'osservazioni', 'inat.jsonl')) + C.leggi_jsonl(os.path.join(a.dati, 'osservazioni', 'gbif.jsonl'))
    controllo_7(t2, a.dati, {str(r['id']) for r in recs if len(str(r['id'])) >= 6}, {r.get('osservatore') for r in recs})
    C.scrivi_atomico(a.uscita, t2 + '\n')
    print('esiti scritti; SHA-256 riepilogo', hashlib.sha256((t2 + '\n').encode()).hexdigest())
    return 0


if __name__ == '__main__':
    sys.exit(main())
