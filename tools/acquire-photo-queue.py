#!/usr/bin/env python3
"""Scarica una coda Commons in serie, conservando hash e limiti di frequenza.

Nessuna scrittura nei cataloghi. Stop immediato su 403/429; nessun retry,
proxy alternativo o modifica di URL. Le code contengono metadati già verificati.
"""
import argparse
import datetime
import email.utils
import fcntl
import hashlib
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / 'incoming/photo-expansion-2026-10-18'
UA = 'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'


def save(path, data):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)


def acquire(queue, interval, limit):
    WORK.mkdir(parents=True, exist_ok=True)
    with (WORK / '.download.lock').open('w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        log_path = WORK / 'commons-download-log.json'
        log = json.loads(log_path.read_text()) if log_path.exists() else {'results': []}
        count = 0
        for row in json.loads(queue.read_text())['queue']:
            target = (ROOT / row['original']).resolve()
            if not target.is_relative_to(WORK.resolve()):
                raise ValueError('Destinazione fuori dal bundle')
            if target.exists():
                if hashlib.sha1(target.read_bytes()).hexdigest() != row['commons_sha1']:
                    raise ValueError('Originale locale con hash inatteso: ' + row['id'])
                continue
            if count >= limit:
                break
            url = row['sourceImage']
            if urllib.parse.urlparse(url).hostname != 'upload.wikimedia.org':
                raise ValueError('La coda seriale accetta soltanto originali Commons')
            result = {'id': row['id'], 'original': row['original'], 'utc': datetime.datetime.utcnow().isoformat() + 'Z'}
            try:
                request = urllib.request.Request(url, headers={'User-Agent': UA})
                with urllib.request.urlopen(request, timeout=40) as response:
                    blob = response.read(25_000_001)
                if len(blob) > 25_000_000:
                    raise ValueError('Originale oltre 25 MB')
                if hashlib.sha1(blob).hexdigest() != row['commons_sha1']:
                    raise ValueError('SHA1 diverso dalla fonte')
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(blob)
                result.update(status='downloaded_pending_review', sha256=hashlib.sha256(blob).hexdigest(), bytes=len(blob))
                count += 1
            except urllib.error.HTTPError as error:
                result.update(status='http_error', http_status=error.code, retry_after=error.headers.get('Retry-After'))
                if error.code in (403, 429):
                    log['results'].append(result)
                    save(log_path, log)
                    print(row['id'], 'STOP', error.code, 'Retry-After:', result['retry_after'], flush=True)
                    return
            except Exception as error:
                result.update(status='error', error=type(error).__name__ + ': ' + str(error).split('?')[0][:160])
            log['results'].append(result)
            save(log_path, log)
            print(row['id'], result['status'], flush=True)
            time.sleep(interval)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('queue', type=Path)
    parser.add_argument('--interval', type=float, default=8)
    parser.add_argument('--limit', type=int, default=90)
    args = parser.parse_args()
    if args.interval < 8:
        parser.error('Intervallo minimo: 8 secondi fra gli originali')
    acquire(args.queue, args.interval, args.limit)
