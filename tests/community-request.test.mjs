import test from 'node:test';
import assert from 'node:assert/strict';
import {communityRequest} from '../js/community.js';
test('a malformed success response cannot falsely confirm a notebook mutation',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('Gateway unavailable',{status:200});
 try{await assert.rejects(communityRequest('reports','POST',{entryId:'test'}),/risposta non valida/);}finally{globalThis.fetch=original;}
});
test('an aborted response body preserves cancellation instead of returning an empty success',async()=>{
 const original=globalThis.fetch,controller=new AbortController(),reason=new DOMException('Request expired','TimeoutError');controller.abort(reason);
 globalThis.fetch=async(_url,options)=>{assert.equal(options.signal,controller.signal);return {ok:true,json:async()=>{throw new Error('Body aborted');}};};
 try{await assert.rejects(communityRequest('reports','DELETE',{entryId:'test'},{signal:controller.signal}),e=>e===reason);}finally{globalThis.fetch=original;}
});
test('non-JSON service failures retain their HTTP status for retry and session handling',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('Bad gateway',{status:503});
 try{await assert.rejects(communityRequest('entries/test','DELETE'),e=>e.status===503&&/Riprova/.test(e.message));}finally{globalThis.fetch=original;}
});
