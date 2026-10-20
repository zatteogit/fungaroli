import {test} from 'node:test';
import assert from 'node:assert/strict';
import {conditionsScore,selectOutingWeather,outingHeadings} from '../js/outing.js';
const weather=level=>({level,available:true});
test('conditions include the existing weather factor once, with no invented score for missing weather',()=>{
 assert.equal(conditionsScore(83,weather('ok')),83);
 assert.equal(conditionsScore(83,weather('sconsigliata')),46);
 assert.equal(conditionsScore(83,weather('attenzione')),71);
 assert.equal(conditionsScore(83,null),null);
 assert.equal(conditionsScore(83,{...weather('ok'),available:false}),null);
 assert.equal(conditionsScore(null,weather('ok')),null);
});
test('bad-weather proposals are excluded when a less critical alternative exists, including held proposals',()=>{
 const bad={id:'bad',w:weather('sconsigliata')},good={id:'good',w:weather('ok')},uncertain={id:'unknown',w:null};
 assert.deepEqual(selectOutingWeather([bad,good,uncertain],c=>c.w),[good]);
 assert.deepEqual(selectOutingWeather([bad],c=>c.w),[bad]);
 assert.deepEqual(selectOutingWeather([bad,good],c=>c.w),[good]);
});
test('all adverse or unverified forecasts cannot produce the good-outings heading',()=>{
 assert.equal(outingHeadings([weather('sconsigliata')]).home,'Con questo meteo, meglio rimandare');
 assert.ok(!outingHeadings([weather('sconsigliata')]).others.includes('buone'));
 assert.equal(outingHeadings([null]).home,'Meteo da verificare');
 assert.equal(outingHeadings([weather('attenzione')]).others,'Altre uscite da valutare');
 assert.equal(outingHeadings([weather('ok')]).others,'Altre buone uscite');
});
