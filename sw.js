// Service Worker — キャッシュ管理と自動更新
//
// ★ バージョンは data.js から取らず、ここにハードコードする（v5.24〜）
//
//   理由: ブラウザが SW の更新を検知する判定は「sw.js 本体のバイト比較」。
//   以前は importScripts('./data.js') で APP_VERSION を受け取っていたため、
//   リリースのたびに変わるのは data.js だけで sw.js は永久に不変だった。
//   その結果、新しい SW が install されず activate も走らず、古いキャッシュが
//   消えないまま残り続けた（v5.23 で送信者ボタンが表示されない障害の原因）。
//   さらに古いキャッシュ由来の data.js が古い CACHE 名を供給する自己参照
//   ループにもなっていた。
//
//   → リリース時は data.js の APP_VERSION と この SW_VERSION の両方を更新すること。
const SW_VERSION = '5.25';
const CACHE = 'st-order-v' + SW_VERSION;
const FILES = ['./', './index.html', './send.html', './sales.html', './changelog.html', './links.html', './seasons.html', './data.js'];

self.addEventListener('install', function (e) {
  // 更新バナーのタップを待たずに切り替える（スタッフの操作を不要にする）
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(FILES); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  // #1: GET以外（POST等）はキャッシュ対象外。素通りさせる
  //     （以前これが無く、SentryのPOST等で "Failed to execute 'put' on 'Cache'" が発生していた）
  if (e.request.method !== 'GET') return;
  // #2: 同一オリジンのみキャッシュ。外部API（売上gviz・天気open-meteo・Sentry等）は触らず素通り
  //     （外部レスポンスのキャッシュ汚染・put失敗・古いデータ表示を防ぐ）
  if (new URL(e.request.url).origin !== self.location.origin) return;

  // #3: HTTPキャッシュを必ず再検証する（v5.24〜）
  //     GitHub Pages は Cache-Control: max-age=600 を返すため、素の fetch だと
  //     最大10分間は古い data.js 等が返り、リロードしても新版を掴めないことがあった。
  //     navigate リクエストは init 付きで Request を作り直すと mode が壊れるため対象外。
  var req = e.request;
  if (req.mode !== 'navigate') {
    try { req = new Request(e.request, { cache: 'no-cache' }); }
    catch (err) { req = e.request; }
  }

  e.respondWith(
    fetch(req).then(function (res) {
      var clone = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
      return res;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});

self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
