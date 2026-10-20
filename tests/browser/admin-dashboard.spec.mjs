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

for(const width of [320,390,1280])test(`dashboard amministrativa: limite reale, storico e contenuti a ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:844});
 await page.route('https://**/*',r=>r.abort());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await loginFixture(page);await page.goto('/redazione');await page.locator('[data-workspace="policy"]').click();
 const panel=page.locator('#cms-dashboard');await expect(panel.getByRole('heading',{name:'Il polso di Fronda'})).toBeVisible();
 await expect(panel).toContainText('Nessun effetto automatico sul modello.');
 const input=panel.getByRole('spinbutton',{name:'Influenza massima (%)'}),old=Number(await input.inputValue()),cap=old===4?0:4;
 await panel.getByLabel('Motivo della modifica').fill('Bozza conservata fra sezioni');await page.locator('#cms-content-tab').click();await page.locator('[data-workspace="policy"]').click();await expect(panel.getByLabel('Motivo della modifica')).toHaveValue('Bozza conservata fra sezioni');
 await input.fill(String(cap));await expect(panel.locator('#admin-preview')).toContainText(cap===0?'Segnalazioni escluse':'Le soglie minime');
 await panel.getByLabel('Motivo della modifica').fill('Prova locale del limite e dello storico');
 await panel.getByRole('button',{name:'Salva limite',exact:true}).click();
 await expect(panel.locator('[data-admin-status]')).toHaveText('Limite salvato. La modifica è registrata nello storico.');
 expect((await cms(page,'dashboard')).data.policy.maxPercent).toBe(cap);
 await expect(panel.locator('.admin-history li').first()).toContainText(`${old}% → ${cap}%`);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await panel.getByRole('button',{name:'Consulta ed esporta'}).click();await expect(page.locator('#cms-survey-dialog')).toBeVisible();await page.locator('#cms-survey-dialog [data-close]').click();
 await page.locator('#cms-content-tab').click();await expect(page.locator('#cms-content')).toBeVisible();
 await page.locator('[data-workspace="policy"]').click();await expect(panel).toBeVisible();
 await expect(panel.getByRole('spinbutton')).toHaveValue(String(cap));expect(errors).toEqual([]);
 if(width===390)await page.screenshot({path:'/tmp/fronda-dashboard-390.png',fullPage:true});
});
test('errore di lettura: nessun dato inventato e riprova raggiungibile',async({page})=>{
 await loginFixture(page);await page.route('**/api/cms/v1/dashboard',r=>r.fulfill({status:503,json:{error:'Dati temporaneamente indisponibili'}}));
 await page.goto('/redazione');await page.locator('[data-workspace="policy"]').click();const panel=page.locator('#cms-dashboard');await expect(panel).toContainText('Dati temporaneamente indisponibili');await expect(panel.getByRole('button',{name:'Riprova'})).toBeVisible();await expect(panel.locator('[data-policy]')).toHaveCount(0);
 await page.unroute('**/api/cms/v1/dashboard');await panel.getByRole('button',{name:'Riprova'}).click();await expect(panel.locator('[data-policy]')).toBeVisible();
});
