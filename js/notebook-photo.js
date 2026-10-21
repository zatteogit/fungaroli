// Una copia privata leggera: canvas rimuove metadati e coordinate EXIF.
export const MAX_PHOTO_BYTES=120_000;
export function normalizeNotebookPhoto(photo){
 if(photo==null)return null;
 if(!photo||typeof photo.data!=='string'||photo.data.length>160_024||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.data)||!Number.isInteger(photo.width)||!Number.isInteger(photo.height)||Math.min(photo.width,photo.height)<1||Math.max(photo.width,photo.height)>1280)throw Error('Fotografia non valida: scegli di nuovo un’immagine.');
 const raw=atob(photo.data.split(',')[1]);
 if(raw.length>MAX_PHOTO_BYTES||!raw.startsWith('\xff\xd8')||!raw.endsWith('\xff\xd9'))throw Error('Fotografia non valida o troppo grande.');
 return {data:photo.data,width:photo.width,height:photo.height};
}
export async function prepareNotebookPhoto(file){
 if(!file||!file.type.startsWith('image/')||file.size>30_000_000)throw Error('Scegli una fotografia fino a 30 MB.');
 const url=URL.createObjectURL(file),img=new Image();
 try{
  img.src=url;await img.decode();let scale=Math.min(1,1280/Math.max(img.naturalWidth,img.naturalHeight));
  if(!img.naturalWidth||!img.naturalHeight)throw Error();
  const canvas=document.createElement('canvas');
  for(let attempt=0;attempt<8;attempt++){
   canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
   for(const quality of [.84,.72,.6,.48]){
    const data=canvas.toDataURL('image/jpeg',quality);if((data.length-23)*.75<=MAX_PHOTO_BYTES)return normalizeNotebookPhoto({data,width:canvas.width,height:canvas.height});
   }scale*=.8;
  }throw Error();
 }catch(error){if(error.message.startsWith('Fotografia'))throw error;throw Error('Non riesco a leggere questa foto. Prova un file JPEG, PNG o WebP.');}finally{URL.revokeObjectURL(url);}
}
