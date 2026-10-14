import {readdir,readFile,stat} from 'node:fs/promises';
import {join,dirname,extname,resolve,sep} from 'node:path';

const root=resolve('dist');
const bad=[];
let scanned=0, links=0;
async function walk(dir){
 const entries=await readdir(dir,{withFileTypes:true});
 const out=[];
 for(const e of entries){
  const p=join(dir,e.name);
  if(e.isDirectory())out.push(...await walk(p));
  else if(e.isFile() && e.name.endsWith('.html'))out.push(p);
 }
 return out;
}
function attributes(html){
 const values=[];
 const re=/<(a|img|script|link|source)\b[^>]*?\b(href|src|srcset)\s*=\s*["']([^"']+)["'][^>]*>/gi;
 for(const m of html.matchAll(re)){
  const [,,tagAttr,raw]=m;
  const tag=m[1].toLowerCase();
  if(m[2].toLowerCase()==='srcset'){
   for(const item of raw.split(',')){const url=item.trim().split(/\s+/)[0];if(url)values.push({tag,url});}
  }else values.push({tag,url:raw});
 }
 return values;
}
const exists=async path=>{try{return(await stat(path)).isFile()}catch{return false}};
const pages=await walk(root);
if(!pages.length){console.error('No built HTML. Run npm run build first.');process.exit(2)}
for(const file of pages){
 scanned++;
 const html=await readFile(file,'utf8');
 const title=html.match(/<title>([^<]*)<\/title>/i)?.[1];
 if(!title?.trim())bad.push({page:file.slice(root.length),url:'<title>',reason:'missing page title'});
 for(const {tag,url} of attributes(html)){
  if(/^(?:[a-z][\w+.-]*:|\/\/|#|data:|mailto:|tel:)/i.test(url))continue;
  const clean=url.split(/[?#]/)[0];if(!clean)continue;
  links++;
  let destination;
  if(clean.startsWith('/'))destination=join(root,decodeURIComponent(clean));
  else destination=resolve(dirname(file),decodeURIComponent(clean));
  if(!destination.startsWith(root+sep) && destination!==root){bad.push({page:file.slice(root.length),url,reason:'outside dist'});continue;}
  const candidate=(clean.endsWith('/')||!extname(clean))?join(destination,'index.html'):destination;
  if(!await exists(candidate))bad.push({page:file.slice(root.length),url,reason:'file missing'});
 }
}
console.log(`CHICHKA local smoke: ${scanned} HTML pages, ${links} local asset/link references checked.`);
for(const b of bad)console.error(`FAIL ${b.page}: ${b.url} — ${b.reason}`);
console.log(bad.length?`FAILED: ${bad.length} issues`:'PASS: all referenced local files exist');
process.exitCode=bad.length?1:0;
