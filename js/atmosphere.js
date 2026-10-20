// Riprese decorative: non rappresentano specie o località consigliate.
export const ATMOSPHERES = Object.freeze({
  'luce-tra-le-foglie': { width:1920, height:1080 },
  'bosco-e-sentiero': { width:1920, height:1080 },
  'autunno': { width:1920, height:1080 },
  'gocce-sulla-felce': { width:1920, height:1080 },
  'ombre-di-foglie': { width:1080, height:1920 },
});
export function homeAtmosphere({walking=false, month=new Date().getMonth()+1}={}) {
  return walking ? 'bosco-e-sentiero' : month>=9 && month<=11 ? 'autunno' : 'luce-tra-le-foglie';
}
export function atmosphere(id,{hero=false, className=''}={}) {
  const clip=ATMOSPHERES[id];if(!clip)return '';
  const base=`assets/video/nature/${id}`,small=clip.width>clip.height?960:540;
  return `<figure class="atmosphere ${className}" data-atmosphere="${id}">
    <span class="atmosphere-media" aria-hidden="true"><img class="atmosphere-still${hero?' cover-img':''}" src="${base}-poster-small.webp" srcset="${base}-poster-small.webp ${small}w, ${base}-poster.webp ${clip.width}w" sizes="${hero?'(max-width:760px) calc(100vw - 28px), 600px':'(max-width:760px) 260px, 320px'}" width="${clip.width}" height="${clip.height}" alt="" loading="${hero?'eager':'lazy'}"${hero?' fetchpriority="high"':''}><video src="${base}-loop.mp4" muted loop playsinline preload="none" tabindex="-1"></video></span>
    <button class="atmosphere-toggle" type="button" hidden aria-label="Metti in pausa il video di atmosfera">Ⅱ Pausa</button>${hero?'<figcaption>Video di atmosfera</figcaption>':''}
  </figure>`;
}
