import {pickCover,seasonOf} from './zone-cover.js';
// Animazioni fornite dal proprietario, associate a luogo, stagione e condizioni illustrate.
export const PLACE_VIDEOS=[{id:'tancia-autunno-asciutto',zone:'tancia',season:'autunno',icons:['sun','cloud','wind'],generated:true},
 {id:'canneto-verde-sereno',zone:'pnalm-settefrati-canneto',seasons:['primavera','estate'],icons:['sun'],generated:true}];
export function chooseHomeCover({zone,date,icon='unknown',media,pickStock,walking=false,plants=false}) {
  const video=PLACE_VIDEOS.find(v=>v.zone===zone&&(v.seasons||[v.season]).includes(seasonOf(date))&&v.icons.includes(icon));
  if(video)return {kind:'place-video',id:video.id,generated:video.generated};
  const photo=pickCover(media,date,icon);
  if(photo)return {kind:'place-photo',photo};
  // Non abbiamo riprese stock che illustrino neve, nebbia o temporali.
  if(['snow','fog','storm'].includes(icon))return {kind:'weather-illustration',icon};
  return {kind:'stock',id:icon==='rain'?'gocce-sulla-felce':pickStock({zone,date,walking,plants,month:Number(date?.slice(5,7))||undefined})};
}
