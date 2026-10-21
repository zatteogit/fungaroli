"""Scarica l'archivio di Brejon Lamartinière & Hoffman (Zenodo 20591123, V1.2) ed estrae solo il CSV.

Uso (dalla radice del repository o da qualsiasi cartella):

    python3 -I tools/benchmark-bielefeld/scarica.py               # scarica da Zenodo
    python3 -I tools/benchmark-bielefeld/scarica.py --zip FILE    # usa un archivio già scaricato

Controlla dimensione, MD5 e SHA-256 dell'archivio, poi lo SHA-256 del CSV estratto. Si ferma se un controllo
fallisce. Non esegue nulla dell'archivio e non estrae altri file. Solo libreria standard.

Il CSV contiene meteo E-OBS: resta in dati/, esclusa da git (preregistrazione, sezione 2.3).
"""
import argparse
import hashlib
import io
import os
import shutil
import sys
import urllib.request
import zipfile

QUI = os.path.dirname(os.path.abspath(__file__))
DATI = os.path.join(QUI, 'dati')

URL = 'https://zenodo.org/api/records/20591123/files/ebrejonl/Boletus_fruiting_triggers-V1.2.zip/content'
ZIP_BYTE = 712920
ZIP_MD5 = 'a5299db56022af2620635a36274e811f'
ZIP_SHA256 = 'ee19dfc414676cbcd4993eca75ea77a9fd1607d18bc4e0bdb7094a4ab07ee07a'
MEMBRO = 'ebrejonl-Boletus_fruiting_triggers-7967c6d/Data/Environmental_fruiting_data_jun8.csv'
CSV_BYTE = 1734999
CSV_SHA256 = '63148586ad0cd2533fb741070e95f900e53343f54a4ccdfe0944f3a8f0000e4c'

NOME_ZIP = 'Boletus_fruiting_triggers-V1.2.zip'
NOME_CSV = 'Environmental_fruiting_data_jun8.csv'


def ferma(msg):
    print('ERRORE: ' + msg, file=sys.stderr)
    sys.exit(1)


def scarica(url, timeout=120):
    req = urllib.request.Request(url, headers={'User-Agent': 'fronda-benchmark-bielefeld/1 (ricerca non commerciale)'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--zip', help='archivio V1.2 già scaricato (al posto del download da Zenodo)')
    args = ap.parse_args()

    os.makedirs(DATI, exist_ok=True)
    if args.zip:
        with open(args.zip, 'rb') as f:
            dati_zip = f.read()
        origine = 'file locale ' + os.path.abspath(args.zip)
    else:
        try:
            dati_zip = scarica(URL)
        except Exception as e:  # rete assente, proxy, errore HTTP
            ferma(f'scaricamento da Zenodo non riuscito ({type(e).__name__}: {e}). '
                  'Riprova, oppure passa un archivio già scaricato con --zip.')
        origine = URL

    n = len(dati_zip)
    md5 = hashlib.md5(dati_zip).hexdigest()
    sha = hashlib.sha256(dati_zip).hexdigest()
    print(f'Archivio da {origine}')
    print(f'  byte {n} (atteso {ZIP_BYTE})')
    print(f'  MD5 {md5}')
    print(f'  SHA-256 {sha}')
    if n != ZIP_BYTE:
        ferma('dimensione dell\'archivio diversa da quella attesa')
    if md5 != ZIP_MD5:
        ferma('MD5 dell\'archivio diverso da quello registrato su Zenodo')
    if sha != ZIP_SHA256:
        ferma('SHA-256 dell\'archivio diverso da quello registrato nella preregistrazione')

    percorso_zip = os.path.join(DATI, NOME_ZIP)
    if not (args.zip and os.path.abspath(args.zip) == os.path.abspath(percorso_zip)):
        with open(percorso_zip, 'wb') as f:
            f.write(dati_zip)

    with zipfile.ZipFile(io.BytesIO(dati_zip)) as z:
        try:
            info = z.getinfo(MEMBRO)
        except KeyError:
            ferma(f'il file {MEMBRO} non è nell\'archivio')
        if info.file_size != CSV_BYTE:
            ferma(f'dimensione del CSV nell\'archivio {info.file_size}, attesa {CSV_BYTE}')
        contenuto = z.read(info)  # in memoria: nessun percorso dell'archivio arriva al disco
    sha_csv = hashlib.sha256(contenuto).hexdigest()
    print(f'CSV {MEMBRO}')
    print(f'  byte {len(contenuto)}; SHA-256 {sha_csv}')
    if sha_csv != CSV_SHA256:
        ferma('SHA-256 del CSV diverso da quello atteso')
    destinazione = os.path.join(DATI, NOME_CSV)
    tmp = destinazione + '.tmp'
    with open(tmp, 'wb') as f:
        f.write(contenuto)
    shutil.move(tmp, destinazione)
    print(f'Scritto {destinazione}')
    print('Controlli superati.')


if __name__ == '__main__':
    main()
