const CACHE='swole-cat-v28-3';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.svg','./icon-512.svg'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});

self.addEventListener('message',e=>{
  if(e.data?.type==='SKIP_WAITING')self.skipWaiting();
});

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

  // Always prefer the newest app shell so installed PWAs don't get stuck on an old index.html.
  if(e.request.mode==='navigate'||u.pathname.endsWith('/index.html')){
    e.respondWith(caches.open(CACHE).then(async cache=>{
      try{
        const res=await fetch(e.request,{cache:'no-store'});
        if(res.ok)cache.put(e.request,res.clone());
        return res;
      }catch(err){
        return (await cache.match(e.request))||(await cache.match('./index.html'))||(await cache.match('./'))||Response.error();
      }
    }));
    return;
  }

  // Other local assets can stay cache-first for fast/offline use.
  e.respondWith(caches.match(e.request).then(async hit=>{
    if(hit)return hit;
    try{
      const res=await fetch(e.request);
      if(res.ok) {
        const cache=await caches.open(CACHE);
        cache.put(e.request,res.clone());
      }
      return res;
    }catch(err){
      return Response.error();
    }
  }));
});
