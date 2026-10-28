async page => {
 const cases_original=[{name:'snow',code:73,gust:10,rain:0,prob:10,severe:true,reason:'Neve'},{name:'rain',code:61,gust:10,rain:1,prob:90,severe:true,reason:'Pioggia'},{name:'wind',code:1,gust:65,rain:0,prob:0,severe:true,reason:'65 km/h'},{name:'storm',code:95,gust:10,rain:0,prob:90,severe:true,reason:'Temporali'},{name:'clear',code:1,gust:8,rain:0,prob:0,severe:false,reason:'Arriva'},{name:'wind-moderate',code:1,gust:46,rain:0,prob:0,severe:false,reason:'Arriva'}];
 const cases=[{name:'storm-no-index',target:'funghi',code:95,gust:10,rain:0,prob:90},{name:'clear-no-index',target:'funghi',code:1,gust:8,rain:0,prob:0},{name:'wind-no-index',target:'funghi',code:1,gust:65,rain:0,prob:0},{name:'snow-no-index',target:'funghi',code:73,gust:8,rain:0,prob:0}];
 const report=[];
 for(const c of cases){
  const context=await page.context().browser().newContext({locale:'it-IT',viewport:{width:390,height:844},serviceWorkers:'block'});const p=await context.newPage();
  await p.addInitScript(target=>{localStorage.setItem('fungaroli:legal-accepted','62026-10-20');localStorage.setItem('fungaroli:prefs:v2',JSON.stringify({interests:[target],target,easyTrails:false,speciesIds:['cyclocybe-aegerita']}));},c.target);
  await p.route('**/api/weather/v1/forecast?**',async route=>{
   const q=new URL(route.request().url()).searchParams,count=(q.get('latitude')||'0').split(',').length;
   const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
   const days=Array.from({length:70},(_,i)=>iso(new Date(Date.now()+(i-62)*864e5)));const time=days.flatMap(d=>Array.from({length:24},(_,h)=>`${d}T${String(h).padStart(2,'0')}:00`)),fill=v=>Array(time.length).fill(v);
   await route.fulfill({json:Array.from({length:count},()=>({daily:{time:days,precipitation_sum:days.map((_,i)=>i%4?3:12),temperature_2m_mean:Array(70).fill(13),temperature_2m_min:Array(70).fill(8),temperature_2m_max:Array(70).fill(18)},hourly:{time,soil_moisture_3_to_9cm:fill(.3),soil_temperature_6cm:fill(13),precipitation:fill(c.rain),precipitation_probability:fill(c.prob),weather_code:fill(c.code),wind_gusts_10m:fill(c.gust),temperature_2m:fill(13)}}))});
  });
  await p.goto('http://127.0.0.1:8796/#/zona/vallonina/1');await p.locator('#detail .field-tools').waitFor({state:'visible',timeout:45000});
  await p.waitForFunction(()=>document.querySelector('#detail')?.innerText.includes('Indice non ancora disponibile'),null,{timeout:45000});await p.waitForTimeout(1000);
  const detail=p.locator('#detail');const text=await detail.innerText();const severe=c.name!=='clear-no-index';
  if(!text.includes('Indice non ancora disponibile')||!text.includes(severe?'Uscita sconsigliata':'Meteo della mattina'))throw Error(c.name+' missing weather or index: '+text.slice(0,400));
  if(!severe&&text.includes('Uscita sconsigliata'))throw Error('clear wrongly discouraged');
  let views=0;for(const width of [320,390,768,1280])for(const theme of ['light','dark']){await p.setViewportSize({width,height:900});await p.emulateMedia({colorScheme:theme});await p.waitForTimeout(350);let measure=await p.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth}));if(measure.document>width+1)throw Error(c.name+' overflow '+JSON.stringify(measure));views++;}
  const result={scenario:c.name,text:await detail.innerText(),aria:await detail.ariaSnapshot(),views};
  await p.screenshot({path:`/tmp/fronda-no-index-${c.name}.png`});report.push(result);await context.close();
 }
 return report;
}
