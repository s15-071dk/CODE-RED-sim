# CODE-RED-sim — AIへの申し送り

## このプロジェクトは
救急外来シミュレーションゲーム。
ターゲット：医学知識ゼロの一般プレイヤー ＋ 医療従事者の両方が楽しめる設計。
コマンドゲーム形式（ドラッグ&ドロップなし）で、難易度で表示レイヤーを切り替える。

## 現在の状態（v0.4.0 - 2026-05-15）
- ✅ 患者受け入れ・ベッド管理・スタッフ疲労・満足度・信号灯・チュートリアル・ステージ1
- ✅ 難易度選択UI（かんたん/ふつう/むずかしい）+ バイタル表示切り替え実装済み
- ✅ ハイブリッド操作（ドラッグ＋ボタン）・一時停止ボタン
- ✅ 会話・イベントログシステム（画面下部全幅・患者/看護師/システムセリフ）
- ✅ 転帰を右パネルボタン1クリックで確定（モーダル廃止）
- ✅ 満足度ゲージ（HPバー風・絵文字付き）
- ✅ 処置なし帰宅ボーナス（noOrderNeeded患者・+200pt 🎯）
- ✅ ES Moduleマルチファイル構成に移行（index.html + src/ + styles/）
- ✅ AGENTS.md 作成（マルチエージェント開発ルール）
- ✅ 転帰クリック後フィードバックカード（右パネル・5秒表示）
- ✅ Stage 4 実装済み（ランダムナイトシフト・3分タイマー・STAGE4_POOLからランダム選出）
- ✅ triggerStage4Event：CT故障 / スタッフ欠勤 / 多重入電を90秒後に1回発生
- ✅ 転帰確定後5秒でベッドを自動解放（bed.patient = null）
- ✅ チュートリアル転帰バグ修正済み
- 🔲 未実装（優先順位順）：
  1. スマホ対応（次マイルストーン）

## 設計方針（重要・変更禁止）
- **コマンドゲーム形式**：ドラッグ&ドロップは廃止。すべてボタンクリックで操作
- **難易度で表示を切り替え**：ゲームロジックは共通。表示レイヤーのみ変える
  - かんたん：❤️ 速い / 🔴 低い などアイコン+日本語
  - ふつう：脈拍 110 / 血圧 80/50 など日本語+数値
  - むずかしい：HR 110 / BP 80/50 など略語+数値（現状維持）
- **バニラJSを維持**：フレームワーク導入禁止
- **マルチファイルES Module構成**：`index.html` + `src/` + `styles/` に分割済み
- `CODERED.html` はバックアップとして凍結（編集禁止）

## 技術スタック
- バニラ JavaScript (ES Modules) / HTML / CSS / SVG
- マルチファイル構成（`index.html` + `src/` + `styles/`）
- ローカルサーバー必須：`python3 -m http.server 8080` で起動
- Tabler Icons（CDN）/ Google Fonts（Noto Sans JP）

## 重要な関数・変数（編集前に確認）
| 名前 | ファイル | 役割 |
|------|------|------|
| `state` | `src/state.js` | 全ゲーム状態（Tech Lead専任） |
| `setDifficulty(d)` | `src/main.js` | 難易度切り替え |
| `makeVitalHtml(p)` | `src/systems/vitals.js` | 難易度別バイタル表示HTML生成 |
| `waitVitals(p)` | `src/systems/vitals.js` | 待機カードの難易度別バッジHTML |
| `logMsg(type, text)` | `src/ui/notifications.js` | ログパネルへのメッセージ追加 |
| `PATIENT_SPEECH` | `src/data/diseases.js` | 疾患別患者セリフ（assign/critical/iv_done/disposed） |
| `STAFF_SPEECH` | `src/data/staff.js` | スタッフID別セリフ（assign/critical/order） |
| `assignPatient(bedId)` | `src/ui/dragDrop.js` | 患者をベッドに割り当て（drag/button両対応） |
| `renderWaitList()` | `src/ui/render.js` | 待機患者リスト描画 |
| `renderDetail()` | `src/ui/render.js` | 右パネル描画 |
| `applyDisp(type)` | `src/systems/disposition.js` | 転帰確定（state.dispTargetBedIdを使用） |
| `checkTutEvent(event)` | `src/systems/tutorial.js` | チュートリアル進行判定 |
| `TUT_STEPS[]` | `src/data/stages.js` | チュートリアルステップ定義 |
| `changeSat(delta)` | `src/systems/scoring.js` | 満足度変更＋絵文字更新 |
| `gameLoop()` | `src/main.js` | メインゲームループ（1秒毎） |
| `triggerStage4Event()` | `src/main.js` | Stage 4ランダムイベント発火（90秒後・1回のみ） |
| `setupStage4()` | `src/data/stages.js` | Stage 4セットアップ（STAGE4_POOLからランダム選出） |
| `pickRandomN(arr,n)` | `src/utils/random.js` | 配列からランダムn件を返す |

> **要Tech Lead追記：** `showEventBanner(text)` / `hideEventBanner()`（`src/ui/notifications.js`・window公開済み）を重要な関数一覧に追加。`gameLoop()` からの明示呼び出しを推奨（現状は `renderBeds()` → `syncCtEventBanner()` で CT 故障バナーを同期）。

## 開発のお作法
- コメントは日本語で書く
- フレームワーク導入禁止
- 新機能前にGDD.mdの仕様を確認
- 作業後は必ず `dev-log/YYYY-MM-DD.md` に記録
- **変更後は必ずブラウザで動作確認してからコミット**
- **マルチエージェント運用はAGENTS.mdを必ず読む**
- **ゲームはローカルサーバーが必要**：`python3 -m http.server 8080` → `http://localhost:8080`

## ファイル構成
```
CODE-RED-sim/
├── CLAUDE.md        ← このファイル（AIへの申し送り・最新状態を常に反映）
├── AGENTS.md        ← マルチエージェント開発ルール（Tech Lead管理）
├── README.md        ← プロジェクト概要
├── GDD.md           ← ゲーム設計書（仕様の正）
├── CODERED.html     ← バックアップ（凍結・編集禁止）
├── index.html       ← ゲームエントリーポイント（Cursor担当）
├── styles/
│   └── main.css     ← 全CSS（Cursor担当）
├── src/
│   ├── state.js     ← 全状態管理（Tech Lead専任）
│   ├── main.js      ← ゲームループ・統合（Tech Lead担当）
│   ├── data/        ← ゲームデータ定数（Codex担当）
│   ├── systems/     ← ゲームロジック（Tech Lead担当）
│   ├── ui/          ← 描画・操作（Cursor担当）
│   └── utils/       ← 共通ユーティリティ（Tech Lead担当）
└── dev-log/         ← 日次作業ログ（Codex担当）
    └── YYYY-MM-DD.md
```

## 次のエージェントへの引き継ぎテンプレート
作業開始前にこのテンプレートを読み、作業後に更新すること。

```
## 引き継ぎ（YYYY-MM-DD）
- 担当エージェント：[Claude Code / Codex / ChatGPT]
- 実施した作業：
  - [変更内容1]
  - [変更内容2]
- 変更したコード箇所：[関数名・行番号]
- 動作確認：[確認済み / 未確認]
- 次のタスク：[具体的に何を実装するか]
- 注意点・未解決：[バグ・懸念点があれば]
```
