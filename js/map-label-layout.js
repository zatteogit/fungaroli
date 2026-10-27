const overlaps=(a,b,gap=6)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;

// Dimensioni reali del DOM, ordine stabile, nessuna etichetta forzata dopo i tentativi.
// Le zone senza spazio restano nei cerchi e nell'elenco accessibile della mappa.
export function layoutMapLabels(items,{width,height,blocked=[],maxNames=8,padding=8}={}){
 const placed=[...blocked],result=new Map();let names=0;
 const ordered=[...items].sort((a,b)=>Number(b.selected)-Number(a.selected)||(b.priority||0)-(a.priority||0)||a.id.localeCompare(b.id));
 for(const it of ordered){
  if(it.x<0||it.y<0||it.x>width||it.y>height){result.set(it.id,null);continue;}
  let choice=null;
  for(const compact of it.selected?[false]:names<maxNames?[false,true]:[true]){
   const [w,h]=compact?it.compact:it.full;
   if(!w||!h||w>width-padding*2||h>height-padding*2)continue;
   const offsets=compact?[[0,0],[0,24],[0,-24],[24,0],[-24,0],[0,48],[0,-48]]:[[0,0],[0,32],[0,-32],[0,64],[0,-64],[32,0],[-32,0]];
   for(const [dx,dy] of offsets){
    const x=Math.max(padding,Math.min(width-padding-w,it.x+dx-w/2)),y=Math.max(padding,Math.min(height-padding-h,it.y+dy-h/2));
    const box={x,y,w,h};
    if(placed.some(b=>overlaps(box,b)))continue;
    choice={...box,compact,cx:x+w/2,cy:y+h/2};break;
   }
   if(choice)break;
  }
  if(choice){placed.push(choice);if(!choice.compact)names++;}
  result.set(it.id,choice);
 }
 return result;
}
