"""Scarica le osservazioni per la prova retrospettiva (preregistrazione-italia.md, 2 e 7).

- iNaturalist API v1: Agaricomycetes (taxon 50814), research + needs_id, luogo 6973 (Italia), incertezza ≤ 1000 m,
  coordinate non oscurate, un anno alla volta, pagine da 200 ordinate per id (id_above). Casi, controlli P1 e P2
  sono sottoinsiemi di questo scaricamento.
- GBIF occurrence API: Agaricomycetes (186), country=IT, incertezza 0–1000 m, osservazioni e campioni, presenti,
  senza problemi geospaziali, un anno alla volta, pagine da 300.
- Taxa: GBIF Backbone (species/match, sinonimi) per le specie in prova e per il gruppo P2.
- Nomi verbatim GBIF (deviazioni.md, D10): per i record assegnati solo a uno dei generi in prova che passano i filtri
  di base, /occurrence/{key}/verbatim, una richiesta al secondo. `--solo-verbatim` li aggiunge a un gbif.jsonl già
  scaricato.
- Geometria del luogo iNaturalist 6973 con SHA-256.

Cache su disco per pagina (file per URL, scrittura atomica): una pagina già salvata non si richiede. Si conserva solo
ciò che elenca 2.6 del documento del Lazio: niente nomi, login, foto, descrizioni o commenti; l'osservatore è
un'impronta con sale. Ritmo: iNaturalist una richiesta ogni 1,1 s, GBIF una ogni 0,6 s.

Uso: python3 -I scarica_osservazioni.py [--anni 2015-2025] [--fonti inat,gbif] [--dati CARTELLA] [--solo-verbatim]
"""
import argparse
import hashlib
import json
import os
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comune as C  # noqa: E402

INAT = 'https://api.inaturalist.org/v1/'
GBIF = 'https://api.gbif.org/v1/'


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def riduci_inat(sale):
    def f(b):
        out = []
        for o in b.get('results', []):
            t = o.get('taxon') or {}
            loc = o.get('location')
            lat, lon = (loc.split(',') if loc else (None, None))
            out.append({
                'fonte': 'inat', 'id': o['id'], 'taxon': t.get('id'), 'rango': t.get('rank'), 'nome': t.get('name'),
                'antenati': t.get('ancestor_ids') or [], 'data': o.get('observed_on'),
                'lat': lat.strip() if lat else None, 'lon': lon.strip() if lon else None,
                'incertezza': o.get('positional_accuracy'), 'oscurato': bool(o.get('obscured')),
                'geoprivacy': o.get('geoprivacy'), 'geoprivacy_taxon': o.get('taxon_geoprivacy'),
                'qualita': o.get('quality_grade'), 'licenza': o.get('license_code'),
                'osservatore': C.hash_osservatore(sale, (o.get('user') or {}).get('id')),
                'luoghi': o.get('place_ids') or [],
            })
        return {'total_results': b.get('total_results'), 'results': out}
    return f


def norm_recorded_by(s):
    return ' '.join(str(s).lower().split()) if s else None


def riduci_gbif(sale, p2_chiavi):
    def f(b):
        out = []
        for o in b.get('results', []):
            link = any('inaturalist.org' in str(o.get(k) or '') for k in ('occurrenceID', 'references', 'catalogNumber'))
            g1 = ((o.get('gadm') or {}).get('level1') or {}).get('name')
            ids = {o.get(k) for k in ('taxonKey', 'acceptedTaxonKey', 'speciesKey', 'genusKey')}
            out.append({
                'fonte': 'gbif', 'id': o['key'], 'taxon': o.get('taxonKey'), 'accettato_gbif': o.get('acceptedTaxonKey'),
                'specie_gbif': o.get('speciesKey'), 'genere_gbif': o.get('genusKey'), 'rango': o.get('taxonRank'),
                'nome': o.get('acceptedScientificName') or o.get('scientificName'),
                'nome_verbatim': o.get('verbatimScientificName'), 'data': o.get('eventDate'),
                'anno': o.get('year'), 'mese': o.get('month'), 'giorno': o.get('day'),
                'lat': o.get('decimalLatitude'), 'lon': o.get('decimalLongitude'),
                'incertezza': o.get('coordinateUncertaintyInMeters'), 'licenza': o.get('license'),
                'base': o.get('basisOfRecord'), 'dataset': o.get('datasetKey'), 'in_cluster': o.get('isInCluster'),
                'link_inat': link, 'regione_gadm': g1, 'p2': bool(ids & p2_chiavi),
                'osservatore': C.hash_osservatore(sale, norm_recorded_by(o.get('recordedBy'))),
            })
        return {'count': b.get('count'), 'endOfRecords': b.get('endOfRecords'), 'results': out}
    return f


def taxa(cache):
    """GBIF Backbone: corrispondenza esatta, chiave accettata e sinonimi (2.2 del documento del Lazio)."""
    res = {'specie': {}, 'p2': {}}
    def match(nome, rango=None):
        q = {'name': nome, 'kingdom': 'Fungi', 'strict': 'true'}
        if rango:
            q['rank'] = rango
        return C.ottieni_con_cache(cache, GBIF + 'species/match?' + urllib.parse.urlencode(q), pausa=0.6, log=log)
    for sp, v in C.SPECIE.items():
        for nome in v['nomi']:
            m = match(nome)
            acc = m.get('acceptedUsageKey') or m.get('usageKey')
            syn = C.ottieni_con_cache(cache, f'{GBIF}species/{acc}/synonyms?limit=500', pausa=0.6, log=log) if acc else {}
            res['specie'][nome] = {'specie_app': sp, 'match': {k: m.get(k) for k in ('usageKey', 'scientificName', 'status', 'matchType', 'confidence', 'acceptedUsageKey', 'rank')},
                                   'sinonimi': sorted({s['canonicalName'] for s in syn.get('results', []) if s.get('canonicalName')})}
    for nome in C.P2_NOMI_GBIF:
        m = match(nome, 'GENUS' if ' ' not in nome else 'SPECIES')
        res['p2'][nome] = {k: m.get(k) for k in ('usageKey', 'scientificName', 'status', 'matchType', 'confidence', 'acceptedUsageKey', 'rank')}
    return res


def p2_chiavi(tx):
    out = set()
    for v in tx['p2'].values():
        if v.get('matchType') == 'EXACT':
            out.add(v.get('acceptedUsageKey') or v.get('usageKey'))
    return out


def scarica_inat(anni, cache, sale):
    righe = []
    for anno in anni:
        sopra, pagine = 0, 0
        while True:
            q = {'taxon_id': C.AGARICOMYCETES_INAT, 'quality_grade': 'research,needs_id', 'place_id': C.ITALIA_INAT,
                 'd1': f'{anno}-01-01', 'd2': f'{anno}-12-31', 'acc_below': 1001, 'obscuration': 'none',
                 'per_page': 200, 'order_by': 'id', 'order': 'asc', 'id_above': sopra}
            b = C.ottieni_con_cache(cache, INAT + 'observations?' + urllib.parse.urlencode(q), riduci_inat(sale), pausa=1.1, log=log)
            righe.extend(b['results'])
            pagine += 1
            if len(b['results']) < 200:
                break
            sopra = b['results'][-1]['id']
        log(f'iNaturalist {anno}: {sum(1 for r in righe if (r["data"] or "").startswith(str(anno)))} record, {pagine} pagine')
    return righe


def regioni_inat(righe, cache):
    ids = sorted({p for r in righe for p in r['luoghi']})
    luoghi = {}
    for k in range(0, len(ids), 100):
        b = C.ottieni_con_cache(cache, INAT + 'places/' + ','.join(map(str, ids[k:k + 100])),
                                lambda b: {'results': [{'id': p['id'], 'name': p['name'], 'admin_level': p.get('admin_level'),
                                                        'anc': p.get('ancestor_place_ids') or []} for p in b['results']]},
                                pausa=1.1, log=log)
        for p in b['results']:
            luoghi[p['id']] = p
    reg = {p['id']: C.regione(p['name']) for p in luoghi.values() if p['admin_level'] == 10 and C.ITALIA_INAT in p['anc']}
    for r in righe:
        rr = sorted({reg[p] for p in r['luoghi'] if reg.get(p)})
        r['regione'] = rr[0] if len(rr) == 1 else None
        r['lazio'] = C.LAZIO_INAT in r['luoghi']
        del r['luoghi']
    return {str(k): v for k, v in reg.items()}


def scarica_gbif(anni, cache, sale, chiavi_p2):
    righe = []
    for anno in anni:
        offset = 0
        while True:
            q = [('taxonKey', C.AGARICOMYCETES_GBIF), ('country', 'IT'), ('year', anno), ('hasCoordinate', 'true'),
                 ('hasGeospatialIssue', 'false'), ('occurrenceStatus', 'PRESENT'), ('basisOfRecord', 'HUMAN_OBSERVATION'),
                 ('basisOfRecord', 'PRESERVED_SPECIMEN'), ('coordinateUncertaintyInMeters', '0,1000'),
                 ('limit', 300), ('offset', offset)]
            b = C.ottieni_con_cache(cache, GBIF + 'occurrence/search?' + urllib.parse.urlencode(q),
                                    riduci_gbif(sale, chiavi_p2), pausa=0.6, log=log)
            righe.extend(b['results'])
            offset += 300
            if b.get('endOfRecords') or not b['results'] or offset >= 100000:
                if offset >= 100000 and not b.get('endOfRecords'):
                    raise SystemExit(f'GBIF {anno}: più di 100 000 record, serve una suddivisione')
                break
        log(f'GBIF {anno}: {sum(1 for r in righe if r.get("anno") == anno)} record')
    for r in righe:
        r['regione'] = C.regione(r.get('regione_gadm'))
    return righe


def nomi_verbatim(righe, cache, geometria):
    """Per i record GBIF assegnati solo a uno dei generi in prova che passano i filtri di base, legge il
    `dwc:scientificName` verbatim da /occurrence/{key}/verbatim (la ricerca non lo restituisce) e lo salva in
    `nome_verbatim` (2.2 del documento del Lazio; deviazioni.md). Una richiesta per record, lenta, con cache.
    Restituisce il conteggio dei record letti e di quelli senza nome verbatim."""
    letti = senza = 0
    for r in righe:
        if not (C.genere_in_prova_gbif(r) and C.passa_filtri_base(r, geometria)):
            continue
        v = C.ottieni_con_cache(cache, f'{GBIF}occurrence/{int(r["id"])}/verbatim',
                                lambda b: {'scientificName': b.get('http://rs.tdwg.org/dwc/terms/scientificName')},
                                pausa=1.1, log=log)
        r['nome_verbatim'] = v.get('scientificName')
        letti += 1
        senza += not r['nome_verbatim']
    log(f'GBIF, nomi verbatim dei record al genere nei generi in prova: {letti} letti, {senza} senza nome')
    return {'letti': letti, 'senza_nome': senza}


def solo_verbatim(a):
    """Aggiunge i nomi verbatim a un gbif.jsonl già scaricato, senza ripetere il resto; aggiorna scaricamento.json
    conservando le date originali."""
    oss = os.path.join(a.dati, 'osservazioni')
    fp = os.path.join(oss, 'gbif.jsonl')
    righe = C.leggi_jsonl(fp)
    geometria = json.load(open(os.path.join(a.dati, 'geometria-italia.json')))
    conti = nomi_verbatim(righe, os.path.join(a.dati, 'cache-gbif'), geometria)
    testo = ''.join(json.dumps(r, ensure_ascii=False, sort_keys=True) + '\n' for r in righe)
    C.scrivi_atomico(fp, testo)
    fm = os.path.join(oss, 'scaricamento.json')
    meta = json.load(open(fm))
    meta['gbif_verbatim'] = dict(conti, scaricato=C.adesso_iso())
    meta['sha256_gbif.jsonl'] = hashlib.sha256(testo.encode()).hexdigest()
    C.scrivi_atomico(fm, json.dumps(meta, ensure_ascii=False, indent=1, sort_keys=True))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--anni', default='2015-2025')
    ap.add_argument('--fonti', default='inat,gbif')
    ap.add_argument('--dati', default=C.DATI)
    ap.add_argument('--solo-verbatim', action='store_true',
                    help='aggiunge solo i nomi verbatim GBIF a un gbif.jsonl esistente')
    a = ap.parse_args()
    if a.solo_verbatim:
        return solo_verbatim(a)
    lo, hi = (int(x) for x in a.anni.split('-'))
    anni = list(range(lo, hi + 1))
    fonti = set(a.fonti.split(','))
    oss = os.path.join(a.dati, 'osservazioni')
    os.makedirs(oss, exist_ok=True)
    sale = C.sale(a.dati)
    cache_i, cache_g = os.path.join(a.dati, 'cache-inat'), os.path.join(a.dati, 'cache-gbif')

    g = C.ottieni_con_cache(cache_i, f'{INAT}places/{C.ITALIA_INAT}', lambda b: {'geometry_geojson': b['results'][0]['geometry_geojson'], 'name': b['results'][0]['name']}, log=log)
    testo = json.dumps(g['geometry_geojson'], sort_keys=True)
    C.scrivi_atomico(os.path.join(a.dati, 'geometria-italia.json'), testo)
    meta = {'scaricato': C.adesso_iso(), 'anni': a.anni, 'user_agent': C.USER_AGENT,
            'geometria_sha256': hashlib.sha256(testo.encode()).hexdigest()}

    tx = taxa(cache_g)
    C.scrivi_atomico(os.path.join(a.dati, 'taxa.json'), json.dumps(tx, ensure_ascii=False, indent=1, sort_keys=True))

    if 'inat' in fonti:
        righe = scarica_inat(anni, cache_i, sale)
        meta['regioni_inat'] = regioni_inat(righe, cache_i)
        righe.sort(key=lambda r: r['id'])
        C.scrivi_atomico(os.path.join(oss, 'inat.jsonl'), ''.join(json.dumps(r, ensure_ascii=False, sort_keys=True) + '\n' for r in righe))
        meta['inat_record'] = len(righe)
    if 'gbif' in fonti:
        righe = scarica_gbif(anni, cache_g, sale, p2_chiavi(tx))
        righe.sort(key=lambda r: r['id'])
        meta['gbif_verbatim'] = dict(nomi_verbatim(righe, cache_g, g['geometry_geojson']), scaricato=C.adesso_iso())
        C.scrivi_atomico(os.path.join(oss, 'gbif.jsonl'), ''.join(json.dumps(r, ensure_ascii=False, sort_keys=True) + '\n' for r in righe))
        meta['gbif_record'] = len(righe)
    for nome in ('inat.jsonl', 'gbif.jsonl'):
        fp = os.path.join(oss, nome)
        if os.path.exists(fp):
            with open(fp, 'rb') as f:
                meta[f'sha256_{nome}'] = hashlib.sha256(f.read()).hexdigest()
    C.scrivi_atomico(os.path.join(oss, 'scaricamento.json'), json.dumps(meta, ensure_ascii=False, indent=1, sort_keys=True))
    log(json.dumps({k: v for k, v in meta.items() if k != 'regioni_inat'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
