import {effectsQuality,EFFECTS_CHANGE} from './adaptive-effects.js';
// Un solo video decorativo attivo: still prima, video soltanto con buffer e frame pronto.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const mounted=new Map();let active,preferred,manualPaused=false,scheduled=false;
const allowed=()=>!reduced.matches&&!navigator.connection?.saveData&&effectsQuality()==='full';
const visible=c=>c.ratio>0&&c.root.isConnected&&!c.root.closest('[hidden],[inert]');
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(sync);}}
function sync(){
  scheduled=false;
  for(const [video,c] of mounted)if(!video.isConnected){c.dispose();mounted.delete(video);}
  for(const root of document.querySelectorAll('[data-atmosphere]')){
    const video=root.querySelector('video');if(video&&!mounted.has(video))mounted.set(video,mount(root,video));
  }
  const candidates=[...mounted.values()].filter(visible);
  const canPlay=allowed()&&!manualPaused&&!document.hidden&&!document.querySelector('dialog[open]');
  active=canPlay?(candidates.find(c=>c===preferred)||candidates.find(c=>c===active)||candidates[0]):null;
  preferred=null;
  for(const c of mounted.values())c.apply(c===active);
}
function mount(root,video){
  const still=root.querySelector('.atmosphere-still'),button=root.querySelector('.atmosphere-toggle');
  let disposed=false,stillRequested=false,imageReady=false,loaded=false,failed=false,shown=false,starting=false,frameRequest;
  const c={root,ratio:0,apply,dispose};
  const wanted=()=>!disposed&&active===c&&allowed()&&!manualPaused&&!document.hidden&&!failed;
  const buffered=()=>{
    if(video.readyState<HTMLMediaElement.HAVE_FUTURE_DATA)return false;
    for(let i=0;i<video.buffered.length;i++)if(video.buffered.start(i)<=video.currentTime+.05&&video.buffered.end(i)>video.currentTime)
      return video.buffered.end(i)-video.currentTime>=2||video.buffered.end(i)>=video.duration-.05;
    return false;
  };
  function paint(){
    const ready=shown&&allowed()&&!failed?'true':'false';
    if(video.dataset.videoReady!==ready)video.dataset.videoReady=ready;
    const hide=!allowed()||failed||(!shown&&!manualPaused);
    if(button.hidden!==hide)button.hidden=hide;
    const text=video.paused?'▶ Riprendi':'Ⅱ Pausa',label=video.paused?'Riprendi il video di atmosfera':'Metti in pausa il video di atmosfera';
    if(button.textContent!==text)button.textContent=text;
    if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
  }
  function showFrame(){frameRequest=null;if(wanted()&&!video.paused&&buffered())shown=true;paint();}
  function playing(){if(frameRequest!=null||disposed)return;if(video.requestVideoFrameCallback)frameRequest=video.requestVideoFrameCallback(showFrame);else requestAnimationFrame(showFrame);}
  function apply(selected){
    if(disposed)return;
    if(!selected||!wanted()){
      if(!video.paused)video.pause();
      if(!allowed())shown=false;
    }else if(!stillRequested){
      stillRequested=true;still.loading='eager';
      const decoded=still.decode?still.decode():Promise.resolve();
      decoded.catch(()=>{}).then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{imageReady=true;schedule();})));
    }else if(imageReady){
      video.preload='auto';
      if(!loaded){loaded=true;video.load();}
      else if(buffered()){
        if(video.paused&&!starting){
          starting=true;video.muted=true;
          video.play().then(playing).catch(error=>{shown=false;if(wanted()&&error.name!=='AbortError')manualPaused=true;}).finally(()=>{starting=false;paint();});
        }else if(!video.paused&&!shown)playing();
      }
    }
    paint();
  }
  const toggle=()=>{manualPaused=!video.paused;preferred=manualPaused?null:c;schedule();};
  const hover=event=>{
    if(!allowed()||!visible(c)||event.pointerType==='touch')return;
    const rect=root.getBoundingClientRect();
    root.classList.toggle('is-hovered',event.pointerType!=='touch'&&event.clientX>=rect.left&&event.clientX<rect.right&&event.clientY>=rect.top&&event.clientY<rect.bottom);
  };
  const leave=()=>root.classList.remove('is-hovered');
  document.addEventListener('pointermove',hover,{passive:true});
  document.addEventListener('pointerleave',leave);
  const waiting=()=>{shown=false;paint();};
  const error=()=>{failed=true;shown=false;video.pause();paint();};
  const progress=()=>apply(active===c);
  const events=[['playing',playing],['pause',paint],['waiting',waiting],['error',error],['canplay',progress],['progress',progress]];
  events.forEach(([event,fn])=>video.addEventListener(event,fn));button.addEventListener('click',toggle);
  const observer=new IntersectionObserver(([entry])=>{c.ratio=entry.isIntersecting?entry.intersectionRatio:0;schedule();});observer.observe(root);
  function dispose(){disposed=true;observer.disconnect();document.removeEventListener('pointermove',hover);document.removeEventListener('pointerleave',leave);if(frameRequest!=null)video.cancelVideoFrameCallback?.(frameRequest);events.forEach(([event,fn])=>video.removeEventListener(event,fn));button.removeEventListener('click',toggle);video.pause();}
  return c;
}
reduced.addEventListener('change',schedule);navigator.connection?.addEventListener('change',schedule);document.addEventListener('visibilitychange',schedule);
document.addEventListener(EFFECTS_CHANGE,schedule);
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','inert','open']});
schedule();
