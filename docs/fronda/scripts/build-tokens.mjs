import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const t=JSON.parse(readFileSync(resolve(root,'tokens.json'),'utf8'));
const alias=v=>{const m=/^\{(primitive|semantic)\.([^}]+)\}$/.exec(v);if(!m)throw Error('Invalid alias '+v);return `var(--${m[1]==='primitive'?'_ref-':''}${m[2]})`};
export const rendered='/* Fronda 1.1 — generated from tokens.json; private → semantic → component. */\n:root {\n'+Object.entries(t.primitive).map(([k,v])=>`  --_ref-${k}: ${v.$value};\n`).join('')+Object.entries(t.semantic).map(([k,v])=>`  --${k}: ${alias(v.$value)};\n`).join('')+Object.entries(t.component).map(([k,v])=>`  --${k}: ${alias(v.$value)};\n`).join('')+'}\n[data-theme="dark"] {\n'+Object.entries(t.$extensions['fronda.modes'].dark).map(([k,v])=>`  --${k}: ${alias(v)};\n`).join('')+'}\n';
if(process.argv.includes('--write'))writeFileSync(resolve(root,'styles/tokens.css'),rendered);
