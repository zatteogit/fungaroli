// Intenzione non confermata: soltanto memoria della pagina, mai un consenso sul profilo.
let pending=null;
export function setPilotChoices({share=false,research=false}={},accountId=null){pending=share||research?{share:share===true,research:research===true,accountId}:null;}
export function getPilotChoices(){return pending?{...pending}:null;}
export function clearPilotChoices(){pending=null;}
