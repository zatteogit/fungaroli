import schema from '../migrations/0018_app_feedback.sql';
import {validateFeedback,FEEDBACK_RETENTION_DAYS} from '../js/feedback-schema.js';
import {rateSubject} from './survey.js';
const initialized=new WeakMap(),enc=new TextEncoder();
const fail=(message,status)=>{throw Object.assign(new Error(message),{status});};
const hash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value)))].map(v=>v.toString(16).padStart(2,'0')).join('');
const response=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
async function init(db){
 if(!db)fail('Il feedback non è disponibile in questo momento. Riprova più tardi.',503);
 if(!initialized.has(db))initialized.set(db,(async()=>{
  await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
  await db.prepare("INSERT INTO feedback_meta(key,value) VALUES('salt',?) ON CONFLICT(key) DO NOTHING").bind(crypto.randomUUID()+crypto.randomUUID()).run();
 })().catch(e=>{initialized.delete(db);throw e;}));
 await initialized.get(db);
}
async function readBody(request){
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')fail('Serve una richiesta JSON.',415);
 const reader=request.body?.getReader();if(!reader)fail('Messaggio mancante.',422);
 const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12000){await reader.cancel();fail('Il messaggio è troppo lungo.',413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{fail('Messaggio non valido.',422);}
}
export async function handleFeedback(request,env,now=Date.now()){
 try{
  if(new URL(request.url).pathname!=='/api/feedback/v1/messages')fail('Percorso non disponibile.',404);
  if(request.method!=='POST')fail('Metodo non consentito.',405);
  if(request.headers.get('origin')!==(env.APP_ORIGIN||new URL(request.url).origin))fail('Origine non autorizzata.',403);
  const value=validateFeedback(await readBody(request)),db=env.COMMUNITY_DB;
  await init(db);await cleanupFeedback(env,now);
  const fingerprint=await hash(JSON.stringify(value)),existing=await db.prepare('SELECT submission_hash FROM app_feedback WHERE id=?').bind(value.id).first();
  if(existing){if(existing.submission_hash!==fingerprint)fail('Il messaggio è cambiato: riaprilo e riprova.',409);return response({ok:true,id:value.id},201);}
  const salt=await db.prepare("SELECT value FROM feedback_meta WHERE key='salt'").first('value');
  const hour=Math.floor(now/36e5),day=Math.floor(now/864e5),key=await hash(salt+'|'+rateSubject(request.headers.get('CF-Connecting-IP'))+'|'+hour),total='total:'+day;
  const count=(k,expires)=>db.prepare('INSERT INTO feedback_rate(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').bind(k,expires);
  await db.batch([count(key,(hour+1)*36e5),db.prepare('INSERT INTO feedback_rate(key,count,expires_at) SELECT ?,1,? WHERE (SELECT count FROM feedback_rate WHERE key=?)<=20 ON CONFLICT(key) DO UPDATE SET count=count+1').bind(total,(day+1)*864e5,key),db.prepare('INSERT INTO app_feedback(id,type,message,context,submission_hash,created_at) SELECT ?,?,?,?,?,? WHERE (SELECT count FROM feedback_rate WHERE key=?)<=20 AND (SELECT count FROM feedback_rate WHERE key=?)<=200 ON CONFLICT(id) DO NOTHING').bind(value.id,value.type,value.message,value.context?JSON.stringify(value.context):null,fingerprint,now,key,total)]);
  const saved=await db.prepare('SELECT submission_hash FROM app_feedback WHERE id=?').bind(value.id).first();
  if(!saved)fail('Sono arrivati molti messaggi. Conserva il testo e riprova più tardi.',429);
  if(saved.submission_hash!==fingerprint)fail('Il messaggio è cambiato: riaprilo e riprova.',409);
  return response({ok:true,id:value.id},201);
 }catch(e){return response({error:e.status?e.message:'Non riesco a salvare il feedback. Il testo resta nel modulo: riprova.'},e.status||503);}
}
export async function cleanupFeedback(env,now=Date.now()){
 const db=env.COMMUNITY_DB;if(!db||!await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='app_feedback'").first())return;
 await db.batch([db.prepare('DELETE FROM app_feedback WHERE created_at<?').bind(now-FEEDBACK_RETENTION_DAYS*864e5),db.prepare('DELETE FROM feedback_rate WHERE expires_at<=?').bind(now)]);
}
// Chiamate esclusivamente dopo permit(actor,'admin') nel router CMS.
export async function listFeedback(db,{before=null}={},now=Date.now()){
 await init(db);await cleanupFeedback({COMMUNITY_DB:db},now);
 const cursor=before===null?null:/^(\d{1,16}):([0-9a-f-]{36})$/.exec(before);
 if(before!==null&&!cursor)fail('Pagina non valida.',422);
 const query='SELECT id,type,message,context,created_at AS createdAt,status FROM app_feedback';
 const rows=(await (cursor?db.prepare(query+' WHERE created_at<? OR (created_at=? AND id<?) ORDER BY created_at DESC,id DESC LIMIT 51').bind(Number(cursor[1]),Number(cursor[1]),cursor[2]):db.prepare(query+' ORDER BY created_at DESC,id DESC LIMIT 51')).all()).results;
 return {items:rows.slice(0,50).map(r=>({...r,context:r.context?JSON.parse(r.context):null})),nextBefore:rows.length>50?rows[49].createdAt+':'+rows[49].id:null};
}
export async function manageFeedback(db,id,method,now=Date.now()){
 await init(db);if(!/^[0-9a-f-]{36}$/.test(id))fail('Messaggio non valido.',422);
 const result=await (method==='DELETE'?db.prepare('DELETE FROM app_feedback WHERE id=?'):db.prepare("UPDATE app_feedback SET status='read' WHERE id=?")).bind(id).run();
 if(!result.meta.changes)fail('Messaggio non trovato.',404);
 return {ok:true};
}
