import { projects } from '../data/projects.js';

const pages=['/','/about/','/contact/','/cv/','/projects/',...projects.map(({slug})=>`/projects/${slug}/`)];
const xml=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');

export function GET({site}:{site:URL|undefined}){
 const origin=site||new URL('https://chichkova.com');
 const entries=pages.flatMap(path=>{
  const en=new URL(path,origin).href;
  const uk=new URL(`/uk${path}`,origin).href;
  return [en,uk].map(url=>({url,en,uk}));
 });
 const body=entries.map(({url,en,uk})=>`<url><loc>${xml(url)}</loc><xhtml:link rel="alternate" hreflang="en" href="${xml(en)}"/><xhtml:link rel="alternate" hreflang="uk" href="${xml(uk)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${xml(en)}"/></url>`).join('');
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${body}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
}
