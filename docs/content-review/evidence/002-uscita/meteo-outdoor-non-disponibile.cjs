async page => {
 const results=[];
 for(const target of ['piante','passeggiata']) {
  const context=await page.context().browser().newContext({locale:'it-IT',viewport:{width:390,height:844},serviceWorkers:'block'});const p=await context.newPage();
  await p.addInitScript(target=>{localStorage.setItem('fungaroli:legal-accepted','62026-10-20');localStorage.setItem('fungaroli:prefs:v2',JSON.stringify({interests:[target],target}));},target);
  await p.route('**/api/weather/v1/forecast?**',route=>route.fulfill({status:503,json:{error:'fixture unavailable'}}));
  await p.goto('http://127.0.0.1:8796/#/zona/vallonina/1');
  const detail=p.locator('#detail');await detail.locator('.field-tools').waitFor({state:'visible',timeout:45000});
  const text=await detail.innerText();if(!text.includes('Meteo da verificare prima di partire.'))throw Error(target+' missing unavailable warning');
  if(text.includes('Uscita sconsigliata'))throw Error(target+' false warning');results.push({target,unavailable:true,unwarrantedSevereWarning:false});await context.close();
 }return results;
}
