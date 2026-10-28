// Direction hysteresis and rubber-band clamp, adapted from Vulcan's liquid nav.
// Compact is density, never visibility: all four destinations remain usable.
export function createDockScroll(){
 let last=0,travel=0,compact=false;
 return {
  reset(y=0,keepCompact=false){last=y;travel=0;compact=keepCompact;return compact;},
  read(raw,max){
   const y=Math.min(Math.max(0,raw),Math.max(0,max)),dy=y-last;last=y;
   if(Math.abs(dy)>=.5)travel=Math.sign(dy)===Math.sign(travel)?travel+dy:dy;
   const next=y<96?false:y>140&&travel>28?true:travel< -20?false:compact;
   if(y<96||next!==compact)travel=0;
   compact=next;return compact;
  }
 };
}

// One spring for all dimensions and fades. Keep velocity on reversal.
// Vulcan navigation preset: stiffness 360, damping 31, mass .72.
export function stepDockSpring(value,velocity,target,seconds){
 const duration=Math.min(.064,Math.max(0,seconds)),steps=Math.max(1,Math.ceil(duration*120)),dt=duration/steps;
 for(let i=0;i<steps;i++){
  velocity+=((360*(target-value)-31*velocity)/.72)*dt;
  value+=velocity*dt;
 }
 if(Math.abs(target-value)<.0005&&Math.abs(velocity)<.008)return {value:target,velocity:0,settled:true};
 return {value,velocity,settled:false};
}

export function initNavigationDock(bar){
 const root=document.documentElement,mobile=matchMedia('(max-width:899px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const direction=createDockScroll();
 let max=0,value=0,velocity=0,target=0,frame=0,lastTime=0,pressing=false,pointerId=null,keyboardFocus=false,locked=false;
 const y=()=>Math.min(Math.max(scrollY,0),max);
 const write=()=>{bar.style.setProperty('--nav-collapse',String(Math.max(0,Math.min(1,value))));};
 const tick=time=>{
  frame=0;if(pressing||document.hidden)return;
  if(reduced.matches||!mobile.matches){value=target;velocity=0;lastTime=0;write();bar.removeAttribute('data-morphing');return;}
  const next=stepDockSpring(value,velocity,target,lastTime?(time-lastTime)/1000:1/60);lastTime=time;
  value=next.value;velocity=next.velocity;write();
  if(!next.settled)frame=requestAnimationFrame(tick);else{lastTime=0;bar.removeAttribute('data-morphing');}
 };
 const animate=()=>{
  if(pressing)return;
  if(reduced.matches||!mobile.matches){cancelAnimationFrame(frame);frame=0;lastTime=0;velocity=0;value=target;write();bar.removeAttribute('data-morphing');return;}
  if(value===target&&!velocity)return;
  bar.dataset.morphing='';if(!frame){lastTime=0;frame=requestAnimationFrame(tick);}
 };
 const set=compact=>{
  const next=compact?1:0;if(next===target)return;
  target=next;bar.dataset.compact=String(compact);animate();
 };
 const resync=()=>{direction.reset(y());set(false);};
 const measure=()=>{
  const next=Math.max(0,document.documentElement.scrollHeight-innerHeight);
  const clamped=next<max&&scrollY>=next-1;max=next;
  if(clamped)direction.reset(y(),target===1);
 };
 const resize=()=>{measure();direction.reset(y(),target===1);if(!mobile.matches)set(false);else animate();};
 // Observers update page geometry; the scroll path reads only scrollY and cached max.
 const observer=new ResizeObserver(measure);observer.observe(document.body);observer.observe(document.documentElement);
 const viewportChange=()=>{measure();direction.reset(y(),target===1);};
 const updateLock=()=>{
  locked=root.classList.contains('kb-open')||document.body.hasAttribute('data-legal-pending')||!!document.querySelector('dialog[open]');
  if(locked)resync();
 };
 const classes=new MutationObserver(updateLock);classes.observe(root,{attributes:true,attributeFilter:['class']});
 const focus=event=>{
  keyboardFocus=bar.contains(event.target)&&event.target.matches(':focus-visible');
  if(keyboardFocus)resync();
 };
 bar.addEventListener('focusout',()=>queueMicrotask(()=>{keyboardFocus=bar.contains(document.activeElement)&&document.activeElement.matches(':focus-visible');}));
 document.addEventListener('focusin',focus);
 bar.addEventListener('pointerdown',event=>{
  if(!mobile.matches||!event.isPrimary)return;
  pressing=true;pointerId=event.pointerId;cancelAnimationFrame(frame);frame=0;lastTime=0;
 },{capture:true,passive:true});
 const release=event=>{
  if(!pressing||event?.pointerId!=null&&event.pointerId!==pointerId)return;
  pressing=false;pointerId=null;
  // Click/default navigation runs before geometry resumes on the next frame.
  requestAnimationFrame(()=>animate());
 };
 window.addEventListener('pointerup',release,{passive:true});window.addEventListener('pointercancel',release,{passive:true});
 window.addEventListener('blur',()=>release());window.addEventListener('hashchange',resync);
 window.addEventListener('resize',resize,{passive:true});
 globalThis.visualViewport?.addEventListener('resize',viewportChange,{passive:true});
 mobile.addEventListener('change',()=>{resize();resync();});reduced.addEventListener('change',animate);
 document.addEventListener('toggle',updateLock,{capture:true});document.addEventListener('close',updateLock,{capture:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;lastTime=0;}else{measure();resync();animate();}});
 for(const link of bar.querySelectorAll('a')){
  const label=link.textContent.trim();link.setAttribute('aria-label',label);link.title=label;
 }
 bar.dataset.compact='false';measure();write();updateLock();
 return {
  resync,
  update(){
   if(!mobile.matches||locked||keyboardFocus||document.body.dataset.page==='mappa'){direction.reset(y());set(false);return;}
   set(direction.read(scrollY,max));
  }
 };
}
