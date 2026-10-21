#!/usr/bin/env python3
"""Import controllato del delta raster; ESEGUIRE SOLO dal coordinatore.

Usa l'importer corrente dell'app, lo stato reale dello snapshot e conserva all_rows
integro per base_size/provenienza. Non modifica il manifest dello snapshot.
"""
import argparse
import hashlib
import importlib.util
import json
import subprocess
import sys
from pathlib import Path

COMMIT = 'beefdb824d8cccd381adbfd0d216f2eee7b3800e'

def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def key(r):
    return (r['file'],r.get('cella'),r.get('variante'),r['soggetto'],r['tessera'])

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app',default='/workspace/fungaroli')
    parser.add_argument('--snapshot',default='/tmp/fronda-raster-final')
    parser.add_argument('--plan',default='/tmp/fronda-raster-delta-receipt.json')
    parser.add_argument('--receipt',default='/tmp/fronda-raster-import-receipt.json')
    args=parser.parse_args();app=Path(args.app).resolve();snapshot=Path(args.snapshot).resolve();plan=json.loads(Path(args.plan).read_text())
    assert plan['source_commit']==COMMIT
    assert str(snapshot).startswith('/tmp/')
    assert digest(snapshot/'incoming/manifest.json')==plan['manifest_sha256'], 'Manifest snapshot cambiato: non importare sorgenti diverse.'
    assert digest(snapshot/'incoming/bozze/STATO.md')==plan['state_sha256'], 'STATO snapshot cambiato.'
    for src in plan['source_sheets']:
        assert digest(snapshot/src['file'])==src['sha256'],f"Sorgente non corrisponde: {src['file']}"
    for row in plan['rows']:
        p=app/row['target'];actual=digest(p) if p.exists() else None
        assert actual==row['sha256_current'],f"Destinazione cambiata rispetto al delta: {row['target']}"
    tools=app/'tools';sys.path.insert(0,str(tools));spec=importlib.util.spec_from_file_location('import_trait_icons',tools/'import_trait_icons.py');mod=importlib.util.module_from_spec(spec);sys.modules['import_trait_icons']=mod;spec.loader.exec_module(mod)
    original_load_rows=mod.load_rows
    expected={(r['source_sheet'],r['cell'],r['variant'],r['key'],r['tile']) for r in plan['rows']}
    calls=[]
    def delta_load_rows(inc,stato=False,stati=(mod.STATE_OK,)):
        assert stato is True,'Import deve usare stato=True'
        ready,skipped,all_rows=original_load_rows(inc,stato=True,stati=stati)
        selected=[r for r in ready if key(r) in expected]
        assert len(selected)==176 and {key(r) for r in selected}==expected
        calls.append({'ready_snapshot_rows':len(ready),'selected_rows':len(selected),'all_rows':len(all_rows),'blocked_manifest_sheets':skipped})
        return selected,skipped,all_rows
    mod.load_rows=delta_load_rows
    # È l'unica operazione di scrittura dell'app: importer corrente non modificato.
    mod.main(snapshot/'incoming',stato=True)
    assert calls,'Importer non ha richiamato load_rows'
    checked=[]
    for row in plan['rows']:
        current=digest(app/row['target']);assert current==row['sha256_expected'],f"Hash import non conforme: {row['target']}";checked.append(dict(row,sha256_imported=current))
    receipt=dict(plan,status='imported-and-hashes-verified',rows=checked,importer_path=str(tools/'import_trait_icons.py'),importer_sha256=digest(tools/'import_trait_icons.py'),load_rows_calls=calls,app_head_at_import=subprocess.check_output(['git','-C',str(app),'rev-parse','HEAD'],text=True).strip())
    Path(args.receipt).write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
    print(f'Delta importato:170nuovi+6sostituzioni;176hash verificati. Ricevuta:{args.receipt}')

if __name__=='__main__':
    main()
