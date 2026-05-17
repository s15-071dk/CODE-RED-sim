# 満足度回復システム — Codex への実装依頼

## 背景・課題
現状、患者満足度（satisfaction）は下がる一方でプレイヤーが能動的に回復できない。
正しい転帰でも +5 しか戻らず、赤患者の危険域バイタル（-2/tick）や誤転帰コールバック（-10）に追いつかないため難しすぎる。

## 実装してほしいこと

### 1. 転帰時の回復量を重症度に応じて段階化

**ファイル**: `src/systems/disposition.js` の `applyDisp()` 内  
**変更箇所**: 現在 `changeSat(effectivelyCorrect ? 5 : -10)` の1行

```js
// 変更前
changeSat(effectivelyCorrect ? 5 : -10);

// 変更後（重症度・判断内容でボーナスを変える）
if (effectivelyCorrect) {
  let satBonus = 8;  // 基本回復量（通常正解）
  if (type === "icu" && p.color === "red") satBonus = 15;          // 重症患者をICUへ
  if (p.noOrderNeeded && type === "discharge" && doneOrderCnt === 0) satBonus = 12; // 処置なし帰宅の正解
  changeSat(satBonus);
} else {
  changeSat(-10);
}
```

### 2. 入電承諾ボーナス

**ファイル**: `src/systems/ambulance.js` の `acceptCall()` 関数内  
現状は入電拒否で -5 だが、承諾時は満足度変化なし。以下を追加：

```js
// acceptCall() の中、既存処理の後に追加
changeSat(3);  // 入電を受け入れると小さく回復
```

`changeSat` は `./scoring.js` からすでに import されているか確認して、なければ追加すること。

### 3. 点滴オーダー完了ボーナス（赤・橙患者のみ）

**ファイル**: `src/systems/orders.js` のオーダー完了処理内  
点滴（iv）オーダーが完了したとき、重症患者なら小回復：

```js
// iv オーダー完了時（既存の完了判定の後）
if (order.type === 'iv' && (p.color === 'red' || p.color === 'orange')) {
  changeSat(2);
}
```

### 4. コールバック正解時の追加回復

**ファイル**: `src/systems/disposition.js` の callBack setTimeout 内  
25秒後のコールバックが correct のとき、さらに満足度を少し回復させる。

```js
// 変更前
if (effectivelyCorrect) {
  logMsg('system', msg);
} else {
  logMsg('alert', msg);
  changeSat(-10);
}

// 変更後
if (effectivelyCorrect) {
  logMsg('system', msg);
  changeSat(5);  // 退院後の良い報告で回復
} else {
  logMsg('alert', msg);
  changeSat(-10);
}
```

## まとめ（変更後の満足度収支イメージ）

| アクション | 変更前 | 変更後 |
|-----------|--------|--------|
| 通常患者の正解転帰 | +5 | +8 |
| 赤患者をICUへ（正解） | +5 | +15 |
| 処置なし帰宅（正解） | +5 | +12 |
| コールバック正解（25秒後） | なし | +5 |
| 入電承諾 | 0 | +3 |
| 点滴完了（赤・橙） | なし | +2 |
| 誤転帰 | -10 | -10（変わらず） |
| コールバック不正解 | -10 | -10（変わらず） |
| 入電拒否 | -5 | -5（変わらず） |
| 危険域バイタル放置 | -2/tick | -2/tick（変わらず） |

## 変更対象ファイル
- `src/systems/disposition.js`（メインの変更・転帰回復量）
- `src/systems/ambulance.js`（入電承諾ボーナス）
- `src/systems/orders.js`（点滴完了ボーナス）

## 動作確認
- Stage 2 を「かんたん」でプレイして、満足度50%前後でも立て直せることを確認
- 重症患者をICUへ送ると「+15」相当の回復感があることをログで確認
- `node --check` で構文エラーがないことを確認してからコミット

---

## 実装ログ（Codex）

### 実施した作業
- `src/systems/disposition.js`
  - 正解転帰時の満足度回復を段階化
  - 通常正解 `+8`、赤患者ICU `+15`、処置なし帰宅 `+12`
  - 正解 `callBack` 表示時に追加回復 `+5`
- `src/systems/ambulance.js`
  - 入電承諾時に `changeSat(3)` を追加
- `src/systems/orders.js`
  - 点滴完了時、赤・橙患者に `changeSat(2)` を追加

### 構文確認
- `node --check src/systems/disposition.js`：OK
- `node --check src/systems/ambulance.js`：OK
- `node --check src/systems/orders.js`：OK

### 動作確認
- `python3 -m http.server 8080`：sandbox外実行でも `Address already in use` で起動不可
- `curl http://localhost:8080/` / `curl http://127.0.0.1:8080/`：接続不可
- 代替として実モジュール実行で満足度変化を確認
  - 点滴完了：`50 → 52`
  - 入電承諾：`50 → 53`
  - 赤患者ICU + 正解callback：`50 → 70`
