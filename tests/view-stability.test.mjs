// Stabilità della pagina (decisione di Matteo del 24/10/2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import {freshness,viewSignature,compareViews,updatePolicy,FRESH_MS,OUTING_VALID_MS,GROWTH_VALID_MS} from '../js/view-stability.js';
const now=Date.parse('2026-10-24T10:00:00Z'),ago=ms=>new Date(now-ms);
const c=(id,o=0,level='ok',thunder=false)=>({z:{id},o,weather:{level,thunder}});

test('freschezza: fresco, datato, scaduto, assente',()=>{
 assert.equal(freshness(ago(FRESH_MS-1),now),'fresh');
 assert.equal(freshness(ago(FRESH_MS),now),'dated');
 assert.equal(freshness(ago(OUTING_VALID_MS),now),'expired');
 assert.equal(freshness(ago(5*FRESH_MS),now,GROWTH_VALID_MS),'dated','la crescita resta valida fino a 24 h');
 assert.equal(freshness(null,now),'missing');assert.equal(freshness('non una data',now),'missing');
});
test('cambia poco: stessa copertina e stesso ordine delle prime tre',()=>{
 const a=viewSignature([c('a'),c('b'),c('c'),c('d')]);
 assert.equal(compareViews(a,viewSignature([c('a'),c('b'),c('c'),c('e')])).kind,'same','oltre il terzo posto non conta');
 assert.equal(compareViews(a,viewSignature([c('b'),c('a'),c('c')])).kind,'major','cambia la copertina');
 assert.equal(compareViews(a,viewSignature([c('a'),c('c'),c('b')])).kind,'major','cambia l’ordine delle prime tre');
 assert.equal(compareViews(a,viewSignature([c('a',1),c('b'),c('c')])).kind,'major','stessa zona, altro giorno');
 assert.equal(compareViews(null,a).kind,'major');
});
test('sicurezza: un peggioramento delle card visibili si segnala subito',()=>{
 const a=viewSignature([c('a'),c('b'),c('c')]);
 const r=compareViews(a,viewSignature([c('a'),c('b','0','ok',true),c('c','0','sconsigliata')].map(x=>({...x,o:0}))));
 assert.deepEqual([r.kind,r.alerts],['values',['b|0','c|0']]);
 assert.deepEqual(compareViews(viewSignature([c('a','0','sconsigliata')].map(x=>({...x,o:0}))),viewSignature([c('a','0','sconsigliata')].map(x=>({...x,o:0})))).alerts,[],'già segnalata prima');
});
test('politica: si rimanda solo un cambio grande a pagina già letta',()=>{
 assert.equal(updatePolicy({kind:'values',shownAt:now-60000,now}),'apply');
 assert.equal(updatePolicy({kind:'major',shownAt:now-1000,now}),'apply','pagina appena aperta');
 assert.equal(updatePolicy({kind:'major',shownAt:now-1000,now,scrolled:true}),'defer','ha già cominciato a leggere');
 assert.equal(updatePolicy({kind:'major',shownAt:now-5000,now}),'defer');
 assert.equal(updatePolicy({kind:'major',shownAt:NaN,now}),'defer');
});
