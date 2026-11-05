/* Progressie Oefenkamer service worker (één map / flat) */
const VERSION='po-app-v1';
const FONTS='po-fonts-v1';
const CORE=["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-192.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./favicon-32.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)))});
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting()});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('po-app-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  // Google Fonts: bewaar na het eerste bezoek, zodat de letters ook offline werken
  if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(FONTS).then(async c=>{const hit=await c.match(req);if(hit)return hit;
      try{const res=await fetch(req);if(res.ok||res.type==='opaque')c.put(req,res.clone());return res}catch(err){return hit||Response.error()}}));
    return;
  }
  if(url.origin!==location.origin)return;
  if(req.mode==='navigate'){
    e.respondWith(caches.match('./index.html').then(hit=>hit||fetch(req)).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(res=>{
    if(res.ok&&!url.pathname.includes('screenshot-')){const copy=res.clone();caches.open(VERSION).then(c=>c.put(req,copy))}
    return res;
  })));
});
