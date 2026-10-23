// Riprese decorative: non rappresentano specie o località consigliate.
export const ATMOSPHERES = Object.freeze({
  'canneto-verde-sereno': {width:1280,height:720,base:'assets/video/places/canneto-verde-sereno',manifest:'assets/video/places/manifest.json'},
  'tancia-autunno-asciutto': {width:1280,height:720,base:'assets/video/places/tancia-autunno-asciutto',manifest:'assets/video/places/manifest.json'},
  'luce-tra-le-foglie': { width:1920, height:1080 },
  'bosco-e-sentiero': { width:1920, height:1080 },
  'autunno': { width:1920, height:1080 },
  'gocce-sulla-felce': { width:1920, height:1080 },
  'ombre-di-foglie': { width:1080, height:1920 },
});
// Zona e giorno variano la ripresa; gli aggiornamenti meteo conservano la stessa clip.
export function homeAtmosphere({walking=false, plants=false, zone='', date='', offset=0, month=new Date().getMonth()+1}={}) {
  const autumn=month>=9&&month<=11;
  const pool=plants?['gocce-sulla-felce','luce-tra-le-foglie','bosco-e-sentiero']
    :walking?['bosco-e-sentiero','luce-tra-le-foglie','gocce-sulla-felce']
    :['luce-tra-le-foglie','bosco-e-sentiero','gocce-sulla-felce'];
  if(autumn)plants||walking?pool.push('autunno'):pool.unshift('autunno');
  const hash=[...zone].reduce((n,c)=>(Math.imul(n,31)+c.codePointAt(0))>>>0,0);
  const parsed=Date.parse(date),day=Number.isFinite(parsed)?Math.floor(parsed/86400000):0;
  return pool[((hash+day+offset)%pool.length+pool.length)%pool.length];
}
// Nella visita corrente ogni proposta conserva la sua clip; una nuova evita quella appena vista.
export function createHomeAtmospherePicker() {
  const picks=new Map();let previous;
  return options=>{
    const key=JSON.stringify([options.zone,options.date,!!options.walking,!!options.plants,options.month]);
    if(!picks.has(key)){
      const clip=homeAtmosphere(options);
      picks.set(key,clip===previous?homeAtmosphere({...options,offset:1}):clip);
    }
    previous=picks.get(key);return previous;
  };
}
export function atmosphere(id,{hero=false, className='',kind='stock'}={}) {
  const clip=ATMOSPHERES[id];if(!clip)return '';
  const base=clip.base||`assets/video/nature/${id}`,small=clip.width>clip.height?960:540;
  return `<figure class="${['atmosphere',className].filter(Boolean).join(' ')}" data-atmosphere="${id}" data-cover-kind="${kind}">
    <span class="atmosphere-media" aria-hidden="true"><img class="atmosphere-still${hero?' cover-img':''}" src="${base}-poster-small.webp" srcset="${base}-poster-small.webp ${small}w, ${base}-poster.webp ${clip.width}w" sizes="${hero?'(max-width:760px) calc(100vw - 28px), 600px':'(max-width:760px) 260px, 320px'}" width="${clip.width}" height="${clip.height}" alt="" loading="${hero?'eager':'lazy'}"${hero?' fetchpriority="high"':''}><video src="${base}-loop.mp4" muted loop playsinline preload="none" tabindex="-1"></video></span>
    <button class="atmosphere-toggle" type="button" hidden aria-label="Metti in pausa il video di atmosfera">Ⅱ Pausa</button>
  </figure>`;
}
