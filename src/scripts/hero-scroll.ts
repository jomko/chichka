// Native scroll-linked hero choreography. No scroll interception or dependencies.
const clamp=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(t:number)=>{const x=clamp(t);return x*x*(3-2*x)};
let queued=false;
function updateHeroScene(){
 queued=false;
 updateManagementPhoto();
 updateAboutPhoto();
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
 const camera=smooth(progress/.65);
 const exit=smooth((progress-.35)/.30);
 const frame=smooth((progress-.65)/.20);
 hero.style.setProperty('--ch-camera',camera.toFixed(4));
 hero.style.setProperty('--ch-exit',exit.toFixed(4));
 hero.style.setProperty('--ch-frame',`${(frame*7.5).toFixed(3)}vw`);
}
function updateManagementPhoto(){
 const row=document.querySelector<HTMLElement>('.ch-home .ch-discipline--management');
 const photo=row?.querySelector<HTMLElement>('.ch-preview img');
 if(!row||!photo)return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){photo.style.removeProperty('--ch-management-shift');return;}
 const bounds=row.getBoundingClientRect();
 const distance=innerHeight+bounds.height;
 const progress=clamp((innerHeight-bounds.top)/distance);
 photo.style.setProperty('--ch-management-shift',`${((progress-.5)*20).toFixed(2)}px`);
}
function updateAboutPhoto(){
 const frame=document.querySelector<HTMLElement>('.ch-home .ch-about__image');
 const photo=frame?.querySelector<HTMLElement>('img');
 if(!frame||!photo)return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){
  photo.style.removeProperty('--ch-about-parallax');
  return;
 }
 const box=frame.getBoundingClientRect();
 const progress=clamp((innerHeight-box.top)/(innerHeight+box.height));
 // Reserve 5% overscan above and below, so the image never exposes an edge.
 const shift=(progress-.5)*box.height*.08;
 photo.style.setProperty('--ch-about-parallax',`${shift.toFixed(2)}px`);
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(updateHeroScene)}}
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule,{passive:true});
document.addEventListener('astro:page-load',schedule);
schedule();
