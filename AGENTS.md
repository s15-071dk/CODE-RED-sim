# AGENTS.md — マルチエージェント開発ルール

**Tech Lead**: Claude Code  
**最終更新**: 2026-05-14

---

## エージェント別ファイルオーナーシップ

| エージェント | 役割 | 担当ファイル | 担当外（触らない） |
|---|---|---|---|
| **Claude Code** | Tech Lead / ゲームロジック統合 | `src/main.js` `src/state.js` `src/systems/*.js` `src/utils/` | `index.html` `styles/` `src/data/` |
| **Cursor** | UI / フロントエンド | `index.html` `styles/main.css` `src/ui/*.js` | `src/state.js` `src/systems/` |
| **Codex** | データ / ドキュメント | `src/data/*.js` `GDD.md` `README.md` `dev-log/` `CLAUDE.md` | `src/main.js` `src/systems/` `src/ui/` |

### 特別ルール：`src/state.js` は Tech Lead 専任
- stateのプロパティ追加・削除・リネームは必ず Tech Lead が承認・実施する
- 他エージェントは `state.xxx` を読み書きするだけでよい
- 変更が必要な場合は CLAUDE.md に要望を記載してユーザーに判断を仰ぐ

---

## セッション開始プロトコル（全エージェント共通）

```
1. CLAUDE.md を読む（現在の状態・バージョン確認）
2. dev-log/ の最新ファイルを読む（前回どこまで進んだか確認）
3. 自分の担当ファイルのみ編集する
4. 他エージェントの担当ファイルを変更したい場合
   → CLAUDE.md に「要相談：XXXが必要」とコメントを残してユーザーに判断を仰ぐ
```

## セッション終了プロトコル（全エージェント共通）

```
1. dev-log/YYYY-MM-DD.md に作業内容を追記（同日ファイルがあれば追記）
2. CLAUDE.md の「現在の状態」と「重要な関数一覧」を更新
3. git commit（以下のプレフィックスルールに従う）
```

---

## コミットプレフィックス

| prefix | 用途 |
|---|---|
| `feat:` | 新機能追加 |
| `fix:` | バグ修正 |
| `ui:` | UIの変更（ロジック変更なし） |
| `refactor:` | 動作を変えないコード整理 |
| `docs:` | CLAUDE.md・README・GDD・dev-log |
| `balance:` | ゲームバランス調整 |

---

## インターフェース変更ルール（ファイルをまたぐ変更）

関数シグネチャの変更、`state` への新プロパティ追加、`window` 公開関数の追加など、
複数ファイルに影響する変更は以下の一方向フローで行う：

```
Tech Lead が先に変更・コミット → CLAUDE.md の「重要な関数一覧」を更新
    ↓
他エージェントはそれを読んでから自分のファイルを追従更新
```

「インターフェースを変える側が先にコミット・文書化し、使う側が後で追従」する原則。

---

## ブランチ戦略

通常は **main ブランチ直コミット**で運用する。  
以下の場合のみフィーチャーブランチを切る：

| ケース | ブランチ名の例 |
|---|---|
| ステージ2の実装（大規模追加） | `feat/stage2` |
| スマホ対応（CSS全面変更） | `feat/mobile` |
| `src/state.js` の構造変更 | `refactor/state` |

---

## 禁止事項

- 担当外ファイルへの無断編集
- `src/state.js` への直接変更（Tech Lead 以外）
- `CODERED.html` の編集（バックアップとして凍結済み）
- フレームワークの導入（バニラJS維持）
- ドラッグ&ドロップへの回帰（コマンドゲーム形式を維持）

---

## ファイル構成と担当マップ

```
CODE-RED-sim/
├── CLAUDE.md           ← Codex が更新（毎コミット後）
├── AGENTS.md           ← Tech Lead が更新
├── GDD.md              ← Codex が更新
├── README.md           ← Codex が更新
├── index.html          ← Cursor 担当
├── styles/
│   └── main.css        ← Cursor 担当
├── src/
│   ├── state.js        ← Tech Lead 専任
│   ├── main.js         ← Tech Lead 担当
│   ├── data/           ← Codex 担当
│   │   ├── diseases.js
│   │   ├── patients.js
│   │   ├── staff.js
│   │   └── stages.js
│   ├── systems/        ← Tech Lead 担当
│   │   ├── ambulance.js
│   │   ├── disposition.js
│   │   ├── orders.js
│   │   ├── scoring.js
│   │   ├── triage.js
│   │   ├── tutorial.js
│   │   └── vitals.js
│   ├── ui/             ← Cursor 担当
│   │   ├── dragDrop.js
│   │   ├── modals.js
│   │   ├── notifications.js
│   │   └── render.js
│   └── utils/          ← Tech Lead 担当
│       └── random.js
└── dev-log/            ← Codex が記録（全エージェント分）
```
