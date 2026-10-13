import { navigate } from 'astro:transitions/client';

// A single, explicit controller. This script is loaded once across Astro client navigation.
type Phase = 'idle'|'expanding'|'holding'|'loading'|'contracting';
type Session = { slug:string; url:string; layer:HTMLElement; image:HTMLImageElement; phase:Phase; started:number };
let session:Session|null=null;
const sleep=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
const paint=()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));
const rectangle=(r:DOMRect)=>({left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});
const viewport=()=>({left:'0px',top:'0px',width:`${innerWidth}px`,height:`${innerHeight}px`});
const selector=(slug:string)=>`[data-project-image="${CSS.escape(slug)}"]`;
function restore(){
 const img=document.querySelector<HTMLElement>('[data-ch-arrival]');
 if(img){img.style.visibility='';img.removeAttribute('data-ch-arrival');}
 if(session?.layer)session.layer.remove();
 session=null;
}
async function withTimeout<T>(promise:Promise<T>,ms:number):Promise<T>{
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([promise,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Image load timeout')),ms)})]);}
 finally{if(timer)clearTimeout(timer);}
}
// Hide the destination figure BEFORE Astro swaps it into the live document.
// Hiding after navigate() resolves is too late: the first frame already contains a duplicate.
document.addEventListener('astro:before-swap',(event)=>{
 if(!session)return;
 const next=(event as CustomEvent & {newDocument:Document}).newDocument;
 const figure=next?.querySelector<HTMLElement>(selector(session.slug));
 if(figure){figure.style.visibility='hidden';figure.setAttribute('data-ch-arrival','');}
});
document.addEventListener('click',async(event)=>{
 if(session || event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
     matchMedia('(prefers-reduced-motion: reduce)').matches || !Element.prototype.animate)return;
 const link=(event.target as Element|null)?.closest<HTMLAnchorElement>('a[data-project-entry]');
 if(!link || link.target==='_blank' || link.hasAttribute('download'))return;
 const original=link.querySelector<HTMLImageElement>('.ch-work__photo');
 if(!original?.complete || !original.naturalWidth)return;
 event.preventDefault();event.stopImmediatePropagation();
 const initial=original.getBoundingClientRect();
 const layer=document.createElement('div');
 const photo=original.cloneNode() as HTMLImageElement;
 layer.setAttribute('aria-hidden','true');
 layer.className='ch-transition-stage';
 photo.removeAttribute('loading');
 photo.style.objectPosition=getComputedStyle(original).objectPosition;
 layer.append(photo);
 document.documentElement.appendChild(layer);
 Object.assign(layer.style,rectangle(initial));
 session={slug:link.dataset.projectEntry!,url:link.href,layer,image:photo,phase:'expanding',started:performance.now()};
 const current=session;
 try{
  await layer.animate([rectangle(initial),viewport()],{duration:950,easing:'cubic-bezier(.22,1,.36,1)'}).finished;
  Object.assign(layer.style,viewport()); // Commit full viewport, never clear before committing.
  current.phase='holding';
  await paint();
  await sleep(300); // Actual visible full-screen hold, NOT concurrent with expansion.
  current.phase='loading';
  await navigate(current.url); // Incoming figure was hidden in astro:before-swap.
  if(session!==current)return;
  const figure=document.querySelector<HTMLElement>(selector(current.slug));
  const destImg=figure?.querySelector<HTMLImageElement>('img');
  if(!figure || !destImg)throw new Error('Missing destination photo');
  if(!destImg.complete)await withTimeout(new Promise<void>((resolve,reject)=>{
   destImg.addEventListener('load',()=>resolve(),{once:true});
   destImg.addEventListener('error',()=>reject(new Error('Image error')),{once:true});
  }),4000);
  await withTimeout(destImg.decode(),4000);
  // The destination must be measured at its NEW position in the new DOM.
  const y=Math.max(0,figure.getBoundingClientRect().top+scrollY-Math.min(100,innerHeight*.12));
  scrollTo({top:y,behavior:'instant'});
  await paint();await paint();
  if(session!==current)return;
  const target=figure.getBoundingClientRect();
  current.phase='contracting';
  await layer.animate([viewport(),rectangle(target)],{duration:1050,easing:'cubic-bezier(.76,0,.24,1)'}).finished;
  Object.assign(layer.style,rectangle(target));
  figure.style.visibility='';
  figure.removeAttribute('data-ch-arrival');
  restore();
  // Once the image has landed, return to the beginning of the new project page.
  // Do not change scroll position until the photographic handoff is complete.
  requestAnimationFrame(()=>scrollTo({top:0,behavior:'smooth'}));
 }catch(error){
  const fallbackUrl=current.url;
  restore();
  if(location.href!==fallbackUrl)location.assign(fallbackUrl);
 }
},{capture:true});
window.addEventListener('pagehide',()=>{if(session)restore()});
