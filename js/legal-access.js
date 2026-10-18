import {communityRequest,currentUser} from './community.js';
export const LEGAL_KEY='fungaroli:legal-accepted',RECEIPT_KEY='fungaroli:legal-acceptance:v1';
let version='',receipt=null,fingerprint=Promise.resolve(''),synced=new Set(),syncing=new Set();
const platform=()=>navigator.standalone===true||matchMedia('(display-mode: standalone)').matches?'standalone':'browser';
function storedReceipt(){
 try{
  if(localStorage.getItem(LEGAL_KEY)!==version)return null;
  const saved=JSON.parse(localStorage.getItem(RECEIPT_KEY)||'null');
  if(saved?.version===version&&['explicit','legacy'].includes(saved.source)&&(saved.source==='legacy'?saved.acceptedAt===null:typeof saved.acceptedAt==='string'&&Number.isFinite(Date.parse(saved.acceptedAt))))return saved;
  // Non inventare una data per conferme registrate dalle versioni precedenti.
  return {version,acceptedAt:null,source:'legacy',platform:platform()};
 }catch{return null;}
}
function persist(){
 try{localStorage.setItem(RECEIPT_KEY,JSON.stringify(receipt));localStorage.setItem(LEGAL_KEY,version);return true;}catch{return false;}
}
function setAccess(allowed){
 document.body.toggleAttribute('data-legal-pending',!allowed);
 document.querySelectorAll('body > .appbar,body > .tabbar,#views').forEach(el=>el.inert=!allowed);
 const loading=document.getElementById('legal-loading');if(loading)loading.hidden=allowed;
 dispatchEvent(new CustomEvent('fronda:legal-access',{detail:{accepted:allowed}}));
}
export async function configureLegalAccess(value,hash){
 version=value;fingerprint=hash;receipt=null;setAccess(false);
 const saved=storedReceipt(),noticeHash=await fingerprint;
 if(saved&&(!saved.noticeHash||saved.noticeHash===noticeHash)){
  receipt={...saved,noticeHash};persist();setAccess(true);syncAcceptance();
 }
 return !!receipt;
}
export async function acceptLegalNotice(){
 const noticeHash=await fingerprint;
 receipt={version,noticeHash,acceptedAt:new Date().toISOString(),source:'explicit',platform:platform()};
 const persisted=persist();setAccess(true);syncAcceptance();return {receipt,persisted};
}
export const hasLegalAcceptance=()=>!!receipt;
async function syncAcceptance(){
 const user=currentUser(),saved=receipt;
 if(!user||!saved?.noticeHash)return;
 const key=`${user.id}/${saved.version}/${saved.noticeHash}`;
 if(synced.has(key)||syncing.has(key))return;
 syncing.add(key);
 try{await communityRequest('legal-acceptance','POST',{...saved,accountId:user.id});synced.add(key);}catch{/* Riprova al prossimo aggiornamento della sessione; la conferma locale rimane valida. */}
 finally{syncing.delete(key);}
}
document.addEventListener('fungaroli:community',syncAcceptance);
addEventListener('storage',async event=>{
 if(!version||![LEGAL_KEY,RECEIPT_KEY].includes(event.key)&&event.key!==null)return;
 const currentVersion=version,saved=storedReceipt(),noticeHash=await fingerprint;
 if(version!==currentVersion)return;
 receipt=saved&&(!saved.noticeHash||saved.noticeHash===noticeHash)?{...saved,noticeHash}:null;
 setAccess(!!receipt);
 if(!receipt)dispatchEvent(new Event('fronda:legal-required'));else syncAcceptance();
});
