const CACHE='st-order-v5.21';
const FILES=['./', './index.html', './send.html', './sales.html', './changelog.html', './links.html', './seasons.html'];

self.addEventListener('install', function(e){
  // キャッシュに新しいファイルを追加するが、skipWaitingはしない
  // → メッセージを受け取るまでwaiting状態で待機
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(FILES); })
  );
});

self.addEventListener('activate', function(e){
  // 古いキャッシュを全て削除
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  e.respondWith(
    fetch(e.request).then(function(res){
      var clone = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
      return res;
    }).catch(function(){
      return caches.match(e.request);
    })
  );
});

// SKIP_WAITINGメッセージを受け取ったときだけ切り替え
self.addEventListener('message', function(e){
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
