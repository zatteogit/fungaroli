// A source-informed experimental decision index, not a harvest probability.
// Numerical weights express ranking policy; no borrowed cultivar GDD thresholds.
export const BOTANICAL_VERSION='1.0.0';
const clamp=v=>Math.max(0,Math.min(1,v));
export function botanicalModels(data,plants){
 return Object.entries(data?.models||{}).flatMap(([key,m])=>{
  const p=plants?.plants?.[m.plantId];if(!p||p.category==='Pericolose'||p.foodUse?.status!=='solo parti e preparazioni indicate'||m.enabled===false)return [];
  return [{...m,id:key,kind:'plant',name:p.name,latin:p.latin,group:m.group||m.plantId,href:`#/pianta/${m.plantId}`,caution:p.foodUse.caution,parts:p.foodUse.parts,plantHabitat:p.habitat,photos:p.photos,months:Array.from({length:12},(_,i)=>m.phaseMonths?.includes(i+1)?1:0),elev:m.elevationRange||[0,2500],forest:m.landscapeAffinity||{},evidence:m.methodNote}];
 });
}
export function recentBotanicalObservation(entries,plantId,zoneId,date,phase,maxDays=14){
 const latest=entries.filter(e=>e.kind==='note'&&e.zoneId===zoneId&&e.observation?.taxonId===plantId&&e.date<=date&&e.observation.phases?.some(p=>p.code===phase&&p.status!=='unsure'))
 .sort((a,b)=>b.date.localeCompare(a.date)||String(b.savedAt||'').localeCompare(String(a.savedAt||'')))[0];
 if(!latest)return null;const age=(Date.parse(date+'T12:00:00Z')-Date.parse(latest.date+'T12:00:00Z'))/864e5;
 if(age<0||age>maxDays)return null;
 return {date:latest.date,age,status:latest.observation.phases.find(p=>p.code===phase).status,availability:latest.observation.availability,identification:'unreviewed'};
}
function stats(s,i,key,days){const a=Array.from({length:days},(_,j)=>s?.[key]?.[i-j]);return a.every(Number.isFinite)?{min:Math.min(...a),mean:a.reduce((a,b)=>a+b,0)/days}:null;}
export function scoreBotanical(species,s,i,hab,band,{zoneId,observations=[]}={}){
 const date=s?.dates?.[i],counts={},half=150;let n=0;
 for(const [e,c] of hab?.samples||[])if(Number.isFinite(e)&&Math.abs(e-band)<=half){const cat=c>=0?hab.sample_categories[c]:'non bosco';if(cat){counts[cat]=(counts[cat]||0)+1;n++;}}
 const share=n?Object.entries(counts).reduce((v,[c,k])=>v+k/n*(species.forest[c]||0),0):null;
 // Broad land-cover compatibility is a proxy: it does not measure soil nutrients,
 // margins, species occurrence or ripe fruits. The mapping is an explicit hypothesis.
 const landscape=share==null?null:clamp(share/(species.landscapeSaturation||.45));
 const elev=species.elevationRange?(band>=species.elev[0]&&band<=species.elev[1]?1:clamp(1-Math.min(Math.abs(band-species.elev[0]),Math.abs(band-species.elev[1]))/300)):null;
 const month=Number(date?.slice(5,7));let season=species.phaseMonths?.length?(species.phaseMonths.includes(month)?1:.15):null;
 const fresh=!s?.source?.expired;
 const frost=fresh?stats(s,i,'tmin',3):null,soil=fresh?stats(s,i,'soilm',3):null,temp=fresh?stats(s,i,'tmean',7):null,rain=fresh?stats(s,i,'p',7):null;
 const own=recentBotanicalObservation(observations,species.plantId,zoneId,date,species.phase,species.observationDays||14);
 const fruitDepleted=species.phase==='ripe_fruits'&&own?.availability==='none';
 const calendarSeason=season;
 if(own?.status==='present'&&!fruitDepleted)season=Math.max(season??0,.5*(1-own.age/(species.observationDays||14)));
 const observedSeason=season!==calendarSeason;
 const factors=[{key:'habitat',label:'Paesaggio',value:landscape,weight:2,origin:'hypothesis',text:species.habitatNote},
 {key:'elevation',label:'Quota',value:elev,weight:1,origin:'hypothesis',text:species.elevationRange?`${band} m · intervallo descritto ${species.elev.join('–')} m. ${species.elevationNote||'Da calibrare localmente'}`: 'Intervallo di quota non documentato: non entra nel punteggio'},
 {key:'season',label:species.phaseLabel,value:season,weight:2,origin:observedSeason?'private_unreviewed':species.phaseMonths?.length?(species.calendarOrigin||'source_calendar'):'unknown',text:(species.calendarNote||'Calendario della parte utile non documentato; non viene sostituito dalla fioritura')+(observedSeason?' Il tuo appunto recente sostiene la fase fuori dal calendario: correzione personale sperimentale.':'')}];
 // Freeze exposure is a cautious ranking rule for new leaves, never a mortality
 // threshold. Fruit maturity receives no automatic recent-rain/temperature bonus.
 let climate=null;
 if(species.phase==='young_leaves'&&frost)climate=frost.min<0?.4:1;
 factors.push({key:'climate',label:species.phase==='young_leaves'?'Gelate e foglie nuove':'Meteo e maturazione',value:climate,weight:1,origin:climate==null?'unknown':'hypothesis',text:species.phase==='young_leaves'?(frost?`Minima modellata ${frost.min.toFixed(1)} °C nei 3 giorni: ${frost.min<0?'possibile esposizione al gelo; penalità prudenziale, non soglia di danno della specie':'nessuna esposizione al gelo nella serie'}`:'Temperature minime incomplete'):'Il meteo recente non determina la maturazione: mancano parametri locali per questa fase'});
 if(own)factors.push({key:'observation',label:'Dal tuo taccuino',value:own.status==='present'?(fruitDepleted?.35:1):.3,weight:2*(1-own.age/(species.observationDays||14)),origin:'private_unreviewed',text:`${own.date}: ${own.status==='present'?'fase annotata presente':'cercata, non osservata'}${fruitDepleted?' · nessun frutto maturo rimasto osservato':''} · indizio nella zona, quota e identificazione non verificate${own.status!=='present'||fruitDepleted?'. Una ricerca senza esito o senza frutti rimasti non aumenta l’indice; non prova assenza della specie.':''}`});
 const known=factors.filter(f=>Number.isFinite(f.value)&&f.weight>0),weight=known.reduce((v,f)=>v+f.weight,0);
 const missing=factors.filter(f=>f.value==null).map(f=>f.label);
 const hardMissing=[];if(!n)hardMissing.push('campioni di paesaggio');if(!date)hardMissing.push('data');
 const indexFor=rows=>{const usable=rows.filter(f=>Number.isFinite(f.value)&&f.weight>0),sum=usable.reduce((v,f)=>v+f.weight,0),all=rows.reduce((v,f)=>v+f.weight,0);return hardMissing.length||!sum?null:Math.round(100*clamp(usable.reduce((v,f)=>v+f.value*f.weight,0)/sum)*(.4+.6*sum/all)*(.35+.65*(landscape??.5)));};
 let score=indexFor(factors); // conservative ranking policy, not biological coefficients
 // Better coverage from a non-detection cannot create a positive recommendation.
 if(own&&(own.status!=='present'||fruitDepleted)&&score!=null)score=Math.min(score,indexFor(factors.filter(f=>f.key!=='observation')));
 return {score,kind:'plant',modelVersion:BOTANICAL_VERSION,phase:species.phase,phaseLabel:species.phaseLabel,factors,season,habitat:landscape,suitableShare:share,elev,habitatSamples:n,quality:{climateUnavailable:!fresh,complete:!hardMissing.length,missing:hardMissing,partial:missing,coverage:known.length/factors.length,validation:'sperimentale, non calibrato localmente',usesForecast:i>=(s?.issuedIndex??s?.todayIndex),fetchedAt:s?.source?.fetchedAt||null},ownObservation:own,climateContext:{rain7:rain?rain.mean*7:null,temperature7:temp?.mean??null,soilMoisture3:soil?.mean??null,minTemperature3:frost?.min??null},temp:climate,frost:climate??1,moist:1,rain:1,heat:1,shock:1};
}
