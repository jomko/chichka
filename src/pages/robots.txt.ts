export function GET({site}:{site:URL|undefined}){
 const origin=site||new URL('https://chichkova.com');
 return new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml',origin).href}\n`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
