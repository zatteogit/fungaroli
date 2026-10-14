// Shared daily soil aggregation for server responses and local snapshots.
export function compactGrowth(rows) {
  let reference=null,ranges;
  return rows.map(row=>{
    const h=row.hourly;
    if(!h?.time)return row;
    if(!reference||h.time.length!==reference.length||!h.time.every((t,i)=>t===reference[i])) {
      reference=h.time;ranges=new Map();
      h.time.forEach((t,i)=>{const day=t.slice(0,10);if(!ranges.has(day))ranges.set(day,[]);ranges.get(day).push(i);});
    }
    const mean=key=>row.daily.time.map(day=>{
      let sum=0,count=0;for(const i of ranges.get(day)||[])if(Number.isFinite(h[key][i])){sum+=h[key][i];count++;}
      return count>=24?sum/count:null;
    });
    const {hourly,...rest}=row;
    return {...rest,daily:{...row.daily,soil_moisture_3_to_9cm_mean:mean('soil_moisture_3_to_9cm'),soil_temperature_6cm_mean:mean('soil_temperature_6cm')}};
  });
}
