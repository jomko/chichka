// Temporal Echo. The portrait is always one intact image;
// only local, fading recollections of its pixels move with the cursor.
function initMissingPage(){
 const stage=document.querySelector<HTMLElement>('[data-missing-stage]');
 if(!stage || stage.dataset.motionReady==='1')return;
 stage.dataset.motionReady='1';
 const section=stage.closest<HTMLElement>('.ch-missing');
 const canvas=stage.querySelector<HTMLCanvasElement>('.ch-missing__echo');
 const photo=stage.querySelector<HTMLImageElement>('.ch-missing__photo');
 if(!canvas || !photo || !section)return;
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 let width=0,height=0,dpr=1,frame=0;
 let history:{x:number;y:number;t:number}[]=[];
 let lastMove=0,point={x:0,y:0};
 const now=()=>performance.now();
 const canAnimate=()=>!reduced.matches && fine.matches && photo.complete && photo.naturalWidth>0;
 function resize(){
  const r=stage.getBoundingClientRect();
  width=r.width;height=r.height;
  dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  ctx!.setTransform(dpr,0,0,dpr,0,0);
 }
 function reset(){
  history=[];lastMove=0;ctx!.clearRect(0,0,width,height);
  section!.style.removeProperty('--type-x');section!.style.removeProperty('--type-y');section!.style.removeProperty('--type-r');
 }
 function draw(){
  frame=0;
  if(!stage.isConnected || !canAnimate()){reset();return}
  const t=now(),age=t-lastMove;
  ctx!.clearRect(0,0,width,height);
  // Native object-fit:cover geometry; identical to the underlying img.
  const scale=Math.max(width/photo.naturalWidth,height/photo.naturalHeight);
  const iw=photo.naturalWidth*scale,ih=photo.naturalHeight*scale;
  const ox=(width-iw)/2,oy=(height-ih)*.19;
  const delays=[65,140,240];
  const decay=Math.max(0,1-age/650);
  for(let i=delays.length-1;i>=0;i--){
   const sample=history.find(h=>h.t<=t-delays[i])||history[0];
   if(!sample)continue;
   const dx=(point.x-sample.x),dy=(point.y-sample.y);
   const distance=Math.hypot(dx,dy);
   if(distance<2)continue;
   const radius=110+i*42;
   const alpha=[.23,.13,.07][i]*decay;
   ctx!.save();
   ctx!.beginPath();ctx!.arc(sample.x,sample.y,radius,0,Math.PI*2);ctx!.clip();
   ctx!.globalAlpha=alpha;
   ctx!.drawImage(photo,ox+dx*(.5+i*.32),oy+dy*(.5+i*.32),iw,ih);
   ctx!.restore();
  }
  history=history.filter(h=>t-h.t<450);
  if(decay>0 && history.length)frame=requestAnimationFrame(draw);
  else reset();
 }
 function move(e:PointerEvent){
  if(!canAnimate())return;
  const r=stage.getBoundingClientRect();
  const x=e.clientX-r.left,y=e.clientY-r.top;
  point={x,y};lastMove=now();history.push({x,y,t:lastMove});
  const nx=(x/width-.5)*2,ny=(y/height-.5)*2;
  section!.style.setProperty('--type-x',(nx*28).toFixed(2));
  section!.style.setProperty('--type-y',(ny*24).toFixed(2));
  section!.style.setProperty('--type-r',(nx*3).toFixed(2));
  if(!frame)frame=requestAnimationFrame(draw);
 }
 stage.addEventListener('pointermove',move,{passive:true});
 stage.addEventListener('pointerleave',()=>{lastMove=now()-400;if(!frame)frame=requestAnimationFrame(draw)});
 window.addEventListener('resize',resize,{passive:true});
 reduced.addEventListener('change',()=>{if(reduced.matches)reset()});
 photo.addEventListener('load',resize);
 resize();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMissingPage,{once:true});
else initMissingPage();
document.addEventListener('astro:page-load',initMissingPage);
