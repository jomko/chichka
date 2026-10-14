import { navigate } from 'astro:transitions/client';

// Home entrance + editorial return. Independent from the approved 500/200/500 photo transition.
let returning=false;
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const nextFrame=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
const cover=()=>document.getElementById('ch-editorial-cut') as HTMLElement|null;

async function revealHero(){
 const hero=document.querySelector<HTMLElement>('.ch-home .ch-hero');
 if(!hero)return;
 const html=document.documentElement;
 if(html.classList.contains('ch-initial-loading')){
  const image=hero.querySelector<HTMLImageElement>('.ch-photo img');
  try{
   if(image){
    if(!image.complete)await Promise.race([
     new Promise<void>(resolve=>{
      image.addEventListener('load',()=>resolve(),{once:true});
      image.addEventListener('error',()=>resolve(),{once:true});
     }),
     new Promise<void>(resolve=>setTimeout(resolve,4000))
    ]);
    if(image.complete && image.naturalWidth)await Promise.race([
     image.decode().catch(()=>{}),
     new Promise<void>(resolve=>setTimeout(resolve,1200))
    ]);
   }
  }finally{
   html.classList.replace('ch-initial-loading','ch-initial-revealing');
   await new Promise<void>(resolve=>setTimeout(resolve,reduced()?0:460));
   html.classList.remove('ch-initial-revealing');
  }
 }
 if(reduced())return;
 // A new visit starts with a fresh document; Astro back/forward may retain an existing page.
 if(hero.dataset.entrancePlayed)return;
 hero.dataset.entrancePlayed='true';
 const photo=hero.querySelector<HTMLElement>('.ch-photo');
 const title=hero.querySelector<HTMLElement>('.ch-title');
 const tag=hero.querySelector<HTMLElement>('.ch-tag');
 const cta=hero.querySelector<HTMLElement>('.ch-cta');
 if(!photo || !title || !tag || !cta)return;
 // WAAPI fill:backwards only; no hidden content if JS fails.
 const reveal=(el:HTMLElement,frames:Keyframe[],duration:number,delay=0,easing='cubic-bezier(.22,1,.36,1)')=>
  el.animate(frames,{duration,delay,easing,fill:'backwards'});
 // When returning, allow the editorial curtain to reveal the complete composition
 // instead of stacking a second entrance animation on top of it.
 if(returning)return;
 reveal(photo,[{opacity:.5,transform:'scale(1.065)'},{opacity:1,transform:'scale(1)'}],1050);
 reveal(title,[{opacity:0,transform:'translateY(28px)',clipPath:'inset(0 0 100% 0)'},{opacity:1,transform:'translateY(0)',clipPath:'inset(0 0 0 0)'}],800,200);
 reveal(tag,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],650,470);
 reveal(cta,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],600,560);
}

function isHomepageLink(a:HTMLAnchorElement){
 const url=new URL(a.href);
 return url.origin===location.origin && /^\/(?:uk\/?)?$/.test(url.pathname) && location.pathname!==url.pathname && !url.hash;
}

// Do not allow the incoming document to add a second curtain during the swap.
document.addEventListener('astro:before-swap',event=>{
 if(!returning)return;
 const next=(event as typeof event & {newDocument:Document}).newDocument;
 next?.getElementById('ch-editorial-cut')?.remove();
});

document.addEventListener('click',async event=>{
 if(returning || reduced() || !Element.prototype.animate || event.defaultPrevented || event.button!==0 ||
    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
 const a=(event.target as Element|null)?.closest<HTMLAnchorElement>('a[href]');
 if(!a || a.hasAttribute('download') || a.target==='_blank')return;
 const home=isHomepageLink(a);
 const menu=!!a.closest('.navigation') && new URL(a.href).origin===location.origin &&
  new URL(a.href).pathname!==location.pathname && !new URL(a.href).hash;
 if(!home && !menu)return;
 // Photo transitions have their own navigation controller; never compete.
 if(a.closest('[data-project-entry]'))return;
 const stage=cover();
 if(!stage)return;
 event.preventDefault();
 event.stopImmediatePropagation();
 returning=true;
 const destination=a.href;
 const title=stage.querySelector('span');
 const previousTitle=title?.innerHTML;
 stage.dataset.mode=home?'home':'menu';
 if(menu && title){
  const label=(a.textContent||'').trim();
  title.textContent=label.toUpperCase();
 }
 document.documentElement.append(stage); // survives Astro body swap
 stage.style.visibility='visible';
 stage.style.clipPath='inset(0 100% 0 0)';
 try{
  await stage.animate([{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],
    {duration:home?350:280,easing:'cubic-bezier(.76,0,.24,1)'}).finished;
  stage.style.clipPath='inset(0 0 0 0)';
  await navigate(destination);
  window.scrollTo({top:0,behavior:'instant'});
  await nextFrame();
  await stage.animate([{clipPath:'inset(0 0 0 0)'},{clipPath:'inset(0 0 0 100%)'}],
    {duration:home?430:340,easing:'cubic-bezier(.22,1,.36,1)'}).finished;
  stage.style.visibility='hidden';
  stage.style.clipPath='inset(0 100% 0 0)';
  if(title && previousTitle!==undefined)title.innerHTML=previousTitle;
  delete stage.dataset.mode;
  document.body.prepend(stage);
 }catch{
  location.assign(destination);
 }finally{returning=false;}
},{capture:true});

document.addEventListener('astro:page-load',()=>{
 if(document.querySelector('.ch-home'))revealHero();
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{void revealHero()},{once:true});
else void revealHero();
