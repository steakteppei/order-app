# CLAUDE.md — order-app

Steak Teppei（Ala Moana Center / Makai Market Food Court）の発注アプリ。
静的サイトとして GitHub Pages で公開している PWA。

- 公開 URL: https://steakteppei.github.io/order-app/
- リポジトリ: https://github.com/steakteppei/order-app （**public**）
- ビルド工程なし。HTML / JS を直接編集して push すれば反映される。

---

## Git 運用ルール

- **push は Aki が明示的に指示したときだけ行う。勝手に commit / push しない。**
- **push 前に必ず変更内容の要約を日本語で提示する。**
- コミットメッセージは**バージョン番号のみ**（例: `v5.24`）。
  これはアプリのリリース（下記5箇所のバージョンを上げる変更）に適用する。
  ドキュメントのみの変更など、アプリの挙動が変わらないコミットは
  `docs: ...` のように内容がわかるメッセージにし、バージョンは上げない。
- `gh` のアクティブアカウントは **steakteppei（会社）**。
  `aki-dan16`（個人）では push 権限が無く 403 になる。
- order-app はローカル設定で gh 認証を紐付け済みのため、
  `gh` 側のアクティブアカウントを切り替えても push は steakteppei として通る。

  ```
  credential.https://github.com.helper = !gh auth git-credential   (--local)
  ```

---

## バージョン管理ルール

バージョンを上げるときは**以下6箇所を必ず同時に更新する**。

| ファイル | 箇所 |
|---|---|
| `data.js` | `var APP_VERSION='5.24';` — アプリ側の一次ソース |
| `sw.js` | `const SW_VERSION = '5.24';` — **v5.24〜。data.js とは独立に持つ** |
| `version.json` | `version` と `deployed`（ISO 8601） |
| `changelog.html` | `VERSIONS` 配列の**先頭**に新エントリを追加 |
| `index.html` | `Last updated: <日付>` と `CHANGELOG` の `date` / `items` |
| `send.html` | `Last updated: <日付>` |

> **`sw.js` の更新を忘れないこと。** ブラウザが Service Worker の更新を検知する判定は
> 「sw.js 本体のバイト比較」。ここを据え置くと**新しい SW が一切配信されない**。
> 番号が data.js と二重管理になるのは承知の上で、確実性を優先している（経緯は後述）。

---

## ファイル構成と設計方針

### `data.js` — 一元化マスタ

業者(`V`)・メール宛先(`EC`)・送信者(`SENDERS`)・`DEFAULT_CC`・祝日(`HI_NAMES`)・
繁忙/閑散期・共通関数を集約。ここを直せば index.html / send.html 両方に反映される。

> **制約**: `sw.js` が `importScripts('./data.js')` で読み込むため、
> `document` / `window` 参照を絶対に入れないこと。純粋なデータと計算のみ。

### 送信者と CC の自動除外

`SENDERS` の各 `email` は `EC` の `cc` に載っているアドレスと**完全一致**させる。
`send.html` の `getCC()` が、送信者本人のアドレスを CC から除外するため。

```js
return base.cc.split(',').filter(function(e){return e.trim()!==sObj.email;}).join(',');
```

- **Nao と Harold は共有アドレス `admin@teppei-usa.com` を使う。**
  CC には `admin@` を**1回だけ**載せること（`filter` は一致する全要素を除去するので
  2回載せると両方消え、他人の送信時に CC が重複して見苦しくなる）。
- 2人が同じ受信箱を使うため、片方が送信して `admin@` が CC から外れても情報の欠落は起きない。
- 発注メッセージの署名に送信者名が入る（v5.23〜）。
  **Nao / Harold はアドレスが同じなので、業者側はこの署名でしか発注者を区別できない。**

### 公開リポジトリであることの制約

- 給与・勤怠データ（氏名・時給・労働時間を含む CSV 等）を絶対にコミットしない。
- `config.js`（`GAS_URL` / `GAS_SECRET`）を絶対にコミットしない。
- `.gitignore` で除外済みだが、**すでに追跡下のファイルには効かない**。
- 詳細は [README.md](README.md) を参照。

---

## 既知の未解決問題

（現時点で未解決の問題は「給与 CSV の旧コミット残存」のみ。下記参照）

---

## 解決済みの重大な不具合 — v5.24 の自動更新修正

**症状**: v5.23 で `data.js` の `SENDERS` が古いキャッシュに阻まれ、
スタッフ端末で送信者ボタンが表示されない障害が発生した。

**原因は2つ重なっていた。**

**① sw.js のバイト列が毎リリース同一だった。**
ブラウザの SW 更新判定は sw.js 本体のバイト比較。バージョンを
`importScripts('./data.js')` から受け取る設計では、変わるのは data.js だけで
sw.js は永久に不変。よって新 SW が install されず `activate` も走らず、
古いキャッシュが消えなかった。さらに古いキャッシュ由来の data.js が
古い CACHE 名を供給する自己参照ループにもなっていた。

**② HTTP キャッシュの10分窓と `checkVersion()` の判定順序。**
GitHub Pages は全ファイルに `Cache-Control: max-age=600` を返す。
旧 `checkVersion()` は localStorage の `st_app_version` と比較していたため、
「差分検知 → 記録を新版に更新 → リロード → しかし HTTP キャッシュから古い
data.js が返る」で**記録上のバージョンだけ進み、実際の data.js は古いまま固定**
された。加えて `send.html` の SW 登録に `updateViaCache:'none'` が無く、
同一スコープの登録を既定値 `'imports'` で上書きしていた。

**対策（v5.24）**

- `sw.js` は `importScripts` を撤廃し `SW_VERSION` を自身に持つ
- `sw.js` の `install` で `skipWaiting()`、`activate` で旧キャッシュ全削除 + `clients.claim()`
- `sw.js` の fetch は同一オリジン GET を `cache:'no-cache'` で必ず再検証（navigate は除外）
- `checkVersion()` の比較対象を **実際に読み込まれた `APP_VERSION`** に変更。
  新しい data.js を掴めるまでリロードで再試行し、`sessionStorage` で2回に制限
- `index.html` / `send.html` とも `{updateViaCache:'none'}` で登録し、起動時と復帰時に `reg.update()`
- 更新バナーは廃止（スタッフの操作なしで切り替わる）

**設計上の注意**: 上記②のため、**バージョン判定に localStorage の記録だけを使わないこと。**
「実際に読み込まれたコードのバージョン」と突き合わせないと、記録だけが進む状態を検知できない。

### 発注入力の保存（v5.24 で同時に修正）

`checkVersion()` は復帰時にも走り、バージョン差分があればリロードする。
v5.23 以前は `saveState()` が `goToSend()` からしか呼ばれておらず、
**「Go」を押す前にリロードが起きると入力が失われ、しかも前回送信時の状態が
復元されて別の注文が表示される**状態だった。

v5.24 での対策:

- `updateGoBtn()` の終端で `saveState()` を呼ぶ。
  この関数は業者選択・日付選択・数量変更・flex切替・最近の注文読込の
  すべてから呼ばれる共通の終端処理なので、ここ1箇所で入力全体を保存できる。
- 備考欄は `updateGoBtn()` を通らないため `oninput` で個別に保存する。
- `checkVersion()` のリロード直前にも `saveState()` を呼ぶ。
- `restoreState()` の復元条件を `selId` のみに緩和（日付未選択でも数量・備考を戻す）。

> **状態を変える処理を追加するときは `updateGoBtn()` を通すか、
> 個別に `saveState()` を呼ぶこと。** 通らない経路は保存されない。

### 給与 CSV が GitHub の旧コミットに残存

`STEAK TEPPEI NEW-timesheets.csv` は削除・履歴抹消（force push）済みだが、
GitHub は到達不能オブジェクトを即座に削除しないため、
旧 SHA `1105499426b5c543ee2e7a79295e65c9c79d2088` を知っていれば現在も取得できる。

完全な削除には GitHub Support への依頼が必要（未対応）。
