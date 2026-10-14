// Secondary discoveries never enter the mushroom score or select another route.
import {scoreBotanical} from './botanical-model.js';
const finite=Number.isFinite;
function contextSamples(zoneHabitat,trail,trailCategories){
 if(trail)return {scope:'tracciato',habitat:{samples:trail.samples||[],sample_categories:trailCategories||[]}};
 return {scope:'zona',habitat:zoneHabitat};
}
export function outingDiscoveries({zone,zoneHabitat,trail,trailCategories,seriesByBand,date,models=[],flora=[],trees={},observations=[]}){
 const {scope,habitat}=contextSamples(zoneHabitat,trail,trailCategories);
 if(!date||!habitat?.samples?.length)return [];
 const counts={},samples=habitat.samples.filter(([e,c])=>finite(e)&&(c===-1||habitat.sample_categories?.[c]));
 for(const [,c] of samples){const cat=c<0?'non bosco':habitat.sample_categories[c];counts[cat]=(counts[cat]||0)+1;}
 if(samples.length<3)return [];
 const candidates=[];
 for(const model of models){
  let best;
  for(const [bi,band] of zone.bands.entries()){
   let s=seriesByBand?.[bi],i=s?.dates?.indexOf(date);
   if(i==null||i<0){s={dates:[date],source:{expired:true}};i=0;}
   const r=scoreBotanical(model,s,i,habitat,band,{zoneId:zone.id,observations});
   if(r.habitatSamples<3||r.suitableShare<.15||!finite(r.score))continue;
   const current=model.phaseMonths?.includes(Number(date.slice(5,7)))||r.ownObservation?.status==='present';
   const rank=r.score+(current?10:0);
   if(!best||rank>best.rank)best={kind:'pianta',id:model.plantId,name:model.name,href:model.href,scope,date,zoneId:zone.id,model,r,band,rank,phase:current?`Periodo indicativo: ${model.phaseLabel.toLowerCase()}`:'Ambiente compatibile'};
  }
  if(best)candidates.push(best);
 }
 // Catalogue-only flora: match documented environments, without inventing a
 // growth model. A flowering calendar is labelled as flowering, never harvest.
 const modelled=new Set(models.map(m=>m.plantId));
 for(const p of flora){
  if(modelled.has(p.id)||p.category==='Pericolose'||!p.habitatCategories?.length)continue;
  const share=p.habitatCategories.reduce((sum,c)=>sum+(counts[c]||0),0)/samples.length;
  if(share<.2)continue;
  const flowering=p.flowerMonths?.includes(Number(date.slice(5,7)));
  candidates.push({kind:'pianta',id:p.id,name:p.name,href:`#/pianta/${p.id}`,scope,date,zoneId:zone.id,rank:share*50+(flowering?10:0),phase:flowering?'Fioritura nel calendario indicativo':'Ambiente compatibile',mappingNote:p.habitatMappingNote});
 }
 candidates.sort((a,b)=>b.rank-a.rank||a.name.localeCompare(b.name,'it'));
 const out=candidates.slice(0,2),dominant=Object.entries(counts).filter(([c])=>c!=='non bosco').sort((a,b)=>b[1]-a[1])[0];
 if(dominant){
  const [cat,n]=dominant;const tree=Object.entries(trees).find(([,t])=>t.forest_categories?.[0]===cat)||Object.entries(trees).find(([,t])=>t.forest_categories?.includes(cat));
  if(tree&&n/samples.length>=.2){const [id,t]=tree;out.push({kind:'albero',id,name:t.name,href:`#/albero/${encodeURIComponent(id)}`,scope,date,zoneId:zone.id,phase:`${cat} nei campioni ${scope==='tracciato'?'del tracciato':'della zona'}`});}
 }
 return out;
}
