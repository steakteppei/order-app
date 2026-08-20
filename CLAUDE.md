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

バージョンを上げるときは**以下5箇所を必ず同時に更新する**。

| ファイル | 箇所 |
|---|---|
| `data.js` | `var APP_VERSION='5.23';` — 数字の一次ソース |
| `version.json` | `version` と `deployed`（ISO 8601） |
| `changelog.html` | `VERSIONS` 配列の**先頭**に新エントリを追加 |
| `index.html` | `Last updated: <日付>` |
| `send.html` | `Last updated: <日付>` |

`sw.js` と `index.html` は `APP_VERSION` を参照するだけなので直接編集しない。

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

### Service Worker のキャッシュ更新が効かないケース

**新規ファイル追加時、Service Worker のキャッシュ更新が正しく効かないケースがある。**
v5.23 で `data.js` の `SENDERS` が古いキャッシュに阻まれ、送信者ボタンが表示されない障害が発生した。

想定される原因（未確定）:

`sw.js` はキャッシュ名を `'st-order-v'+APP_VERSION` で決めているが、その `APP_VERSION` は
`importScripts('./data.js')` で読み込まれる。この `data.js` 自体が古いキャッシュから
供給されると、SW は**古いバージョン名のキャッシュを使い続ける**循環に陥る。

```js
importScripts('./data.js');
const CACHE='st-order-v'+APP_VERSION;   // ← APP_VERSION の供給元が古いと更新されない
```

暫定の対処: 端末側でアプリを再読み込み、または Safari / Chrome のサイトデータを削除する。

未着手の検討案:
- `sw.js` 内にバージョンをハードコードして `data.js` 依存を切る
- `importScripts` に cache-busting クエリを付ける（`./data.js?v=...`）
- `install` 時に `skipWaiting()` させる（現状は更新バナー経由の手動更新）

### 給与 CSV が GitHub の旧コミットに残存

`STEAK TEPPEI NEW-timesheets.csv` は削除・履歴抹消（force push）済みだが、
GitHub は到達不能オブジェクトを即座に削除しないため、
旧 SHA `1105499426b5c543ee2e7a79295e65c9c79d2088` を知っていれば現在も取得できる。

完全な削除には GitHub Support への依頼が必要（未対応）。
