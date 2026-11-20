// Service worker khusus PWA Wali Santri.
// OneSignal tetap menggunakan worker lama di /fmart/service-worker.js.
const CACHE_PREFIX='fmart-wali-';
const CACHE_NAME='fmart-wali-shell-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./config.js'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache=>Promise.all(SHELL.map(asset=>cache.add(asset).catch(error=>{
      console.warn('FMart Wali asset tidak dapat disimpan:',asset,error);return null;
    }))))
    .then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      if(!response||!response.ok)return response;
      return caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone()).catch(()=>null)).then(()=>response);
    }).catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html'))));
    return;
  }
  if(/\/config\.js$/i.test(url.pathname)){
    event.respondWith(fetch(request).then(response=>{
      if(!response||!response.ok)return response;
      return caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone()).catch(()=>null)).then(()=>response);
    }).catch(()=>caches.match(request)));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>{
    if(cached)return cached;
    return fetch(request).then(response=>{
      if(!response||!response.ok)return response;
      return caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone()).catch(()=>null)).then(()=>response);
    });
  }));
});
