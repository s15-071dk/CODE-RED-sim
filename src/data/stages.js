import { state } from '../state.js';

export const TUT_STEPS = [
  { id: "welcome",    icon: "🏥", step: "ようこそ",               text: "CODE RED ERへようこそ！\nあなたは救急外来の担当医です。患者を処置してdispositionを決定しましょう。",    hint: "",                                    nextLabel: "はじめる", waitFor: null },
  { id: "drag",       icon: "👤", step: "STEP 1/5 — 患者割り当て", text: "左パネルの患者カードの「割り当て」ボタンをクリックして、空きベッドへ割り当ててください。",          hint: "💡 割り当てボタンを押してから空きベッドを選択", nextLabel: null,       waitFor: "assigned" },
  { id: "click_bed",  icon: "🛏️", step: "STEP 2/5 — ベッド確認",  text: "患者がベッドに入りました！\nベッドをクリックすると右側に詳細が表示されます。",                     hint: "💡 ベッドをクリックしてみましょう",       nextLabel: null,       waitFor: "bed_click" },
  { id: "order",      icon: "📋", step: "STEP 3/5 — オーダー",    text: "まず「点滴」をオーダーしてください。\n検査結果が🔴🟡🟢で返ってきます。",                          hint: "💡 点滴ボタンを押してください",           nextLabel: null,       waitFor: "ordered" },
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
  state.staffEnabled = false;
  state.satEnabled   = false;
  state.callEnabled  = false;
  document.getElementById("staff-panel").style.display = "none";
  document.getElementById("shift-wrap").style.display  = "none";
  document.getElementById("stage-lbl").textContent = "Tutorial";
  state.orderCountForTut = 0;
}

export function setupStage1() {
  state.beds = makeBeds();
  state.waitPatients = [
    { id: "w1", name: "田中 恵子", age: 45, sex: "女性", pmh: "花粉症",         chief: "発熱・咽頭痛",    color: "green",  HR: 82, BP_sys: 118, BP_dia: 74, SpO2: 99, GCS: 15, RR: 15, Temp: 38.6, disease: "fever" },
    { id: "w2", name: "山本 大輔", age: 28, sex: "男性", pmh: "なし",           chief: "右足首捻挫・疼痛", color: "green",  HR: 76, BP_sys: 122, BP_dia: 78, SpO2: 99, GCS: 15, RR: 16, Temp: 36.7, disease: "minor", noOrderNeeded: true },
    { id: "w3", name: "鈴木 光子", age: 68, sex: "女性", pmh: "高血圧・高脂血症", chief: "めまい・頭痛",   color: "orange", HR: 92, BP_sys: 158, BP_dia: 94, SpO2: 97, GCS: 15, RR: 17, Temp: 36.9, disease: "bp" },
  ];
  state.staffEnabled = false;
  state.satEnabled   = true;
  state.callEnabled  = false;
  document.getElementById("staff-panel").style.display = "none";
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
      chief: "胸痛・冷汗", color: "red",
      HR: 115, BP_sys: 75, BP_dia: 50, SpO2: 91, GCS: 14, RR: 24, Temp: 36.5,
      disease: "acs",
    },
    {
      id: "s2-p2", name: "佐藤 真理", age: 54, sex: "女性", pmh: "胆石症",
      chief: "腹痛・嘔気", color: "orange",
      HR: 95, BP_sys: 110, BP_dia: 70, SpO2: 97, GCS: 15, RR: 18, Temp: 37.4,
      disease: "abdo",
    },
    {
      id: "s2-p3", name: "田中 恵子", age: 45, sex: "女性", pmh: "花粉症",
      chief: "発熱・咽頭痛", color: "green",
      HR: 88, BP_sys: 118, BP_dia: 76, SpO2: 98, GCS: 15, RR: 16, Temp: 38.4,
      disease: "fever",
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
