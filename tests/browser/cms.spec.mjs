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
  db.execute('INSERT INTO accounts(id,handle,created_at) VALUES(?,?,?) ON CONFLICT(id) DO NOTHING',(sys.argv[2],'Matteo' if sys.argv[2]=='cms-test-admin' else 'Lettore',now))
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

test('redazione, bozze, pubblicazione, conflitti, agenti e catalogo condiviso',async({page,browser})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());
  await page.addInitScript(()=>localStorage.setItem('fungaroli:legal-accepted','22026-10-12'));
  await page.goto('/redazione');
  await expect(page.locator('#cms-access-status')).toContainText('Accedi');
  expect((await cms(page,'items')).status).toBe(401);
  const other=await browser.newContext({serviceWorkers:'block'}),reader=await other.newPage();await reader.goto('/redazione');await loginFixture(reader,'cms-test-reader');
  expect((await cms(reader,'me')).data.user.scopes).toEqual([]);expect((await cms(reader,'items')).status).toBe(403);await other.close();
  await loginFixture(page);await page.reload();
  await expect(page.locator('#cms-workspace')).toBeVisible();
  await expect(page.locator('[data-profile-label]')).toHaveText('Matteo');
  await expect(page.locator('[data-resource]')).toHaveCount(17);
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
  // Restore the seed as a new revision, preserving history and isolating later browser tests.
  const restoreItems=[];
  for(const id of ['guides','edible-catalog']){const current=(await cms(page,'items/'+id)).data;const restored=await cms(page,`items/${id}/restore`,'POST',{version:0},{'if-match':`"${current.version}"`});expect(restored.status).toBe(200);restoreItems.push({id,version:restored.data.version});}
  list=(await cms(page,'items')).data;
  expect((await cms(page,'releases','POST',{baseRelease:list.release,items:restoreItems,reviewed:true})).status).toBe(201);
  expect((await api(page,'/api/content/v1/snapshot')).data.resources.guides).toEqual(original.resources.guides);
  const readonly=(await cms(page,'items/habitat')).data;
  expect((await cms(page,'items/habitat','PATCH',{data:readonly.data},{'if-match':'"0"'})).status).toBe(403);
  await page.setViewportSize({width:390,height:844});await page.goto('/redazione');await page.locator('[data-resource="guides"]').click();
  await expect(page.locator('#cms-editor > h2')).toHaveText('Articoli e taccuini');
  await expect(page.getByLabel('Titolo',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'/tmp/fungaroli-cms-mobile.png',fullPage:true});
  expect(errors).toEqual([]);
});
