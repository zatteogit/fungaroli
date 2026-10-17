import schema from '../migrations/0002_cms.sql';
import { CONTENT_RESOURCES, CONTENT_SCHEMA_VERSION, resourceOf } from '../js/content-schema.js';
import { readCommunityUser } from './community.js';
import { validateContent } from './content-validation.js';
import {glossaryContextSeedUpdate,repositorySeedUpdate} from './seed-update.js';
import { weatherMetrics } from './weather-metrics.js';

const initialized=new WeakMap(), enc=new TextEncoder();
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
const failure=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const response=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}});
async function json(req) {
  if(!req.headers.get('content-type')?.includes('application/json')) failure('Serve una richiesta JSON.',415);
  const reader=req.body?.getReader(); if(!reader) failure('Richiesta vuota.');
  const chunks=[];let size=0;
  while(true){const{done,value}=await reader.read();if(done)break;size+=value.length;if(size>1500000){await reader.cancel();failure('Documento troppo grande.',413);}chunks.push(value);}
  const buffer=new Uint8Array(size);let i=0;for(const c of chunks){buffer.set(c,i);i+=c.length;}
  try{return JSON.parse(new TextDecoder().decode(buffer));}catch{failure('JSON non valido.');}
}

// Documenti che un deploy aggiorna dal repository finché nessun autore li ha toccati (seed o ultima
// scrittura di una release). Ognuno deve passare validateContent: un errore qui ferma init() e lo snapshot.
export const REPOSITORY_REFRESHED=['ui-copy','plants','trees','media','media-trees','media-zones','species-id','species-traits','edible-catalog','preparation','glossary','guides','legal','media-glossary','trails','zones'];

async function init(env,origin) {
  const db=env.CMS_DB;
  if(!db) failure('La redazione non è configurata.',503);
  if(!initialized.has(db)) initialized.set(db,(async()=>{
    await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
    const known=new Set((await db.prepare('SELECT id FROM cms_documents').all()).results.map(r=>r.id));
    const missing=CONTENT_RESOURCES.filter(r=>!known.has(r.id));
    const seeds=await Promise.all(missing.map(async r=>{
      const res=await env.ASSETS.fetch(new Request(new URL(`/data/${r.id}.json`,origin)));
      if(!res.ok) failure(`Dati iniziali mancanti: ${r.title}.`,503);
      const data=await res.json();
      const value=['guides','legal','glossary','plants','botanical-models'].includes(r.id)?validateContent(r.id,data).value:data;
      return {id:r.id,payload:JSON.stringify(value)};
    }));
    if(seeds.length) await db.batch([
      ...Array.from({length:Math.ceil(seeds.length/20)},(_,i)=>{const batch=seeds.slice(i*20,(i+1)*20);return db.prepare(`INSERT INTO cms_documents(id,draft,published,updated_at,updated_by) VALUES ${batch.map(()=>'(?,?,?,?,?)').join(',')} ON CONFLICT(id) DO NOTHING`).bind(...batch.flatMap(r=>[r.id,r.payload,r.payload,Date.now(),'seed']));}),
      db.prepare('INSERT INTO cms_revisions(document_id,version,payload,created_at,actor) SELECT id,0,draft,updated_at,updated_by FROM cms_documents WHERE version=0 ON CONFLICT(document_id,version) DO NOTHING'),
    ]);
    const baseline=await db.prepare("SELECT id FROM cms_documents WHERE id='glossary' AND draft=published AND ((version=0 AND published_version=0 AND updated_by='seed' AND json_extract(draft,'$.version') IN (1,2)) OR (version=1 AND published_version=1 AND updated_by='release:glossary-illustrations-v2' AND json_extract(draft,'$.version')=2))").first();
    if(baseline){
      const source=await env.ASSETS.fetch(new Request(new URL('/data/glossary.json',origin)));
      if(source.ok){const data=await source.json();if(data.version===3){
        const payload=JSON.stringify(validateContent('glossary',data).value);
        await db.batch(glossaryContextSeedUpdate(db,payload,Date.now(),crypto.randomUUID(),crypto.randomUUID()));
      }}
    }
    const untouched=(await db.prepare("SELECT id,version,published FROM cms_documents WHERE draft=published AND version=published_version AND ((version=0 AND updated_by='seed') OR updated_by LIKE 'release:%')").all()).results.filter(r=>REPOSITORY_REFRESHED.includes(r.id));
    const sources=await Promise.all(untouched.map(async previous=>{
      const source=await env.ASSETS.fetch(new Request(new URL(`/data/${previous.id}.json`,origin)));
      if(!source.ok)failure(`Aggiornamento iniziale mancante: ${previous.id}.`,503);
      return {previous,payload:JSON.stringify(validateContent(previous.id,await source.json()).value)};
    }));
    for(const {previous,payload} of sources)if(previous.published!==payload)
      await db.batch(repositorySeedUpdate(db,previous.id,previous,payload,Date.now(),crypto.randomUUID(),crypto.randomUUID()));
  })().catch(e=>{initialized.delete(db);throw e;}));
  return initialized.get(db);
}

export async function publishedContent(env,origin) {
  if(!env.CMS_DB) return null;
  await init(env,origin);
  const rows=await env.CMS_DB.batch([
    env.CMS_DB.prepare("SELECT value FROM cms_meta WHERE key='release'"),
    env.CMS_DB.prepare('SELECT id,published,published_version FROM cms_documents'),
  ]);
  return {schemaVersion:CONTENT_SCHEMA_VERSION,release:rows[0].results[0].value,
    resources:Object.fromEntries(rows[1].results.map(r=>[r.id,JSON.parse(r.published)])),
    versions:Object.fromEntries(rows[1].results.map(r=>[r.id,r.published_version]))};
}

export async function publishedResources(env,origin,ids,{initialize=true}={}) {
  if(!env.CMS_DB)return null;
  if(initialize)await init(env,origin);
  const rows=await env.CMS_DB.prepare(`SELECT id,published FROM cms_documents WHERE id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all();
  return Object.fromEntries(rows.results.map(r=>[r.id,JSON.parse(r.published)]));
}

async function identity(req,env,now) {
  const auth=req.headers.get('authorization');
  if(auth) {
    if(!/^Bearer cms_[a-f0-9]{64}$/.test(auth)) failure('Credenziale agente non valida.',401);
    const t=await env.CMS_DB.prepare('SELECT * FROM cms_agent_tokens WHERE token_hash=? AND expires_at>? AND revoked_at IS NULL').bind(await hash(auth.slice(7)),now).first();
    if(!t) failure('Credenziale agente scaduta o revocata.',401);
    return {id:'agent:'+t.id,name:t.name,kind:'agent',role:'agent',scopes:JSON.parse(t.scopes),resources:JSON.parse(t.resources)};
  }
  const user=await readCommunityUser(req,env,now);
  if(!user) failure('Accedi con la tua passkey.',401);
  const assigned=key=>(env[key]||'').split(',').map(s=>s.trim()).filter(Boolean).includes(user.id);
  const role=assigned('CMS_ADMIN_IDS')?'admin':assigned('CMS_EDITOR_IDS')?'editor':'member';
  const scopes=role==='admin'?['read','write','publish','review','admin']:role==='editor'?['read','write']:[];
  return {id:user.id,name:user.handle,kind:'human',role,scopes,resources:role==='member'?[]:CONTENT_RESOURCES.map(r=>r.id)};
}
function permit(actor,scope,id) {
  if(!actor.scopes.includes(scope)||id&&!actor.resources.includes(id)) failure('Il tuo profilo non ha questo permesso di redazione.',403);
}
async function rate(db,actor,now) {
  const count=await db.prepare('INSERT INTO cms_rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<? THEN 1 ELSE count+1 END,expires_at=CASE WHEN expires_at<? THEN excluded.expires_at ELSE expires_at END RETURNING count').bind(actor.id,now+60000,now,now).first('count');
  if(count>180) failure('Troppe richieste. Riprova tra un minuto.',429);
}
const etag=version=>`"${version}"`;
async function item(db,id) {if(!resourceOf(id))failure('Contenuto non trovato.',404);return db.prepare('SELECT * FROM cms_documents WHERE id=?').bind(id).first();}
const view=r=>({id:r.id,version:r.version,publishedVersion:r.published_version,data:JSON.parse(r.draft),updatedAt:r.updated_at,updatedBy:r.updated_by});

export async function handleCms(req,env,now=Date.now()) {
  const url=new URL(req.url),path=url.pathname.replace(/^\/api\/cms\/v1\/?/,'');
  try {
    await init(env,url.origin);
    const db=env.CMS_DB,actor=await identity(req,env,now);
    if(!['GET','POST','PATCH','DELETE'].includes(req.method)) failure('Metodo non consentito.',405);
    const origin=req.headers.get('origin'),expected=env.APP_ORIGIN||url.origin;
    if(req.method!=='GET' && (actor.kind==='human'?origin!==expected:origin&&origin!==expected)) failure('Origine non autorizzata.',403);
    if(path==='me'&&req.method==='GET')return response({user:actor,configured:!!(env.CMS_ADMIN_IDS||env.CMS_EDITOR_IDS)});
    permit(actor,'read');await rate(db,actor,now);
    if(path==='schemas'&&req.method==='GET')return response({schemaVersion:CONTENT_SCHEMA_VERSION,resources:CONTENT_RESOURCES.map(r=>({...r,schema:{type:'object',required:r.required,additionalProperties:true}})),operations:['read','write','publish','review'],maxBytes:1500000});
    if(path==='items'&&req.method==='GET') {
      const rows=(await db.prepare('SELECT id,version,published_version,updated_at,updated_by FROM cms_documents').all()).results;
      return response({items:rows.filter(r=>actor.resources.includes(r.id)).map(r=>({...resourceOf(r.id),version:r.version,publishedVersion:r.published_version,updatedAt:r.updated_at})),release:await db.prepare("SELECT value FROM cms_meta WHERE key='release'").first('value')});
    }
    const match=path.match(/^items\/([a-z0-9-]+)(?:\/(validate|revisions|preview))?$/);
    if(match) {
      const[,id,action]=match;permit(actor,'read',id);const row=await item(db,id);
      if(!action&&req.method==='GET')return response(view(row),200,{etag:etag(row.version)});
      if(action==='revisions'&&req.method==='GET')return response({revisions:(await db.prepare('SELECT version,created_at AS createdAt,actor FROM cms_revisions WHERE document_id=? ORDER BY version DESC LIMIT 100').bind(id).all()).results});
      if(action==='preview'&&req.method==='GET') {
        const v=url.searchParams.get('revision');
        const data=v===null?row.draft:await db.prepare('SELECT payload FROM cms_revisions WHERE document_id=? AND version=?').bind(id,Number(v)).first('payload');
        if(!data)failure('Revisione non trovata.',404);return response({id,data:JSON.parse(data)});
      }
      if(action==='validate'&&req.method==='POST') {
        const data=await json(req);const checked=validateContent(id,data.data??data,JSON.parse(row.published));
        return response({valid:true,needsReview:checked.needsReview,data:checked.value,note:'Controlli di struttura e riferimenti: non certificano la correttezza scientifica.'});
      }
      if(!action&&req.method==='PATCH') {
        permit(actor,'write',id);if(resourceOf(id).readonly)failure('Questo documento è generato: si aggiorna dal processo dei dati.',403);
        if(req.headers.get('if-match')!==etag(row.version))failure('La scheda è cambiata. Rileggi e confronta le modifiche.',412);
        const input=await json(req),checked=validateContent(id,input.data,JSON.parse(row.published)),nonce=crypto.randomUUID(),payload=JSON.stringify(checked.value);
        const writes=await db.batch([
          db.prepare('UPDATE cms_documents SET version=version+1,draft=?,write_nonce=?,updated_at=?,updated_by=? WHERE id=? AND version=?').bind(payload,nonce,now,actor.id,id,row.version),
          db.prepare('INSERT INTO cms_revisions(document_id,version,payload,created_at,actor) SELECT id,version,draft,updated_at,updated_by FROM cms_documents WHERE id=? AND write_nonce=?').bind(id,nonce),
          db.prepare("INSERT INTO cms_audit(actor,action,document_id,version,created_at) SELECT updated_by,'draft',id,version,updated_at FROM cms_documents WHERE id=? AND write_nonce=?").bind(id,nonce),
        ]);
        if(!writes[0].meta.changes)failure('Un’altra modifica ha aggiornato la scheda. Rileggi prima di salvare.',412);
        return response({...view(await item(db,id)),needsReview:checked.needsReview});
      }
      failure('Metodo non consentito.',405);
    }
    if(path==='releases'&&req.method==='GET')return response({releases:(await db.prepare('SELECT id,created_at AS createdAt,actor,note FROM cms_releases ORDER BY created_at DESC LIMIT 100').all()).results});
    if(path==='releases'&&req.method==='POST') {
      permit(actor,'publish');const input=await json(req);
      if(!Array.isArray(input.items)||!input.items.length||input.items.length>CONTENT_RESOURCES.length||new Set(input.items.map(x=>x.id)).size!==input.items.length||typeof input.baseRelease!=='string')failure('Indica le schede, le revisioni e la release di partenza.');
      const docs=[];
      for(const x of input.items) {
        permit(actor,'publish',x.id);if(resourceOf(x.id)?.readonly)failure('I dati generati non si pubblicano dal CMS.',403);
        const row=await item(db,x.id);if(!row||row.version!==x.version)failure('Una revisione è cambiata. Rileggi prima di pubblicare.',412);
        const checked=validateContent(x.id,JSON.parse(row.draft),JSON.parse(row.published));
        if(checked.needsReview){permit(actor,'review',x.id);if(input.reviewed!==true)failure('Verifica le fonti della modifica scientifica o normativa e conferma la revisione.',422);}
        docs.push(row);
      }
      const release=crypto.randomUUID();
      const conditions=docs.map(()=>'(id=? AND version=?)').join(' OR '),bindings=docs.flatMap(r=>[r.id,r.version]);
      const writes=await db.batch([
        db.prepare(`UPDATE cms_meta SET value=? WHERE key='release' AND value=? AND (SELECT COUNT(*) FROM cms_documents WHERE ${conditions})=?`).bind(release,input.baseRelease,...bindings,docs.length),
        ...docs.map(r=>db.prepare("UPDATE cms_documents SET published=draft,published_version=version WHERE id=? AND EXISTS(SELECT 1 FROM cms_meta WHERE key='release' AND value=?)").bind(r.id,release)),
        db.prepare("INSERT INTO cms_releases(id,created_at,actor,note,snapshot) SELECT ?,?,?,?,json_group_object(id,published_version) FROM cms_documents HAVING EXISTS(SELECT 1 FROM cms_meta WHERE key='release' AND value=?)").bind(release,now,actor.id,String(input.note||'').slice(0,1000),release),
        db.prepare("INSERT INTO cms_audit(actor,action,created_at) SELECT ?,'publish',? WHERE EXISTS(SELECT 1 FROM cms_meta WHERE key='release' AND value=?)").bind(actor.id,now,release),
      ]);
      if(!writes[0].meta.changes)failure('La pubblicazione è cambiata. Rileggi la release e le revisioni.',412);
      return response({release,published:docs.map(r=>({id:r.id,version:r.version}))},201);
    }
    const restore=path.match(/^items\/([a-z0-9-]+)\/restore$/);
    if(restore&&req.method==='POST') {
      const id=restore[1];permit(actor,'write',id);const row=await item(db,id),input=await json(req);
      const payload=await db.prepare('SELECT payload FROM cms_revisions WHERE document_id=? AND version=?').bind(id,input.version).first('payload');
      if(!payload)failure('Revisione non trovata.',404);
      return handleCms(new Request(new URL(`/api/cms/v1/items/${id}`,url),{method:'PATCH',headers:req.headers,body:JSON.stringify({data:JSON.parse(payload)})}),env,now);
    }
    if(path==='tokens'&&req.method==='GET'){permit(actor,'admin');return response({tokens:(await db.prepare('SELECT id,name,scopes,resources,expires_at AS expiresAt,revoked_at AS revokedAt FROM cms_agent_tokens ORDER BY created_at DESC').all()).results.map(t=>({...t,scopes:JSON.parse(t.scopes),resources:JSON.parse(t.resources)}))});}
    if(path==='tokens'&&req.method==='POST') {
      permit(actor,'admin');const input=await json(req);
      if(typeof input.name!=='string'||!input.name.trim()||!Array.isArray(input.scopes)||!input.scopes.length||input.scopes.some(s=>!['read','write','publish','review'].includes(s))||!input.scopes.includes('read')||!Array.isArray(input.resources)||!input.resources.length||input.resources.some(r=>!resourceOf(r))||!Number.isInteger(input.days)||input.days<1||input.days>90)failure('Indica nome, permessi, sezioni e scadenza (1–90 giorni).');
      const raw='cms_'+Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join(''),id=crypto.randomUUID();
      await db.batch([
        db.prepare('INSERT INTO cms_agent_tokens(id,token_hash,name,scopes,resources,created_at,expires_at,created_by) VALUES(?,?,?,?,?,?,?,?)').bind(id,await hash(raw),input.name.trim().slice(0,80),JSON.stringify([...new Set(input.scopes)]),JSON.stringify([...new Set(input.resources)]),now,now+input.days*864e5,actor.id),
        db.prepare("INSERT INTO cms_audit(actor,action,created_at) VALUES(?,'token_create',?)").bind(actor.id,now),
      ]);return response({id,token:raw,expiresAt:now+input.days*864e5},201);
    }
    const revoke=path.match(/^tokens\/([a-f0-9-]+)$/);
    if(revoke&&req.method==='DELETE') {
      permit(actor,'admin');await db.batch([db.prepare('UPDATE cms_agent_tokens SET revoked_at=? WHERE id=?').bind(now,revoke[1]),db.prepare("INSERT INTO cms_audit(actor,action,created_at) VALUES(?,'token_revoke',?)").bind(actor.id,now)]);return response({ok:true});
    }
    if(path==='metrics/weather'&&req.method==='GET'){permit(actor,'admin');return response(await weatherMetrics(db,Number(url.searchParams.get('days'))||30));}
    if(path==='audit'&&req.method==='GET'){permit(actor,'admin');return response({events:(await db.prepare('SELECT * FROM cms_audit ORDER BY id DESC LIMIT 100').all()).results});}
    failure('Percorso non trovato.',404);
  }catch(e){return response({error:e.status?e.message:'Redazione temporaneamente non disponibile.'},e.status||503);}
}

// If-None-Match usa il confronto debole (RFC 9110 §13.1.2 e §8.8.3.2): W/"x" equivale a "x".
// Cloudflare indebolisce l'ETag quando comprime la risposta, e il browser rimanda W/"…".
// Il campo può contenere una lista di ETag oppure «*».
export function noneMatch(header,tag) {
  if(!header)return false;
  if(header.trim()==='*')return true;
  const opaque=tag.replace(/^W\//,'');
  // ogni elemento della lista è un entity-tag intero; un elemento malformato non corrisponde a nulla
  return (header.match(/(?:W\/)?"[^"]*"|[^,\s]+/g)||[]).some(t=>/^(?:W\/)?"[^"]*"$/.test(t)&&t.replace(/^W\//,'')===opaque);
}

export async function handleContent(req,env) {
  const url=new URL(req.url);
  try {
    if(req.method!=='GET')return response({error:'Metodo non consentito.'},405);
    const snapshot=await publishedContent(env,url.origin);
    if(!snapshot)return response({error:'Contenuti non configurati.'},503);
    const tag=`"${snapshot.release}"`;
    if(noneMatch(req.headers.get('if-none-match'),tag))return new Response(null,{status:304,headers:{etag:tag,'cache-control':'public, max-age=30'}});
    return response(snapshot,200,{etag:tag,'cache-control':'public, max-age=30'});
  }catch{return response({error:'Contenuti temporaneamente non disponibili.'},503);}
}
