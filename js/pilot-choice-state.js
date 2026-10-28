// Intenzione non confermata: soltanto memoria della pagina, mai un consenso sul profilo.
let pending=null;
// La casella «Mi interessa contribuire» è stata tolta il 28/10/2026 (decisione di Matteo): nessuno la leggeva.
export function setPilotChoices({research=false}={},accountId=null){pending=research?{research:research===true,accountId}:null;}
export function getPilotChoices(){return pending?{...pending}:null;}
export function clearPilotChoices(){pending=null;}
