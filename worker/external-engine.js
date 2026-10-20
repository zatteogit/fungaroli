import {externalDataset,externalCatalog} from './external-observations.js';
import {externalImpact,romeDay,EXTERNAL_RULE} from '../js/external-signal.js';
import {SPECIES} from '../js/species.js';
import {rankingPolicy} from './admin-dashboard.js';
export async function externalEngineImpact(env,{day,now=Date.now()}={}){
 const [dataset,catalog,policy]=await Promise.all([externalDataset(env.COMMUNITY_DB,now),externalCatalog(env.CMS_DB),rankingPolicy(env.COMMUNITY_DB)]);
 const impact=externalImpact(dataset,{day,now,maxPercent:policy.maxPercent,modelTaxonIds:SPECIES.map(s=>s.id),zoneIds:catalog.zones.map(z=>z.id)});
 return {...impact,policy:{...impact.policy,revision:policy.version},catalog};
}
export async function publicExternalSignals(env,now=Date.now()){
 const [dataset,catalog,policy]=await Promise.all([externalDataset(env.COMMUNITY_DB,now),externalCatalog(env.CMS_DB),rankingPolicy(env.COMMUNITY_DB)]);
 const first={generatedAt:new Date(now).toISOString(),policy:{...EXTERNAL_RULE,maxPercent:policy.maxPercent,revision:policy.version}},days=[];
 for(let i=0;i<8;i++){
  const day=romeDay(now+i*864e5),impact=externalImpact(dataset,{day,now,maxPercent:first.policy.maxPercent,modelTaxonIds:SPECIES.map(s=>s.id),zoneIds:catalog.zones.map(z=>z.id)});
  days.push({day,groups:impact.groups.filter(g=>g.eligible).map(({zoneId,taxonId,events,days,presences,searchedAbsent,multiplier})=>({zoneId,taxonId,events,days,presences,searchedAbsent,multiplier}))});
 }
 return {schemaVersion:1,generatedAt:first.generatedAt,policy:first.policy,days,indexDelta:0,absenceFromMissingRecords:false};
}
