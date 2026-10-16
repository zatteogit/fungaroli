// Scomposizione del deficit logaritmico dell'indice nei casi pertinenti; correlazioni tra fattori.
import fs from 'node:fs';
const FIX = process.env.FRONDA_DIR || process.cwd();
const {scoreSpecies}=await import(FIX+'/js/model.js');
const {SPECIES}=await import(FIX+'/js/species.js');
const habitat=JSON.parse(fs.readFileSync(FIX+'/data/habitat.json','utf8')).zones;
const [file,idsFile,soil,from,to]=process.argv.slice(2);
const data=JSON.parse(fs.readFileSync(file,'utf8')), ids=JSON.parse(fs.readFileSync(idsFile,'utf8'));
const fin=v=>Number.isFinite(v)?v:null;
function series(loc){const d=loc.daily,h=loc.hourly||{};let soilm;
 if(soil==='icon'){const by={};(h.time||[]).forEach((t,k)=>{const day=t.slice(0,10),v=h.soil_moisture_3_to_9cm?.[k];const b=(by[day]||={m:0,n:0});if(Number.isFinite(v)&&v>=0&&v<=1){b.m+=v;b.n++;}});soilm=d.time.map(x=>by[x]?.n>=24?by[x].m/by[x].n:null);}
 else soilm=d.time.map((_,k)=>fin(d.soil_moisture_0_to_7cm_mean?.[k]));
 return {dates:d.time,p:d.time.map((_,k)=>d.precipitation_sum?.[k]>=0?fin(d.precipitation_sum[k]):null),tmean:d.time.map((_,k)=>fin(d.temperature_2m_mean?.[k])),tmin:d.time.map((_,k)=>fin(d.temperature_2m_min?.[k])),tmax:d.time.map((_,k)=>fin(d.temperature_2m_max?.[k])),soilm,todayIndex:d.time.length-1,issuedIndex:d.time.length-1,source:{}};}
const F=['season','habitat','elev','rain','temp','moist','frost','heat'];
const rel=[];
data.forEach((loc,k)=>{const [zid,band]=ids[k].split('|');const s=series(loc);
 for(let i=0;i<s.dates.length;i++){if(s.dates[i]<from||s.dates[i]>to)continue;
  for(const sp of SPECIES){if(sp.kind==='plant')continue;const r=scoreSpecies(sp,s,i,habitat[zid],+band,{});if(r.score==null)continue;
   if(r.season>=0.8&&r.habitat>=0.8&&r.elev===1)rel.push(r);}}});
const pos=rel.filter(r=>r.score>0);
const tot={};let T=0;
for(const r of pos){for(const f of F){const v=-Math.log(Math.max(r[f],1e-6));tot[f]=(tot[f]||0)+v;T+=v;}}
const share=Object.fromEntries(F.map(f=>[f,(100*tot[f]/T).toFixed(1)+'%']));
const pear=(a,b)=>{const n=a.length,ma=a.reduce((x,y)=>x+y)/n,mb=b.reduce((x,y)=>x+y)/n;let s=0,da=0,db=0;for(let i=0;i<n;i++){s+=(a[i]-ma)*(b[i]-mb);da+=(a[i]-ma)**2;db+=(b[i]-mb)**2;}return s/Math.sqrt(da*db);};
const q=(a,p)=>{const b=[...a].sort((x,y)=>x-y);return b[Math.min(b.length-1,Math.floor(p*b.length))];};
// soffitto del fattore pioggia: casi con r30 >= 100 mm e pioggia di latenza >= 50 mm
const wet=rel.filter(r=>r.r30>=100&&r.effRain>=50);
console.log(JSON.stringify({file,from,to,relevant:rel.length,positive:pos.length,
 log_deficit_share:share,
 corr_rain_moist:+pear(rel.map(r=>r.rain),rel.map(r=>r.moist)).toFixed(2),
 corr_rain_temp:+pear(rel.map(r=>r.rain),rel.map(r=>r.temp)).toFixed(2),
 corr_r30_soilm:+pear(rel.filter(r=>r.sm!=null).map(r=>r.r30),rel.filter(r=>r.sm!=null).map(r=>r.sm)).toFixed(2),
 rain_factor:{p50:+q(rel.map(r=>r.rain),0.5).toFixed(3),p99:+q(rel.map(r=>r.rain),0.99).toFixed(3),max:+Math.max(...rel.map(r=>r.rain)).toFixed(3)},
 wet_cases:wet.length, rain_factor_when_r30_ge_100_and_lag_ge_50:wet.length?{p50:+q(wet.map(r=>r.rain),0.5).toFixed(3),max:+Math.max(...wet.map(r=>r.rain)).toFixed(3)}:null},null,1));
