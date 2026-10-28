async page => {
 const cases=[{name:'snow',code:73,gust:10,rain:0,prob:10,severe:true,reason:'Neve'},{name:'rain',code:61,gust:10,rain:1,prob:90,severe:true,reason:'Pioggia'},{name:'wind',code:1,gust:65,rain:0,prob:0,severe:true,reason:'65 km/h'},{name:'storm',code:95,gust:10,rain:0,prob:90,severe:true,reason:'Temporali'},{name:'clear',code:1,gust:8,rain:0,prob:0,severe:false,reason:'Arriva'},{name:'wind-moderate',code:1,gust:46,rain:0,prob:0,severe:false,reason:'Arriva'}];
 const report=[];
 for(const c of cases){
  const context=await page.context().browser().newContext({locale:'it-IT',viewport:{width:390,height:900},serviceWorkers:'block'});
  const p=await context.newPage();
  await p.addInitScript(()=>{localStorage.setItem('fungaroli:legal-accepted','62026-10-20');localStorage.setItem('fungaroli:prefs:v2',JSON.stringify({interests:['funghi','piante'],target:'funghi',speciesIds:['edulis'],easyTrails:true}));});
  await p.route('**/api/weather/v1/forecast?**',async route=>{
   const q=new URL(route.request().url()).searchParams,count=(q.get('latitude')||'0').split(',').length;
   const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
   const days=Array.from({length:70},(_,i)=>iso(new Date(Date.now()+(i-62)*864e5)));
   const time=days.flatMap(d=>Array.from({length:24},(_,h)=>`${d}T${String(h).padStart(2,'0')}:00`)),fill=v=>Array(time.length).fill(v);
   const out=Array.from({length:count},()=>({daily:{time:days,precipitation_sum:days.map((_,i)=>i%4?3:12),temperature_2m_mean:Array(70).fill(13),temperature_2m_min:Array(70).fill(8),temperature_2m_max:Array(70).fill(18)},hourly:{time,soil_moisture_3_to_9cm:fill(.3),soil_temperature_6cm:fill(13),precipitation:fill(c.rain),precipitation_probability:fill(c.prob),weather_code:fill(c.code),wind_gusts_10m:fill(c.gust),temperature_2m:fill(13)}}));
   await route.fulfill({json:out});
  });
  await p.goto('http://127.0.0.1:8796/#/zona/vallonina/1');
  const section=p.locator('#detail details[data-sec="quando"]'),summary=section.locator(':scope > summary');
  await summary.waitFor({state:'visible',timeout:45000});
  await p.waitForFunction(({reason})=>document.querySelector('#detail details[data-sec="quando"] > summary')?.innerText.includes(reason),{reason:c.reason},{timeout:45000});
  const before=await summary.innerText();
  if(c.severe&&(!before.includes('Uscita sconsigliata')||before.includes('Arriva')))throw Error(c.name+' incorrect summary '+before);
  if(!c.severe&&(before.includes('Uscita sconsigliata')||!before.includes('Arriva')))throw Error(c.name+' incorrect summary '+before);
  await summary.focus();await p.keyboard.press('Enter');if(!await section.evaluate(el=>el.open))throw Error(c.name+' keyboard cannot open');
  const body=await section.locator(':scope > .sec-body').innerText();
  if(!body.includes('Alba')||!body.includes('Orario consentito di raccolta'))throw Error(c.name+' missing reference');
  if(c.severe&&(body.includes('Partenza ·')||body.includes('Preferisci meno gente?')))throw Error(c.name+' unsafe advice');
  if(!c.severe&&!body.includes('Partenza ·'))throw Error(c.name+' normal departure missing');
  for(const width of [320,390,768,1280])for(const theme of ['light','dark']){
   await p.setViewportSize({width,height:900});await p.emulateMedia({colorScheme:theme});
   const box=await summary.boundingBox();const info=await p.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
   if(!box||box.x < -1||box.x+box.width>width+1||info.scroll>width+1)throw Error(`${c.name} ${width} ${theme} overflow ${JSON.stringify({box,info})}`);
   if(c.name==='snow'&&(width===320||width===1280))await section.screenshot({path:`/tmp/fronda-severe-${c.name}-${width}-${theme}.png`});
  }
  report.push({scenario:c.name,summary:before.replace(/\s+/g,' ').trim(),keyboard:true,body:body.includes('Orario consentito di raccolta'),views:8});await context.close();
 }
 return report;
}
