import test from 'node:test';
import assert from 'node:assert/strict';
import {contextCanAnnotate} from '../js/contextual-navigation.js';
test('il contesto propone l’appunto solo dopo una scelta o nel Taccuino',()=>{
 for(const page of ['diario','zona','specie-dettaglio','fungo','commestibile','pianta','albero','animale','guide'])assert.equal(contextCanAnnotate(page),true,page);
 for(const page of ['uscite','mappa','specie','piante','alberi','animali','riconosci','info','impara','giri',''])assert.equal(contextCanAnnotate(page),false,page);
});
