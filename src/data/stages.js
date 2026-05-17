import { state } from '../state.js';
import { pickRandomN } from '../utils/random.js';
import { STAGE4_POOL, STAGE5_POOL } from './patients.js';
import { logMsg } from '../ui/notifications.js';

export const TUT_STEPS = [
  { id: "welcome",    icon: "🏥", step: "ようこそ",               text: "CODE RED ERへようこそ！\nあなたは救急外来の担当医です。患者を処置してdispositionを決定しましょう。",    hint: "",                                    nextLabel: "はじめる", waitFor: null },
  { id: "drag",       icon: "👤", step: "STEP 1/5 — 患者割り当て", text: "左パネルの患者カードをクリックして選択し、次に空きベッドをクリックして割り当ててください。",        hint: "💡 カードをクリック → 空きベッドをクリック",   nextLabel: null,       waitFor: "assigned" },
  { id: "click_bed",  icon: "🛏️", step: "STEP 2/5 — ベッド確認",  text: "患者がベッドに入りました！\nベッドをクリックすると右側に詳細が表示されます。",                     hint: "💡 ベッドをクリックしてみましょう",       nextLabel: null,       waitFor: "bed_click" },
  { id: "order",      icon: "📋", step: "STEP 3/5 — オーダー",    text: "まず「点滴」をオーダーしてください。\n検査結果が🔴🟡🟢で返ってきます。",                          hint: "💡 点滴ボタンを押してください",           nextLabel: null,       waitFor: "ordered" },
  { id: "staff_place", icon: "👩", step: "スタッフ配置",             text: "左パネルのスタッフ名をタップしてポップアップを開き、患者のいるベッドに配置してみましょう。配置すると検査・処置が速くなります。", hint: "💡 スタッフ名タップ → ベッドへの配置を選択", waitFor: "staff_placed" },
  { id: "staff_rest",  icon: "☕", step: "休憩指示",                 text: "スタッフは働き続けると疲労します。疲労が溜まったら同じようにタップして「休憩させる」を選びましょう。疲労0%で自動復帰します。", hint: "💡 スタッフ名タップ → 休憩させる", waitFor: "staff_rested" },
  { id: "more_order", icon: "🔬", step: "STEP 4/5 — 追加検査",    text: "点滴をオーダーしました！\nもう1件、「心電図」か「血液検査」もオーダーしてみましょう。",              hint: "💡 2件完了で転帰が解放されます",          nextLabel: null,       waitFor: "two_orders" },
  { id: "disp",       icon: "🚪", step: "STEP 5/5 — 転帰の決定",  text: "検査結果を見て転帰を決定してください。\n🔴が多ければICU、全部🟢なら帰宅が推奨されます。",          hint: "💡 推奨ボタンがハイライトされます",       nextLabel: null,       waitFor: "disposed" },
  { id: "done",       icon: "🎉", step: "完了！",                  text: "チュートリアルを完了しました！\nステージ1が解放されます。",                                        hint: "",                                    nextLabel: "クリア！", waitFor: null },
];

export function makeBeds() {
  return [
    { id: "c1", zone: "critical", label: "重症 01", patient: null },
    { id: "c2", zone: "critical", label: "重症 02", patient: null },
    { id: "c3", zone: "critical", label: "重症 03", patient: null },
    { id: "e1", zone: "exam",     label: "診察 01", patient: null },
    { id: "e2", zone: "exam",     label: "診察 02", patient: null },
    { id: "e3", zone: "exam",     label: "診察 03", patient: null },
    { id: "e4", zone: "exam",     label: "診察 04", patient: null },
    { id: "e5", zone: "exam",     label: "診察 05", patient: null },
  ];
}

export function setupTutorial() {
  state.beds = makeBeds();
  state.waitPatients = [
    {
      id: "w1", name: "佐々木 花子", age: 32, sex: "女性", pmh: "なし",
      chief: "発熱・倦怠感", color: "green",
      HR: 88, BP_sys: 112, BP_dia: 70, SpO2: 98, GCS: 15, RR: 16, Temp: 38.2,
      disease: "fever",
    },
  ];
  state.staffEnabled = true;
  // チュートリアルは青木（n1）のみ
  state.staffState = state.staffState
    ? state.staffState.filter(s => s.id === "n1").map(s => ({ ...s, fatigue: 0, onBreak: false, assignedBedId: null, absent: false }))
    : [];
  state.satEnabled   = false;
  state.callEnabled  = false;
  document.getElementById("staff-panel").style.display = "flex";
  document.getElementById("shift-wrap").style.display  = "none";
  document.getElementById("stage-lbl").textContent = "Tutorial";
  state.orderCountForTut = 0;
}

export function setupStage1() {
  state.beds = makeBeds();
  state.waitPatients = [
    {
      id: "w1", name: "田中 恵子", age: 45, sex: "女性", pmh: "花粉症",
      chief: "発熱・咽頭痛", color: "green",
      HR: 82, BP_sys: 118, BP_dia: 74, SpO2: 99, GCS: 15, RR: 15, Temp: 38.6,
      disease: "fever",
      story: "夜に子供の参観日があって…熱が下がれば行けますか？",
      callBack: {
        correct:   "📞 田中さんから：解熱剤が効いて、夕方の参観日に間に合いました。ありがとうございました",
        incorrect: "⚠ 田中さんから：入院が必要だったんでしょうか…仕事も休めなくて困っています",
      },
    },
    {
      id: "w2", name: "山本 大輔", age: 28, sex: "男性", pmh: "なし",
      chief: "右足首捻挫・疼痛", color: "green",
      HR: 76, BP_sys: 122, BP_dia: 78, SpO2: 99, GCS: 15, RR: 16, Temp: 36.7,
      disease: "minor", noOrderNeeded: true,
      story: "明日、チームの大事な試合があるんです。テーピングすれば出られますか？",
      callBack: {
        correct:   "📞 山本さんから：テーピングで固定して試合に出られました！ありがとうございます",
        incorrect: "⚠ 山本さんから：検査が多くて疲れました…次から病院に来るのが怖いです",
      },
    },
    {
      id: "w3", name: "鈴木 光子", age: 68, sex: "女性", pmh: "高血圧・高脂血症",
      chief: "めまい・頭痛", color: "orange",
      HR: 92, BP_sys: 158, BP_dia: 94, SpO2: 97, GCS: 15, RR: 17, Temp: 36.9,
      disease: "bp",
      story: "最近忙しくて降圧剤を飲み忘れていて…息子に無理やり連れてこられました",
      callBack: {
        correct:   "📞 鈴木さんが一般病棟で降圧治療中。血圧が安定してきました。息子さんも安心されています",
        incorrect: "⚠ 鈴木さんを帰宅させましたが、深夜に高血圧緊急症で再搬送されました",
      },
    },
  ];
  state.staffEnabled = true;
  state.staffState = state.staffState
    ? state.staffState.filter(s => s.id === "n1").map(s => ({ ...s, fatigue: 0, onBreak: false, assignedBedId: null, absent: false }))
    : [];
  state.satEnabled   = true;
  state.callEnabled  = false;
  document.getElementById("staff-panel").style.display = "";
  document.getElementById("shift-wrap").style.display  = "flex";
  document.getElementById("stage-lbl").textContent = "Stage 1";
  document.getElementById("tut-nav").classList.remove("show");
  document.getElementById("sp-ring").style.display = "none";
}

export function setupStage2() {
  state.beds = [
    { id: "c1", zone: "critical", label: "重症 01", patient: null },
    { id: "c2", zone: "critical", label: "重症 02", patient: null },
    { id: "e1", zone: "exam",     label: "診察 01", patient: null },
    { id: "e2", zone: "exam",     label: "診察 02", patient: null },
  ];
  state.waitPatients = [
    {
      id: "s2-p1", name: "木村 義男", age: 62, sex: "男性", pmh: "高血圧・喫煙歴",
      chief: "胸痛・冷汗", color: "orange",
      HR: 104, BP_sys: 102, BP_dia: 66, SpO2: 96, GCS: 15, RR: 20, Temp: 36.5,
      disease: "acs",
      story: "今日は孫の誕生日で、ケーキを買って帰る約束なんです…胸がつぶれるみたいで。",
      callBack: {
        correct:   "📞 木村さんのご家族から：すぐICUで治療が始まり、山場を越えました。孫にも無事だと伝えられました",
        incorrect: "⚠ 木村さんは帰宅後に胸痛が悪化し、心停止寸前で再搬送されました",
      },
    },
    {
      id: "s2-p2", name: "佐藤 真理", age: 54, sex: "女性", pmh: "胆石症",
      chief: "腹痛・嘔気", color: "orange",
      HR: 95, BP_sys: 110, BP_dia: 70, SpO2: 97, GCS: 15, RR: 18, Temp: 37.4,
      disease: "abdo",
      story: "母の夕飯を作らないといけないんです。でも立っているのもつらくて…。",
      callBack: {
        correct:   "📞 佐藤さんから：入院して点滴と検査を受け、腹痛が落ち着いてきました。母にも連絡できました",
        incorrect: "⚠ 佐藤さんは帰宅後に腹痛が悪化し、腹膜炎疑いで再搬送されました",
      },
    },
    {
      id: "s2-p3", name: "田中 恵子", age: 45, sex: "女性", pmh: "花粉症",
      chief: "発熱・咽頭痛", color: "green",
      HR: 88, BP_sys: 118, BP_dia: 76, SpO2: 98, GCS: 15, RR: 16, Temp: 38.4,
      disease: "fever",
      story: "明日の朝までに少しでも楽になりたいんです。家のことを代われる人がいなくて…。",
      callBack: {
        correct:   "📞 田中さんから：薬を飲んで休んだら熱が下がってきました。家でも様子を見られそうです",
        incorrect: "⚠ 田中さんから：入院と言われて家の予定が全部止まってしまいました。本当に必要だったのでしょうか",
      },
    },
  ];
  state.staffEnabled = false;
  state.satEnabled   = true;
  state.callEnabled  = true;
  document.getElementById("staff-panel").style.display = "none";
  document.getElementById("shift-wrap").style.display  = "flex";
  document.getElementById("stage-lbl").textContent = "Stage 2";
  document.getElementById("tut-nav").classList.remove("show");
  document.getElementById("sp-ring").style.display = "none";
}

export function setupStage3() {
  state.beds = [
    { id: "c1", zone: "critical", label: "重症 01", patient: null },
    { id: "c2", zone: "critical", label: "重症 02", patient: null },
    { id: "e1", zone: "exam",     label: "診察 01", patient: null },
    { id: "e2", zone: "exam",     label: "診察 02", patient: null },
    { id: "e3", zone: "exam",     label: "診察 03", patient: null },
  ];
  state.waitPatients = [
    {
      id: "s3-p1", name: "高橋 由美", age: 70, sex: "女性", pmh: "心房細動・高血圧",
      chief: "意識レベル低下・右片麻痺", color: "red",
      HR: 58, BP_sys: 185, BP_dia: 110, SpO2: 94, GCS: 11, RR: 20, Temp: 36.6,
      disease: "stroke",
      story: "朝の散歩に出ようとしたら、急に足が動かなくて…言葉も出にくいんです。",
      callBack: {
        correct:   "📞 高橋さんの息子さんから：すぐICUで治療が始まり、麻痺の悪化は止まっています。ありがとうございます",
        incorrect: "⚠ 高橋さんは帰宅後に意識が悪化し、重い後遺症が残る可能性が高い状態で再搬送されました",
      },
    },
    {
      id: "s3-p2", name: "木村 義男", age: 62, sex: "男性", pmh: "高血圧・喫煙歴",
      chief: "胸痛・冷汗", color: "red",
      HR: 118, BP_sys: 72, BP_dia: 48, SpO2: 90, GCS: 14, RR: 26, Temp: 36.4,
      disease: "acs",
      story: "仕事の引き継ぎだけでも電話したいんですが…胸が苦しくて声が出ません。",
      callBack: {
        correct:   "📞 木村さんの同僚から：ICUで処置が始まったと聞きました。命が助かって本当によかったです",
        incorrect: "⚠ 木村さんは帰宅後に倒れ、急性心筋梗塞の疑いで緊急再搬送されました",
      },
    },
    {
      id: "s3-p3", name: "佐藤 真理", age: 54, sex: "女性", pmh: "胆石症",
      chief: "腹痛・嘔気", color: "orange",
      HR: 96, BP_sys: 108, BP_dia: 68, SpO2: 97, GCS: 15, RR: 18, Temp: 37.5,
      disease: "abdo",
      story: "痛み止めだけもらえれば帰れると思って来たんです。でも波みたいに痛みます。",
      callBack: {
        correct:   "📞 佐藤さんから：入院して詳しく診てもらえて安心しました。痛みも少し落ち着いています",
        incorrect: "⚠ 佐藤さんは帰宅後に嘔吐と腹痛が強くなり、緊急手術の可能性がある状態で戻ってきました",
      },
    },
    {
      id: "s3-p4", name: "山本 大輔", age: 28, sex: "男性", pmh: "なし",
      chief: "右足首捻挫・疼痛", color: "green",
      HR: 76, BP_sys: 122, BP_dia: 78, SpO2: 99, GCS: 15, RR: 16, Temp: 36.7,
      disease: "minor", noOrderNeeded: true,
      story: "歩くと痛いけど、明日はどうしても外せない予定があって…大げさじゃないですよね？",
      callBack: {
        correct:   "📞 山本さんから：安静と固定でだいぶ楽になりました。余計な検査がなくて助かりました",
        incorrect: "⚠ 山本さんから：検査や処置が多くて不安になりました…軽いけがでも大ごとになるんですね",
      },
    },
  ];
  state.staffEnabled = true;
  logMsg('system', '📋 今回からスタッフ管理が導入されます。左パネルのスタッフを患者ベッドに配置して処置を速めましょう。疲労に注意！');
  state.satEnabled   = true;
  state.callEnabled  = true;
  document.getElementById("staff-panel").style.display = "flex";
  document.getElementById("shift-wrap").style.display  = "flex";
  document.getElementById("stage-lbl").textContent = "Stage 3";
  document.getElementById("tut-nav").classList.remove("show");
  document.getElementById("sp-ring").style.display = "none";
}

export function setupStageEndless() {
  state.beds = [
    { id: "c1", zone: "critical", label: "重症 01", patient: null },
    { id: "c2", zone: "critical", label: "重症 02", patient: null },
    { id: "e1", zone: "exam",     label: "診察 01", patient: null },
    { id: "e2", zone: "exam",     label: "診察 02", patient: null },
    { id: "e3", zone: "exam",     label: "診察 03", patient: null },
    { id: "e4", zone: "exam",     label: "診察 04", patient: null },
  ];

  // フェーズ1（緑多め）の患者を2名用意してスタート
  const initPool = [...STAGE4_POOL, ...STAGE5_POOL].filter(p => p.color !== 'red');
  state.waitPatients = pickRandomN(initPool, 2).map((p, i) => ({
    ...p, id: 'se-init-' + i, orders: [], signals: {}, urgency: 100, ivOrdered: false, disposed: false,
  }));

  state.staffEnabled    = true;
  state.satEnabled      = true;
  state.callEnabled     = true;
  state.activeEvent     = null;
  state.endlessCount    = 0; // 補充した患者の通し番号

  document.getElementById("staff-panel").style.display = "flex";
  document.getElementById("shift-wrap").style.display  = "none"; // シフトバーは非表示（時間無制限）
  document.getElementById("stage-lbl").textContent = "Endless";
  document.getElementById("tut-nav").classList.remove("show");
  document.getElementById("sp-ring").style.display = "none";
}

export function setupStageReverse() {
  // 全ベッドに引き継ぎ患者を配置（前の担当医が崩壊させたシフト）
  const makeP = (id, name, age, sex, pmh, chief, color, HR, BP_sys, BP_dia, SpO2, GCS, RR, Temp, disease, extra = {}) => ({
    id, name, age, sex, pmh, chief, color, HR, BP_sys, BP_dia, SpO2, GCS, RR, Temp, disease,
    orders: [], signals: {}, urgency: 100, ivOrdered: false, disposed: false, ...extra,
  });

  const p_c1 = makeP("sr-p1", "村上 修二", 69, "男性", "高血圧・糖尿病・喫煙歴",
    "胸痛・冷汗（入室から20分放置）", "red",
    132, 78, 46, 90, 13, 28, 36.3, "acs", {
      story: "…先生、ようやく来てくれた。胸が…もう限界です",
      callBack: {
        correct:   "📞 村上さんのご家族から：ICUで治療が始まり、山場を越えました",
        incorrect: "⚠ 村上さんは帰宅後に心停止寸前の状態で再搬送されました",
      },
    });

  const p_c2 = makeP("sr-p2", "岡田 静江", 75, "女性", "関節リウマチ・ステロイド内服",
    "高熱・意識混濁（前シフトから継続）", "red",
    140, 80, 44, 91, 11, 32, 40.1, "sepsis", {
      orders: [{ id: "o1", type: "iv", label: "点滴", status: "done", result: null }],
      ivOrdered: true,
      story: "…さむい…寒くて…震えが…止まらなくて…",
      callBack: {
        correct:   "📞 岡田さんのご家族から：ICUで抗菌薬が効いてきました。ありがとうございます",
        incorrect: "⚠ 岡田さんは帰宅後に敗血症性ショックで重篤化し緊急再搬送されました",
      },
    });

  const p_e1 = makeP("sr-p3", "前田 一郎", 58, "男性", "胆石症",
    "右上腹部痛・黄疸（長時間待機中）", "orange",
    110, 100, 64, 95, 15, 22, 39.1, "abdo", {
      story: "1時間以上待っています…もう限界です。どうなってるんですか",
      callBack: {
        correct:   "📞 前田さんから：入院して治療を受け、痛みが落ち着いてきました",
        incorrect: "⚠ 前田さんは帰宅後に胆管炎が悪化し、敗血症で再搬送されました",
      },
    });

  const p_e2 = makeP("sr-p4", "安田 千春", 42, "女性", "なし",
    "発熱・倦怠感（処置不要な患者）", "green",
    88, 116, 74, 98, 15, 16, 38.3, "fever", {
      noOrderNeeded: false,
      story: "ずっと待っているんですが…先生、私のこと忘れてましたか？",
      callBack: {
        correct:   "📞 安田さんから：薬を飲んで休んだら回復しました。迅速な対応ありがとうございます",
        incorrect: "⚠ 安田さんから：入院になるとは思いませんでした。家族に連絡できなくて困っています",
      },
    });

  const p_e3 = makeP("sr-p5", "川口 悟", 65, "男性", "高血圧・慢性片頭痛",
    "激しい頭痛・血圧高値", "orange",
    96, 198, 112, 96, 14, 20, 36.8, "bp", {
      story: "頭が割れそうで…目もぼやけています。早く診てください",
      callBack: {
        correct:   "📞 川口さんから：降圧治療で頭痛が楽になりました。ありがとうございます",
        incorrect: "⚠ 川口さんは帰宅後に高血圧性脳症で意識障害が出現し再搬送されました",
      },
    });

  state.beds = [
    { id: "c1", zone: "critical", label: "重症 01", patient: p_c1 },
    { id: "c2", zone: "critical", label: "重症 02", patient: p_c2 },
    { id: "e1", zone: "exam",     label: "診察 01", patient: p_e1 },
    { id: "e2", zone: "exam",     label: "診察 02", patient: p_e2 },
    { id: "e3", zone: "exam",     label: "診察 03", patient: p_e3 },
  ];

  state.waitPatients = [];
  state.staffEnabled = true;
  state.satEnabled   = true;
  state.callEnabled  = true;
  state.activeEvent  = null;

  // スタッフを疲弊状態でスタート（前シフトの引き継ぎ）
  state.staffState.forEach(s => {
    if (s.id === 'n1') s.fatigue = 50;
    if (s.id === 'n2') s.fatigue = 65;
    if (s.id === 'n3') s.fatigue = 40;
    if (s.id === 'd1') s.fatigue = 55;
    if (s.id === 'd2') s.fatigue = 78;
  });

  // 満足度を20%に直接設定
  state.satisfaction = 20;
  const col = "#ef4444";
  document.getElementById("sat-fill").style.width      = "20%";
  document.getElementById("sat-fill").style.background = col;
  document.getElementById("sat-pct").textContent       = "20%";
  document.getElementById("sat-pct").style.color       = col;
  const ei = document.getElementById("sat-emoji");
  if (ei) ei.textContent = "💀 患者満足度";

  document.getElementById("staff-panel").style.display = "flex";
  document.getElementById("shift-wrap").style.display  = "flex";
  document.getElementById("stage-lbl").textContent = "逆転シフト";
  document.getElementById("tut-nav").classList.remove("show");
  document.getElementById("sp-ring").style.display = "none";

  // 引き継ぎ演出ログ
  setTimeout(() => logMsg('system', '🚨 緊急引き継ぎ：前の担当医が急病で搬送されました'), 300);
  setTimeout(() => logMsg('system', '📋 全ベッドに患者あり。引き継ぎノートなし。現場を立て直してください'), 1500);
  setTimeout(() => logMsg('nurse',  '青木「先生！c1の村上さん、バイタルが限界です！」'), 3000);
  setTimeout(() => logMsg('nurse',  '林「e1の前田さんが1時間以上お待ちです…クレームが来ています」'), 5000);
}

export function setupStage5() {
  const reds    = STAGE5_POOL.filter(p => p.color === 'red');
  const oranges = STAGE5_POOL.filter(p => p.color === 'orange');
  const greens  = STAGE5_POOL.filter(p => p.color === 'green');
  const picked  = [
    ...pickRandomN(reds, 3),
    ...pickRandomN(oranges, 2),
    ...pickRandomN(greens, 1),
  ].map((p, i) => ({ ...p, id: 's5-' + i, orders: [], signals: {}, urgency: 100, ivOrdered: false, disposed: false }));

  state.beds = [
    { id: "c1", zone: "critical", label: "重症 01", patient: null },
    { id: "c2", zone: "critical", label: "重症 02", patient: null },
    { id: "c3", zone: "critical", label: "重症 03", patient: null },
    { id: "e1", zone: "exam",     label: "診察 01", patient: null },
    { id: "e2", zone: "exam",     label: "診察 02", patient: null },
    { id: "e3", zone: "exam",     label: "診察 03", patient: null },
    { id: "e4", zone: "exam",     label: "診察 04", patient: null },
    { id: "e5", zone: "exam",     label: "診察 05", patient: null },
  ];
  state.waitPatients   = picked;
  state.staffEnabled   = true;
  state.satEnabled     = true;
  state.callEnabled    = true;
  state.stage5EventCount = 0;
  state.activeEvent    = null;

  // 夜間単独シフト：n2・n3・d2 を不在扱い（青木 + 松本 の2名体制）
  const absentIds = ['n2', 'n3', 'd2'];
  state.staffState.forEach(s => {
    if (absentIds.includes(s.id)) { s.absent = true; return; }
    s.fatigueRate *= 1.4; // 夜間は疲弊しやすい
  });

  // 時計を深夜02:00から開始
  state.clockMin = 2;
  state.clockSec = 0;

  document.getElementById("staff-panel").style.display = "flex";
  document.getElementById("shift-wrap").style.display  = "flex";
  document.getElementById("stage-lbl").textContent = "Stage 5";
  document.getElementById("tut-nav").classList.remove("show");
  document.getElementById("sp-ring").style.display = "none";
}

export function setupStage4() {
  const reds    = STAGE4_POOL.filter(p => p.color === 'red');
  const oranges = STAGE4_POOL.filter(p => p.color === 'orange');
  const greens  = STAGE4_POOL.filter(p => p.color === 'green');
  const picked  = [
    ...pickRandomN(reds, 3),
    ...pickRandomN(oranges, 1),
    ...pickRandomN(greens, 1),
  ].map((p, i) => ({ ...p, id: 's4-' + i, orders: [], signals: {}, urgency: 100, ivOrdered: false, disposed: false }));

  state.beds = [
    { id: "c1", zone: "critical", label: "重症 01", patient: null },
    { id: "c2", zone: "critical", label: "重症 02", patient: null },
    { id: "e1", zone: "exam",     label: "診察 01", patient: null },
    { id: "e2", zone: "exam",     label: "診察 02", patient: null },
    { id: "e3", zone: "exam",     label: "診察 03", patient: null },
  ];
  state.waitPatients  = picked;
  state.staffEnabled  = true;
  state.satEnabled    = true;
  state.callEnabled   = true;
  state.stage4EventFired = false;
  state.activeEvent   = null;
  document.getElementById("staff-panel").style.display = "flex";
  document.getElementById("shift-wrap").style.display  = "flex";
  document.getElementById("stage-lbl").textContent = "Stage 4";
  document.getElementById("tut-nav").classList.remove("show");
  document.getElementById("sp-ring").style.display = "none";
}

export const STAGES_META = [
  {
    id: "tutorial",
    title: "チュートリアル",
    subtitle: "救急外来へようこそ",
    description: "基本操作を学ぶ。患者は軽症のみ。まずは流れを掴もう。",
    beds: 3,
    staffMode: "none",
    staffPool: [],
    staffCount: 0,
    icon: "ti-school",
    unlockAfter: null,
  },
  {
    id: "stage1",
    title: "Stage 1 — 一人当直",
    subtitle: "今夜は君一人だ",
    description: "スタッフなし。軽〜中等症の患者を一人でこなす。",
    beds: 5,
    staffMode: "none",
    staffPool: [],
    staffCount: 0,
    icon: "ti-user",
    unlockAfter: "tutorial",
  },
  {
    id: "stage2",
    title: "Stage 2 — 先輩ナースと一緒に",
    subtitle: "青木チーフが手伝ってくれる",
    description: "看護師チーフ・青木が固定でサポート。スタッフ配置の効果を体験しよう。",
    beds: 6,
    staffMode: "fixed",
    staffPool: ["n1"],
    staffCount: 1,
    icon: "ti-users",
    unlockAfter: "stage1",
  },
  {
    id: "stage3",
    title: "Stage 3 — チームを組もう",
    subtitle: "看護師から2名を選んでください",
    description: "ER拡張。看護師3名の中から2名を選んでシフトに入ろう。",
    beds: 6,
    staffMode: "select",
    staffPool: ["n1", "n2", "n3"],
    staffCount: 2,
    icon: "ti-user-plus",
    unlockAfter: "stage2",
  },
  {
    id: "stage4",
    title: "Stage 4 — 研修医ローテ開始",
    subtitle: "医師がチームに加わった",
    description: "研修医がローテートで来てくれた。看護師2名＋研修医1名でチームを編成しよう。",
    beds: 6,
    staffMode: "select",
    staffPool: ["n1", "n2", "n3", "d1", "d2"],
    staffCount: 3,
    staffRule: "min1nurse_min1doctor",
    icon: "ti-stethoscope",
    unlockAfter: "stage3",
  },
  {
    id: "stage5",
    title: "Stage 5 — 週末の繁忙期",
    subtitle: "フルチームで乗り越えろ",
    description: "週末で患者が急増。5名から3名を自由に選んでチームを組もう。",
    beds: 8,
    staffMode: "select",
    staffPool: ["n1", "n2", "n3", "d1", "d2"],
    staffCount: 3,
    icon: "ti-calendar-week",
    unlockAfter: "stage4",
  },
  {
    id: "stage6",
    title: "Stage 6 — ベテラン欠員",
    subtitle: "青木チーフが急病で欠勤",
    description: "頼りになる青木が不在。残り4名から3名を選んで乗り切ろう。",
    beds: 8,
    staffMode: "select",
    staffPool: ["n2", "n3", "d1", "d2"],
    staffCount: 3,
    icon: "ti-user-off",
    unlockAfter: "stage5",
  },
  {
    id: "stage7",
    title: "Stage 7 — 深夜のER",
    subtitle: "夜間単独シフト",
    description: "深夜のER。スタッフは2名のみ。夜間イベントに備えよ。",
    beds: 8,
    staffMode: "fixed",
    staffPool: ["n1", "d1"],
    staffCount: 2,
    icon: "ti-moon",
    unlockAfter: "stage6",
  },
  {
    id: "stage8",
    title: "Stage 8 — 多重外傷",
    subtitle: "大規模事故の搬送が続く",
    description: "外傷患者が集中する。CT故障イベントあり。チーム編成が鍵になる。",
    beds: 8,
    staffMode: "select",
    staffPool: ["n1", "n2", "n3", "d1", "d2"],
    staffCount: 3,
    icon: "ti-ambulance",
    unlockAfter: "stage7",
  },
  {
    id: "stage9",
    title: "Stage 9 — 逆転の引き継ぎ",
    subtitle: "最悪の状態からスタート",
    description: "満足度20%・全床埋まりの状態で引き継ぎ。立て直せるか。",
    beds: 8,
    staffMode: "select",
    staffPool: ["n1", "n2", "n3", "d1", "d2"],
    staffCount: 3,
    icon: "ti-urgent",
    unlockAfter: "stage8",
  },
  {
    id: "stage10",
    title: "Stage 10 — 疲弊引き継ぎ",
    subtitle: "前チームは限界だった",
    description: "引き継いだらスタッフ全員が疲弊状態(🟠)でスタート。休憩を上手く回しながら乗り切ろう。",
    beds: 8,
    staffMode: "select",
    staffPool: ["n1", "n2", "n3", "d1", "d2"],
    staffCount: 3,
    startFatigue: 75,
    icon: "ti-battery-2",
    unlockAfter: "stage9",
  },
  {
    id: "stageE",
    title: "Stage 11 — エンドレスシフト",
    subtitle: "終わりなき救急外来",
    description: "フルチーム5名全員投入。フェーズが加速し続ける。ハイスコアを目指せ。",
    beds: 8,
    staffMode: "fixed",
    staffPool: ["n1", "n2", "n3", "d1", "d2"],
    staffCount: 5,
    icon: "ti-infinity",
    unlockAfter: "stage10",
  },
];
