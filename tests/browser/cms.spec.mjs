import {test,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {createHash,randomBytes} from 'node:crypto';
import {todayISO} from '../../js/weather.js';

async function loginFixture(page,id='cms-test-admin') {
  // Only the isolated local D1 fixture is seeded. Production authentication is never bypassed.
  await page.request.get('/api/community/status');
  const raw=randomBytes(32).toString('hex'),digest=createHash('sha256').update(raw).digest('hex');
  execFileSync('python3',['-c',`
import sys,sqlite3,pathlib,time
for path in pathlib.Path(sys.argv[1]).rglob('*.sqlite'):
 db=sqlite3.connect(path,timeout=20)
 if db.execute("SELECT COUNT(*) FROM sqlite_master WHERE name='accounts'").fetchone()[0]:
  now=int(time.time()*1000)
  db.execute('INSERT INTO accounts(id,handle,created_at) VALUES(?,?,?) ON CONFLICT(id) DO NOTHING',(sys.argv[2],'Matteo' if sys.argv[2]=='cms-test-admin' else 'Editor' if sys.argv[2]=='cms-test-editor' else 'Lettore',now))
  db.execute('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)',(sys.argv[3],sys.argv[2],now+3600000))
  db.commit();db.close();break
 else: db.close()
else: raise Exception('Local community fixture missing')
`,process.env.FUNGAROLI_BROWSER_PERSIST,id,digest]);
  await page.context().addCookies([{name:'__Host-fungaroli_session',value:raw,domain:'localhost',path:'/',secure:true,httpOnly:true,sameSite:'Strict'}]);
}
async function api(page,path,method='GET',data,headers={}) {
  return page.evaluate(async({path,method,data,headers})=>{const r=await fetch(path,{method,cache:'no-store',headers:{...(data===undefined?{}:{'content-type':'application/json'}),...headers},body:data===undefined?undefined:JSON.stringify(data)});return{status:r.status,data:await r.json()};},{path,method,data,headers});
}
const cms=(page,path,method='GET',data,headers)=>api(page,'/api/cms/v1/'+path,method,data,headers);
// CSV con virgolette (RFC 4180), separatore a scelta: per leggere le esportazioni del questionario.
function parseCsv(text,sep){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"')quoted=true;else if(c===sep){row.push(cell);cell='';}else if(c==='\r'&&text[i+1]==='\n'){row.push(cell);rows.push(row);row=[];cell='';i++;}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}

test('ruoli del profilo: utente, editor delle bozze e amministratore',async({browser})=>{
  for(const[id,role,label]of[['cms-test-reader','member','Utente'],['cms-test-editor','editor','Editor'],['cms-test-admin','admin','Amministratore']]){
    const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://**/*',r=>r.abort());
  await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill({status:503,json:{error:'Meteo non disponibile nella prova CMS.'}}));
    await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','62026-10-20'));
    await loginFixture(page,id);await page.goto('/');
    const me=await cms(page,'me');expect(me.status).toBe(200);expect(me.data.user.role).toBe(role);
    expect((await api(page,'/api/community/session')).data.user.role).toBe(role);
    if(role==='member'){
      expect(me.data.user.scopes).toEqual([]);expect((await cms(page,'items')).status).toBe(403);
      expect((await cms(page,'items/ui-copy','PATCH',{role:'admin',data:{}},{'if-match':'"0"'})).status).toBe(403);
    }
    if(role==='editor'){
      expect(me.data.user.scopes).toEqual(['read','write']);
      const before=(await api(page,'/api/content/v1/snapshot')).data.resources['ui-copy'];
      const current=(await cms(page,'items/ui-copy')).data,data={...current.data,homeTitle:'Bozza dell’editor'};
      const saved=await cms(page,'items/ui-copy','PATCH',{data},{'if-match':`"${current.version}"`});expect(saved.status).toBe(200);
      const release=(await cms(page,'items')).data.release;
      expect((await cms(page,'releases','POST',{baseRelease:release,items:[{id:'ui-copy',version:saved.data.version}],role:'admin',reviewed:true})).status).toBe(403);
      expect((await cms(page,'tokens','POST',{name:'Promozione non consentita',days:1,scopes:['read']})).status).toBe(403);
      expect((await cms(page,'audit')).status).toBe(403);
      expect((await api(page,'/api/content/v1/snapshot')).data.resources['ui-copy']).toEqual(before);
      expect((await cms(page,'items/ui-copy/restore','POST',{version:0},{'if-match':`"${saved.data.version}"`})).status).toBe(200);
    }
    for(const width of[320,390,1280]){
      await page.setViewportSize({width,height:900});await page.locator('[data-community-account]').first().click();
      const dialog=page.locator('dialog.profile-dialog[open]');await expect(dialog.locator('[data-account-role]')).toHaveText(label);
      await expect(dialog.getByRole('link',{name:'Apri la redazione →'})).toHaveCount(role==='member'?0:1);
      const geometry=await dialog.evaluate(el=>{
        const a=el.querySelector('[data-logout]').getBoundingClientRect(),b=el.querySelector('.profile-actions [data-close]').getBoundingClientRect(),d=el.querySelector('[data-delete-account]').getBoundingClientRect();
        return{overlap:a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top,destructiveSeparate:d.top>=Math.max(a.bottom,b.bottom)+12,overflow:el.scrollWidth>el.clientWidth,heights:[a.height,b.height]};
      });
      expect(geometry.overlap).toBe(false);expect(geometry.destructiveSeparate).toBe(true);expect(geometry.overflow).toBe(false);expect(geometry.heights.every(h=>h>=44)).toBe(true);
      if(role==='admin'&&width===390)await dialog.screenshot({path:'/tmp/fungaroli-profile-admin.png'});
      if(role==='editor'&&width===390)await dialog.screenshot({path:'/tmp/fungaroli-profile-editor.png'});
      await dialog.locator('[data-delete-account]').click();await expect(dialog.locator('[data-delete-account]')).toHaveText('Conferma eliminazione');
      expect((await api(page,'/api/community/session')).status).toBe(200);
      await dialog.locator('.profile-actions [data-close]').click();await expect(dialog).toHaveCount(0);
    }
    if(role==='editor'){
      await page.goto('/redazione');await expect(page.locator('#cms-workspace')).toBeVisible();
  await page.locator('#cms-content-tab').click();await expect(page.locator('#cms-identity')).toContainText('Editor');
      await expect(page.locator('[data-save]')).toBeEnabled();await expect(page.locator('[data-publish]')).toBeDisabled();await expect(page.locator('#cms-agents')).toBeHidden();await expect(page.locator('#cms-survey')).toBeHidden();
      await page.locator('[data-resource="species-traits"]').click();await expect(page.locator('[data-reviewed]')).toHaveCount(0);
    }
    expect(errors).toEqual([]);await context.close();
  }
});

test('redazione, bozze, pubblicazione, conflitti, agenti e catalogo condiviso',async({page,browser})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());
  await page.route('**/api/weather/v1/forecast?**',r=>r.fulfill({status:503,json:{error:'Meteo non disponibile nella prova CMS.'}}));
  await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','62026-10-20'));
  await page.goto('/redazione');
  await expect(page.locator('#cms-access-status')).toContainText('Accedi');
  expect((await cms(page,'items')).status).toBe(401);
  const other=await browser.newContext({serviceWorkers:'block'}),reader=await other.newPage();await reader.goto('/redazione');await loginFixture(reader,'cms-test-reader');
  expect((await cms(reader,'me')).data.user.scopes).toEqual([]);expect((await cms(reader,'me')).data.user.role).toBe('member');expect((await cms(reader,'items')).status).toBe(403);await other.close();
  await loginFixture(page);await page.reload();
  await expect(page.locator('#cms-workspace')).toBeVisible();
  await page.locator('#cms-content-tab').click();
  await expect(page.locator('[data-profile-label]')).toHaveText('Matteo');
  await expect(page.locator('[data-resource]')).toHaveCount(21);
  // Risposte al questionario: pannello solo per gli amministratori (conteggio, esportazione, ricerca e cancellazione per ricevuta).
  // Una risposta vera, inviata dalla stessa origine come fa la pagina /questionario, con un testo che sembra una formula.
  const sent=await api(page,'/api/survey/v1/responses','POST',{survey:'esperti-reatino',version:1,website:'',respondent:{name:'Prova redazione'},consent:{anonymousUse:true,recontact:false,diary:false},answers:{profile:{years:30},risks:{knowsPoisonings:'sì',poisonings:'=SOMMA(1;2), -3'}}});
  expect(sent.status).toBe(201);const receipt=sent.data.receipt;
  const surveyGets=[];page.on('request',r=>{if(r.url().includes('/api/survey/v1/responses?'))surveyGets.push(new URL(r.url()).searchParams.get('format'));});
  await page.locator('#cms-survey').click();const survey=page.locator('#cms-survey-dialog');await expect(survey).toBeVisible();
  await expect(survey.locator('#cms-survey-count')).toContainText(/rispost[ae]\. L’ultima è arrivata il /);
  // il conteggio non scarica le risposte (format=count): nomi e contatti restano sul server finché non si esporta
  expect(surveyGets).toEqual(['count']);
  const fs=await import('node:fs');
  const download=async name=>{const d=page.waitForEvent('download');await survey.getByRole('button',{name,exact:true}).click();const file=await d;return{name:file.suggestedFilename(),text:fs.readFileSync(await file.path(),'utf8')};};
  const comma=await download('CSV con la virgola'),excel=await download('CSV per Excel');
  expect(comma.name).toMatch(/^questionario-esperti-reatino-\d{4}-\d{2}-\d{2}\.csv$/);expect(excel.name).toMatch(/^questionario-esperti-reatino-\d{4}-\d{2}-\d{2}-excel\.csv$/);
  expect(comma.text.startsWith('\uFEFFid,created_at,survey,')).toBe(true);expect(excel.text.startsWith('\uFEFFid;created_at;survey;')).toBe(true);
  // stesse colonne con i due separatori; l'apostrofo contro le formule a inizio cella, e nel file per Excel anche dopo la virgola
  const [hc,...rc]=parseCsv(comma.text.slice(1),','),[hx,...rx]=parseCsv(excel.text.slice(1),';');expect(hx).toEqual(hc);
  const row=(rows,head)=>rows.find(r=>r[head.indexOf('receipt')]===receipt),rowC=row(rc,hc),rowX=row(rx,hx);
  expect(rowC).toHaveLength(hc.length);expect(rowX).toHaveLength(hx.length);
  expect(rowC[hc.indexOf('name')]).toBe('Prova redazione');expect(rowX[hx.indexOf('name')]).toBe('Prova redazione');
  expect(rowC[hc.indexOf('risks.poisonings.text')]).toBe("'=SOMMA(1;2), -3");expect(rowX[hx.indexOf('risks.poisonings.text')]).toBe("'=SOMMA(1;2),' -3");
  expect(rowX[hx.indexOf('risks.knowsPoisonings')]).toBe('sì');
  // richiesta di cancellazione: il codice si trova anche in minuscolo e con il trattino, si cancella dopo una conferma
  const find=async code=>{await survey.getByLabel('Richiesta di cancellazione: codice ricevuta').fill(code);await survey.getByRole('button',{name:'Cerca la risposta'}).click();};
  await find(`${receipt.slice(0,4)}-${receipt.slice(4)}`.toLowerCase());
  const result=survey.locator('#cms-survey-result');await expect(result).toContainText(`Ricevuta ${receipt}`);await expect(result).toContainText('nome: Prova redazione');
  await result.getByRole('button',{name:'Cancella questa risposta'}).click();await expect(result).toContainText('La cancellazione non si può annullare.');
  expect((await api(page,`/api/survey/v1/responses?survey=esperti-reatino&format=json&receipt=${receipt}`)).data.count).toBe(1);
  await result.getByRole('button',{name:'Conferma: cancella per sempre'}).click();await expect(result).toContainText(`Risposta ${receipt} cancellata.`);
  expect((await api(page,`/api/survey/v1/responses?survey=esperti-reatino&format=json&receipt=${receipt}`)).data.count).toBe(0);
  await find(receipt);await expect(result).toContainText('Nessuna risposta con questo codice');
  await survey.locator('[data-close]').click();await expect(survey).toBeHidden();
  const original=(await api(page,'/api/content/v1/snapshot')).data;
  await page.locator('[data-resource="guides"]').click();
  await expect(page.locator('#cms-editor > h2')).toHaveText('Articoli e taccuini');
  // Locate by the field label rather than relying on the layout order.
  await page.getByLabel('Titolo',{exact:true}).fill('Una passeggiata di prova');
  await page.locator('[data-save]').click();await expect(page.locator('#cms-status')).toContainText('Bozza salvata');
  expect((await api(page,'/api/content/v1/snapshot')).data.resources.guides.guides[0].title).toBe(original.resources.guides.guides[0].title);
  await page.locator('[data-preview]').click();await expect(page.locator('#cms-preview')).toContainText('Una passeggiata di prova');
  await page.locator('[data-publish]').click();await expect(page.locator('#cms-status')).toContainText('Pubblicato');
  expect((await api(page,'/api/content/v1/snapshot')).data.resources.guides.guides[0].title).toBe('Una passeggiata di prova');
  await page.goto('/#/guide/leggere-il-bosco');await expect(page.locator('.editorial-article h1')).toHaveText('Una passeggiata di prova');
  const head=(await cms(page,'items/guides')).data;
  const h={'if-match':`"${head.version}"`},edit={data:structuredClone(head.data)};edit.data.guides[0].body='<h2>Testo valido</h2><script>window.injected=1</script><a href="javascript:alert(1)">Link</a>';
  const a=await cms(page,'items/guides','PATCH',edit,h);expect(a.status).toBe(200);expect(a.data.data.guides[0].body).not.toContain('<script');
  expect((await cms(page,'items/guides','PATCH',edit,h)).status).toBe(412);
  const cross=await page.request.patch('/api/cms/v1/items/guides',{headers:{origin:'https://evil.example','if-match':`"${a.data.version}"`},data:edit});expect(cross.status()).toBe(403);
  const token=(await cms(page,'tokens','POST',{name:'Agente di prova',days:1,scopes:['read','write'],resources:['guides']})).data;
  const agent={authorization:'Bearer '+token.token};
  expect((await cms(page,'items/guides','GET',undefined,agent)).status).toBe(200);
  expect((await cms(page,'items/zones','GET',undefined,agent)).status).toBe(403);
  expect((await cms(page,'releases','POST',{baseRelease:'0',items:[]},agent)).status).toBe(403);
  expect(JSON.stringify((await cms(page,'tokens')).data)).not.toContain(token.token);
  await cms(page,'tokens/'+token.id,'DELETE');expect((await cms(page,'items','GET',undefined,agent)).status).toBe(401);
  const catalog=(await cms(page,'items/edible-catalog')).data;
  const updated=structuredClone(catalog.data);updated.species.push({id:'catalogo-prova',name:'Fungo didattico',latin:'Taxon test',toxicity:'commestibile',months:null,aliases:[],caution:'Solo una scheda di prova.',description:'Descrizione di prova',sources:['https://example.org/source']});
  const draft=await cms(page,'items/edible-catalog','PATCH',{data:updated},{'if-match':`"${catalog.version}"`});expect(draft.status).toBe(200);
  let list=(await cms(page,'items')).data;
  expect((await cms(page,'releases','POST',{baseRelease:list.release,items:[{id:'edible-catalog',version:draft.data.version}]})).status).toBe(422);
  expect((await cms(page,'releases','POST',{baseRelease:list.release,items:[{id:'edible-catalog',version:draft.data.version}],reviewed:true})).status).toBe(201);
  expect((await cms(page,'releases','POST',{baseRelease:list.release,items:[{id:'edible-catalog',version:draft.data.version}],reviewed:true})).status).toBe(412);
  await page.goto('/#/commestibile/catalogo-prova');await page.reload();await expect(page.getByRole('heading',{name:'Fungo didattico',exact:true})).toBeVisible();
  const report=await api(page,'/api/community/reports','POST',{zoneId:'tancia',day:todayISO(),speciesId:'catalogo-prova',amount:1});expect(report.status).toBe(200);
  await api(page,'/api/community/entries/'+report.data.entryId,'DELETE');
  const glossary=(await cms(page,'items/glossary')).data, glossaryData=structuredClone(glossary.data);
  glossaryData.terms.find(t=>t.id==='volva').definition+=' Precisazione verificata dalla redazione.';
  const glossaryDraft=await cms(page,'items/glossary','PATCH',{data:glossaryData},{'if-match':`"${glossary.version}"`});expect(glossaryDraft.status).toBe(200);
  list=(await cms(page,'items')).data;
  expect((await cms(page,'releases','POST',{baseRelease:list.release,items:[{id:'glossary',version:glossaryDraft.data.version}]})).status).toBe(422);
  expect((await api(page,'/api/content/v1/snapshot')).data.resources.glossary).toEqual(original.resources.glossary);
  expect((await cms(page,'releases','POST',{baseRelease:list.release,items:[{id:'glossary',version:glossaryDraft.data.version}],reviewed:true})).status).toBe(201);
  await page.goto('/redazione');await page.locator('#cms-content-tab').click();await page.locator('[data-resource="media-glossary"]').click();
  await page.locator('[data-record]').selectOption('pliche');
  await page.locator('details.cms-fieldset > summary',{hasText:'Illustrazioni'}).click();
  await expect(page.getByLabel('Immagine generata',{exact:true})).toBeEnabled();
  await page.getByLabel('Didascalia',{exact:true}).fill('Pliche del finferlo: didascalia di prova verificata.');
  await page.locator('[data-save]').click();await expect(page.locator('#cms-status')).toContainText('Bozza salvata');
  await page.locator('[data-preview]').click();await expect(page.locator('#cms-preview img')).toBeVisible();await expect(page.locator('#cms-preview')).toContainText('Japonica');
  await page.locator('[data-publish]').click();await expect(page.locator('#cms-status')).toContainText('Verifica le fonti');
  await page.locator('[data-reviewed]').check();await page.locator('[data-publish]').click();await expect(page.locator('#cms-status')).toContainText('Pubblicato');
  await page.goto('/#/glossario/pliche');await expect(page.locator('#glossary-term-pliche figcaption')).toContainText('didascalia di prova verificata');
  await page.goto('/#/glossario/volva');await page.reload();await expect(page.locator('#glossary-term-volva')).toContainText('Precisazione verificata dalla redazione.');
  // Restore the seed as a new revision, preserving history and isolating later browser tests.
  const restoreItems=[];
  for(const id of ['guides','edible-catalog','glossary','media-glossary']){const current=(await cms(page,'items/'+id)).data;const restored=await cms(page,`items/${id}/restore`,'POST',{version:0},{'if-match':`"${current.version}"`});expect(restored.status).toBe(200);restoreItems.push({id,version:restored.data.version});}
  list=(await cms(page,'items')).data;
  expect((await cms(page,'releases','POST',{baseRelease:list.release,items:restoreItems,reviewed:true})).status).toBe(201);
  expect((await api(page,'/api/content/v1/snapshot')).data.resources.guides).toEqual(original.resources.guides);
  const readonly=(await cms(page,'items/habitat')).data;
  expect((await cms(page,'items/habitat','PATCH',{data:readonly.data},{'if-match':'"0"'})).status).toBe(403);
  await page.setViewportSize({width:390,height:844});await page.goto('/redazione');await page.locator('#cms-content-tab').click();
  await page.locator('[data-resource="glossary"]').click();await page.locator('[data-record]').selectOption({label:'Volva'});await expect(page.getByRole('textbox',{name:'Definizione',exact:true})).toHaveValue(/velo generale/);await expect(page.getByRole('combobox',{name:'Categoria',exact:true})).toHaveValue('Funghi');
  await page.locator('[data-resource="guides"]').click();
  await expect(page.locator('#cms-editor > h2')).toHaveText('Articoli e taccuini');
  await expect(page.getByLabel('Titolo',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'/tmp/fungaroli-cms-mobile.png',fullPage:true});
  expect(errors).toEqual([]);
});
