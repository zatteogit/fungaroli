from scout import *
d=json.load(open(B/'metadata/felleus.json'));allrows=json.load(open(B/'candidates.json'));part=[]
for p in sorted(d['query']['pages'].values(),key=lambda p:p.get('index',0)):
 if p['index'] not in [19,20,21,25]:continue
 ii=p['imageinfo'][0];m=ii['extmetadata'];val=lambda k:clean(m.get(k,{}).get('value',''));row=dict(id='ce1-replace-felleus-extra'+str(p['index']),target_group='lookalikes',target_key='Tylopilus felleus',latin='Tylopilus felleus',photo_taxon='Tylopilus felleus',source='Wikimedia Commons',source_title=p['title'],source_description=val('ImageDescription'),source_categories=[x['title']for x in p.get('categories',[])],page=ii['descriptionurl'],author=val('Artist'),license=val('LicenseShortName'),licenseUrl=val('LicenseUrl'),sourceImage=ii['url'],previewImage=ii.get('thumburl',ii['url']),commons_sha1=ii['sha1'],size=ii['size'],attribution_required_text=val('Attribution'),api_metadata='incoming/catalog-expansion-2026-10-19/replacements/metadata/felleus.json')
 assert row['license'].startswith('CC BY') and row['author'] and row['licenseUrl'];path=B/'previews'/(row['id']+'.jpg');path.write_bytes(get(row['previewImage']));row['preview_file']=str(path.relative_to(R));part.append(row);print(row['id'],row['source_title'],flush=True)
sheet=Image.new('RGB',(1400,400),'white');draw=ImageDraw.Draw(sheet)
for i,p in enumerate(part):
 im=Image.open(R/p['preview_file']).convert('RGB');im.thumbnail((345,350));sheet.paste(im,(i*350,0));draw.text((i*350,355),p['id'],fill='black')
sheet.save(B/'felleus-extra.jpg');allrows.extend(part);(B/'candidates.json').write_text(json.dumps(allrows,ensure_ascii=False,indent=2)+'\n');(B/'network-extra.json').write_text(json.dumps(network,indent=2))
