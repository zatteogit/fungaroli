"""Parti comuni degli script della prova retrospettiva (preregistrazione.md e preregistrazione-italia.md).

Solo libreria standard. Nessun calcolo dell'indice: qui stanno taxa, filtri, celle, uscite e la richiesta HTTP
con cache su disco. Gli script si lanciano con `python3 -I`; per importare questo modulo aggiungono a mano la loro
cartella a sys.path.
"""
import datetime as dt
import hashlib
import json
import os
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
from decimal import ROUND_FLOOR, Decimal

QUI = os.path.dirname(os.path.abspath(__file__))
DATI = os.path.join(QUI, 'dati')
VERSIONE = '0.3'
USER_AGENT = (f'Fronda-prova-retrospettiva/{VERSIONE} (+https://fungaroli.zatteo.workers.dev; '
              'ricerca non commerciale)')
CA_BUNDLE = '/root/.ccr/ca-bundle.crt'

ITALIA_INAT = 6973
LAZIO_INAT = 8670
AGARICOMYCETES_INAT = 50814
AGARICOMYCETES_GBIF = 186
INAT_SU_GBIF = '50c9509d-22c7-4a22-a47d-8c48425ef4a7'
INIZIO_ICON = dt.date(2022, 11, 25)  # preregistrazione-italia.md, 2.1
PERIODO = (dt.date(2023, 1, 1), dt.date(2025, 12, 31))
FINESTRA_ABBINAMENTO = 30   # giorni, 4.3 del documento del Lazio
GIORNI_PRIMA = 62           # PAST_DAYS dell'app

# Le 14 specie con un modello (2.2 del documento del Lazio): id iNaturalist e chiavi GBIF Backbone accettate.
SPECIE = {
    'edulis': {'inat': [48701], 'gbif': [5954958], 'nomi': ['Boletus edulis']},
    'pinophilus': {'inat': [335942], 'gbif': [5954949], 'nomi': ['Boletus pinophilus']},
    'aereus': {'inat': [333772], 'gbif': [8733688], 'nomi': ['Boletus aereus']},
    'aestivalis': {'inat': [350216], 'gbif': [5954691], 'nomi': ['Boletus reticulatus', 'Boletus aestivalis']},
    'caesarea': {'inat': [204588], 'gbif': [5240269], 'nomi': ['Amanita caesarea']},
    'cibarius': {'inat': [47347], 'gbif': [5249504], 'nomi': ['Cantharellus cibarius']},
    'cornucopioides': {'inat': [48607], 'gbif': [2554662], 'nomi': ['Craterellus cornucopioides']},
    'repandum': {'inat': [48641], 'gbif': [2554716], 'nomi': ['Hydnum repandum']},
    'procera': {'inat': [63401], 'gbif': [8914748], 'nomi': ['Macrolepiota procera']},
    'mellea': {'inat': [55950], 'gbif': [2536891], 'nomi': ['Armillaria mellea']},
    'virescens': {'inat': [125720, 194437], 'gbif': [2551423, 2551542], 'nomi': ['Russula virescens', 'Russula cyanoxantha']},
    'suillus': {'inat': [53488, 179065, 363592], 'gbif': [7777157, 8146046, 9104622],
                'nomi': ['Suillus luteus', 'Suillus granulatus', 'Suillus collinitus']},
    'terreum': {'inat': [341797], 'gbif': [5241808], 'nomi': ['Tricholoma terreum']},
    'nuda': {'inat': [1525548], 'gbif': [5242048], 'nomi': ['Lepista nuda', 'Collybia nuda']},
}
ORDINE_SPECIE = list(SPECIE)
# Generi in prova: un controllo identificato solo a un rango fra genere e specie di questi generi è escluso.
GENERI_INAT = {'Boletus': 48703, 'Amanita': 48419, 'Cantharellus': 47348, 'Craterellus': 48611, 'Hydnum': 48422,
               'Macrolepiota': 63402, 'Armillaria': 55930, 'Russula': 48339, 'Suillus': 53490, 'Tricholoma': 62484,
               'Collybia': 154391, 'Lepista': 55591}
# Gruppo P2, poliporacei perenni (preregistrazione-italia.md, 4.2).
P2_INAT = {'Fomes': 127511, 'Phellinus': 118087, 'Fomitiporia': 352247, 'Fuscoporia': 328266, 'Porodaedalea': 118086,
           'Fomitopsis pinicola': 1098280, 'Ganoderma applanatum': 48473, 'Ganoderma adspersum': 63509,
           'Ganoderma pfeifferi': 781305}
P2_NOMI_GBIF = ['Fomes', 'Phellinus', 'Fomitiporia', 'Fuscoporia', 'Porodaedalea', 'Fomitopsis pinicola',
                'Ganoderma applanatum', 'Ganoderma adspersum', 'Ganoderma pfeifferi']

MACRO = {
    'Nord': ["Valle d'Aosta", 'Piemonte', 'Lombardia', 'Trentino-Alto Adige', 'Veneto', 'Friuli-Venezia Giulia',
             'Liguria', 'Emilia-Romagna'],
    'Centro': ['Toscana', 'Umbria', 'Marche', 'Lazio'],
    'Sud e isole': ['Abruzzo', 'Molise', 'Campania', 'Puglia', 'Basilicata', 'Calabria', 'Sicilia', 'Sardegna'],
}
REGIONE_MACRO = {r: m for m, rs in MACRO.items() for r in rs}
# Nomi usati da iNaturalist e da GADM ricondotti a quelli italiani.
ALIAS_REGIONI = {'Sicily': 'Sicilia', 'Apulia': 'Puglia', 'Piedmont': 'Piemonte', 'Lombardy': 'Lombardia',
                 'Tuscany': 'Toscana', 'Sardinia': 'Sardegna', 'Aosta Valley': "Valle d'Aosta",
                 'Trentino-South Tyrol': 'Trentino-Alto Adige', 'Trentino-Alto Adige/Südtirol': 'Trentino-Alto Adige',
                 'Friuli Venezia Giulia': 'Friuli-Venezia Giulia', 'Emilia Romagna': 'Emilia-Romagna'}


def regione(nome):
    if not nome:
        return None
    nome = ALIAS_REGIONI.get(nome, nome)
    return nome if nome in REGIONE_MACRO else None


def cella(lat, lon, passo=10):
    """Cella regolare di 1/passo gradi: (floor(lat*passo), floor(lon*passo)), calcolata in decimale."""
    a = (Decimal(str(lat)) * passo).to_integral_value(ROUND_FLOOR)
    b = (Decimal(str(lon)) * passo).to_integral_value(ROUND_FLOOR)
    return f'{int(a)}_{int(b)}'


def hash_osservatore(sale, ident):
    if ident is None or ident == '':
        return None
    return hashlib.sha256(sale + str(ident).encode('utf-8')).hexdigest()[:20]


def sale(cartella=DATI):
    """Sale casuale generato una volta e salvato solo in dati/ (2.6 del documento del Lazio)."""
    import secrets
    fp = os.path.join(cartella, 'sale.bin')
    if not os.path.exists(fp):
        os.makedirs(cartella, exist_ok=True)
        scrivi_atomico(fp, secrets.token_bytes(32))
    with open(fp, 'rb') as f:
        return f.read()


def scrivi_atomico(fp, contenuto):
    tmp = f'{fp}.{os.getpid()}.tmp'
    modo = 'wb' if isinstance(contenuto, bytes) else 'w'
    with open(tmp, modo) as f:
        f.write(contenuto)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, fp)


def contesto_tls():
    if os.path.exists(CA_BUNDLE):
        return ssl.create_default_context(cafile=CA_BUNDLE)
    return ssl.create_default_context()


class ErroreHTTP(Exception):
    def __init__(self, codice, corpo):
        super().__init__(f'HTTP {codice}: {corpo[:200]}')
        self.codice = codice
        self.corpo = corpo


def http_json(url, timeout=120):
    """GET con User-Agent del progetto. Restituisce (codice, json). Solleva ErroreHTTP per codici ≠ 200."""
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'application/json'})
    host = urllib.parse.urlsplit(url).hostname
    if host in ('127.0.0.1', 'localhost'):  # server finto delle prove: niente proxy
        apri = urllib.request.build_opener(urllib.request.ProxyHandler({})).open
    else:
        apri = urllib.request.build_opener(urllib.request.HTTPSHandler(context=contesto_tls())).open
    try:
        with apri(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        corpo = e.read().decode('utf-8', 'replace')
        raise ErroreHTTP(e.code, corpo) from None


def ottieni_con_cache(cartella, url, riduci=None, pausa=1.1, tentativi=6, log=print):
    """Una risposta per file (chiave = SHA-256 dell'URL), scrittura atomica; una risposta in cache non si richiede.
    `riduci` toglie dalla risposta ciò che non si conserva (nomi, foto, testi) prima di scriverla."""
    os.makedirs(cartella, exist_ok=True)
    fp = os.path.join(cartella, hashlib.sha256(url.encode()).hexdigest()[:32] + '.json')
    if os.path.exists(fp):
        with open(fp) as f:
            return json.load(f)['corpo']
    attesa = 10
    for k in range(tentativi):
        try:
            _, corpo = http_json(url)
            break
        except ErroreHTTP as e:
            if e.codice not in (429, 500, 502, 503, 504) or k == tentativi - 1:
                raise
            log(f'  {e.codice}, attendo {attesa} s')
        except (OSError, ValueError) as e:
            if k == tentativi - 1:
                raise
            log(f'  errore di rete ({e}), attendo {attesa} s')
        time.sleep(attesa)
        attesa = min(attesa * 3, 900)
    if riduci:
        corpo = riduci(corpo)
    scrivi_atomico(fp, json.dumps({'url': url, 'scaricato': adesso_iso(), 'corpo': corpo}, ensure_ascii=False))
    time.sleep(pausa)
    return corpo


def adesso_iso():
    return dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def leggi_jsonl(fp):
    with open(fp) as f:
        return [json.loads(r) for r in f if r.strip()]


def punto_in_geojson(lat, lon, geom):
    """Ray casting su Polygon o MultiPolygon GeoJSON (lon, lat); i buchi contano."""
    poligoni = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    x, y = float(lon), float(lat)

    def dentro(anello):
        c = False
        n = len(anello)
        for i in range(n):
            x1, y1 = anello[i][0], anello[i][1]
            x2, y2 = anello[i - 1][0], anello[i - 1][1]
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                c = not c
        return c

    for pol in poligoni:
        if dentro(pol[0]) and not any(dentro(buco) for buco in pol[1:]):
            return True
    return False


# --- record e unità ---------------------------------------------------------------------------------------

def specie_del_caso(rec, sinonimi_gbif=None):
    """Specie dell'app se il record è un caso possibile (prima dei filtri di data e precisione), altrimenti None."""
    if rec['fonte'] == 'inat':
        if rec.get('qualita') != 'research':
            return None
        ids = set(rec.get('antenati') or []) | {rec.get('taxon')}
        for sp, v in SPECIE.items():
            if ids & set(v['inat']):
                return sp
        return None
    chiavi = {rec.get('specie_gbif'), rec.get('accettato_gbif'), rec.get('taxon')}
    for sp, v in SPECIE.items():
        if chiavi & set(v['gbif']):
            return sp
    # 2.2 del documento del Lazio: nome verbatim sinonimo, record assegnato solo al genere.
    if sinonimi_gbif and rec.get('rango') == 'GENUS':
        nome = ' '.join((rec.get('nome_verbatim') or '').split()[:2]).lower()
        return sinonimi_gbif.get(nome)
    return None


def e_p2(rec):
    if rec['fonte'] == 'inat':
        ids = set(rec.get('antenati') or []) | {rec.get('taxon')}
        return bool(ids & set(P2_INAT.values()))
    return bool(rec.get('p2'))


def data_singola(rec):
    d = rec.get('data')
    if not d or '/' in d or len(d) < 10:
        return None
    try:
        return dt.date.fromisoformat(d[:10])
    except ValueError:
        return None


def passa_filtri_base(rec, geometria=None):
    """Data di un giorno, incertezza dichiarata ≤ 1000 m, non oscurato, dentro l'Italia (2.3 del documento del Lazio)."""
    if data_singola(rec) is None or rec.get('lat') is None or rec.get('lon') is None:
        return False
    inc = rec.get('incertezza')
    if inc is None or inc > 1000:
        return False
    if rec['fonte'] == 'inat' and rec.get('oscurato'):
        return False
    if rec['fonte'] == 'gbif':
        if rec.get('dataset') == INAT_SU_GBIF or rec.get('link_inat'):
            return False
        if geometria is not None and not punto_in_geojson(rec['lat'], rec['lon'], geometria):
            return False
    return True


def uscite(records, chiave_unita=None):
    """Raggruppa in uscite (osservatore, data, cella). Senza osservatore ogni record è un'uscita a sé.
    Il punto dell'uscita è quello del record con l'identificativo più basso (fonte, poi id)."""
    gruppi = {}
    for r in records:
        oss = r.get('osservatore')
        k = (r['fonte'], oss, r['data'][:10], r['cella']) if oss else (r['fonte'], f"rec:{r['id']}", r['data'][:10], r['cella'])
        gruppi.setdefault(k, []).append(r)
    out = []
    for k, rs in gruppi.items():
        rs.sort(key=lambda r: (r['fonte'], int(r['id'])))
        out.append({'chiave': k, 'data': k[2], 'cella': k[3], 'osservatore': k[1], 'punto': (rs[0]['lat'], rs[0]['lon']),
                    'record': [r['id'] for r in rs]})
    out.sort(key=lambda u: (u['data'], u['cella'], str(u['osservatore'])))
    return out
