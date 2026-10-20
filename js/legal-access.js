import {communityRequest,currentUser} from './community.js';
export const LEGAL_KEY='fungaroli:legal-accepted',RECEIPT_KEY='fungaroli:legal-acceptance:v1';
let version='',compatibleVersions=[],receipt=null,fingerprint=Promise.resolve(''),synced=new Set(),syncing=new Set();
const platform=()=>navigator.standalone===true||matchMedia('(display-mode: standalone)').matches?'standalone':'browser';
function storedReceipt(){
 try{
  const key=localStorage.getItem(LEGAL_KEY);if(key!==version&&!compatibleVersions.includes(key))return null;
  const saved=JSON.parse(localStorage.getItem(RECEIPT_KEY)||'null');
  if(saved&&(saved.acceptanceVersion===version||saved.version===key)&&['explicit','legacy'].includes(saved.source)&&(saved.source==='legacy'?saved.acceptedAt===null:typeof saved.acceptedAt==='string'&&Number.isFinite(Date.parse(saved.acceptedAt))))return {...saved,acceptanceVersion:version};
  // Solo il vecchio marcatore compatibile: conserva la mancanza di data/impronta.
  if(compatibleVersions.includes(key))return {version:key,acceptanceVersion:version,acceptedAt:null,noticeHash:null,source:'legacy',platform:platform()};
  return null;
 }catch{return null;}
}

function persist(){
 try{localStorage.setItem(RECEIPT_KEY,JSON.stringify(receipt));localStorage.setItem(LEGAL_KEY,version);return true;}catch{return false;}
}
function setAccess(allowed){
 document.body.toggleAttribute('data-legal-pending',!allowed);
 document.querySelectorAll('body > .appbar,body > .tabbar,#views').forEach(el=>el.inert=!allowed);
 const loading=document.getElementById('legal-loading');if(loading)loading.hidden=allowed&&loading.dataset.ready==='true';
 dispatchEvent(new CustomEvent('fronda:legal-access',{detail:{accepted:allowed}}));
}
export async function configureLegalAccess(value,hash,options={}){
 version=value;compatibleVersions=options.compatibleVersions||[];fingerprint=hash;receipt=null;setAccess(false);
 const saved=storedReceipt();await fingerprint;
 if(saved){receipt=saved;persist();setAccess(true);syncAcceptance();}
 return !!receipt;
}

export async function acceptLegalNotice(){
 const noticeHash=await fingerprint;
 receipt={version,acceptanceVersion:version,noticeHash,acceptedAt:new Date().toISOString(),source:'explicit',platform:platform()};
 const persisted=persist();setAccess(true);syncAcceptance();return {receipt,persisted};
}
export const hasLegalAcceptance=()=>!!receipt;
async function syncAcceptance(){
 const user=currentUser(),saved=receipt;
 if(!user||!saved?.noticeHash)return;
 const key=`${user.id}/${saved.version}/${saved.noticeHash}`;
 if(synced.has(key)||syncing.has(key))return;
 syncing.add(key);
 try{const{acceptanceVersion,...proof}=saved;await communityRequest('legal-acceptance','POST',{...proof,accountId:user.id});synced.add(key);}catch{/* Riprova al prossimo aggiornamento della sessione; la conferma locale rimane valida. */}
 finally{syncing.delete(key);}
}
document.addEventListener('fungaroli:community',syncAcceptance);
addEventListener('storage',async event=>{
 if(!version||![LEGAL_KEY,RECEIPT_KEY].includes(event.key)&&event.key!==null)return;
 const currentVersion=version,saved=storedReceipt(),noticeHash=await fingerprint;
 if(version!==currentVersion)return;
 receipt=saved;
 setAccess(!!receipt);
 if(!receipt)dispatchEvent(new Event('fronda:legal-required'));else syncAcceptance();
});

addEventListener('fronda:boot-ready',()=>{const loading=document.getElementById('legal-loading');if(loading){loading.dataset.ready='true';loading.hidden=!!receipt;}});
