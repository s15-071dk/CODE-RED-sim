# CODE-RED-sim — AIへの申し送り

## このプロジェクトは
救急外来シミュレーションゲーム。
ターゲット：医学知識ゼロの一般プレイヤー ＋ 医療従事者の両方が楽しめる設計。
コマンドゲーム形式（ドラッグ&ドロップなし）で、難易度で表示レイヤーを切り替える。

## 現在の状態（v0.5.0 - 2026-05-16）
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
- ✅ Stage 2〜3 callBack 実装済み（転帰25秒後の遅延フィードバック）
- ✅ Stage 5（夜間単独シフト）実装済み — スタッフ2名・8床・夜間イベント2回
- ✅ stageR（逆転の引き継ぎ）実装済み — 満足度20%・全床埋まりからスタート
- ✅ stageE（エンドレスシフト）実装済み — フェーズ加速・ハイスコア記録
- ✅ keyOrderが配列化 — 複数検査の全完了が転帰解放の条件に
- ✅ ICU疾患6種に点滴（iv）が必須検査として追加
- ✅ CALL_PATIENTSにanaphylaxis・gi_bleed（各2件）追加
- ✅ 📋キーオーダー一覧モーダル（疾患別必須検査の参照）
- ✅ ステージ開始前ブリーフィング画面（全ステージ対応）
- ✅ 患者満足度ゲージを画面上部の専用バーに移動
- ✅ チュートリアルから割り当てボタンを廃止（カードクリック方式）
- ✅ ドラッグ機能廃止（タップ→タップのみ）— renderWaitList()をonclickのみに簡略化
- ✅ モバイルCSS大幅コンパクト化（詳細パネルスクロールなし・ベッドSVG52px・sa-sec非表示）
- ✅ STAFF_GUIDE定数追加（src/data/staff.js・スタッフ管理効果の説明テキスト）
- ✅ Stage 3開始時スタッフ管理紹介logMsg（src/data/stages.js）
- 🔲 未実装（優先順位順）：
  1. モバイル向けスタッフ操作UI（sa-secをモバイルで非表示にしたため代替が必要）
  2. STAFF_GUIDEを使ったスタッフガイドモーダルの実装

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
| `showStoryScreen(stageName)` | `src/main.js` | ステージ開始前ブリーフィング画面を表示 |
| `setupStage5()` | `src/data/stages.js` | Stage5セットアップ（夜間単独シフト） |
| `setupStageReverse()` | `src/data/stages.js` | stageRセットアップ（逆転の引き継ぎ） |
| `setupStageEndless()` | `src/data/stages.js` | stageEセットアップ（エンドレス） |
| `triggerStage5Events()` | `src/main.js` | Stage5夜間イベント発火（90秒・180秒の2回） |
| `openKeyOrderModal()` | `src/ui/render.js` | 転帰解放に必要な検査一覧モーダルを開く |
| `closeKeyOrderModal()` | `src/ui/render.js` | 同モーダルを閉じる |
| `STAFF_GUIDE` | `src/data/staff.js` | スタッフ管理効果の説明テキスト（モーダル用データ） |

> **要Tech Lead追記：** `showEventBanner(text)` / `hideEventBanner()`（`src/ui/notifications.js`・window公開済み）を重要な関数一覧に追加。`gameLoop()` からの明示呼び出しを推奨（現状は `renderBeds()` → `syncCtEventBanner()` で CT 故障バナーを同期）。

## keyOrder仕様（転帰解放条件）

`DISEASE_SIG[disease].keyOrder` は文字列配列（`string[] | null`）。
配列内の**すべての検査が完了**して初めて転帰ボタンが解放される。

- ICU疾患（acs / stroke / sepsis / trauma / anaphylaxis / gi_bleed）: 点滴を含む2〜4件
- 入院疾患（abdo / bp / hypo）: 1〜2件
- 帰宅疾患（fever）: 1件
- 軽症（minor）: null（noOrderNeeded）

`keyDone` の判定は `src/ui/render.js` の `renderDetail()` 内で `keyOrder.every(k => !!p.signals[k])` で行う。

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
- 次のタスク：PWA化（manifest.json + service-worker.js の追加）
- 注意点・未解決：[バグ・懸念点があれば]
```
