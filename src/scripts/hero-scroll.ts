// Native scroll-linked hero choreography. No scroll interception or dependencies.
const clamp=(value:number)=>Math.max(0,Math.min(1,value));
let queued=false;
function updateHeroScene(){
 queued=false;
 const scene=document.querySelector<HTMLElement>('.ch-home .ch-hero-scene');
 const hero=scene?.querySelector<HTMLElement>('.ch-hero');
 if(!scene||!hero)return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){
  hero.style.removeProperty('--ch-scroll');
  hero.style.removeProperty('--ch-frame');
  return;
 }
 const range=scene.offsetHeight-hero.offsetHeight;
 const progress=range>0?clamp(-scene.getBoundingClientRect().top/range):0;
 hero.style.setProperty('--ch-scroll',progress.toFixed(4));
 // First the camera moves. Only the last third frames the image on paper.
 const frame=clamp((progress-.65)/.35);
 const eased=frame*frame*(3-2*frame);
 hero.style.setProperty('--ch-frame',`calc(${(eased*7.5).toFixed(3)}vw)`);
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(updateHeroScene)}}
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule,{passive:true});
document.addEventListener('astro:page-load',schedule);
schedule();
