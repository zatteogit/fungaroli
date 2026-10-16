import json,sys,os
for fn in sorted(os.listdir(sys.argv[1])):
    d=json.load(open(os.path.join(sys.argv[1],fn)))
    if 'data' not in d: print(fn, 'ERR', str(d)[:200]); continue
    a=d['data']['attributes']
    print('##',a['doi'])
    print('  creators:',[c.get('name') for c in a.get('creators',[])][:6])
    print('  title:',[t.get('title') for t in a.get('titles',[])][:1])
    print('  publisher:',a.get('publisher'),'year:',a.get('publicationYear'),'type:',(a.get('types') or {}).get('resourceTypeGeneral'),'version:',a.get('version'))
    print('  rights:',[(r.get('rights'),r.get('rightsIdentifier'),r.get('rightsUri')) for r in a.get('rightsList',[])])
    print('  dates:',[(x.get('dateType'),x.get('date')) for x in a.get('dates',[])][:6])
    rel=[(r.get('relationType'),r.get('relatedIdentifier')) for r in a.get('relatedIdentifiers',[])]
    print('  related:',rel[:8])
    cont=a.get('container') or {}
    if cont: print('  container:',cont)
