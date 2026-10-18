#!/usr/bin/env python3
"""Repeat source-pixel fits only; output requires a new visual review before build."""
from pathlib import Path
import json,sys,hashlib
import numpy as np
from PIL import Image
import vtracer
base=Path('incoming/vettoriali/botanici-lotto-01')
for key,part in [('fragolina-frutto','achenes'),('finocchietto-ombrella','minute-flowers')]:
 f=base/key;a=np.asarray(Image.open(f/'source.png').convert('RGBA')).astype(float);R,G,B,A=np.moveaxis(a,2,0);c=json.loads((f/'detail-candidates.json').read_text());keep=np.zeros(A.shape,dtype=bool)
 for i,item in enumerate(c['items']):
  if key=='fragolina-frutto'and i in [14,17]:continue # Rejected by direct overlay review: two pink tissue highlights, not achenes.
  x0,y0,x1,y1=item['bbox'];pad=3;keep[max(0,y0-pad):y1+pad,max(0,x0-pad):x1+pad]=True
 if key=='fragolina-frutto':
  appearance=((R<125)&(G<R*.45))|((R>110)&(G>R*.4)&(G<R*.9)&(B<R*.45))
 else:appearance=np.ones(A.shape,dtype=bool) # yellow/brown head paints; green supporting rays excluded.
 mask=keep&appearance&(A>=220)
 if key=='finocchietto-ombrella':
  for _ in range(2):
   padded=np.pad(mask,1);mask=np.logical_or.reduce([padded[y:y+mask.shape[0],x:x+mask.shape[1]]for y in range(3)for x in range(3)])
 im=np.full((*mask.shape,4),255,dtype='uint8');im[mask]=[0,0,0,255];Image.fromarray(im).save(f/(part+'-mask.png'))
 vtracer.convert_image_to_svg_py(str(f/(part+'-mask.png')),str(f/(part+'-region.svg')),colormode='binary',mode='spline',filter_speckle=3,corner_threshold=80,length_threshold=2,path_precision=3)
 c.update(review_status='needs-visual-review-after-extraction',accepted_items=[i for i in range(len(c['items']))if not(key=='fragolina-frutto'and i in[14,17])],rejected_items=[14,17]if key=='fragolina-frutto'else[],meaning='Depicted surface details only; connected color patches do not establish a biological organ count.',region_file=part+'-region.svg',region_sha256=hashlib.sha256((f/(part+'-region.svg')).read_bytes()).hexdigest(),limitation='Source-pixel boundary fitting within manually inspected local boxes; preserves visible details, not hidden anatomy. A few touching outline pixels at joins are illustrative boundaries.');(f/'detail-candidates.json').write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
 print(key,mask.sum())
