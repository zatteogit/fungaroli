#!/usr/bin/env node
// Tokens are read from the environment and never echoed or written to disk.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {CONTENT_RESOURCES} from '../js/content-schema.js';
const [command,id,file]=process.argv.slice(2),base=(process.env.CMS_URL||'https://fungaroli.zatteo.workers.dev').replace(/\/$/,'');
async function call(path,method='GET',data,headers={}){
  if(!process.env.CMS_TOKEN)throw new Error('Imposta CMS_TOKEN con una credenziale dedicata della redazione.');
  const res=await fetch(base+'/api/cms/v1/'+path,{method,headers:{authorization:'Bearer '+process.env.CMS_TOKEN,...(data?{'content-type':'application/json'}:{}),...headers},body:data?JSON.stringify(data):undefined});
  const out=await res.json();if(!res.ok)throw new Error(`${res.status}: ${out.error}`);return out;
}
try{
  let out;
  if(command==='list')out=await call('items');
  else if(command==='schemas')out=await call('schemas');
  else if(command==='get'){out=await call('items/'+id);if(file){await writeFile(file,JSON.stringify({id:out.id,version:out.version,data:out.data},null,2)+'\n');out={id,version:out.version,file};}}
  else if(command==='validate'||command==='save'){
    if(!id||!file)throw new Error('Indica sezione e file JSON.');
    const input=JSON.parse(await readFile(file,'utf8')),data=input.data||input;
    if(command==='validate')out=await call(`items/${id}/validate`,'POST',{data});
    else {const version=input.version??Number(process.argv[process.argv.indexOf('--version')+1]);if(!Number.isInteger(version))throw new Error('Indica la revisione di partenza nel file o con --version.');out=await call('items/'+id,'PATCH',{data},{'if-match':`"${version}"`});out={id:out.id,version:out.version,needsReview:out.needsReview};}
  }
  else if(command==='publish'){
    const version=Number(process.argv[process.argv.indexOf('--version')+1]);if(!Number.isInteger(version))throw new Error('Indica la revisione da pubblicare con --version.');
    const list=await call('items');
    out=await call('releases','POST',{baseRelease:list.release,items:[{id,version}],reviewed:process.argv.includes('--reviewed')});
  }
  else if(command==='revisions')out=await call(`items/${id}/revisions`);
  else if(command==='export'){
    const res=await fetch(base+'/api/content/v1/snapshot',{cache:'no-cache'});if(!res.ok)throw new Error('Export pubblico non disponibile.');
    const snapshot=await res.json(),target=id||'/tmp/fungaroli-content';await mkdir(target,{recursive:true});
    for(const r of CONTENT_RESOURCES)await writeFile(`${target}/${r.id}.json`,JSON.stringify(snapshot.resources[r.id],null,2)+'\n');
    out={release:snapshot.release,directory:target,documents:CONTENT_RESOURCES.length};
  }else throw new Error('Comandi: list, schemas, get <sezione> [file], validate <sezione> <file>, save <sezione> <file>, publish <sezione> --version <n> [--reviewed], revisions <sezione>, export [directory].');
  process.stdout.write(JSON.stringify(out,null,2)+'\n');
}catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}
