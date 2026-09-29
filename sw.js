const CACHE='swole-cat-v25';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.svg','./icon-512.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
])));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  const isFormSource=u.hostname==='exercise-dataset.com';
  if(isFormSource){
    e.respondWith(caches.open(CACHE).then(async cache=>{
      const hit=await cache.match(e.request);
      if(hit)return hit;
      try{
        const res=await fetch(e.request);
        if(res.ok||res.type==='opaque')cache.put(e.request,res.clone());
        return res;
      }catch(err){
        return hit||Response.error();
      }
    }));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
