// Shared resource descriptions used by the human editor and the agent API.
export const CONTENT_SCHEMA_VERSION = 1;
export const CONTENT_RESOURCES = [
  {id:'species-traits',title:'Specie e sosia',group:'Specie',collections:['taxa'],required:['taxa','vocabulary']},
  {id:'edible-catalog',title:'Catalogo dei commestibili',group:'Specie',collections:['species'],required:['species']},
  {id:'species-id',title:'Schede delle specie modellate',group:'Specie',collections:['species'],required:['species']},
  {id:'trees',title:'Alberi',group:'Bosco',collections:['trees'],required:['trees']},
  {id:'guides',title:'Articoli e taccuini',group:'Redazione',collections:['guides'],required:['guides']},
  {id:'glossary',title:'Glossario e legenda',group:'Impara',collections:['terms'],required:['terms']},
  {id:'ui-copy',title:'Testi della home',group:'Redazione',collections:[],required:['homeTitle','homeIntro']},
  {id:'zones',title:'Luoghi e microzone',group:'Luoghi',collections:['zones'],required:['zones','origin']},
  {id:'trails',title:'Sentieri',group:'Luoghi',collections:['zones'],required:['zones']},
  {id:'trailheads',title:'Imbocchi mappati',group:'Dati generati',collections:['zones'],required:['zones'],readonly:true},
  {id:'access',title:'Percorsi di accesso',group:'Dati generati',collections:['zones'],required:['zones'],readonly:true},
  {id:'habitat',title:'Campioni del bosco',group:'Dati generati',collections:['zones'],required:['zones'],readonly:true},
  {id:'media',title:'Foto di funghi e sosia',group:'Immagini',collections:['species','lookalikes'],required:['species']},
  {id:'media-zones',title:'Foto dei luoghi',group:'Immagini',collections:['zones'],required:['zones']},
  {id:'media-trees',title:'Foto degli alberi',group:'Immagini',collections:['trees'],required:['trees']},
  {id:'infografiche',title:'Infografiche',group:'Immagini',collections:['species'],required:['species']},
  {id:'preparation',title:'Preparazione e cucina',group:'Informazioni',collections:['general','species','cucina'],required:['general','species']},
  {id:'legal',title:'Regole e avvisi',group:'Informazioni',collections:['info_sections'],required:['version','onboarding','info_sections']},
];
export const resourceOf = id => CONTENT_RESOURCES.find(r => r.id === id);
export const CONTENT_TEMPLATES = {
  guides:{id:'',category:'',title:'',excerpt:'',body:''},
  glossary:{id:'',term:'',category:'Bosco',aliases:[],definition:'',observe:'',related:[],sources:[]},
  'edible-catalog':{id:'',name:'',latin:'',toxicity:'da verificare',aliases:[],months:null,description:'',caution:'',sources:[]},
  'species-traits':{name:'',latin:'',toxicity:'da verificare',caution:'',traits:{season:[]},sources:[]},
  infografiche:{file:'',alt:'',author:'',license:'',page:''},
};
export const isLockedField = key => ['samples','lines','line','sample_categories','in_zone_km','total_km','duration','ascent','generated','source'].includes(key);
export const FIELD_LABELS = {
  guides:'Articoli',taxa:'Specie e sosia',species:'Specie',zones:'Luoghi',trees:'Alberi',
  terms:'Voci del glossario',term:'Parola',definition:'Definizione',observe:'Cosa osservare',related:'Voci collegate',
  info_sections:'Sezioni informative',general:'Indicazioni generali',cucina:'Cucina',lookalikes:'Sosia',trails:'Tracciati',
  version:'Versione degli avvisi',verified_on:'Data della verifica',vocabulary:'Vocabolario dei caratteri',
  name:'Nome',latin:'Nome scientifico',title:'Titolo',subtitle:'Sottotitolo',description:'Descrizione',
  excerpt:'Introduzione',body:'Testo dell’articolo',html:'Testo formattato',category:'Categoria',
  aliases:'Altri nomi',aka:'Altri nomi',toxicity:'Commestibilità',caution:'Cautele',warning:'Avvertenza',
  traits:'Caratteri',months:'Mesi della stagione',season:'Stagione',sources:'Fonti',source:'Provenienza',
  file:'File immagine',file_hd:'Immagine grande',thumb:'Miniatura',author:'Autore',license:'Licenza',
  page:'Pagina della fonte',alt:'Testo alternativo',caption:'Didascalia',id:'Identificativo',
  lat:'Latitudine',lon:'Longitudine',parking:'Soste',access:'Accesso',protection:'Tutela e regole locali',
  ref:'Segnavia',operator:'Gestore',difficulty:'Difficoltà',editorialNote:'Nota della redazione',group:'Gruppo',
  homeTitle:'Titolo della home',homeIntro:'Introduzione della home',otherPlacesTitle:'Titolo degli altri luoghi',
  speciesTitle:'Titolo delle specie',editorialEyebrow:'Etichetta dei taccuini',editorialTitle:'Titolo dei taccuini',
  communityEyebrow:'Etichetta della community',communityTitle:'Titolo della community',
  communityIntro:'Introduzione della community',indexExplanation:'Spiegazione delle condizioni',
};
