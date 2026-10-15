// Native scroll-linked hero choreography. No scroll interception or dependencies.
const clamp=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(t:number)=>{const x=clamp(t);return x*x*(3-2*x)};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let queued=false;
function updateHeroScene(){
 queued=false;
 updateManagementPhoto();
 updateAboutScene();
 updateCollaboration();
 const scene=document.querySelector<HTMLElement>('.ch-home .ch-hero-scene');
 const hero=scene?.querySelector<HTMLElement>('.ch-hero');
 if(!scene||!hero)return;
 if(reducedMotion.matches){
  for(const key of ['--ch-camera','--ch-exit','--ch-frame'])hero.style.removeProperty(key);
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
 if(reducedMotion.matches){photo.style.removeProperty('--ch-management-shift');return;}
 const bounds=row.getBoundingClientRect();
 const distance=innerHeight+bounds.height;
 const progress=clamp((innerHeight-bounds.top)/distance);
 photo.style.setProperty('--ch-management-shift',`${((progress-.5)*20).toFixed(2)}px`);
}
// Exact reverse of Hero's camera / text / frame phases.
function updateAboutScene(){
 const scene=document.querySelector<HTMLElement>('.ch-home .ch-about-scene');
 const about=scene?.querySelector<HTMLElement>('.ch-about');
 if(!scene||!about)return;
 if(reducedMotion.matches){
  for(const key of ['--ch-about-frame','--ch-about-exit','--ch-about-camera'])about.style.removeProperty(key);
  return;
 }
 const range=scene.offsetHeight-about.offsetHeight;
 const progress=range>0?clamp(-scene.getBoundingClientRect().top/range):1;
 const frame=1-smooth(progress/.20);
 const exit=1-smooth((progress-.20)/.30);
 const camera=1-smooth((progress-.50)/.50);
 about.style.setProperty('--ch-about-frame',`${(frame*7.5).toFixed(3)}vw`);
 about.style.setProperty('--ch-about-exit',exit.toFixed(4));
 about.style.setProperty('--ch-about-camera',camera.toFixed(4));
}
function updateCollaboration(){
 const section=document.querySelector<HTMLElement>('.ch-home .ch-collaboration');
 if(!section)return;
 if(reducedMotion.matches){
  section.style.removeProperty('--ch-collab-progress');
  return;
 }
 const rect=section.getBoundingClientRect();
 const progress=smooth((innerHeight*.92-rect.top)/(innerHeight*.75));
 section.style.setProperty('--ch-collab-progress',progress.toFixed(4));
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(updateHeroScene)}}
reducedMotion.addEventListener('change',schedule);
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule,{passive:true});
document.addEventListener('astro:page-load',schedule);
schedule();
