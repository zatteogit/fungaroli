import {initExternalObservations,externalDataset} from './external-observations.js';
import {externalEngineImpact} from './external-engine.js';
import {romeDay} from '../js/external-signal.js';
export async function researchOverview(env,now=Date.now()){
 await initExternalObservations(env.COMMUNITY_DB);const db=env.COMMUNITY_DB,today=romeDay(now),since=romeDay(now-6*864e5);
 const totals=await db.prepare("SELECT COUNT(*) AS records,SUM(review_status='pending') AS pending,SUM(review_status='accepted') AS accepted,SUM(review_status='excluded') AS excluded,SUM(observed_on IS NULL) AS undated,SUM(observed_on>=? AND observed_on<=?) AS recent FROM external_observations").bind(since,today).first();
 const province=(await db.prepare("SELECT COALESCE(json_extract(payload,'$.province'),'Non risolta') AS name,COUNT(*) AS total,SUM(observed_on>=? AND observed_on<=?) AS recent FROM external_observations GROUP BY COALESCE(json_extract(payload,'$.province'),'Non risolta') ORDER BY total DESC").bind(since,today).all()).results;
 const sources=(await db.prepare("SELECT json_extract(payload,'$.sourceType') AS name,COUNT(*) AS total FROM external_observations GROUP BY json_extract(payload,'$.sourceType') ORDER BY total DESC").all()).results;
 const [dataset,impact]=await Promise.all([externalDataset(db,now),externalEngineImpact(env,{now})]);
 const series=[];for(let i=7;i>=0;i--){const from=romeDay(now-(i*7+6)*864e5),to=romeDay(now-i*7*864e5);const n=await db.prepare('SELECT COUNT(*) AS n FROM external_observations WHERE observed_on>=? AND observed_on<=?').bind(from,to).first('n');series.push({from,to,count:n});}
 return {generatedAt:now,today,since,totals,province,sources,series,engine:{exportable:dataset.occurrences.length,used:impact.totals.used,groups:impact.groups.filter(g=>g.eligible).length,indexDelta:0,maxPercent:impact.policy.maxPercent},note:'Conteggi di voci del registro, non uscite indipendenti o abbondanza fungina.'};
}
