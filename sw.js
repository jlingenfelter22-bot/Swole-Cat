const CACHE='swole-cat-__SWOLE_CAT_VERSION__';
const ASSETS=['./','./index.html','./app.css','./app.js','./manifest.webmanifest','./icon-192.svg','./icon-512.svg'];

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
  const isWorkoutArt=u.hostname==='raw.githubusercontent.com'&&u.pathname.includes('/bryllim/workout-guide/');

  if(isFormSource||isWorkoutArt){
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

  const isSameOrigin=u.origin===self.location.origin;

  // Never allow the PWA cache to sit in front of cloud/API requests.
  // A cached empty Supabase sync response can hide records created later at
  // the same cursor, so all non-whitelisted cross-origin traffic is network-only.
  if(!isSameOrigin){
    e.respondWith(fetch(e.request,{cache:'no-store'}));
    return;
  }

  // Mutating requests must never participate in the app-shell cache.
  if(e.request.method!=='GET'){
    e.respondWith(fetch(e.request));
    return;
  }

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
