import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {plantPairContext} from '../js/plant-pair-context.js';
import {outingDocumentation} from '../js/outing-documentation.js';
import {layoutMapLabels} from '../js/map-label-layout.js';
const read=name=>JSON.parse(readFileSync(new URL(`../data/${name}.json`,import.meta.url)));

test('note botaniche della coppia, anche invertita; nessuna istruzione di un terzo sosia',()=>{
 const data=read('recognize-plants');
 const pair=plantPairContext(data,'aglio-orsino','colchico');
 assert.equal(pair.differences.length,1);assert.doesNotMatch(JSON.stringify(pair.differences),/croco|stami/);
 assert.match(pair.cautions[0],/odore non è una prova/);
 assert.deepEqual(plantPairContext(data,'colchico','aglio-orsino').differences,pair.differences);
 assert.deepEqual(plantPairContext(data,'colchico','aglio-orsino').cautions,pair.cautions);
 assert.equal(plantPairContext(data,'colchico','croco').differences.length,2);
 assert.equal(plantPairContext(data,'aglio-orsino','croco').differences.length,0);
 assert.equal(pair.others.length,2);
 assert.equal(plantPairContext(data,'ortica','aglio-orsino').documented,false);
 for(const relation of data.confusables.filter(c=>c.ids.length>2))for(const p of relation.pairs){
  assert.equal(p.ids.length,2);assert.ok(p.ids.every(id=>relation.ids.includes(id)));
  assert.ok(p.differences.every(([,text])=>relation.differences.some(([,source])=>text.split(' / ').every(part=>source.includes(part)))));
 }
});

test('dati pratici: nessun itinerario inventato e nessuna modifica dell’indice',()=>{
 const id='pnalm-settefrati-canneto',zone=read('zones').zones.find(z=>z.id===id);
 const args={trails:read('trails').zones[id]?.trails||[],access:read('access').zones[id]||[]};
 const before=JSON.stringify({zone,args}),info=outingDocumentation(zone,args);
 assert.equal(info.label,'Sentiero e accesso non documentati');assert.equal(info.trailCount,0);assert.equal(info.hasAccess,false);
 assert.deepEqual(info.missing,['Sentiero','Arrivo in auto']);assert.equal(JSON.stringify({zone,args}),before);
 const mapped={lines:[[[42,12],[42.01,12.01]]],total_km:1,in_zone_km:1};
 const partial=outingDocumentation({parking:[{lat:42,lon:12}]},{trails:[mapped]});
 assert.equal(partial.trailCount,1);assert.equal(partial.hasAccess,true);
 assert.ok(partial.missing.includes('Ritorno'));assert.ok(partial.missing.includes('Tempo totale a piedi'));
 assert.equal(outingDocumentation({parking:[]},{trails:[{lines:[]}]}).trailCount,0);
});

test('etichette mappa: dense, lunghe, fuori schermo e selezionata; nessuna collisione forzata',()=>{
 for(const width of [320,390,768,1280]){
  const items=Array.from({length:36},(_,i)=>({id:String(i),x:width/2+(i%5)*4,y:180+Math.floor(i/5)*4,full:[i===0?260:180,30],compact:[50,24],priority:i,selected:i===0}));
  items.push({id:'outside',x:-20,y:180,full:[180,30],compact:[50,24]});
  const blocked=[{x:12,y:0,w:width-24,h:90}],positions=layoutMapLabels(items,{width,height:600,blocked,maxNames:5});
  assert.equal(positions.get('outside'),null);assert.ok(positions.get('0'));assert.equal(positions.get('0').compact,false);
  const visible=[...positions.values()].filter(Boolean);assert.ok(visible.length<items.length);
  assert.ok(visible.filter(p=>!p.compact).length<=5);
  visible.forEach((p,i)=>{assert.ok(p.x>=8&&p.y>=8&&p.x+p.w<=width-8&&p.y+p.h<=592);for(const q of [...visible.slice(i+1),...blocked])assert.ok(p.x+p.w<=q.x||q.x+q.w<=p.x||p.y+p.h<=q.y||q.y+q.h<=p.y);});
  assert.deepEqual(layoutMapLabels([...items].reverse(),{width,height:600,blocked,maxNames:5}),positions);
 }
});
