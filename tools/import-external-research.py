"""Raccolta iniziale verificabile; nessuna foto, nome o coordinata conservata."""
import hashlib, json, math, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TODAY = '2026-10-20'
FB = ROOT.parent/'ricerche/facebook/2026-10-20/segnalazioni.json'
taxa = json.loads((ROOT/'data/species-traits.json').read_text())['taxa']
taxon_ids = {v.get('latin'): k for k, v in taxa.items()}
zones = json.loads((ROOT/'data/zones.json').read_text())['zones']
province_names = {33136:'Frosinone',33137:'Latina',33138:'Rieti',33139:'Roma',33140:'Viterbo'}

def blank():
    return dict(sourceUrl=None,sourceLabel=None,sourceRecordId=None,publicationLabel=None,publishedOn=None,observedOn=None,
        observationLabel=None,placeName=None,province=None,reportedTaxon=None,scientificName=None,zoneId=None,taxonId=None,
        summary=None,limitations=None,license=None,attribution=None,eventKey=None,sourceType='other',outcome='context',
        evidence='context',datePrecision='unknown',spatialScope='unknown',quality='unverified',reviewStatus='pending',
        searched=False,effortMinutes=None)

rows=[]
for f in json.loads(FB.read_text())['segnalazioni']:
    r=blank()
    r.update(sourceUrl=f['fonte'].rstrip('/'), sourceLabel=f['gruppo'],sourceRecordId=f['id'],
        publicationLabel=f['pubblicazione_visibile'],observationLabel=f['riferimento_temporale_osservazione'],
        placeName=f['zona_ampia'],reportedTaxon=', '.join(f['specie_dichiarata'] or []) or None,
        summary=f['sintesi'],limitations=f['limiti'],sourceType='facebook',
        outcome={'ricerca_a_vuoto':'searched_absent','assenza_dichiarata':'absence_claim','ritrovamento_dichiarato':'presence',
            'ritrovamento_riferito':'presence','presenza_fotografata_dichiarata':'presence','esito_nullo_dichiarato':'absence_claim',
            'presenza_passata_riferita':'presence','misto':'mixed'}.get(f['esito'],'context'),
        evidence={'resoconto_diretto_esplicito':'direct','sentito_dire':'reported',
            'osservazione_con_foto_e_identificazione_proposta':'identification'}.get(f['natura'],'context'),
        datePrecision='relative' if f['pubblicazione_visibile'].endswith('fa') else 'unknown',
        spatialScope='multi_area' if f['id'] in ['FB01','FB06','FB07','FB10'] else 'municipality',
        license='Non dichiarata; sintesi fattuale, nessuna riproduzione del contenuto',
        attribution='Fonte originale collegata',searched=f['esito']=='ricerca_a_vuoto',
        eventKey='facebook:'+f['fonte'].split('/posts/')[-1].split('/')[0].split('?')[0]+':'+f['id'])
    # Nessuna conversione automatica di “ovoli”, “boccetti” o nomi suggeriti nei commenti.
    rows.append({'id':'external-'+f['id'].lower(),'data':r})

def get(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Fronda-Research/1.0 (local factual observation register)'}),timeout=30))

def distance(a,b):
    la,lo=a;lb,ln=b
    p=math.pi/180
    h=math.sin((lb-la)*p/2)**2+math.cos(la*p)*math.cos(lb*p)*math.sin((ln-lo)*p/2)**2
    return 6371000*2*math.asin(min(1,math.sqrt(h)))

queries=[f'https://api.inaturalist.org/v1/observations?place_id=33138&taxon_id=47170&d1=2026-09-01&d2={TODAY}&order_by=observed_on&order=desc&per_page=30',
    f'https://api.inaturalist.org/v1/observations?place_id=8670&taxon_id=47170&d1=2026-09-01&d2={TODAY}&quality_grade=research&order_by=observed_on&order=desc&per_page=30',
    f'https://api.inaturalist.org/v1/observations?place_id=8670&taxon_id=47169&d1=2026-09-01&d2={TODAY}&quality_grade=research&order_by=observed_on&order=desc&per_page=30']
seen=set();coverage=[]
for url in queries:
    result=get(url);coverage.append(dict(url=url,totalResults=result['total_results'],read=len(result['results'])))
    for x in result['results']:
        if x['id'] in seen:continue
        seen.add(x['id']);r=blank();name=x.get('taxon',{}).get('name')
        province=next((label for id,label in province_names.items() if id in x.get('place_ids',[])),None)
        day=x.get('observed_on')
        license=x.get('license_code')
        r.update(sourceUrl=x['uri'],sourceLabel='iNaturalist',sourceRecordId=str(x['id']),
            publicationLabel=x['created_at'],publishedOn=x['created_at'][:10],observedOn=day,
            observationLabel='Data osservazione dichiarata nel record iNaturalist',
            placeName=('Provincia di '+province) if province else 'Lazio',province=province,reportedTaxon=name,scientificName=name,
            taxonId=taxon_ids.get(name),sourceType='inaturalist',outcome='presence',evidence='identification',datePrecision='day' if day else 'unknown',
            spatialScope='province' if province else 'region',quality='research' if x['quality_grade']=='research' else 'needs_id',
            reviewStatus='accepted' if x['quality_grade']=='research' else 'pending',
            summary=f'Presenza di {name} dichiarata su iNaturalist; qualità della fonte: {x["quality_grade"]}.',
            limitations='Presenza opportunistica, senza sforzo di ricerca. Research grade è il consenso della piattaforma, non una verifica micologica di Fronda. Nessuna inferenza di assenza da altre specie mancanti.',
            license=license or 'Non dichiarata',attribution='iNaturalist; attribuzione e licenza originali nel record collegato')
        # Dedup prudente: stesso osservatore/giorno/provincia/taxon, senza conservare l’identificativo personale.
        event=hashlib.sha256(f'{x["user"]["id"]}|{day}|{province}'.encode()).hexdigest()[:20]
        r['eventKey']='inat-event:'+event
        # Solo coordinate pubbliche non oscurate; la zona deve contenere anche l’errore dichiarato.
        # Coordinate e accuratezza non sono salvate nel registro.
        if x.get('location') and not x.get('obscured') and not x.get('geoprivacy') and x.get('positional_accuracy') is not None:
            point=tuple(map(float,x['location'].split(',')));accuracy=x['positional_accuracy']
            matches=[z for z in zones if distance(point,(z['lat'],z['lon']))+accuracy<=z['radius_m']]
            if len(matches)==1:
                r.update(zoneId=matches[0]['id'],spatialScope='zone',placeName=matches[0]['name'])
                r['limitations']+=' Zona assegnata perché il punto pubblico e la sua accuratezza dichiarata sono interamente entro un solo raggio del catalogo; coordinate eliminate.'
        rows.append({'id':'inat-'+str(x['id']),'data':r})

r=blank();r.update(sourceUrl='https://www.fungocenter.it/meteo-funghi-dal-5-all11-ottobre-2026-timidi-segnali-di-ripresa-lazio-in-evidenza',
    sourceLabel='FungoCenter — bollettino 5–11 ottobre 2026',sourceRecordId='bollettino-2026-10-12',publishedOn='2026-10-12',publicationLabel='12 ottobre 2026 09:00',
    observationLabel='Settimana dal 5 all’11 ottobre; non data di un ritrovamento',placeName='Lazio',spatialScope='region',
    sourceType='editorial',outcome='context',evidence='model',reviewStatus='accepted',eventKey='fungocenter:2026-10-05:2026-10-11',
    summary='Il bollettino descrive segnali meteorologici favorevoli in parte del Lazio. I numeri riportati riguardano notifiche di alert, non ritrovamenti documentati.',
    limitations='Non contiene singole osservazioni con specie, luogo e data dell’uscita. Escluso dal dataset delle presenze e delle ricerche a vuoto.',
    license='Copyright del sito; sola sintesi fattuale',attribution='Redazione FungoCenter, fonte collegata')
rows.append({'id':'editorial-fungocenter-20261012','data':r})

out=dict(schemaVersion=1,collectedOn=TODAY,records=rows,coverage=coverage)
(ROOT/'worker/external-observations-seed.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(records=len(rows),sources=sorted({r['data']['sourceType'] for r in rows}),accepted=sum(r['data']['reviewStatus']=='accepted' for r in rows),zoneMatched=[{'id':r['id'],'zoneId':r['data']['zoneId'],'taxonId':r['data']['taxonId'],'quality':r['data']['quality']} for r in rows if r['data']['zoneId']]),ensure_ascii=False))
