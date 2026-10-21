"""Prova offline dei porcini (Bielefeld): esegue la valutazione preregistrata in preregistrazione.md.

Uso (dopo scarica.py; da qualsiasi cartella):

    python3 -I tools/benchmark-bielefeld/valuta.py

Opzioni:
    --dati CARTELLA   cartella dei dati (predefinita: dati/ accanto a questo file)
    --node PERCORSO   eseguibile di Node ≥ 22 (predefinito: node)
    --repliche N      repliche bootstrap; solo per prove rapide, l'esito preregistrato usa 5000

Ordine (preregistrazione, sezione 11): controlli sui dati e numeri dell'audit; ricostruzione dei giorni prima del 1/8;
hash dei moduli congelati; stime di σ per (2b); fattori dell'indice con `node fattori.mjs` (importa js/model.js e
js/species.js); allineamento fra JavaScript e Python; controllo di sigma_brejon.py; solo dopo, validazione a stagione
esclusa, metriche, bootstrap per stagione, jackknife e sensibilità. Si ferma al primo controllo che non torna.

Scrive in dati/ (esclusa da git): serie.json, sigma.json, fattori.json (da fattori.mjs), esiti.json ed
esiti-riepilogo.json (solo valori aggregati; la copia versionata sta accanto a questo file). Stampa una tabella
leggibile e lo SHA-256 di esiti.json senza `meta`, che è quello riproducibile. Solo libreria standard e numpy.

L'indice di Fronda è sperimentale (0–10) e non è una probabilità. Qui si misura solo come ordina i giorni.
"""
import argparse
import contextlib
import csv
import datetime
import hashlib
import io
import json
import math
import os
import platform
import re
import runpy
import subprocess
import sys

import numpy as np

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.normpath(os.path.join(QUI, '..', '..'))

NOME_CSV = 'Environmental_fruiting_data_jun8.csv'
CSV_SHA256 = '63148586ad0cd2533fb741070e95f900e53343f54a4ccdfe0944f3a8f0000e4c'
SIGMA_BREJON = 'tools/ipotesi/valutazione-v3/impianto-scientifico/sigma_brejon.py'
MODULI = {  # preregistrazione, sezione 11, controllo 4 (commit 2da612f)
    'js/model.js': '3d4785be55b77fe590a7892db7a4cbc2191d971a5b7877e41022456f634b6fcd',
    'js/species.js': 'd43868bd15e202e57bc0b49ff5c404d985d714543e383d5af59e0ab86c5f3cc7',
    'js/botanical-model.js': '75466dcd22524be0472443bb1f54559c4401d8b88dbc3de0075cf5ff5e558a64',
    SIGMA_BREJON: 'e3be0295a448654884ada9d97cac06878a283cd29ccfba0cd594cfff499bb34b',
}
MODEL_VERSION = '2.0.0'

SEME = 20261016
B_PREREG = 5000
DELTA = 0.02          # differenza minima d'interesse (sezione 9.2), proposta della revisione
T_9 = 2.262           # t di Student, 9 gradi di libertà, 97,5%
TOL = 1e-9
FINESTRE = list(range(2, 36, 3))  # 2, 5, …, 35 (codice R)
ANNI = list(range(2015, 2025))
K = len(ANNI)
TUTTE = tuple(range(K))
IDX_1AGO = 34         # nella serie che parte dal 28/6
LUNG_SERIE = 156      # 28/6 … 30/11
GIORNI_STAGIONE = 122  # 1/8 … 30/11
TOPT = 13.0
DECIMALI_PARI_MERITO = 12  # punteggi arrotondati a 10⁻¹² prima di cercare i pari merito (README, «Deviazioni»)

# Insiemi di giorni: scostamenti dal 1/8 (sezioni 4.2 e 5)
PERIODI = {
    'principale': (4, 112),   # 05/08–21/11
    'S1': (0, 121),           # 01/08–30/11
    'S2': (30, 112),          # 31/08–21/11, finestre nei soli valori grezzi
}

ARMONICI = np.concatenate(([0.0], np.cumsum(1.0 / np.arange(1, 20001))))


def ferma(msg):
    print('ERRORE (valuta.py): ' + msg, file=sys.stderr)
    sys.exit(1)


def sha256_file(percorso):
    h = hashlib.sha256()
    with open(percorso, 'rb') as f:
        for blocco in iter(lambda: f.read(1 << 20), b''):
            h.update(blocco)
    return h.hexdigest()


def it(x, cifre=3):
    """Numero con la virgola decimale, per la tabella su stdout."""
    if x is None:
        return '—'
    if isinstance(x, str):
        return x
    if math.isinf(x):
        return '+∞' if x > 0 else '−∞'
    t = f'{x + 0.0:.{cifre}f}'.replace('.', ',')
    return t.replace('-', '−')


def it_int(iv, cifre=3):
    if iv is None:
        return '—'
    return f'[{it(iv[0], cifre)}; {it(iv[1], cifre)}]'


# ----------------------------------------------------------------------------------------------------------------------
# 1. Dati: controlli strutturali e numeri dell'audit (sezione 3; sezione 11, controlli 1 e 2)
# ----------------------------------------------------------------------------------------------------------------------

def leggi_csv(percorso):
    with open(percorso, newline='', encoding='utf-8') as f:
        r = csv.reader(f)
        intest = next(r)
        righe = [riga for riga in r if riga]
    return intest, righe


def controlli_dati(intest, righe):
    trovati = {}

    def atteso(nome, valore, att):
        trovati[nome] = valore
        if valore != att:
            ferma(f'controllo «{nome}»: trovato {valore}, atteso {att}')

    atteso('righe', len(righe), 3660)
    atteso('colonne', len(intest), 32)
    col = {n: k for k, n in enumerate(intest)}
    for c in ['Temp', 'Date', 'Precip', 'date', 'year', 'Mnb', 'month', 'site'] + \
            [f'roll{v}_{w}' for w in FINESTRE for v in 'TP']:
        if c not in col:
            ferma(f'colonna {c} assente')
    for riga in righe:
        if len(riga) != len(intest):
            ferma('riga con un numero di campi diverso dall\'intestazione')
        for v in riga:
            if v.strip() == '' or v.strip().upper() in ('NA', 'NAN'):
                ferma('cella vuota o NA nel CSV')
    atteso('date uniche', len({riga[col['date']] for riga in righe}), 1220)

    blocchi = {}
    for riga in righe:
        blocchi.setdefault(riga[col['site']], []).append(riga)
    atteso('blocchi', sorted(blocchi), ['All', 'Site_A', 'Site_B'])

    attesi = {'All': (155, 1065, 1905, 78), 'Site_A': (61, 1159, 545, None), 'Site_B': (67, 1153, 283, None)}
    meteo = {}
    mnb_per_blocco = {}
    colonne_meteo = ['Temp', 'Precip'] + [f'roll{v}_{w}' for w in FINESTRE for v in 'TP']
    for nome in ['All', 'Site_A', 'Site_B']:
        rr = blocchi[nome]
        atteso(f'{nome}: righe', len(rr), 1220)
        atteso(f'{nome}: date uniche', len({riga[col['date']] for riga in rr}), 1220)
        mnb = {}
        per_anno = {}
        for riga in rr:
            d = riga[col['date']]
            if riga[col['Date']] != d:
                ferma(f'Date diverso da date in {nome} {d}')
            g = datetime.date.fromisoformat(d)
            if int(riga[col['year']]) != g.year or int(riga[col['month']]) != g.month:
                ferma(f'anno o mese incoerenti con la data in {nome} {d}')
            v = float(riga[col['Mnb']])
            if v != int(v) or v < 0:
                ferma(f'Mnb non intero o negativo in {nome} {d}')
            mnb[d] = int(v)
            per_anno.setdefault(g.year, []).append(g)
            valori = tuple(float(riga[col[c]]) for c in colonne_meteo)
            if d in meteo and meteo[d] != valori:
                ferma(f'meteo o medie mobili diversi fra i blocchi in {d}')
            meteo[d] = valori
        atteso(f'{nome}: stagioni', sorted(per_anno), ANNI)
        for anno, gg in per_anno.items():
            attese = [datetime.date(anno, 8, 1) + datetime.timedelta(days=k) for k in range(GIORNI_STAGIONE)]
            if sorted(gg) != attese:
                ferma(f'{nome} {anno}: i giorni non sono 1/8–30/11 consecutivi')
        pos = sum(1 for v in mnb.values() if v > 0)
        zeri = sum(1 for v in mnb.values() if v == 0)
        tot = sum(mnb.values())
        a_pos, a_zeri, a_tot, a_max = attesi[nome]
        atteso(f'{nome}: giorni con Mnb > 0', pos, a_pos)
        atteso(f'{nome}: giorni con Mnb = 0', zeri, a_zeri)
        atteso(f'{nome}: carpofori', tot, a_tot)
        if a_max is not None:
            atteso(f'{nome}: massimo giornaliero', max(mnb.values()), a_max)
        mnb_per_blocco[nome] = mnb
    # All somma più siti: All ≥ Site_A + Site_B in ogni data (sezione 3.2)
    sotto = [d for d in mnb_per_blocco['All']
             if mnb_per_blocco['All'][d] < mnb_per_blocco['Site_A'][d] + mnb_per_blocco['Site_B'][d]]
    atteso('date con All < Site_A + Site_B', len(sotto), 0)
    temp = [v[0] for v in meteo.values()]
    prec = [v[1] for v in meteo.values()]
    trovati['Temp minima'] = min(temp)
    trovati['Temp massima'] = max(temp)
    trovati['Precip minima'] = min(prec)
    trovati['Precip massima'] = max(prec)
    if min(prec) < 0:
        ferma('Precip negativa nel CSV')
    return trovati, col


def stagioni_all(intest, righe, col):
    """Blocco All per stagione, in ordine di data: valori grezzi, medie mobili, Mnb, date."""
    per = {a: [] for a in ANNI}
    for riga in righe:
        if riga[col['site']] != 'All':
            continue
        per[int(riga[col['year']])].append(riga)
    st = {}
    for a in ANNI:
        rr = sorted(per[a], key=lambda r: r[col['date']])
        st[a] = {
            'date': [r[col['date']] for r in rr],
            'Temp': np.array([float(r[col['Temp']]) for r in rr]),
            'Precip': np.array([float(r[col['Precip']]) for r in rr]),
            'Mnb': np.array([int(float(r[col['Mnb']])) for r in rr]),
            'roll': {(v, w): np.array([float(r[col[f'roll{v}_{w}']]) for r in rr]) for w in FINESTRE for v in 'TP'},
        }
    return st


# ----------------------------------------------------------------------------------------------------------------------
# 2. Ricostruzione dei giorni dal 28/6 al 31/7 (sezioni 3.4 e 5; controllo 3)
# ----------------------------------------------------------------------------------------------------------------------

def ricostruisci(anno, g):
    """Serie di 156 giorni (28/6–30/11): ricostruiti per identità aritmetica fino al 31/7, poi valori grezzi."""
    serie = {}
    info = {'scarto_stime': {}, 'scarto_agosto': {}, 'scarto_medie': {}, 'pioggia_azzerata': 0,
            'pioggia_minima_ricostruita': None, 'stime_per_giorno_min': None}
    for var, v in (('Temp', 'T'), ('Precip', 'P')):
        x = np.full(LUNG_SERIE, np.nan)
        x[IDX_1AGO:] = g[var]
        stime = {j: [] for j in range(LUNG_SERIE)}
        for d in range(IDX_1AGO + 1, LUNG_SERIE):
            for w in FINESTRE:
                r = g['roll'][(v, w)]
                j = d - w
                stime[j].append(x[d] - w * (r[d - IDX_1AGO] - r[d - IDX_1AGO - 1]))
        scarto_stime = 0.0
        for j in range(IDX_1AGO):
            if not stime[j]:
                ferma(f'{anno} {var}: nessuna stima per il giorno {j} della serie')
            s = np.array(stime[j])
            scarto_stime = max(scarto_stime, float(s.max() - s.min()))
            x[j] = float(np.median(s))
        scarto_ago = 0.0
        for j in range(IDX_1AGO, LUNG_SERIE):
            for e in stime[j]:
                scarto_ago = max(scarto_ago, abs(e - x[j]))
        if scarto_stime > TOL:
            ferma(f'{anno} {var}: stime dello stesso giorno discordi ({scarto_stime:.3g})')
        if scarto_ago > TOL:
            ferma(f'{anno} {var}: stime dei giorni di agosto diverse dai valori grezzi ({scarto_ago:.3g})')
        if var == 'Precip':
            info['pioggia_minima_ricostruita'] = float(np.min(x[:IDX_1AGO]))
            for j in range(IDX_1AGO):
                if x[j] < 0:
                    if x[j] >= -TOL:
                        x[j] = 0.0
                        info['pioggia_azzerata'] += 1
                    else:
                        ferma(f'{anno}: pioggia ricostruita {x[j]:.3g} sotto −1e-9 al giorno {j}')
        scarto_medie = 0.0
        for w in FINESTRE:
            r = g['roll'][(v, w)]
            for d in range(IDX_1AGO, LUNG_SERIE):
                m = float(np.mean(x[d - w + 1:d + 1]))
                scarto_medie = max(scarto_medie, abs(m - r[d - IDX_1AGO]))
        if scarto_medie > TOL:
            ferma(f'{anno} {var}: le medie mobili ricalcolate non coincidono con il CSV ({scarto_medie:.3g})')
        info['scarto_stime'][var] = scarto_stime
        info['scarto_agosto'][var] = scarto_ago
        info['scarto_medie'][var] = scarto_medie
        serie[var] = x
        info['stime_per_giorno_min'] = min(len(stime[j]) for j in range(IDX_1AGO))
    giorno0 = datetime.date(anno, 6, 28)
    serie['date'] = [(giorno0 + datetime.timedelta(days=k)).isoformat() for k in range(LUNG_SERIE)]
    if serie['date'][IDX_1AGO] != f'{anno}-08-01' or serie['date'][IDX_1AGO:] != g['date']:
        ferma(f'{anno}: date della serie diverse da quelle del CSV')
    return serie, info


# ----------------------------------------------------------------------------------------------------------------------
# 3. Metriche (sezione 8)
# ----------------------------------------------------------------------------------------------------------------------

def ranghi_medi(x):
    x = np.asarray(x, dtype=float)
    n = len(x)
    ordine = np.argsort(x, kind='mergesort')
    xs = x[ordine]
    cambi = np.flatnonzero(xs[1:] != xs[:-1]) + 1
    inizi = np.concatenate(([0], cambi))
    fini = np.concatenate((cambi, [n]))
    r = np.empty(n)
    r[ordine] = np.repeat((inizi + fini + 1) / 2.0, fini - inizi)
    return r


def pearson(a, b):
    am = a - a.mean()
    bm = b - b.mean()
    den = math.sqrt(float((am * am).sum()) * float((bm * bm).sum()))
    if den == 0.0:
        return None
    return float((am * bm).sum()) / den


def ap_caso(n, r):
    """AP attesa di un ordinamento a caso (punteggio costante), forma esatta (sezione 8.2)."""
    if r == 0:
        return None
    if n == 1:
        return 1.0
    p = np.arange(1, n + 1)
    return float(np.sum((1 + (p - 1) * (r - 1) / (n - 1)) / p) / n)


def metriche_insieme(s, y, c=None, rc=None):
    """AP attesa sulle rotture dei pari merito, ROC-AUC (Mann–Whitney, pari merito ½), Spearman sui conteggi.

    Pari merito: punteggi arrotondati a 10⁻¹² prima di cercarli, così due valori uguali in aritmetica esatta ma
    diversi nell'ultima cifra binaria (per esempio `seasonWeight` interpolato) contano come pari merito.
    """
    s = np.round(np.asarray(s, dtype=float), DECIMALI_PARI_MERITO)
    y = np.asarray(y, dtype=np.int64)
    n = len(s)
    R = int(y.sum())
    Nn = n - R
    ordine = np.argsort(s, kind='mergesort')
    ss = s[ordine]
    yy = y[ordine]
    cambi = np.flatnonzero(ss[1:] != ss[:-1]) + 1
    inizi = np.concatenate(([0], cambi))
    fini = np.concatenate((cambi, [n]))
    dim = fini - inizi
    cy = np.concatenate(([0], np.cumsum(yy)))
    a = cy[fini] - cy[inizi]
    medi = (inizi + fini + 1) / 2.0
    U = float((a * medi).sum() - R * (R + 1) / 2.0)
    auc = U / (R * Nn) if (R > 0 and Nn > 0) else None
    if R > 0:
        a_d = a[::-1].astype(float)
        n_d = dim[::-1]
        N0 = np.concatenate(([0], np.cumsum(n_d)[:-1]))
        TP0 = np.concatenate(([0.0], np.cumsum(a_d)[:-1]))
        q = np.where(n_d > 1, (a_d - 1) / np.maximum(n_d - 1, 1), 0.0)
        contr = (a_d / n_d) * ((TP0 + 1 - q * (N0 + 1)) * (ARMONICI[N0 + n_d] - ARMONICI[N0]) + q * n_d)
        ap = float(contr.sum()) / R
    else:
        ap = None
    rho = None
    if c is not None or rc is not None:
        if rc is None:
            rc = ranghi_medi(c)
        rs = np.empty(n)
        rs[ordine] = np.repeat(medi, dim)
        rho = pearson(rs, rc)
    return {'n': n, 'R': R, 'Nn': Nn, 'ap': ap, 'ap_caso': ap_caso(n, R), 'U': U, 'auc': auc, 'rho': rho,
            'distinti': int(len(inizi))}


def stratifica(per_stagione, ks):
    """Medie pesate di 8.2 sulle stagioni ks (ripetizioni ammesse)."""
    num_ap = den_ap = num_u = den_u = num_r = den_r = num_c = 0.0
    escluse = 0
    for k in ks:
        m = per_stagione[k]
        if m['R'] > 0:
            num_ap += m['R'] * m['ap']
            num_c += m['R'] * m['ap_caso']
            den_ap += m['R']
        num_u += m['U']
        den_u += m['R'] * m['Nn']
        if m['rho'] is None:
            escluse += 1
        else:
            num_r += m['R'] * m['rho']
            den_r += m['R']
    return {'ap': num_ap / den_ap if den_ap else None, 'ap_caso': num_c / den_ap if den_ap else None,
            'auc': num_u / den_u if den_u else None, 'rho': num_r / den_r if den_r else None,
            'rho_escluse': escluse}


def percentili(v):
    if len(v) == 0:
        return None
    lo, hi = np.percentile(np.asarray(v), [2.5, 97.5])
    return [float(lo), float(hi)]


def jackknife(stima, valori):
    v = np.asarray(valori, dtype=float)
    se = math.sqrt((K - 1) / K * float(np.sum((v - v.mean()) ** 2)))
    return [stima - T_9 * se, stima + T_9 * se], se


# ----------------------------------------------------------------------------------------------------------------------
# 4. Stime: GLM di Poisson per (2b), logistica per (3)
# ----------------------------------------------------------------------------------------------------------------------

def glm_poisson(P, T, y, anni, arresto_pendenze=True):
    """Porting di sigma_brejon.py: log μ = a_anno + bP·P + bT·T + bT2·T². IRLS con 1e-8·I, al massimo 100 giri."""
    lista = sorted(set(anni.tolist()))
    Xy = (anni[:, None] == np.array(lista)[None, :]).astype(float)
    X = np.column_stack([Xy, P, T, T ** 2])
    beta = np.zeros(X.shape[1])
    beta[:len(lista)] = math.log(max(float(y.mean()), 1e-3))
    conv = False
    giri = 0
    for giri in range(1, 101):
        eta = X @ beta
        mu = np.exp(eta)
        z = eta + (y - mu) / mu
        W = mu
        nuovo = np.linalg.solve(X.T @ (W[:, None] * X) + 1e-8 * np.eye(X.shape[1]), X.T @ (W * z))
        d = nuovo[-3:] - beta[-3:] if arresto_pendenze else nuovo - beta
        if np.max(np.abs(d)) < 1e-9:
            beta = nuovo
            conv = True
            break
        beta = nuovo
    bP, bT, bT2 = (float(v) for v in beta[-3:])
    return {'bP': bP, 'bT': bT, 'bT2': bT2, 'giri': giri, 'converge': conv}


def logistica(Xf, y, lam=0.0):
    X = np.column_stack([np.ones(len(y)), Xf])
    ym = float(y.mean())
    b = np.zeros(X.shape[1])
    b[0] = math.log(ym / (1 - ym))
    D = np.diag([0.0] + [1.0] * (X.shape[1] - 1))
    conv = False
    giri = 0
    for giri in range(1, 101):
        eta = X @ b
        p = 1.0 / (1.0 + np.exp(-eta))
        W = p * (1 - p)
        g = X.T @ (y - p) - lam * (D @ b)
        H = X.T @ (W[:, None] * X) + lam * D
        nuovo = b + np.linalg.solve(H, g)
        d = float(np.max(np.abs(nuovo - b)))
        b = nuovo
        if d < 1e-10:
            conv = True
            break
    return b, giri, conv


# ----------------------------------------------------------------------------------------------------------------------
# 5. Contesto dei giorni e modelli
# ----------------------------------------------------------------------------------------------------------------------

class Giorni:
    """Tabella dei 1220 giorni (stagione, poi data), con i predittori Python e le colonne del CSV."""

    def __init__(self, st, serie):
        self.stag = np.repeat(np.arange(K), GIORNI_STAGIONE)
        self.off = np.tile(np.arange(GIORNI_STAGIONE), K)
        self.data = []
        Y, M, rP, rT, rP_prec, rT_prec, P26, T20 = ([] for _ in range(8))
        for a in ANNI:
            g = st[a]
            s = serie[a]
            p = s['Precip'].tolist()
            t = s['Temp'].tolist()
            for o in range(GIORNI_STAGIONE):
                i = IDX_1AGO + o
                self.data.append(g['date'][o])
                M.append(int(g['Mnb'][o]))
                Y.append(1 if g['Mnb'][o] > 0 else 0)
                rP.append(g['roll'][('P', 26)][o])
                rT.append(g['roll'][('T', 20)][o])
                rP_prec.append(g['roll'][('P', 26)][o - 1] if o > 0 else np.nan)
                rT_prec.append(g['roll'][('T', 20)][o - 1] if o > 0 else np.nan)
                P26.append(sum(p[i - 26:i]) / 26)
                T20.append(sum(t[i - 20:i]) / 20)
        self.Y = np.array(Y, dtype=np.int64)
        self.Mnb = np.array(M, dtype=np.int64)
        self.rollP26 = np.array(rP)
        self.rollT20 = np.array(rT)
        self.rollP26_prec = np.array(rP_prec)
        self.rollT20_prec = np.array(rT_prec)
        self.P26 = np.array(P26)
        self.T20 = np.array(T20)


class Analisi:
    def __init__(self, nome, giorni, lo, hi):
        self.nome = nome
        self.lo, self.hi = lo, hi
        maschera = (giorni.off >= lo) & (giorni.off <= hi)
        self.righe = [np.flatnonzero(maschera & (giorni.stag == k)) for k in range(K)]
        self.offset = np.arange(lo, hi + 1)


def insiemi_training():
    """Training della validazione (9 stagioni) e del jackknife (8 stagioni)."""
    tr = set()
    for k in TUTTE:
        tr.add(tuple(x for x in TUTTE if x != k))
        for j in TUTTE:
            if j != k:
                tr.add(tuple(x for x in TUTTE if x not in (j, k)))
    return sorted(tr)


class Stime:
    """Stime di (2b) e (3) per training, con cache."""

    def __init__(self, giorni, analisi):
        self.g = giorni
        self.an = analisi
        self.cache_2b = {}
        self.cache_3 = {}

    def fit_2b(self, nome_an, train):
        chiave = (nome_an, train)
        if chiave in self.cache_2b:
            return self.cache_2b[chiave]
        an = self.an[nome_an]
        g = self.g
        escluse = [ANNI[k] for k in train if g.Mnb[an.righe[k]].sum() == 0]
        usate = [k for k in train if g.Mnb[an.righe[k]].sum() > 0]
        righe = np.concatenate([an.righe[k] for k in usate])
        r = glm_poisson(g.rollP26[righe], g.rollT20[righe], g.Mnb[righe].astype(float), g.stag[righe])
        if not r['converge']:
            sigma, testo = 3.5, '3.5'
        elif r['bT2'] < 0:
            sigma = math.sqrt(-1.0 / (2.0 * r['bT2']))
            testo = repr(sigma)
        else:
            sigma, testo = math.inf, 'inf'
        centro = -r['bT'] / (2 * r['bT2']) if r['bT2'] != 0 else None
        out = dict(r, sigma=sigma, sigma_testo=testo, centro=centro, escluse=escluse,
                   training=[ANNI[k] for k in train])
        self.cache_2b[chiave] = out
        return out

    def fit_3(self, nome_an, colonne, train):
        chiave = (nome_an, colonne, train)
        if chiave in self.cache_3:
            return self.cache_3[chiave]
        an = self.an[nome_an]
        g = self.g
        righe = np.concatenate([an.righe[k] for k in train])
        P, T = (g.P26, g.T20) if colonne == 'serie' else (g.rollP26, g.rollT20)
        mP, sP = float(P[righe].mean()), float(P[righe].std())
        mT, sT = float(T[righe].mean()), float(T[righe].std())
        zP = (P[righe] - mP) / sP
        zT = (T[righe] - mT) / sT
        Xf = np.column_stack([zP, zT, zT ** 2])
        y = g.Y[righe].astype(float)
        b, giri, conv = logistica(Xf, y)
        penalita = False
        if not conv or np.any(np.abs(b) > 30):
            b, giri, conv = logistica(Xf, y, lam=1.0)
            penalita = True
        out = {'beta': [float(v) for v in b], 'giri': giri, 'converge': conv, 'penalita': penalita,
               'media_P': mP, 'ds_P': sP, 'media_T': mT, 'ds_T': sT, 'training': [ANNI[k] for k in train]}
        self.cache_3[chiave] = out
        return out

    def eta_3(self, nome_an, colonne, train, righe):
        f = self.fit_3(nome_an, colonne, train)
        P, T = (self.g.P26, self.g.T20) if colonne == 'serie' else (self.g.rollP26, self.g.rollT20)
        zP = (P[righe] - f['media_P']) / f['ds_P']
        zT = (T[righe] - f['media_T']) / f['ds_T']
        b = f['beta']
        return b[0] + b[1] * zP + b[2] * zT + b[3] * zT ** 2


def memo(f):
    cache = {}

    def g(train, test):
        chiave = (train, test)
        if chiave not in cache:
            cache[chiave] = np.asarray(f(train, test), dtype=float)
        return cache[chiave]
    return g


def modello_c0(giorni, an, h):
    dentro = np.zeros(GIORNI_STAGIONE, dtype=bool)
    dentro[an.offset] = True

    def f(train, test):
        m = len(train)
        pos = np.zeros(GIORNI_STAGIONE)
        for k in train:
            rr = an.righe[k]
            pos[giorni.off[rr]] += giorni.Y[rr]
        out = []
        for o in giorni.off[an.righe[test]]:
            fin = np.arange(max(0, o - h), min(GIORNI_STAGIONE - 1, o + h) + 1)
            fin = fin[dentro[fin]]
            out.append(float(pos[fin].sum()) / (m * len(fin)))
        return out
    return memo(f)


def modello_fisso(an, valori):
    return memo(lambda train, test: valori[an.righe[test]])


def modello_2b(an, stime, f_sigma):
    return memo(lambda train, test: f_sigma[stime.fit_2b(an.nome, train)['sigma_testo']][an.righe[test]])


def modello_3(an, stime, colonne):
    return memo(lambda train, test: stime.eta_3(an.nome, colonne, train, an.righe[test]))


# ----------------------------------------------------------------------------------------------------------------------
# 6. Valutazione di un'analisi: validazione a stagione esclusa, metriche, bootstrap, jackknife
# ----------------------------------------------------------------------------------------------------------------------

def valuta_analisi(modelli, etichette, conteggi, differenze, B):
    nomi = list(modelli)
    loso = {m: [modelli[m](tuple(x for x in TUTTE if x != k), k) for k in TUTTE] for m in nomi}
    per_st = {m: [metriche_insieme(loso[m][k], etichette[k], conteggi[k]) for k in TUTTE] for m in nomi}
    strat = {m: stratifica(per_st[m], TUTTE) for m in nomi}

    # Jackknife per stagione dell'intera procedura (8.4)
    jack = {m: [] for m in nomi}
    for j in TUTTE:
        resto = tuple(x for x in TUTTE if x != j)
        for m in nomi:
            met = {k: metriche_insieme(modelli[m](tuple(x for x in resto if x != k), k), etichette[k], conteggi[k])
                   for k in resto}
            jack[m].append(stratifica(met, resto))

    # Bootstrap per stagione (8.4): stesso seme per ogni analisi, stesse estrazioni per tutti i modelli
    rng = np.random.default_rng(SEME)
    estrazioni = [rng.integers(0, K, K) for _ in range(B)]
    cnt = np.zeros((B, K))
    for b, e in enumerate(estrazioni):
        for k in e:
            cnt[b, k] += 1
    boot_s = {}
    for m in nomi:
        ps = per_st[m]
        Rv = np.array([p['R'] for p in ps], dtype=float)
        apv = np.array([p['R'] * p['ap'] if p['R'] > 0 else 0.0 for p in ps])
        Uv = np.array([p['U'] for p in ps])
        RNv = np.array([p['R'] * p['Nn'] for p in ps], dtype=float)
        rdef = np.array([p['R'] if p['rho'] is not None else 0.0 for p in ps], dtype=float)
        rhov = np.array([p['R'] * p['rho'] if p['rho'] is not None else 0.0 for p in ps])
        den_ap = cnt @ Rv
        den_u = cnt @ RNv
        den_r = cnt @ rdef
        with np.errstate(invalid='ignore', divide='ignore'):
            boot_s[m] = {
                'ap': np.where(den_ap > 0, (cnt @ apv) / den_ap, np.nan),
                'auc': np.where(den_u > 0, (cnt @ Uv) / den_u, np.nan),
                'rho': np.where(den_r > 0, (cnt @ rhov) / den_r, np.nan),
            }
    # Metriche sul complesso: concatenazione delle righe fuori campione delle stagioni estratte
    punti_c = {}
    yc = np.concatenate(etichette)
    cc = np.concatenate(conteggi)
    rcc = ranghi_medi(cc)
    for m in nomi:
        mt = metriche_insieme(np.concatenate(loso[m]), yc, rc=rcc)
        punti_c[m] = mt
    boot_c = {m: {'ap': np.full(B, np.nan), 'auc': np.full(B, np.nan), 'rho': np.full(B, np.nan)} for m in nomi}
    for b, e in enumerate(estrazioni):
        yb = np.concatenate([etichette[k] for k in e])
        R = int(yb.sum())
        if R == 0 or R == len(yb):
            continue
        rc = ranghi_medi(np.concatenate([conteggi[k] for k in e]))
        for m in nomi:
            mt = metriche_insieme(np.concatenate([loso[m][k] for k in e]), yb, rc=rc)
            boot_c[m]['ap'][b] = mt['ap']
            boot_c[m]['auc'][b] = mt['auc']
            boot_c[m]['rho'][b] = np.nan if mt['rho'] is None else mt['rho']

    def riassunto_strat(m, chiave):
        v = boot_s[m][chiave]
        ok = ~np.isnan(v)
        stima = strat[m][chiave]
        jv = [x[chiave] for x in jack[m]]
        out = {'stima': stima, 'boot': percentili(v[ok]), 'boot_scartate': int((~ok).sum())}
        if stima is not None and all(x is not None for x in jv):
            out['jack'], out['se_jack'] = jackknife(stima, jv)
        else:
            out['jack'], out['se_jack'] = None, None
        return out

    def riassunto_compl(m, chiave):
        v = boot_c[m][chiave]
        ok = ~np.isnan(v)
        return {'stima': punti_c[m][chiave], 'boot': percentili(v[ok]), 'boot_scartate': int((~ok).sum())}

    risultati = {'modelli': {}, 'differenze': {}}
    for m in nomi:
        risultati['modelli'][m] = {
            'stratificate': {c: riassunto_strat(m, c) for c in ('ap', 'auc', 'rho')},
            'ap_caso_stratificata': strat[m]['ap_caso'],
            'rho_stagioni_escluse': strat[m]['rho_escluse'],
            'complesso': {c: riassunto_compl(m, c) for c in ('ap', 'auc', 'rho')},
            'valori_distinti': punti_c[m]['distinti'],
            'per_stagione': [{'anno': ANNI[k], 'giorni': per_st[m][k]['n'], 'positivi': per_st[m][k]['R'],
                              'carpofori': int(conteggi[k].sum()), 'ap': per_st[m][k]['ap'],
                              'ap_caso': per_st[m][k]['ap_caso'], 'auc': per_st[m][k]['auc'],
                              'rho': per_st[m][k]['rho']} for k in TUTTE],
        }
    for nome, a, b in differenze:
        d = {'stratificate': {}, 'complesso': {}, 'modelli': [a, b]}
        for c in ('ap', 'auc', 'rho'):
            stima = strat[a][c] - strat[b][c]
            v = boot_s[a][c] - boot_s[b][c]
            ok = ~np.isnan(v)
            jv = [x[c] - y[c] for x, y in zip(jack[a], jack[b])]
            iv, se = jackknife(stima, jv)
            d['stratificate'][c] = {'stima': stima, 'boot': percentili(v[ok]), 'boot_scartate': int((~ok).sum()),
                                    'jack': iv, 'se_jack': se}
            vc = boot_c[a][c] - boot_c[b][c]
            okc = ~np.isnan(vc)
            d['complesso'][c] = {'stima': punti_c[a][c] - punti_c[b][c], 'boot': percentili(vc[okc]),
                                 'boot_scartate': int((~okc).sum())}
        risultati['differenze'][nome] = d
    risultati['insieme'] = insieme_di(etichette)
    return risultati, loso


def insieme_di(etichette):
    """Unità, positivi e riferimenti dell'AP a caso (sezione 3.6): dipendono solo dall'esito."""
    n_tot = int(sum(len(e) for e in etichette))
    r_tot = int(sum(int(e.sum()) for e in etichette))
    return {
        'unita': n_tot, 'positivi': r_tot, 'prevalenza': r_tot / n_tot, 'ap_caso_complesso': ap_caso(n_tot, r_tot),
        'positivi_per_stagione': {str(ANNI[k]): int(etichette[k].sum()) for k in TUTTE},
        'ap_caso_stratificata': stratifica([metriche_insieme(np.zeros(len(etichette[k])), etichette[k])
                                            for k in TUTTE], TUTTE)['ap'],
    }


def controlla_riferimenti(insiemi):
    """Riferimenti della sezione 3.6 (solo esito), prima di qualsiasi metrica dei modelli."""
    rif = {'principale': (1090, 155, 0.1422, 0.1474, 0.2111), 'S1': (1220, 155, 0.1270, 0.1318, 0.1900),
           'S2': (830, 135, 0.1627, 0.1690, None), 'S3': (150, 65, 0.4333, 0.4508, None)}
    for nome, (n_, r_, pi_, apc, aps) in rif.items():
        ins = insiemi[nome]
        if ins['unita'] != n_ or ins['positivi'] != r_ or abs(ins['prevalenza'] - pi_) > 5e-5 or \
                abs(ins['ap_caso_complesso'] - apc) > 5e-5 or (aps is not None and
                                                              abs(ins['ap_caso_stratificata'] - aps) > 5e-5):
            ferma(f'riferimenti di 3.6 diversi per {nome}: {ins}')
    pos_attesi = {'2015': 12, '2016': 1, '2017': 16, '2018': 4, '2019': 16, '2020': 27, '2021': 18, '2022': 15,
                  '2023': 25, '2024': 21}
    if insiemi['principale']['positivi_per_stagione'] != pos_attesi:
        ferma('positivi per stagione diversi dalla sezione 3.6')


# ----------------------------------------------------------------------------------------------------------------------
# 7. Lettura preregistrata (sezioni 9 e 10)
# ----------------------------------------------------------------------------------------------------------------------

def verdetto(d):
    s = d['stratificate']['ap']
    th, bo, ja = s['stima'], s['boot'], s['jack']
    sopra = bo[0] > 0 and ja[0] > 0
    sotto = bo[1] < 0 and ja[1] < 0
    dentro_delta = bo[0] > -DELTA and bo[1] < DELTA and ja[0] > -DELTA and ja[1] < DELTA
    if sopra:
        et = 'ordina meglio' if th >= DELTA else 'meglio, ma trascurabile'
    elif sotto:
        et = 'ordina peggio' if th <= -DELTA else 'peggio, ma trascurabile'
    else:
        et = 'non distinguibile'
    nota = None
    if et == 'non distinguibile' and dentro_delta:
        nota = 'la differenza resta sotto δ in tutto l\'intervallo'
    auc = d['stratificate']['auc']
    opposta = (th != 0 and auc['stima'] != 0 and (th > 0) != (auc['stima'] > 0))
    auc_intervalli_opposti = False
    if th > 0:
        auc_intervalli_opposti = auc['boot'][1] < 0 and auc['jack'][1] < 0
    elif th < 0:
        auc_intervalli_opposti = auc['boot'][0] > 0 and auc['jack'][0] > 0
    return {'etichetta': et, 'nota': nota, 'dentro_delta': dentro_delta,
            'auc_segno_opposto': opposta, 'auc_intervalli_opposti': auc_intervalli_opposti}


def lettura_congiunta(vb, vb1, db, db1):
    eb, eb1 = vb['etichetta'], vb1['etichetta']
    neutro = lambda e: e not in ('ordina meglio', 'ordina peggio')
    if eb == 'ordina peggio' or eb1 == 'ordina peggio':
        quali = [n for n, e in (('(b)', eb), ('(b′)', eb1)) if e == 'ordina peggio']
        return ('Prova contraria alla curva più stretta, su questi dati (in ' + ' e '.join(quali) + ').')
    if eb == 'ordina meglio' and eb1 == 'ordina meglio':
        return 'La curva più stretta ordina meglio anche con σ stimato fuori campione, su questi dati.'
    if eb == 'ordina meglio' and neutro(eb1):
        return ('Vantaggio non dimostrato fuori campione: dipende almeno in parte dall\'aver stimato σ sulle stesse '
                'stagioni.')
    if neutro(eb) and eb1 == 'ordina meglio':
        return ('Un σ stimato sul training ordina meglio di 3,5, ma il valore 2,0 no: nessun sostegno al valore 2,0.')
    testo = 'Nessun vantaggio dimostrato per la curva più stretta.'
    if vb['dentro_delta'] and vb1['dentro_delta']:
        testo += (' (b) e (b′) restano sotto δ in tutto l\'intervallo: per l\'ordinamento la scelta fra 3,5 e 2,0 '
                  'conta poco, su questi dati.')
    return testo


def contraddice(principale, sensibilita):
    th = principale['stratificate']['ap']['stima']
    s = sensibilita['stratificate']['ap']
    if th > 0:
        return s['boot'][1] < 0 and s['jack'][1] < 0
    if th < 0:
        return s['boot'][0] > 0 and s['jack'][0] > 0
    return False


# ----------------------------------------------------------------------------------------------------------------------
# 8. Programma
# ----------------------------------------------------------------------------------------------------------------------

def pulisci(x):
    if isinstance(x, dict):
        return {str(k): pulisci(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [pulisci(v) for v in x]
    if isinstance(x, (np.integer,)):
        return int(x)
    if isinstance(x, (np.floating, float)):
        v = float(x)
        if math.isnan(v):
            return None
        if math.isinf(v):
            return 'inf' if v > 0 else '-inf'
        return v
    if isinstance(x, (np.bool_,)):
        return bool(x)
    return x


def main():
    ap_ = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap_.add_argument('--dati', default=os.path.join(QUI, 'dati'))
    ap_.add_argument('--node', default='node')
    ap_.add_argument('--repliche', type=int, default=B_PREREG)
    args = ap_.parse_args()
    dati = os.path.abspath(args.dati)
    B = args.repliche
    percorso_csv = os.path.join(dati, NOME_CSV)
    if not os.path.exists(percorso_csv):
        ferma(f'{percorso_csv} non esiste: lancia prima scarica.py')

    controlli = {}
    print('Prova offline dei porcini (Bielefeld) — valutazione preregistrata')
    print('=' * 78)

    # Controllo 1: SHA-256 del CSV
    sha = sha256_file(percorso_csv)
    if sha != CSV_SHA256:
        ferma(f'SHA-256 del CSV {sha}, atteso {CSV_SHA256}')
    controlli['1_sha256_csv'] = sha
    print(f'[1] SHA-256 del CSV: {sha[:8]}…{sha[-4:]} ok')

    # Controllo 2: numeri dell'audit e struttura
    intest, righe = leggi_csv(percorso_csv)
    trovati, col = controlli_dati(intest, righe)
    controlli['2_audit_e_struttura'] = trovati
    print('[2] Audit: 3660 righe, 32 colonne, 1220 date; All 155 positivi, 1065 zeri, 1905 carpofori, massimo 78; '
          'Site_A 61/1159/545; Site_B 67/1153/283: ok')

    # Controllo 3: ricostruzione
    st = stagioni_all(intest, righe, col)
    serie = {}
    info_ric = {}
    for a in ANNI:
        serie[a], info_ric[str(a)] = ricostruisci(a, st[a])
    controlli['3_ricostruzione'] = {
        'scarto_max_stime_T': max(v['scarto_stime']['Temp'] for v in info_ric.values()),
        'scarto_max_stime_P': max(v['scarto_stime']['Precip'] for v in info_ric.values()),
        'scarto_max_agosto_T': max(v['scarto_agosto']['Temp'] for v in info_ric.values()),
        'scarto_max_agosto_P': max(v['scarto_agosto']['Precip'] for v in info_ric.values()),
        'scarto_max_medie_T': max(v['scarto_medie']['Temp'] for v in info_ric.values()),
        'scarto_max_medie_P': max(v['scarto_medie']['Precip'] for v in info_ric.values()),
        'pioggia_minima_ricostruita': min(v['pioggia_minima_ricostruita'] for v in info_ric.values()),
        'pioggia_azzerata_giorni': sum(v['pioggia_azzerata'] for v in info_ric.values()),
        'stime_per_giorno_minimo': min(v['stime_per_giorno_min'] for v in info_ric.values()),
    }
    c3 = controlli['3_ricostruzione']
    print(f"[3] Ricostruzione 28/6–31/7: stime concordi (T {c3['scarto_max_stime_T']:.1e}, "
          f"P {c3['scarto_max_stime_P']:.1e}); agosto (T {c3['scarto_max_agosto_T']:.1e}, "
          f"P {c3['scarto_max_agosto_P']:.1e}); 24 medie mobili (T {c3['scarto_max_medie_T']:.1e}, "
          f"P {c3['scarto_max_medie_P']:.1e}); pioggia azzerata in {c3['pioggia_azzerata_giorni']} giorni: ok")

    # Controllo 4: moduli congelati
    hash_moduli = {}
    for rel, att in MODULI.items():
        h = sha256_file(os.path.join(RADICE, rel))
        hash_moduli[rel] = h
        if h != att:
            ferma(f'{rel} è cambiato (SHA-256 {h}, atteso {att}). Proseguire è una deviazione (sezione 11).')
    controlli['4_moduli'] = hash_moduli
    print('[4] SHA-256 di js/model.js, js/species.js, js/botanical-model.js, sigma_brejon.py: ok')

    giorni = Giorni(st, serie)
    analisi = {n: Analisi(n, giorni, lo, hi) for n, (lo, hi) in PERIODI.items()}
    stime = Stime(giorni, analisi)

    # Stime di σ per (2b), prima di chiamare Node: servono a fattori.mjs
    sigma_testi = set()
    for n in PERIODI:
        for tr in insiemi_training():
            sigma_testi.add(stime.fit_2b(n, tr)['sigma_testo'])
    sigma_lista = sorted(sigma_testi)

    # Serie per fattori.mjs
    os.makedirs(dati, exist_ok=True)
    serie_json = {'stagioni': [], 'grezze': []}
    for a in ANNI:
        s = serie[a]
        serie_json['stagioni'].append({'anno': a, 'date': s['date'], 'p': [float(v) for v in s['Precip']],
                                       'tmean': [float(v) for v in s['Temp']]})
        serie_json['grezze'].append({'anno': a, 'date': st[a]['date'], 'p': [float(v) for v in st[a]['Precip']],
                                     'tmean': [float(v) for v in st[a]['Temp']]})
    with open(os.path.join(dati, 'serie.json'), 'w', encoding='utf-8') as f:
        json.dump(serie_json, f, sort_keys=True)
    with open(os.path.join(dati, 'sigma.json'), 'w', encoding='utf-8') as f:
        json.dump({'sigma': sigma_lista}, f, sort_keys=True)
    res = subprocess.run([args.node, os.path.join(QUI, 'fattori.mjs'), dati], capture_output=True, text=True)
    if res.returncode != 0:
        ferma('fattori.mjs non è riuscito:\n' + res.stderr)
    print('    ' + res.stdout.strip())
    with open(os.path.join(dati, 'fattori.json'), encoding='utf-8') as f:
        fat = json.load(f)

    if fat['model_version'] != MODEL_VERSION:
        ferma(f"MODEL_VERSION {fat['model_version']}, atteso {MODEL_VERSION}")
    controlli['4_model_version'] = fat['model_version']
    ed = fat['edulis']
    if (ed['topt'], ed['tsd'], ed['lag'], ed['eref']) != (13, 3.5, [7, 21], 30) or \
            ed['months'] != [0, 0, 0, 0, 0.1, 0.4, 0.6, 0.8, 1, 1, 0.4, 0]:
        ferma(f'profilo edulis diverso da quello preregistrato: {ed}')
    if fat['params'] != {'r30Days': 30, 'tDays': 20, 'triggerMm': 8}:
        ferma(f"PARAMS diversi: {fat['params']}")

    # Controllo 5: allineamento fra JavaScript e Python
    gg = fat['giorni']
    if len(gg) != K * GIORNI_STAGIONE:
        ferma(f'fattori.json ha {len(gg)} giorni, attesi {K * GIORNI_STAGIONE}')
    scarti = {'t20': 0.0, 'r30': 0.0, 'effRain': 0.0, 'rain': 0.0, 'temp': 0.0, 'f1': 0.0,
              't20_vs_rollT20_prec': 0.0, 'P26_vs_rollP26_prec': 0.0, 'T20py_vs_t20': 0.0}
    for n, e in enumerate(gg):
        k = n // GIORNI_STAGIONE
        o = n % GIORNI_STAGIONE
        a = ANNI[k]
        i = IDX_1AGO + o
        if e['data'] != giorni.data[n] or e['stagione'] != a or e['i'] != i:
            ferma(f"fattori.json fuori ordine al giorno {n}: {e['data']}")
        if e['Mnb'] != int(giorni.Mnb[n]) or e['esito'] != int(giorni.Y[n]):
            ferma(f"esito diverso fra fattori.json e CSV in {e['data']}")
        p = serie_json['stagioni'][k]['p']
        t = serie_json['stagioni'][k]['tmean']
        t20 = sum(t[i - 20:i]) / 20
        r30 = sum(p[i - 30:i])
        eff = sum(p[i - 21:i - 6])
        mx = max(p[i - 21:i - 6])
        trig = max(min(mx / 8, 1.0), min(eff / 15, 1.0))
        rain = (0.6 * (1 - math.exp(-eff / 30)) + 0.4 * (1 - math.exp(-r30 / 60))) * (0.5 + 0.5 * trig)
        temp35 = math.exp(-0.5 * ((t20 - TOPT) / 3.5) ** 2)
        temp20 = math.exp(-0.5 * ((t20 - TOPT) / 2.0) ** 2)
        scarti['t20'] = max(scarti['t20'], abs(e['t20'] - t20))
        scarti['r30'] = max(scarti['r30'], abs(e['r30'] - r30))
        scarti['effRain'] = max(scarti['effRain'], abs(e['effRain'] - eff))
        if e['maxEvent'] != mx:
            ferma(f"maxEvent diverso in {e['data']}: {e['maxEvent']} contro {mx}")
        scarti['rain'] = max(scarti['rain'], abs(e['rain'] - rain))
        scarti['temp'] = max(scarti['temp'], abs(e['temp_35'] - temp35), abs(e['temp_20'] - temp20))
        scarti['f1'] = max(scarti['f1'], abs(e['f1'] - e['S'] * e['rain'] * e['temp_35']),
                           abs(e['f2'] - e['S'] * e['rain'] * e['temp_20']))
        scarti['T20py_vs_t20'] = max(scarti['T20py_vs_t20'], abs(giorni.T20[n] - e['t20']))
        if o > 0:
            scarti['t20_vs_rollT20_prec'] = max(scarti['t20_vs_rollT20_prec'], abs(e['t20'] - giorni.rollT20_prec[n]))
            scarti['P26_vs_rollP26_prec'] = max(scarti['P26_vs_rollP26_prec'],
                                                abs(giorni.P26[n] - giorni.rollP26_prec[n]))
        if not e['finestre_complete'] or e['i'] < 30:
            ferma(f"finestre incomplete in {e['data']}")
        if e['mancanti'] != ['umidità del suolo', 'temperature minime', 'temperature massime']:
            ferma(f"inputQuality.missing inatteso in {e['data']}: {e['mancanti']}")
        for chiave in ('S', 'rain', 'temp_35', 'temp_20', 'effRain', 'maxEvent', 'r30', 't20', 'f1', 'f2'):
            if not isinstance(e[chiave], (int, float)) or not math.isfinite(e[chiave]):
                ferma(f"{chiave} non finito in {e['data']}")
    for chiave, tol in (('t20', TOL), ('r30', TOL), ('effRain', TOL), ('rain', 1e-12), ('temp', 1e-12),
                        ('f1', 1e-12), ('t20_vs_rollT20_prec', TOL), ('P26_vs_rollP26_prec', TOL),
                        ('T20py_vs_t20', TOL)):
        if scarti[chiave] > tol:
            ferma(f'allineamento JavaScript/Python: scarto {chiave} = {scarti[chiave]:.3g} > {tol}')
    attesi_S = {'08-01': 0.709677, '08-05': 0.735484, '08-15': 0.8, '09-15': 1.0, '11-15': 0.4, '11-21': 0.32,
                '11-30': 0.2}
    S_trovati = {}
    for e in gg:
        if e['stagione'] in (2015, 2020) and e['data'][5:] in attesi_S:
            S_trovati[e['data']] = e['S']
            if abs(e['S'] - attesi_S[e['data'][5:]]) > 1e-6:
                ferma(f"seasonWeight({e['data']}) = {e['S']}, atteso {attesi_S[e['data'][5:]]}")
    if len(S_trovati) != 14:
        ferma('controllo di seasonWeight incompleto')
    # σ di (2b)
    temp_sigma = {s: np.array(v) for s, v in fat['temp_sigma'].items()}
    f_sigma = {s: np.array(v) for s, v in fat['f_sigma'].items()}
    if sorted(temp_sigma) != sigma_lista or sorted(f_sigma) != sigma_lista:
        ferma('fattori.json non ha tutti i σ richiesti')
    t20v = np.array([e['t20'] for e in gg])
    Sv = np.array([e['S'] for e in gg])
    rainv = np.array([e['rain'] for e in gg])
    sc_sigma = 0.0
    for s in sigma_lista:
        if s == 'inf':
            if not np.all(temp_sigma[s] == 1.0):
                ferma('con σ = +∞ il fattore temperatura non vale 1 in tutti i giorni')
            continue
        sv = float(s)
        att = np.array([math.exp(-0.5 * ((x - TOPT) / sv) ** 2) for x in t20v])
        sc_sigma = max(sc_sigma, float(np.max(np.abs(temp_sigma[s] - att))))
        if np.any(f_sigma[s] != Sv * rainv * temp_sigma[s]):
            sc_sigma = max(sc_sigma, float(np.max(np.abs(f_sigma[s] - Sv * rainv * temp_sigma[s]))))
    if sc_sigma > 1e-12:
        ferma(f'fattore temperatura con σ di (2b): scarto {sc_sigma:.3g}')
    scarti['temp_sigma_2b'] = sc_sigma
    controlli['5_allineamento'] = {'scarti_massimi': scarti, 'seasonWeight': S_trovati,
                                   'giorni_controllati': len(gg), 'valori_sigma_2b': len(sigma_lista)}
    print(f"[5] Allineamento JS/Python su {len(gg)} giorni: t20 {scarti['t20']:.1e}, r30 {scarti['r30']:.1e}, "
          f"effRain {scarti['effRain']:.1e}, rain {scarti['rain']:.1e}, temp {scarti['temp']:.1e}; "
          f"legame con il CSV t20 {scarti['t20_vs_rollT20_prec']:.1e}, P26 {scarti['P26_vs_rollP26_prec']:.1e}; "
          f"seasonWeight, inputQuality, {len(sigma_lista)} σ di (2b): ok")

    # Controllo 6: serie dei soli valori grezzi
    per_data = {e['data']: e for e in gg}
    n6 = 0
    for e in fat['grezze']:
        p = per_data[e['data']]
        for chiave in ('S', 'rain', 'temp_35', 'temp_20', 't20', 'r30', 'effRain', 'maxEvent', 'f1', 'f2'):
            if e[chiave] != p[chiave]:
                ferma(f"controllo 6: {chiave} diverso in {e['data']} ({e[chiave]} contro {p[chiave]})")
        n6 += 1
    if n6 != K * 92:
        ferma(f'controllo 6: {n6} giorni, attesi {K * 92}')
    controlli['6_serie_grezza'] = {'giorni_confrontati': n6, 'dal': '31/08', 'al': '30/11', 'uguali': True}
    print(f'[6] Serie dei soli valori grezzi: {n6} giorni (31/8–30/11) con fattori identici: ok')

    # Controllo 7: sigma_brejon.py eseguito senza modifiche, contro il porting
    script = os.path.join(RADICE, SIGMA_BREJON)
    buf = io.StringIO()
    vecchio = sys.argv
    try:
        sys.argv = [script, percorso_csv]
        with contextlib.redirect_stdout(buf):
            glob = runpy.run_path(script, run_name='__main__')
    finally:
        sys.argv = vecchio
    linee = [x for x in buf.getvalue().splitlines() if x.strip()]
    if len(linee) != 2:
        ferma(f'sigma_brejon.py ha stampato {len(linee)} righe, attese 2')
    patt = re.compile(r'^(\S+): n=(\d+) Topt=(-?[0-9.]+) C sigma=([0-9.]+) C bP=(-?[0-9.]+) per mm/g')
    righe_all = [r for r in righe if r[col['site']] == 'All']
    c7 = {'uscita_script': linee, 'periodi': {}}
    for linea, (etich, lo, hi) in zip(linee, (('1/8-30/11', '08-01', '11-30'), ('5/8-21/11', '08-05', '11-21'))):
        m = patt.match(linea)
        if not m or m.group(1) != etich:
            ferma(f'riga di sigma_brejon.py non riconosciuta: {linea}')
        sel = [r for r in righe_all if lo <= r[col['date']][5:10] <= hi]
        y = np.array([float(r[col['Mnb']]) for r in sel])
        T = np.array([float(r[col['rollT_20']]) for r in sel])
        P = np.array([float(r[col['rollP_26']]) for r in sel])
        anni = np.array([int(r[col['year']]) for r in sel])
        r = glm_poisson(P, T, y, anni)
        topt = -r['bT'] / (2 * r['bT2'])
        sigma = math.sqrt(-1 / (2 * r['bT2']))
        porting = (str(len(y)), f'{topt:.2f}', f'{sigma:.2f}', f"{r['bP']:.3f}")
        script_v = (m.group(2), m.group(3), m.group(4), m.group(5))
        if porting != script_v:
            ferma(f'controllo 7, {etich}: porting {porting}, script {script_v}')
        c7['periodi'][etich] = {'n': len(y), 'topt': topt, 'sigma': sigma, 'bP': r['bP'], 'bT': r['bT'],
                                'bT2': r['bT2'], 'giri': r['giri'], 'converge': r['converge'],
                                'stampato_dallo_script': {'topt': m.group(3), 'sigma': m.group(4), 'bP': m.group(5)}}
    sigma_script = float(glob['sigma'])
    diff7 = abs(sigma_script - c7['periodi']['5/8-21/11']['sigma'])
    if diff7 > 1e-6:
        ferma(f'controllo 7: σ non arrotondato dello script {sigma_script}, porting '
              f"{c7['periodi']['5/8-21/11']['sigma']}")
    c7['sigma_script_non_arrotondato_5/8-21/11'] = sigma_script
    c7['scarto_sigma_5/8-21/11'] = diff7
    controlli['7_sigma_brejon'] = c7
    print('[7] sigma_brejon.py (tutte le 10 stagioni) riprodotto dal porting:')
    for etich, v in c7['periodi'].items():
        print(f"      {etich}: σ {it(v['sigma'], 6)} °C (stampato {v['stampato_dallo_script']['sigma']}), "
              f"Topt {it(v['topt'], 4)} °C, bP {it(v['bP'], 4)}")
    print(f'      scarto dal σ non arrotondato dello script (5/8–21/11): {diff7:.1e}')
    print('Controlli bloccanti superati.')
    print('=' * 78)

    # ------------------------------------------------------------------------------------------------------------------
    # Modelli e valutazione
    # ------------------------------------------------------------------------------------------------------------------
    f1 = np.array([e['f1'] for e in gg])
    f2 = np.array([e['f2'] for e in gg])
    f1_app = np.array([float(e['f1_app']) for e in gg])
    comp_S = np.array([e['S'] for e in gg])
    comp_rain = np.array([e['rain'] for e in gg])
    comp_temp = np.array([e['temp_35'] for e in gg])
    comp_rt = np.array([e['f_rt'] for e in gg])

    esiti = {'analisi': {}}

    def modelli_base(an, h=7):
        return {
            '(0)': modello_c0(giorni, an, h),
            '(1)': modello_fisso(an, f1),
            '(2)': modello_fisso(an, f2),
            '(2b)': modello_2b(an, stime, f_sigma),
            '(3)': modello_3(an, stime, 'serie'),
        }

    diff_base = [('(a) (1)−(0)', '(1)', '(0)'), ('(b) (2)−(1)', '(2)', '(1)'), ('(b′) (2b)−(1)', '(2b)', '(1)'),
                 ('(c) (3)−(0)', '(3)', '(0)'), ('(c) (3)−(1)', '(3)', '(1)')]

    def etichette_di(an):
        return [giorni.Y[an.righe[k]] for k in TUTTE], [giorni.Mnb[an.righe[k]] for k in TUTTE]

    # S3: settimane fisse dal 05/08 (15 per stagione); esito = almeno un giorno positivo nella settimana
    an = analisi['principale']
    et_w = [giorni.Y[an.righe[k]][:105].reshape(15, 7).max(axis=1) for k in TUTTE]
    co_w = [giorni.Mnb[an.righe[k]][:105].reshape(15, 7).sum(axis=1) for k in TUTTE]

    # Controllo dei riferimenti della sezione 3.6 (solo esito), prima di calcolare qualsiasi metrica dei modelli
    insiemi = {n: insieme_di(etichette_di(analisi[n])[0]) for n in PERIODI}
    insiemi['S3'] = insieme_di(et_w)
    controlla_riferimenti(insiemi)
    print('[—] Riferimenti della sezione 3.6 (solo esito): π e AP a caso di principale, S1, S2, settimane; '
          'positivi per stagione: ok')

    # Analisi principale, con le sensibilità S4–S7 sugli stessi giorni
    mod = modelli_base(an)
    mod['(0) h=3'] = modello_c0(giorni, an, 3)
    mod['(0) h=14'] = modello_c0(giorni, an, 14)
    mod["(3′)"] = modello_3(an, stime, 'csv')
    mod['S6 solo stagione'] = modello_fisso(an, comp_S)
    mod['S6 solo pioggia'] = modello_fisso(an, comp_rain)
    mod['S6 solo temperatura'] = modello_fisso(an, comp_temp)
    mod['S6 pioggia×temperatura'] = modello_fisso(an, comp_rt)
    mod['S7 (1) arrotondato'] = modello_fisso(an, f1_app)
    diff_pr = list(diff_base)
    diff_pr += [('S4 (1)−(0) h=3', '(1)', '(0) h=3'), ('S4 (1)−(0) h=14', '(1)', '(0) h=14'),
                ("S5 (3′)−(3)", "(3′)", '(3)')]
    for c in ('S6 solo stagione', 'S6 solo pioggia', 'S6 solo temperatura', 'S6 pioggia×temperatura',
              'S7 (1) arrotondato'):
        diff_pr += [(f'{c} − (0)', c, '(0)'), (f'{c} − (1)', c, '(1)')]
    et, co = etichette_di(an)
    print('Valutazione: analisi principale (05/08–21/11) …', flush=True)
    ris_pr, loso_pr = valuta_analisi(mod, et, co, diff_pr, B)
    esiti['analisi']['principale'] = ris_pr

    # Fra stagioni (8.3): (1) e (2), descrittivo
    fra = []
    for k in TUTTE:
        rr = an.righe[k]
        fra.append({'anno': ANNI[k], 'positivi': int(giorni.Y[rr].sum()), 'carpofori': int(giorni.Mnb[rr].sum()),
                    'media_(1)': float(f1[rr].mean()), 'media_(2)': float(f2[rr].mean())})
    pos_r = ranghi_medi([x['positivi'] for x in fra])
    esiti['fra_stagioni'] = {
        'tabella': fra,
        'spearman_media_(1)_positivi': pearson(ranghi_medi([x['media_(1)'] for x in fra]), pos_r),
        'spearman_media_(2)_positivi': pearson(ranghi_medi([x['media_(2)'] for x in fra]), pos_r),
    }

    # S1 e S2
    for nome in ('S1', 'S2'):
        an_s = analisi[nome]
        et_s, co_s = etichette_di(an_s)
        print(f'Valutazione: {nome} …', flush=True)
        esiti['analisi'][nome], _ = valuta_analisi(modelli_base(an_s), et_s, co_s, diff_base, B)

    # S3: punteggi della settimana = media dei punteggi giornalieri fuori campione
    def settimanale(f_giorno, probabilita=False):
        def f(train, test):
            s = f_giorno(train, test)
            if probabilita:
                s = 1.0 / (1.0 + np.exp(-s))
            return s[:105].reshape(15, 7).mean(axis=1)
        return memo(f)
    mod_w = {m: settimanale(mod[m], probabilita=(m == '(3)')) for m in ('(0)', '(1)', '(2)', '(2b)', '(3)')}
    print('Valutazione: S3 (settimane) …', flush=True)
    esiti['analisi']['S3'], _ = valuta_analisi(mod_w, et_w, co_w, diff_base, B)

    # Lettura preregistrata (9.2–9.5, 10)
    dp = ris_pr['differenze']
    verd = {n: verdetto(dp[n]) for n in ('(a) (1)−(0)', '(b) (2)−(1)', '(b′) (2b)−(1)')}
    congiunta = lettura_congiunta(verd['(b) (2)−(1)'], verd['(b′) (2b)−(1)'], dp['(b) (2)−(1)'],
                                  dp['(b′) (2b)−(1)'])
    contr = {}
    for nome in ('S1', 'S2', 'S3'):
        for dn, _, _ in diff_base:
            contr[f'{nome} {dn}'] = contraddice(dp[dn], esiti['analisi'][nome]['differenze'][dn])
    contr['S4 (1)−(0) h=3'] = contraddice(dp['(a) (1)−(0)'], dp['S4 (1)−(0) h=3'])
    contr['S4 (1)−(0) h=14'] = contraddice(dp['(a) (1)−(0)'], dp['S4 (1)−(0) h=14'])
    contr['S7 (1) arrotondato − (0)'] = contraddice(dp['(a) (1)−(0)'], dp['S7 (1) arrotondato − (0)'])
    esiti['lettura'] = {'delta': DELTA, 'verdetti': verd, 'lettura_congiunta_D5': congiunta,
                        'sensibilita_che_contraddicono': sorted(k for k, v in contr.items() if v),
                        'contraddizioni_controllate': contr}

    # Parametri stimati per giro
    giri = {}
    for nome in PERIODI:
        an_s = analisi[nome]
        loso_2b, loso_3, loso_3c = [], [], []
        for k in TUTTE:
            tr = tuple(x for x in TUTTE if x != k)
            f = stime.fit_2b(nome, tr)
            loso_2b.append({'esclusa': ANNI[k], 'sigma': f['sigma_testo'], 'centro': f['centro'], 'bP': f['bP'],
                            'bT': f['bT'], 'bT2': f['bT2'], 'giri': f['giri'], 'converge': f['converge'],
                            'stagioni_senza_conteggi_escluse': f['escluse']})
            f3 = stime.fit_3(nome, 'serie', tr)
            loso_3.append(dict(f3, esclusa=ANNI[k]))
            if nome == 'principale':
                loso_3c.append(dict(stime.fit_3(nome, 'csv', tr), esclusa=ANNI[k]))
        jk_2b = [stime.fit_2b(nome, tr) for tr in insiemi_training() if len(tr) == K - 2]
        jk_3 = [stime.fit_3(nome, 'serie', tr) for tr in insiemi_training() if len(tr) == K - 2]
        sig_fin = [x['sigma'] for x in jk_2b if math.isfinite(x['sigma'])]
        giri[nome] = {
            '(2b)': loso_2b, '(3)': [{k_: v for k_, v in x.items() if k_ != 'training'} for x in loso_3],
            'jackknife_(2b)': {'stime': len(jk_2b), 'non_convergenti': sum(not x['converge'] for x in jk_2b),
                               'sigma_infinito': sum(not math.isfinite(x['sigma']) for x in jk_2b),
                               'sigma_min': min(sig_fin) if sig_fin else None,
                               'sigma_max': max(sig_fin) if sig_fin else None,
                               'con_stagioni_escluse': sum(bool(x['escluse']) for x in jk_2b)},
            'jackknife_(3)': {'stime': len(jk_3), 'con_penalita': sum(x['penalita'] for x in jk_3),
                              'non_convergenti': sum(not x['converge'] for x in jk_3)},
        }
        if loso_3c:
            giri[nome]["(3′)"] = [{k_: v for k_, v in x.items() if k_ != 'training'} for x in loso_3c]
    esiti['parametri_per_giro'] = giri

    esiti['meta'] = {
        'preregistrazione': 'tools/benchmark-bielefeld/preregistrazione.md (commit 450a8ba)',
        'repliche_bootstrap': B, 'seme': SEME, 'delta': DELTA, 't_9': T_9,
        'python': sys.version.split()[0], 'numpy': np.__version__, 'node': fat['node'],
        'sistema': platform.platform(), 'model_version': fat['model_version'],
        'sha256': {'csv': sha, **{rel: h for rel, h in hash_moduli.items()},
                   **{f'tools/benchmark-bielefeld/{n}': sha256_file(os.path.join(QUI, n))
                      for n in ('scarica.py', 'fattori.mjs', 'valuta.py', 'preregistrazione.md')}},
        'avvertenze': [
            'L\'indice di Fronda è sperimentale (0–10) e non è una probabilità: qui si misura solo l\'ordinamento.',
            'Metriche sul complesso: (0) e (3) penalizzati per costruzione; (2b) cambia scala fra giri; '
            'lo sforzo è cresciuto fra le stagioni.',
            'Mnb = 0 vuol dire «nessun ritrovamento registrato», non «visita senza ritrovamenti».',
        ],
    }
    esiti['controlli'] = controlli

    # Hash riproducibile: esiti senza `meta` (che registra sistema, versioni e commit)
    senza_meta = {k: v for k, v in esiti.items() if k != 'meta'}
    sha_senza_meta = hashlib.sha256(testo_json(senza_meta).encode('utf-8')).hexdigest()
    esiti['meta']['sha256_esiti_senza_meta'] = sha_senza_meta
    esiti['meta']['git'] = stato_git()

    dest = os.path.join(dati, 'esiti.json')
    scrivi(dest, testo_json(esiti))

    # Riepilogo da versionare: niente valori giornalieri E-OBS, niente controlli sui dati, niente sistema né commit
    riepilogo = {
        'nota': ('Riepilogo di esiti.json di tools/benchmark-bielefeld/valuta.py. Contiene solo valori aggregati: '
                 'nessun valore meteo giornaliero E-OBS. I controlli sui dati sono nel README.'),
        'sha256_esiti_senza_meta': sha_senza_meta,
        'analisi': esiti['analisi'],
        'lettura': esiti['lettura'],
        'fra_stagioni': esiti['fra_stagioni'],
        'parametri_per_giro': esiti['parametri_per_giro'],
        'versioni': {k: v for k, v in esiti['meta'].items() if k not in ('sistema', 'git', 'avvertenze')},
        'avvertenze': esiti['meta']['avvertenze'],
    }
    dest_r = os.path.join(dati, 'esiti-riepilogo.json')
    scrivi(dest_r, testo_json(riepilogo))

    stampa(esiti)
    print('=' * 78)
    print(f'Scritto {dest}')
    print(f'SHA-256 di esiti.json: {sha256_file(dest)}')
    print(f'SHA-256 di esiti.json senza meta (riproducibile): {sha_senza_meta}')
    print(f'Scritto {dest_r} (SHA-256 {sha256_file(dest_r)})')


def testo_json(x):
    return json.dumps(pulisci(x), sort_keys=True, ensure_ascii=False, indent=1, allow_nan=False) + '\n'


def scrivi(dest, testo):
    with open(dest + '.tmp', 'w', encoding='utf-8') as f:
        f.write(testo)
    os.replace(dest + '.tmp', dest)


def stato_git():
    """Commit del repository e file tracciati modificati, se git è disponibile (solo informazione, in `meta`)."""
    try:
        commit = subprocess.run(['git', '-C', RADICE, 'rev-parse', 'HEAD'], capture_output=True, text=True,
                                timeout=10)
        stato = subprocess.run(['git', '-C', RADICE, 'status', '--porcelain', '--untracked-files=no'],
                               capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.SubprocessError):
        return None
    if commit.returncode != 0:
        return None
    modificati = sorted(r[3:] for r in stato.stdout.splitlines()) if stato.returncode == 0 else None
    return {'commit': commit.stdout.strip(), 'file_tracciati_modificati': modificati}


def stampa(esiti):
    ris = esiti['analisi']['principale']
    ins = ris['insieme']
    print()
    print(f"ANALISI PRINCIPALE 05/08–21/11: {ins['unita']} giorni, {ins['positivi']} positivi, "
          f"π {it(ins['prevalenza'], 4)}; AP a caso stratificata {it(ins['ap_caso_stratificata'], 4)}, "
          f"sul complesso {it(ins['ap_caso_complesso'], 4)}")
    print('Intervalli al 95%: B = bootstrap per stagione (percentile), J = jackknife della procedura (t, 9 g.d.l.)')
    print()
    print(f"{'modello':<26}{'AP strat.':>10}  {'B':<17}{'J':<17}{'ROC strat.':>10}{'ρ strat.':>10}"
          f"{'AP compl.':>10}{'ROC compl.':>11}{'distinti':>9}")
    for m, v in ris['modelli'].items():
        s = v['stratificate']
        c = v['complesso']
        print(f"{m:<26}{it(s['ap']['stima']):>10}  {it_int(s['ap']['boot']):<17}{it_int(s['ap']['jack']):<17}"
              f"{it(s['auc']['stima']):>10}{it(s['rho']['stima']):>10}{it(c['ap']['stima']):>10}"
              f"{it(c['auc']['stima']):>11}{v['valori_distinti']:>9}")
    print()
    print('Differenze (AP stratificata; accanto ROC-AUC e Spearman stratificati, AP sul complesso solo B)')
    for nome, d in ris['differenze'].items():
        s = d['stratificate']
        print(f"{nome:<30} AP {it(s['ap']['stima']):>7} B {it_int(s['ap']['boot']):<17} J {it_int(s['ap']['jack']):<17}"
              f" | ROC {it(s['auc']['stima'])} J {it_int(s['auc']['jack'])} | ρ {it(s['rho']['stima'])}"
              f" | AP compl. {it(d['complesso']['ap']['stima'])} B {it_int(d['complesso']['ap']['boot'])}")
    print()
    let = esiti['lettura']
    print(f"LETTURA PREREGISTRATA (δ = {it(let['delta'], 2)} di AP stratificata)")
    for n, v in let['verdetti'].items():
        extra = []
        if v['nota']:
            extra.append(v['nota'])
        if v['auc_segno_opposto']:
            extra.append('la ROC-AUC stratificata va in senso opposto')
        print(f"  {n}: {v['etichetta']}" + (f" ({'; '.join(extra)})" if extra else ''))
    print(f"  (b) e (b′) insieme, per D5: {let['lettura_congiunta_D5']}")
    print(f"  Sensibilità che contraddicono il principale: {', '.join(let['sensibilita_che_contraddicono']) or 'nessuna'}")
    for nome in ('S1', 'S2', 'S3'):
        r = esiti['analisi'][nome]
        ins = r['insieme']
        print()
        print(f"{nome}: {ins['unita']} unità, {ins['positivi']} positive; AP a caso stratificata "
              f"{it(ins['ap_caso_stratificata'], 4)}")
        for m, v in r['modelli'].items():
            s = v['stratificate']
            print(f"  {m:<6} AP strat. {it(s['ap']['stima'])} B {it_int(s['ap']['boot'])} J {it_int(s['ap']['jack'])}"
                  f"  ROC {it(s['auc']['stima'])}  ρ {it(s['rho']['stima'])}")
        for dn, d in r['differenze'].items():
            s = d['stratificate']['ap']
            print(f"  {dn:<16} {it(s['stima']):>7} B {it_int(s['boot'])} J {it_int(s['jack'])}")
    print()
    print('(2b): σ stimato in ogni giro (principale)')
    for g in esiti['parametri_per_giro']['principale']['(2b)']:
        sg = g['sigma']
        print(f"  esclusa {g['esclusa']}: σ {it(float(sg), 3) if sg != 'inf' else '+∞'} °C, centro "
              f"{it(g['centro'], 2)} °C, {g['giri']} giri, converge {g['converge']}")
    fr = esiti['fra_stagioni']
    print()
    print('Fra stagioni (descrittivo, senza verdetto; sforzo cresciuto fra le stagioni)')
    for r in fr['tabella']:
        print(f"  {r['anno']}: positivi {r['positivi']:>2}, carpofori {r['carpofori']:>4}, media (1) "
              f"{it(r['media_(1)'])}, media (2) {it(r['media_(2)'])}")
    print(f"  Spearman sulle 10 stagioni, media e positivi: (1) {it(fr['spearman_media_(1)_positivi'])}, "
          f"(2) {it(fr['spearman_media_(2)_positivi'])}")


if __name__ == '__main__':
    main()
