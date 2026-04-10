// ★ アップデートのたびにこの番号を上げる（index.htmlのバージョンに合わせる）
const CACHE='st-order-v2.9';

const FILES=['./','./index.html','./send.html','./sales.html','./changelog.html'];

self.addEventListener('install',function(e){
  // 新バージョンは即座にインストール・待機をスキップ
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES);}));
  self.skipWaiting();
});

self.addEventListener('activate',function(e){
  // 古いキャッシュをすべて削除
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){
    // 全クライアントに「リロードして」と通知
    return self.clients.matchAll({type:'window'}).then(function(clients){
      clients.forEach(function(client){client.postMessage({type:'SW_UPDATED'});});
    });
  }));
  self.clients.claim();
});

self.addEventListener('fetch',function(e){
  // ネットワーク優先：常に最新を取得、失敗時のみキャッシュ
  e.respondWith(fetch(e.request).then(function(res){
    var clone=res.clone();
    caches.open(CACHE).then(function(c){c.put(e.request,clone);});
    return res;
  }).catch(function(){return caches.match(e.request);}));
});

self.addEventListener('message',function(e){if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});
