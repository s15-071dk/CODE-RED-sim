export const STAFF_DEFS = [
  { id: "n1", name: "青木 沙耶",  short: "青木", role: "nurse",  roleLabel: "看護師（チーフ）", roleShort: "Ns チーフ", rbCls: "rb-hn", fatigueRate: 0.65, recoveryRate: 1.1, trait: "重症患者に強い。疲れにくい" },
  { id: "n2", name: "林 美咲",    short: "林",   role: "nurse",  roleLabel: "看護師",           roleShort: "Ns",       rbCls: "rb-ns", fatigueRate: 1.0,  recoveryRate: 1.6, trait: "複数対応が得意。回復が速い" },
  { id: "n3", name: "中川 遥",    short: "中川", role: "nurse",  roleLabel: "看護師",           roleShort: "Ns",       rbCls: "rb-ns", fatigueRate: 1.4,  recoveryRate: 1.0, trait: "検査サポートが速い。疲れやすい" },
  { id: "n4", name: "田中 恵",    short: "田中", role: "nurse",  roleLabel: "看護師（ベテラン）", roleShort: "Ns ベテラン", rbCls: "rb-hn", fatigueRate: 0.7, recoveryRate: 1.2, trait: "ベテランで安定。疲れにくく頼れる" },
  { id: "n5", name: "西村 蓮",    short: "西村", role: "nurse",  roleLabel: "看護師（新人）",     roleShort: "Ns 新人",    rbCls: "rb-ns", fatigueRate: 1.6, recoveryRate: 1.8, trait: "元気いっぱい。回復が速いが疲れやすい" },
];

export const STAFF_SPEECH = {
  n1: {
    assign:   ["青木です。すぐバイタル取ります", "了解しました。準備します", "重症確認、対応開始します"],
    critical: ["先生！バイタル危険域です！", "すぐ介入が必要です！", "急いでください！"],
    order:    ["オーダー受け付けました", "処理開始します", "準備完了、進めます"],
  },
  n2: {
    assign:   ["林です。担当しますね", "わかりました、入りましょう", "患者さん、こちらです"],
    critical: ["バイタル確認、危険です", "対応急ぎます！", "先生、来てください！"],
    order:    ["はい、やります", "オーダー確認", "進めますね"],
  },
  n3: {
    assign:   ["中川です。受け持ちます", "すぐ対応します", "了解です"],
    critical: ["先生、値が悪化してます", "急いでください！", "バイタル要注意です"],
    order:    ["受け付けました", "処理します", "わかりました"],
  },
  n4: {
    assign:   ["田中です。任せてください", "了解、対応します", "ベテランの意地を見せます"],
    critical: ["先生、バイタルが危険域です", "すぐ介入が必要です", "急いでください！"],
    order:    ["了解しました", "すぐ対応します", "処理します"],
  },
  n5: {
    assign:   ["西村です！頑張ります！", "は、はい！担当します！", "やります！"],
    critical: ["せ、先生！大変です！", "どうすれば…！", "バイタルが…！"],
    order:    ["頑張ります！", "やってみます！", "は、はい！"],
  },
};

export function fatigueState(f) {
  if (f < 40) return { label: "元気",     icon: "🟢", color: "#22c55e", speedMult: 1.5, incidentChance: 0 };
  if (f < 70) return { label: "疲労気味", icon: "🟡", color: "#eab308", speedMult: 1.1, incidentChance: 0 };
  if (f < 90) return { label: "疲弊",     icon: "🟠", color: "#f97316", speedMult: 0.7, incidentChance: 0.05 };
  return             { label: "限界",      icon: "🔴", color: "#ef4444", speedMult: 0.4, incidentChance: 0.15 };
}

export const STAFF_GUIDE = {
  title: "スタッフマネジメントとは",
  sections: [
    {
      heading: "配置すると処置が速くなる",
      body: "患者のいるベッドにスタッフを配置すると、検査・処置の完了が速くなります。疲労が少ないほど効果大です。",
    },
    {
      heading: "疲労が溜まると遅くなる",
      body: "配置中は1秒ごとに疲労が蓄積します。疲労気味(🟡)で×0.8、疲弊(🟠)で×0.6、限界(🔴)で×0.4まで低下します。重症患者担当は疲労が1.5倍速く溜まります。",
    },
    {
      heading: "限界に近づくとインシデントが起きる",
      body: "疲弊状態(🟠)では5%/秒、限界(🔴)では15%/秒の確率でインシデントが発生し、満足度が下がります。",
    },
    {
      heading: "休憩させると回復する",
      body: "スタッフアイコンをタップして「休憩」を指示すると疲労が回復します。疲労0%になると自動で復帰します。",
    },
  ],
};
