// Il focus resta nel dialog per tastiera e lettori di schermo.
// Solo l’indicatore visivo dei comandi distingue tocco/puntatore dalla tastiera.
const root=document.documentElement;
const pointer=()=>{root.dataset.focusInput='pointer';};
document.addEventListener('pointerdown',pointer,{capture:true,passive:true});
document.addEventListener('touchstart',pointer,{capture:true,passive:true});
document.addEventListener('keydown',event=>{
 if(!['Shift','Control','Alt','Meta'].includes(event.key))root.dataset.focusInput='keyboard';
},true);
