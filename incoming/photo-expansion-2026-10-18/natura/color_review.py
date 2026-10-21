import json,io
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageCms
B=Path(__file__).resolve().parent;R=B.parents[2];rows=[c for c in json.load(open(B/'manifest.json'))['photos']if c.get('color_conversion')=='ICC_to_sRGB']
out=Image.new('RGB',(1400,270*len(rows)),'white');dr=ImageDraw.Draw(out)
for j,c in enumerate(rows):
 raw=Image.open(R/c['original']);im=ImageOps.exif_transpose(raw);ref=ImageCms.profileToProfile(im,ImageCms.ImageCmsProfile(io.BytesIO(raw.info['icc_profile'])),ImageCms.createProfile('sRGB'),renderingIntent=1,outputMode='RGB');y=j*270;dr.text((4,y+2),c['id']+' | '+c['source_icc_profile'],fill='black')
 for col,(label,image)in enumerate([('riferimento sRGB',ref),('normale',Image.open(R/c['files']['file'])),('HD',Image.open(R/c['files']['file_hd'])),('miniatura',Image.open(R/c['files']['thumb']))]):
  im=image.convert('RGB');im.thumbnail((340,225));x=col*350;out.paste(im,(x+(340-im.width)//2,y+25));dr.text((x+5,y+251),label,fill='black')
out.save(B/'color-reviewed-exports.jpg');print(len(rows),'foto convertite e rese')
