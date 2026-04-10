const CACHE='st-order-v3.7';
const FILES=['./', './index.html', './send.html', './sales.html', './changelog.html'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES);}));
  self.skipWaiting();
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }));
  self.clients.claim();
});
self.addEventListener('fetch',function(e){
  e.respondWith(fetch(e.request).then(function(res){
    var clone=res.clone();
    caches.open(CACHE).then(function(c){c.put(e.request,clone);});
    return res;
  }).catch(function(){return caches.match(e.request);}));
});
self.addEventListener('message',function(e){if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});
