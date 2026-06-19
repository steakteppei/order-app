// #9: バージョンは data.js の APP_VERSION に一元化（importScriptsで取得）
importScripts('./data.js');
const CACHE='st-order-v'+APP_VERSION;
const FILES=['./', './index.html', './send.html', './sales.html', './changelog.html', './links.html', './seasons.html', './data.js'];

self.addEventListener('install', function(e){
  // skipWaitingはせず、メッセージを受け取るまでwaitingで待機
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(FILES); })
  );
});

self.addEventListener('activate', function(e){
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
  // #1: GET以外（POST等）はキャッシュ対象外。素通りさせる
  //     （以前これが無く、SentryのPOST等で "Failed to execute 'put' on 'Cache'" が発生していた）
  if(e.request.method !== 'GET') return;
  // #2: 同一オリジンのみキャッシュ。外部API（売上gviz・天気open-meteo・Sentry等）は触らず素通り
  //     （外部レスポンスのキャッシュ汚染・put失敗・古いデータ表示を防ぐ）
  if(new URL(e.request.url).origin !== self.location.origin) return;
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

self.addEventListener('message', function(e){
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
