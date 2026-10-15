// 404 portrait motion. The numerals remain still; only the photo inside moves.
// Anime.js is loaded just for this route. Native RAF remains a graceful fallback.
type AnimeMotion = ((options:Record<string,unknown>)=>unknown)&{remove:(target:object)=>void};
declare global {interface Window {anime?:AnimeMotion}}
function setupMask(){
 const section=document.querySelector<HTMLElement>('.ch-missing');
 const mask=section?.querySelector<HTMLElement>('.ch-missing__masked');
 if(!section || !mask || section.dataset.maskReady==='1')return;
 section.dataset.maskReady='1';
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 const state={x:50,y:27};
 let targetX=50,targetY=27,frame=0,lastAnime=0;
 const paint=()=>{mask.style.backgroundPosition=`center, ${state.x.toFixed(2)}% ${state.y.toFixed(2)}%`};
 const fallback=()=>{
  frame=0;
  state.x+=(targetX-state.x)*.095;
  state.y+=(targetY-state.y)*.095;
  paint();
  if(Math.abs(state.x-targetX)>.02||Math.abs(state.y-targetY)>.02)frame=requestAnimationFrame(fallback);
 };
 const animateTo=()=>{
  if(reduce.matches)return;
  if(window.anime){
   window.anime.remove(state);
   window.anime({targets:state,x:targetX,y:targetY,duration:1200,easing:'easeOutCubic',update:paint});
  }else if(!frame)frame=requestAnimationFrame(fallback);
 };
 const onMove=(event:PointerEvent)=>{
  if(reduce.matches||!fine.matches)return;
  const rect=section.getBoundingClientRect();
  const x=(event.clientX-rect.left)/rect.width-.5;
  const y=(event.clientY-rect.top)/rect.height-.5;
  targetX=50-x*11;
  targetY=27-y*8;
  const time=performance.now();
  if(time-lastAnime>55){lastAnime=time;animateTo()}
 };
 section.addEventListener('pointermove',onMove,{passive:true});
 section.addEventListener('pointerleave',()=>{
  targetX=50;targetY=27;animateTo();
 });
 reduce.addEventListener('change',()=>{
  if(reduce.matches){window.anime?.remove(state);cancelAnimationFrame(frame);frame=0;state.x=50;state.y=27;paint()}
 });
 if(!reduce.matches&&fine.matches){
  // Lazy-load the existing Anime.js API style, without affecting the global site bundle.
  if(!window.anime && !document.querySelector('[data-404-anime]')){
   const script=document.createElement('script');
   script.src='https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js';
   script.async=true;script.dataset['404Anime']='';
   document.head.append(script);
  }
 }
 paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupMask,{once:true});
else setupMask();
document.addEventListener('astro:page-load',setupMask);
