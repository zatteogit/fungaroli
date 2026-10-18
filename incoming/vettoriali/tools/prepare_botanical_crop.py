#!/usr/bin/env python3
"""Recreate exact raster crop from preserved reviewed master; fail on drift."""
import argparse,hashlib,io,json
from pathlib import Path
from PIL import Image

def prepare(folder):
    folder=Path(folder);rec=json.loads((folder/'source-record.json').read_text());source=rec['source'];assert hashlib.sha256((folder/'master.png').read_bytes()).hexdigest()==source['master_sha256']
    crop=Image.open(folder/'master.png').convert('RGBA').crop(source['crop_bbox']);crop.thumbnail((640,640),Image.Resampling.LANCZOS);assert list(crop.size)==source['crop_resized_size'];pad=source['padding'];im=Image.new('RGBA',(crop.width+pad*2,crop.height+pad*2));im.paste(crop,(pad,pad));out=io.BytesIO();im.save(out,format='PNG');assert hashlib.sha256(out.getvalue()).hexdigest()==source['crop_sha256'],'Crop differs: investigate version/source drift before replacing';(folder/'source.png').write_bytes(out.getvalue());print('Exact crop verified',folder.name)
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('folder',type=Path);a=p.parse_args();prepare(a.folder)
