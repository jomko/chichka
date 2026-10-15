// Three-frame syncopation: panels drift vertically, then reunite near the portrait.
// The same unwarped photograph is used in every panel.
function initMissingPage(){
 const stage=document.querySelector<HTMLElement>('[data-missing-stage]');
 if(!stage || stage.dataset.motionReady==='1')return;
 stage.dataset.motionReady='1';
 const slices=[...stage.querySelectorAll<HTMLElement>('.ch-missing__slice')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 const clamp=(v:number)=>Math.max(0,Math.min(1,v));
 let raf=0;
 let target=[0,0,0],current=[0,0,0];
 let active=false;
 function setTarget(x:number,y:number){
  // In the center of the image the three parts fall into place.
  const center=clamp(1-Math.hypot(x,y)*1.4);
  const scatter=(1-center*center*(3-2*center));
  const swing=x*.32+y*.68;
  target=[(-.13-.085*swing)*scatter,(.115+.09*x)*scatter,(-.09+.11*swing)*scatter];
  if(!raf)raf=requestAnimationFrame(tick);
 }
 function tick(){
  raf=0;
  let moving=false;
  slices.forEach((slice,i)=>{
   current[i]+=(target[i]-current[i])*.095;
   if(Math.abs(current[i]-target[i])>.0002)moving=true;
   slice.style.setProperty('--slice-y',`${(current[i]*100).toFixed(3)}svh`);
  });
  if(moving)raf=requestAnimationFrame(tick);
 }
 function reset(){
  target=[0,0,0];
  if(!raf)raf=requestAnimationFrame(tick);
 }
 stage.addEventListener('pointermove',(e:PointerEvent)=>{
  if(reduced.matches || !fine.matches)return;
  const r=stage.getBoundingClientRect();
  const x=((e.clientX-r.left)/r.width-.5)*2;
  const y=((e.clientY-r.top)/r.height-.5)*2;
  active=true;
  setTarget(x,y);
 });
 stage.addEventListener('pointerleave',()=>{active=false;reset()});
 function change(){
  if(reduced.matches || !fine.matches){active=false;current=[0,0,0];reset()}
 }
 reduced.addEventListener('change',change);
 fine.addEventListener('change',change);
 if(!reduced.matches && fine.matches){
  // An initial displaced rhythm; it resolves as the visitor approaches the center.
  target=[-.11,.12,-.08];
  if(!raf)raf=requestAnimationFrame(tick);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMissingPage,{once:true});
else initMissingPage();
document.addEventListener('astro:page-load',initMissingPage);
