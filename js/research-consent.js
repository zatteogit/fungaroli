// Consenso alla ricerca (D4, decisioni di Matteo del 16 e del 24/10/2026): una casella nel profilo, separata dalla
// condivisione, spenta all'inizio e revocabile. Copre solo ciò che il profilo condivide, mai gli appunti privati.
export const RESEARCH_CONSENT_VERSION='fronda-research-v1';
export const RESEARCH_CONSENT_TEXT='Usa le mie osservazioni condivise anche per verificare e migliorare l’indice. Vale per segnalazioni e appunti che scegli di condividere: specie, zona, giorno, esito e sforzo, mai testo, foto o posizione. Gli appunti privati restano fuori. Puoi toglierlo quando vuoi: da quel momento le tue osservazioni non entrano più nelle nuove analisi.';
// Il servizio deve aver restituito lo stato: un campo assente non prova che manchi una scelta.
export const needsResearchChoice=research=>!!research&&research.version!==RESEARCH_CONSENT_VERSION;
export function researchState(row){
 return row?{granted:!!row.granted,version:row.version,since:Number.isFinite(row.recorded_at)?new Date(row.recorded_at).toISOString():null}:{granted:false,version:null,since:null};
}
