// Device-local, owner-scoped UI preferences. No account or observation requests.
export function createHomeIntro({local,session,id=()=>crypto.randomUUID()}={}){
 const read=(store,key)=>{try{return JSON.parse(store?.getItem(key)||'null');}catch{return null;}};
 const write=(store,key,value)=>{try{store?.setItem(key,JSON.stringify(value));}catch{/* Session still works without storage. */}};
 const sid=read(session,'fronda:home-session:v1')||id();write(session,'fronda:home-session:v1',sid);
 const records=new Map();let activeOwner=null,activeMode=null;
 const key=owner=>'fronda:home-intro:v2:'+owner;
 const record=owner=>{if(!records.has(owner))records.set(owner,read(local,key(owner))||{dismissed:owner==='guest'&&read(local,'fronda:community-card-dismissed:v1')===1});return records.get(owner);};
 const patch=(owner,values)=>{const value={...record(owner),...values};records.set(owner,value);write(local,key(owner),value);};
 return {
  mode(owner,hasProposals,{pending=false}={}){owner ||= 'guest';if(activeOwner!==owner){activeOwner=owner;activeMode=null;}const r=record(owner);if(pending&&!activeMode)return r.dismissed?'hidden':'compact';return activeMode ||= r.dismissed?'hidden':r.experienced||r.seenSession&&r.seenSession!==sid||!hasProposals?'compact':'expanded';},
  seen(owner){patch(owner||'guest',{seenSession:sid});},
  experienced(owner){patch(owner||'guest',{experienced:true});},
  open(owner){activeOwner=owner||'guest';activeMode='expanded';},
  dismiss(owner){patch(owner||'guest',{dismissed:true});activeMode='hidden';},
  leave(){activeMode=null;}
 };
}
