"""Riunisce nella cartella dati di qui le risposte meteo scaricate da un'altra macchina (deviazioni.md, D18).

Copia in dati/meteo/ ogni risposta che qui manca, dopo aver controllato che la richiesta salvata sia identica a quella
di dati/richieste.json. Le risposte già presenti non si toccano: se l'altra macchina ha scaricato la stessa richiesta,
le due risposte si confrontano (senza generationtime_ms) e l'esito si stampa. Il log dell'altra macchina si conserva
accanto come meteo-<nome>.log e non entra in meteo.log, che qui serve ai tetti del ritmo.

Si può lanciare anche mentre scarica_meteo.py gira: la scrittura è atomica e lo scaricamento salta le richieste
già salvate.

Uso:
  python3 -I unisci_meteo.py --da /percorso/dati-altra-macchina [--nome ufficio]
"""
import argparse
import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comune as C  # noqa: E402

CAMPI_LOG = ['ora', 'evento', 'chiave', 'tipo', 'priorita', 'peso', 'http', 'secondi', 'nota']


def senza_tempo(r):
    return {k: v for k, v in (r or {}).items() if k != 'generationtime_ms'}


def sospese_nel_log(fp):
    sosp = {}
    if not os.path.exists(fp):
        return sosp
    with open(fp, encoding='utf-8') as f:
        for riga in f:
            r = dict(zip(CAMPI_LOG, riga.rstrip('\n').split('\t')))
            if r.get('evento') == 'sospesa':
                sosp[r['chiave']] = r.get('nota', '')
            elif r.get('evento') in ('riattivata', 'ok', 'ripiego'):
                sosp.pop(r.get('chiave'), None)
    return sosp


def unisci(da, dati, nome):
    with open(os.path.join(dati, 'richieste.json'), encoding='utf-8') as f:
        richieste = {q['chiave']: q for q in json.load(f)['richieste']}
    cache_da, cache = os.path.join(da, 'meteo'), os.path.join(dati, 'meteo')
    os.makedirs(cache, exist_ok=True)
    copiate, uguali, diverse, scartate = [], [], [], []
    for nome_file in sorted(os.listdir(cache_da)):
        if not nome_file.endswith('.json'):
            continue
        k = nome_file[:-5]
        try:
            with open(os.path.join(cache_da, nome_file), encoding='utf-8') as f:
                d = json.load(f)
        except (OSError, ValueError) as e:
            scartate.append((k, f'non leggibile: {e!r}'[:120]))
            continue
        if d.get('chiave') != k or k not in richieste or d.get('richiesta') != richieste[k] or not d.get('risposta'):
            scartate.append((k, 'chiave o richiesta diversa da richieste.json, o risposta vuota'))
            continue
        qui = os.path.join(cache, nome_file)
        if os.path.exists(qui):
            with open(qui, encoding='utf-8') as f:
                mia = json.load(f)
            stessa = (senza_tempo(mia.get('risposta')) == senza_tempo(d['risposta']) and mia.get('punto') == d.get('punto'))
            (uguali if stessa else diverse).append(k)
            continue
        C.scrivi_atomico(qui, json.dumps(d, ensure_ascii=False))
        copiate.append(k)
    log_da = os.path.join(da, 'meteo.log')
    if os.path.exists(log_da):
        shutil.copyfile(log_da, os.path.join(dati, f'meteo-{nome}.log'))
    fatte = {n[:-5] for n in os.listdir(cache) if n.endswith('.json')}
    sosp = {k: v for k, v in sospese_nel_log(log_da).items() if k not in fatte}
    print(f'copiate {len(copiate)}; già presenti qui {len(uguali) + len(diverse)} '
          f'(identiche {len(uguali)}, diverse {len(diverse)}); scartate {len(scartate)}')
    for k in diverse[:10]:
        print(f'  diversa: {k}')
    for k, motivo in scartate[:10]:
        print(f'  scartata: {k}: {motivo}')
    if sosp:
        print(f'in sospeso sull\'altra macchina e mancanti qui: {len(sosp)}')
        for k, motivo in sorted(sosp.items())[:10]:
            print(f'  {k}: {motivo[:100]}')
    return {'copiate': copiate, 'uguali': uguali, 'diverse': diverse, 'scartate': scartate, 'sospese': sosp}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--da', required=True, help='cartella dati dell\'altra macchina (con meteo/ e meteo.log)')
    ap.add_argument('--dati', default=C.DATI)
    ap.add_argument('--nome', default='seconda', help='nome della copia del log dell\'altra macchina')
    a = ap.parse_args()
    if os.path.abspath(a.da) == os.path.abspath(a.dati):
        raise SystemExit('--da deve essere un\'altra cartella')
    unisci(a.da, a.dati, a.nome)
    return 0


if __name__ == '__main__':
    sys.exit(main())
