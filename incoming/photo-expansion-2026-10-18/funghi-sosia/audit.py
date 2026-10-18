"""Targeted media/integrity audit; no application tests or network."""
import json,hashlib,collections
from pathlib import Path
from PIL import Image
ROOT=Path.cwd();OUT=ROOT/'incoming/photo-expansion-2026-10-18/funghi-sosia';m=json.load(open(OUT/'manifest.json'));rows=m['photos'];issues=[];sizes=[];sha=[]
for row in rows:
 b=(ROOT/row['original']).read_bytes();digest=hashlib.sha256(b).hexdigest();sha.append(digest)
 if digest!=row['sha256_original']:issues.append([row['id'],'sha256'])
 if row.get('commons_sha1') and hashlib.sha1(b).hexdigest()!=row['commons_sha1']:issues.append([row['id'],'commons_sha1'])
 for kind,path in row['files'].items():
  p=ROOT/path;im=Image.open(p);size=p.stat().st_size;sizes.append([row['id'],kind,size,*im.size])
  if im.info.get('exif') or im.info.get('xmp'):issues.append([row['id'],'metadata',kind])
  if kind=='file' and (size>80000 or max(im.size)>560):issues.append([row['id'],'normal limits'])
  if kind=='file_hd' and (size>220000 or max(im.size)>1200):issues.append([row['id'],'HD limits'])
  if kind=='thumb' and im.size!=(160,160):issues.append([row['id'],'thumbnail dimensions'])
 if not row.get('licenseUrl') or not row.get('author') or not row.get('page'):issues.append([row['id'],'provenance incomplete'])
 if not row['visual_review'].get('approved') or not row['visual_review'].get('attribution_approved'):issues.append([row['id'],'unapproved'])
 if len(row.get('crop_points',{}))!=6:issues.append([row['id'],'crop formats'])
if len(sha)!=len(set(sha)):issues.append(['duplicate original SHA256'])
counts=collections.Counter(r['target_key']for r in rows);sources=collections.Counter('Commons'if r.get('commons_sha1')else'iNaturalist' for r in rows)
audit={'approved_photos':len(rows),'distinct_original_sha256':len(set(sha)),'covered_taxa':len(counts),'counts_by_taxon':dict(sorted(counts.items())),'counts_by_source':dict(sources),'derivative_count':len(sizes),'rejected_visual':m.get('rejected_visual_review',[]),'pending_visual':m.get('pending_visual_review',[]),'issues':issues,'files':sizes,'note':'Verifica media circoscritta; nessuna suite applicativa/unit/browser o dry-run.'};(OUT/'audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in audit.items()if k not in ['files','rejected_visual','counts_by_taxon']},ensure_ascii=False))
