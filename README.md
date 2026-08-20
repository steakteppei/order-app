# order-app

Steak Teppei 発注アプリ（GitHub Pages で公開）

## ⚠️ このリポジトリは public です

`https://steakteppei.github.io/order-app/` として全世界に公開されています。
**リポジトリ内のファイルは、サイトのどこからもリンクされていなくても URL 直打ちで誰でも取得できます。**

### 絶対にコミットしてはいけないもの

- **給与・勤怠データ**（従業員の氏名・時給・労働時間などを含む CSV / Excel）
- **`config.js`**（`GAS_URL` / `GAS_SECRET` などの認証情報を保持する設定ファイル）
- API キー、トークン、パスワード、`.env` 類

これらは `.gitignore` で除外していますが、`.gitignore` は**すでに Git の追跡下にあるファイルには効きません**。
新規ファイルを追加する際は、コミット前に必ず `git status` で内容を確認してください。

### 一度コミットしてしまった場合

削除コミットを積むだけでは不十分です（過去のコミットから引き続き閲覧できます）。
`git filter-repo` / BFG による履歴からの抹消＋force push、またはリポジトリの private 化が必要になります。
