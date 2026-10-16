// Porta in JS di predict_encounter (solo inferenza): medie/scale, indicatori di mancanza, ridge, Platt, dominio marginale.
import {readFileSync} from 'node:fs';
const {artifact:a,queries,python}=JSON.parse(readFileSync(process.argv[2],'utf8'));
const sig=x=>1/(1+Math.exp(-x));
function predict(a,q){
  const vals=[...a.feature_names.map(n=>q.features[n]??NaN),q.duration_minutes,q.observer_count];
  const reasons=[];
  if(vals.slice(0,-2).filter(Number.isFinite).length<a.min_observed_features)reasons.push('insufficient_observed_features');
  a.model_feature_names.forEach((n,i)=>{const v=vals[i],d=a.domain[i];if(Number.isNaN(v)){if(!d.missing_seen)reasons.push('unseen_missingness:'+n);}else if(v<d.min||v>d.max)reasons.push('outside_training_range:'+n);});
  if(reasons.length)return null;
  const m=a.model,filled=vals.map((v,i)=>Number.isNaN(v)?m.medians[i]:v),miss=vals.map(v=>Number.isNaN(v)?1:0);
  const x=[...filled,...miss].map((v,i)=>(v-m.mean[i])/m.scale[i]);
  const logit=x.reduce((s,v,i)=>s+v*m.coefficients[i],m.intercept);
  return sig(a.calibrator.slope*logit+a.calibrator.intercept);
}
let maxd=0,n=0,abst=0;
queries.forEach((q,i)=>{const p=predict(a,q),r=python[i];if(p===null||r===null){if((p===null)!==(r===null))throw new Error('astensione diversa');abst++;return;}maxd=Math.max(maxd,Math.abs(p-r));n++;});
console.log(`JS vs Python: ${n} previsioni, ${abst} astensioni concordi, differenza massima ${maxd.toExponential(2)}`);
