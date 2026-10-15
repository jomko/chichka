// Pointer-driven photo triptych. No dependencies, no scroll or router interception.
function initMissingPage(){
 const stage=document.querySelector<HTMLElement>('[data-missing-stage]');
 if(!stage || stage.dataset.motionReady==='1')return;
 stage.dataset.motionReady='1';
 const slices=[...stage.querySelectorAll<HTMLElement>('.ch-missing__slice')];
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 function reset(){slices.forEach(s=>{s.style.removeProperty('--slice-x');s.style.removeProperty('--slice-y')})}
 stage.addEventListener('pointermove',(e:PointerEvent)=>{
  if(motion.matches || !fine.matches)return;
  const r=stage.getBoundingClientRect();
  const x=((e.clientX-r.left)/r.width-.5)*2;
  const y=((e.clientY-r.top)/r.height-.5)*2;
  const offsets=[[-36,14],[12,-15],[39,23]];
  slices.forEach((s,i)=>{
   const [dx,dy]=offsets[i];
   s.style.setProperty('--slice-x',`${(x*dx).toFixed(1)}px`);
   s.style.setProperty('--slice-y',`${(y*dy).toFixed(1)}px`);
  });
 });
 stage.addEventListener('pointerleave',reset);
 motion.addEventListener('change',reset);
 fine.addEventListener('change',reset);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMissingPage,{once:true});
else initMissingPage();
document.addEventListener('astro:page-load',initMissingPage);
