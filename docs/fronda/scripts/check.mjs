import {readFileSync,existsSync} from 'node:fs';import {spawnSync} from 'node:child_process';import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {rendered} from './build-tokens.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');let failures=[];
if(rendered!==readFileSync(resolve(root,'styles/tokens.css'),'utf8'))failures.push('CSS token non allineati alla fonte JSON');
for(const file of ['index.html','product.html']){
const html=readFileSync(resolve(root,file),'utf8');
for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){const u=m[1];if(/^(?:#|https?:|mailto:|data:)/.test(u))continue;if(!existsSync(resolve(root,u.split('#')[0].split('?')[0])))failures.push('Risorsa assente: '+u)}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(ids.length!==new Set(ids).size)failures.push('ID HTML duplicati');
for(const m of html.matchAll(/(?:href="#|aria-controls=")([^"]+)"/g))if(!m[1].startsWith('/')&&!ids.includes(m[1]))failures.push('Target assente: '+m[1]);
}
const source=JSON.parse(readFileSync(resolve(root,'content-source.json'),'utf8'));
const content=JSON.parse(readFileSync(resolve(root,'content.json'),'utf8'));
if(content.zones.length!==15||content.catalog.length!==12||content.guides.length!==3||content.glossary.length!==47)failures.push('Contenuti di studio incompleti');
const embedded=readFileSync(resolve(root,'product.html'),'utf8').match(/<script id="project-data" type="application\/json">([\s\S]*?)<\/script>/);
if(!embedded||JSON.stringify(JSON.parse(embedded[1]))!==JSON.stringify(content))failures.push('Dati del prototipo non allineati a content.json');
const r=spawnSync(process.execPath,['scripts/ds-guard.mjs'],{cwd:root,encoding:'utf8'});process.stdout.write(r.stdout||'');if(r.status!==0)failures.push('Guard del design system fallito');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}console.log('✓ Token allineati; risorse e ancore presenti; ID univoci.');
