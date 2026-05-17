export const STAFF_DEFS = [
  { id: "n1", name: "青木 沙耶",  short: "青木", role: "nurse",  roleLabel: "看護師（チーフ）", roleShort: "Ns チーフ", rbCls: "rb-hn", fatigueRate: 0.65, recoveryRate: 1.1, trait: "重症患者に強い。疲れにくい" },
  { id: "n2", name: "林 美咲",    short: "林",   role: "nurse",  roleLabel: "看護師",           roleShort: "Ns",       rbCls: "rb-ns", fatigueRate: 1.0,  recoveryRate: 1.6, trait: "複数対応が得意。回復が速い" },
  { id: "n3", name: "中川 遥",    short: "中川", role: "nurse",  roleLabel: "看護師",           roleShort: "Ns",       rbCls: "rb-ns", fatigueRate: 1.4,  recoveryRate: 1.0, trait: "検査サポートが速い。疲れやすい" },
  { id: "d1", name: "松本 拓海",  short: "松本", role: "doctor", roleLabel: "研修医 2年目",     roleShort: "Dr 2年目", rbCls: "rb-d2", fatigueRate: 1.0,  recoveryRate: 1.0, trait: "バランス型。安定した対応" },
  { id: "d2", name: "小野 結衣",  short: "小野", role: "doctor", roleLabel: "研修医 1年目",     roleShort: "Dr 1年目", rbCls: "rb-d1", fatigueRate: 1.5,  recoveryRate: 0.7, trait: "処置が速いがミスしやすい" },
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
  d1: {
    assign:   ["松本です。一緒に診ましょう", "確認しました。介入します", "状況把握、対応します"],
    critical: ["先生、緊急対応が必要です", "バイタル悪化中です", "早急に動きます"],
    order:    ["オーダー確認しました", "実施します", "了解です"],
  },
  d2: {
    assign:   ["小野です、担当します！", "わかりました！", "対応始めます！"],
    critical: ["先生これ…やばいですよね！？", "急いだほうがいいですよね", "どうしますか！？"],
    order:    ["は、はい！やります！", "了解です！", "すぐやります！"],
  },
};

export function fatigueState(f) {
  if (f < 40) return { label: "元気",     icon: "🟢", color: "#22c55e", speedMult: 1.0, incidentChance: 0 };
  if (f < 70) return { label: "疲労気味", icon: "🟡", color: "#eab308", speedMult: 0.8, incidentChance: 0 };
  if (f < 90) return { label: "疲弊",     icon: "🟠", color: "#f97316", speedMult: 0.6, incidentChance: 0.05 };
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
