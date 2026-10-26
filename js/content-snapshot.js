const URL='/api/content/v1/snapshot',CACHE='fungaroli-content-v1',LEGACY='fungaroli:content:v1';
export const completeSnapshot=s=>s?.schemaVersion===1&&s.resources?.legal?.version>=5&&['zones','habitat','species-traits','edible-catalog','guides','legal'].every(id=>s.resources[id]);
// La copia pubblica è una generazione coerente. Si rinnova per l'apertura successiva,
// senza cambiare cataloghi, filtri o testi sotto gli occhi di chi sta usando l'app.
export async function loadContentSnapshot({onUpdate}={}){
 let cached=null;
 const save=async value=>{try{await(await caches.open(CACHE)).put(URL,new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}}));localStorage.removeItem(LEGACY);}catch{/* la copia ricevuta resta in memoria */}};
 try{const response=await(await caches.open(CACHE)).match(URL);if(response){const value=await response.json();if(completeSnapshot(value))cached=value;}}catch{/* cache facoltativa */}
 if(!cached)try{const value=JSON.parse(localStorage.getItem(LEGACY)||'null');if(completeSnapshot(value)){cached=value;void save(value);}}catch{/* vecchia copia assente */}
 const update=(async()=>{
  try{const response=await fetch(URL,{cache:'no-cache',signal:AbortSignal.timeout(7000)});if(response.ok){const value=await response.json();if(completeSnapshot(value)){void save(value);if(cached)onUpdate?.(value);return value;}}}catch{/* conserva la copia */}
  return null;
 })();
 return cached||await update;
}
