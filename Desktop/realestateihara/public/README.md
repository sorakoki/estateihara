## 管理者用編集画面（admin.html）

- ファイル場所: `realestate/admin/admin.html`
- 主な機能:
  - 物件画像のアップロードとプレビュー表示（削除ボタン付き、複数枚対応）
  - 物件情報（名前、賃料、所在地、間取り、説明）の登録・編集・削除
  - 登録済み物件の一覧表示
  - JSONファイルとして保存可能
- データ保存方法: `localStorage` を使用
- スクリプト分離: `admin-script.js` に機能を移動済み
- スタイル分離: `admin.css` に外部化済み
- 共通処理分離: `shared/common.js` に `updateFileInput()` と `createImagePreview()` を移動
- モジュール化: `<script type="module">` を使用して ES Modules に対応
- 表示確認済み: 2025年10月16日、Mac + VS Code + Live Server にて動作確認済み
- **入力記憶機能あり**: 前回登録した物件情報（名前・価格・所在地・間取り・説明）を自動復元し、フォームに表示。確認メッセージ付き。
## 管理者用編集画面（admin.html）

- ファイル場所: `realestate/admin/admin.html`
- 主な機能:
  - 物件画像のアップロードとプレビュー表示（削除ボタン付き、複数枚対応）
  - 物件情報（名前、賃料、所在地、間取り、説明）の登録・編集・削除
  - 登録済み物件の一覧表示
  - JSONファイルとして保存可能
- データ保存方法: `localStorage` を使用
- スクリプト分離: `admin-script.js` に機能を移動済み
- スタイル分離: `admin.css` に外部化済み
- 共通処理分離: `shared/common.js` に `updateFileInput()` と `createImagePreview()` を移動
- モジュール化: `<script type="module">` を使用して ES Modules に対応
- 入力記憶機能あり: 前回登録した物件情報（名前・価格・所在地・間取り・説明）を自動復元し、フォームに表示。確認メッセージ付き。
- **Live Server 表示確認済み**: 2025年10月16日、Mac + VS Code + Live Server にて動作確認済み


