// Profilo meteo di crescita condiviso da Worker e browser: la richiesta deve essere identica
// nei due posti, perché il Worker accetta solo le query che conosce.
// et0_fao_evapotranspiration (ET₀ di riferimento FAO-56, mm/giorno; Open-Meteo, CC BY 4.0) è solo registrata,
// come lo strato 9–27 cm: finisce nella serie e nelle previsioni datate del Taccuino, non nell'indice (decisione D2).
export const GROWTH_DAILY='precipitation_sum,temperature_2m_mean,temperature_2m_min,temperature_2m_max,et0_fao_evapotranspiration';
// Strati orari del suolo (Open-Meteo, modelli best match). soil_moisture_9_to_27cm è solo registrato:
// finisce nella serie e nelle previsioni datate del Taccuino, non nell'indice.
export const GROWTH_SOIL_HOURLY=['soil_moisture_3_to_9cm','soil_temperature_6cm','soil_moisture_9_to_27cm'];
export const GROWTH_HOURLY=GROWTH_SOIL_HOURLY.join(',');
// Richiesta delle pagine aperte con la versione in produzione (fino a v82: senza strato 9–27 cm e senza ET₀):
// il Worker continua ad accettarla, così una scheda già aperta non riceve un errore dopo il rilascio.
export const LEGACY_GROWTH_DAILY='precipitation_sum,temperature_2m_mean,temperature_2m_min,temperature_2m_max';
export const LEGACY_GROWTH_HOURLY='soil_moisture_3_to_9cm,soil_temperature_6cm';
// Umidità del suolo: frazione di volume (m³/m³), valida solo tra 0 e 1. Un valore fuori intervallo è un dato
// non valido e vale null, sia ora per ora sia nelle medie giornaliere compatte (Worker, KV, localStorage).
export const SOIL_FRACTION_HOURLY=new Set(['soil_moisture_3_to_9cm','soil_moisture_9_to_27cm']);
export const soilFraction=v=>Number.isFinite(v)&&v>=0&&v<=1?v:null;

// Shared daily soil aggregation for server responses and local snapshots.
// Ogni strato orario presente diventa `<nome>_mean`; uno strato assente (copie e risposte
// precedenti) resta assente, senza errori: chi legge lo tratta come dato mancante.
export function compactGrowth(rows) {
  let reference=null,ranges;
  return rows.map(row=>{
    const h=row.hourly;
    if(!h?.time)return row;
    if(!reference||h.time.length!==reference.length||!h.time.every((t,i)=>t===reference[i])) {
      reference=h.time;ranges=new Map();
      h.time.forEach((t,i)=>{const day=t.slice(0,10);if(!ranges.has(day))ranges.set(day,[]);ranges.get(day).push(i);});
    }
    // stesso controllo della via oraria di toDaily: per l'umidità contano solo i valori tra 0 e 1
    const mean=key=>row.daily.time.map(day=>{
      const ok=SOIL_FRACTION_HOURLY.has(key)?v=>soilFraction(v)!==null:Number.isFinite;
      let sum=0,count=0;for(const i of ranges.get(day)||[])if(ok(h[key][i])){sum+=h[key][i];count++;}
      return count>=24?sum/count:null;
    });
    const {hourly,...rest}=row;
    const means=Object.fromEntries(GROWTH_SOIL_HOURLY.filter(key=>Array.isArray(h[key])).map(key=>[`${key}_mean`,mean(key)]));
    return {...rest,daily:{...row.daily,...means}};
  });
}
