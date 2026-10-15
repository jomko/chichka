// Contact motion follows native scrolling; do not intercept navigation or scroll.
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t)};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let frame=0;
function update(){
 frame=0;
 const hero=document.querySelector<HTMLElement>('.ch-contact__hero');
 if(!hero)return;
 if(reduced.matches){hero.style.removeProperty('--contact-scroll');return;}
 const bounds=hero.getBoundingClientRect();
 // Motion unfolds as the cover leaves the viewport, with no abrupt snap.
 const travel=Math.max(1,bounds.height-innerHeight*.22);
 const progress=ease(-bounds.top/travel);
 hero.style.setProperty('--contact-scroll',progress.toFixed(4));
}
function schedule(){if(!frame)frame=requestAnimationFrame(update)}
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule,{passive:true});
reduced.addEventListener('change',schedule);
document.addEventListener('astro:page-load',schedule);
schedule();
