export const FEEDBACK_TYPES={commento:'Come mi sono trovato',problema:'Un problema',idea:'Un’idea'};
export const FEEDBACK_PAGES=['Uscite','Mappa','Scopri','Funghi','Piante','Alberi','Animali','Confronto','Riconoscimento','Taccuino','Informazioni','Altra pagina'];
export const FEEDBACK_RETENTION_DAYS=90;
export const FEEDBACK_PRIVACY='Il messaggio arriva privatamente a Matteo Sgambato, gestore di Fronda, e viene conservato per 90 giorni, poi eliminato con la pulizia giornaliera successiva. Non chiediamo nome o email e non lo colleghiamo al profilo. Non inserire dati personali o la posizione precisa dei tuoi ritrovamenti. Pagina e versione sono facoltative; non alleghiamo foto, appunti, coordinate GPS o dati del dispositivo.';
export function feedbackContext(hash,version){
 const section=String(hash||'#/').split('/')[1];
 const page=({uscite:'Uscite','':'Uscite',mappa:'Mappa',scopri:'Scopri',specie:'Funghi',fungo:'Funghi',commestibile:'Funghi',piante:'Piante',pianta:'Piante',alberi:'Alberi',albero:'Alberi',animali:'Animali',animale:'Animali',confronta:'Confronto',riconosci:'Riconoscimento',diario:'Taccuino',info:'Informazioni',zona:'Uscite'})[section]||'Altra pagina';
 return {page,version:/^fungaroli-shell-v\d+$/.test(version||'')?version:'non disponibile'};
}
export function validateFeedback(body){
 const bad=()=>{throw Object.assign(new Error('Controlla il tipo e scrivi un messaggio da 5 a 2000 caratteri.'),{status:422});};
 if(!body||Array.isArray(body)||typeof body!=='object'||Object.keys(body).some(k=>!['id','type','message','context'].includes(k)))bad();
 if(typeof body.id!=='string'||typeof body.type!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(body.id||'')||!Object.hasOwn(FEEDBACK_TYPES,body.type)||typeof body.message!=='string'||body.message.trim().length<5||body.message.length>2000)bad();
 let context=null;
 if(body.context!=null){const c=body.context;if(typeof c!=='object'||Array.isArray(c)||Object.keys(c).some(k=>!['page','version'].includes(k))||!FEEDBACK_PAGES.includes(c.page)||typeof c.version!=='string'||!(/^(fungaroli-shell-v\d+|non disponibile)$/.test(c.version||''))||c.version.length>40)bad();context={page:c.page,version:c.version};}
 return {id:body.id,type:body.type,message:body.message.trim(),context};
}
