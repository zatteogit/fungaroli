// Studio UX: scenari sintetici. Non carica né modifica dati personali o previsioni.
import {CLASSES} from '../../js/model.js';
import {conditionsScore} from '../../js/outing.js';
const favourable=CLASSES.find(c=>c.shortLabel==='Buone').min;
const fair=CLASSES.find(c=>c.shortLabel==='Discrete').min;
export const places=[
 {id:'vallonina',name:'Vallonina',area:'Valle del Velino',photo:'assets/zones/vallonina.webp'},
 {id:'tancia',name:'Monte Tancia',area:'Sabina',photo:'assets/zones/tancia.webp'},
 {id:'antrodoco',name:'Antrodoco',area:'Valle del Velino',photo:'assets/zones/antrodoco.webp'}
];
const wx=(level='ok')=>({available:level!=='non_disponibile',level});
const candidate=(index,growth=80,level='ok',extra={})=>({...places[index],weather:wx(level),growth,eligible:true,inScope:true,timing:true,modeled:true,trail:true,...extra});
const next=(extra={})=>candidate(0,83,'ok',{offset:1,...extra});
export const scenarios=[
 {id:'low',label:'Condizioni basse ovunque',reason:'Nessun punteggio raggiunge la classe favorevole. Niente hero né alternative deboli.',rows:[candidate(0,8),candidate(1,20),candidate(2,32)],future:[next()]},
 {id:'rain',label:'Maltempo ovunque',reason:'Il meteo sconsigliato esclude le proposte anche con alto potenziale fungino.',rain:true,rows:[candidate(0,90,'sconsigliata'),candidate(1,85,'sconsigliata')],future:[next()]},
 {id:'none-next',label:'Nessuna finestra nei prossimi giorni',reason:'Niente data inventata e nessun ripiego su una card bassa. Il giorno futuro resta sconosciuto.',rain:true,rows:[candidate(0,90,'sconsigliata')],future:[next({weather:wx('ok'),growth:20}),next({offset:2,weather:wx('sconsigliata')})]},
 {id:'good',label:'Più uscite favorevoli',reason:'Una proposta principale e solo altre uscite che superano gli stessi criteri.',rows:[candidate(0,83),candidate(1,72),candidate(2,12)],future:[]},
 {id:'single',label:'Una sola uscita favorevole',reason:'Una card principale. Nessuna sezione “Altre uscite” da riempire.',rows:[candidate(0,83),candidate(1,22)],future:[]},
 {id:'fair',label:'Solo condizioni discrete o incerte',reason:'Le proposte da valutare compaiono solo su richiesta, con etichetta esplicita e formato compatto.',rows:[candidate(0,53),candidate(1,80,'attenzione')],future:[next()]},
 {id:'missing',label:'Meteo o indice mancanti',reason:'Non valutabile è diverso da sfavorevole. Nessun indice sostitutivo né numero vecchio.',rows:[candidate(0,null,'non_disponibile'),candidate(1,null)],future:[]},
 {id:'partial',label:'Copertura parziale',reason:'Le proposte verificabili restano visibili; le altre non vengono messe in graduatoria.',rows:[candidate(0,81),candidate(1,90,'non_disponibile')],future:[]},
 {id:'filters',label:'Filtri senza risultati',reason:'L’assenza riguarda i filtri attivi. Non equivale a condizioni sfavorevoli in tutto il Lazio.',rows:[candidate(0,90,'ok',{inScope:false})],future:[next({inScope:false})]},
 {id:'closed',label:'Accessi o attività non proponibili',reason:'Vincoli documentati e accessi non idonei prevalgono su meteo e indice.',rows:[candidate(0,95,'ok',{eligible:false})],future:[next({eligible:false})]},
 {id:'late',label:'Troppo tardi per partire oggi',reason:'La finestra utile di partenza è passata. Il luogo non diventa meteorologicamente sfavorevole.',rows:[candidate(0,90,'ok',{timing:false})],future:[next()]},
 {id:'unsupported',label:'Specie senza modello',reason:'Nessun punteggio fittizio per completare una scheda. L’esplorazione resta disponibile.',rows:[candidate(0,null,'ok',{modeled:false})],future:[]},
 {id:'walking',label:'Solo sentieri',intent:'walking',reason:'L’indice fungino non decide se proporre una passeggiata. Servono comunque percorso e meteo valutabili.',rows:[candidate(0,8),candidate(1,15)],future:[]},
 {id:'plants',label:'Solo piante',intent:'plants',reason:'Proposta di osservazione botanica senza indice fungino. Nessuna presenza locale dedotta.',rows:[candidate(0,8),candidate(1,15)],future:[]},
 {id:'browse',label:'Nessun interesse selezionato',intent:'browse',reason:'Si esplorano luoghi e attività senza ereditare il filtro delle condizioni fungine.',rows:[candidate(0,8)],future:[]},
 {id:'loading',label:'Caricamento iniziale',loading:true,reason:'Prima che la valutazione finisca non si dichiara l’assenza di proposte.',rows:[],future:[]},
 {id:'community',label:'Filtro community non verificabile',communityUnavailable:true,reason:'Il servizio non disponibile non significa zero osservazioni. L’esplorazione editoriale resta indipendente.',rows:[],future:[]},
 {id:'future',label:'Giorno futuro selezionato',selectedOffset:2,reason:'La scelta del giorno resta esplicita: niente sostituzione silenziosa con un’altra data.',rows:[candidate(0,10),candidate(1,23)],future:[next({offset:3})]}
];
const assessed=c=>({...c,score:conditionsScore(c.growth,c.weather)});
const usable=c=>c.eligible&&c.inScope&&c.timing;
const good=(c,intent)=>c.weather?.available&&c.weather.level==='ok'&&(intent!=='fungi'?c.trail:Number.isFinite(c.score)&&c.score>=favourable&&c.modeled);
export function composeHome(input){
 const intent=input.intent||'fungi',rows=(input.rows||[]).map(assessed),scope=rows.filter(c=>c.inScope),allowed=scope.filter(c=>c.eligible),timely=allowed.filter(c=>c.timing);
 const ready=timely.filter(c=>good(c,intent)).sort((a,b)=>intent==='fungi'?(b.score??0)-(a.score??0):0);
 const review=timely.filter(c=>c.weather.available&&['ok','attenzione'].includes(c.weather.level)&&(intent!=='fungi'?c.trail:c.modeled&&Number.isFinite(c.score)&&c.score>=fair)&&!ready.includes(c));
 let state='low';
 if(input.loading)state='loading';
 else if(input.communityUnavailable)state='community';
 else if(!scope.length)state='filters';
 else if(!allowed.length)state='closed';
 else if(!timely.length)state='late';
 else if(ready.length)state='ready';
 else if(review.length)state='review';
 else if(timely.some(c=>!c.weather.available))state='unknown';
 else if(intent==='fungi'&&timely.every(c=>!c.modeled))state='unsupported';
 else if(timely.some(c=>c.weather.level!=='sconsigliata'&&!Number.isFinite(c.score))&&intent==='fungi')state='unknown';
 else if(timely.every(c=>c.weather.level==='sconsigliata'))state='weather';
 const next=(input.future||[]).map(assessed).filter(c=>usable(c)&&c.offset>(input.selectedOffset||0)&&c.offset<=7&&good(c,intent)).sort((a,b)=>a.offset-b.offset||(intent==='fungi'?(b.score??0)-(a.score??0):0))[0]||null;
 return {state,intent,ready,review,next:!['ready','loading','community','filters','closed','unsupported'].includes(state)?next:null,partial:state==='ready'&&timely.some(c=>!c.weather.available||intent==='fungi'&&!Number.isFinite(c.score)),rain:!!input.rain,selectedOffset:input.selectedOffset||0};
}
