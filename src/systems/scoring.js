import { state } from '../state.js';

export function getUrgencyColor(p) {
  return p > 60 ? "#22c55e" : p > 30 ? "#f97316" : "#ef4444";
}

export function calcGrade() {
  if (state.satisfaction > 80 && state.score > 500) return { g: "S", cls: "gS", c: "完璧なシフト！" };
  if (state.satisfaction > 60 && state.score > 300) return { g: "A", cls: "gA", c: "優秀な判断でした。" };
  if (state.satisfaction > 40 && state.score > 150) return { g: "B", cls: "gB", c: "良い対応でした。" };
  if (state.satisfaction > 20)                      return { g: "C", cls: "gC", c: "優先順位を再確認しましょう。" };
  return                                                   { g: "D", cls: "gD", c: "重症患者への対応を優先しましょう。" };
}

export function changeSat(delta) {
  if (!state.satEnabled || !state.gameRunning) return;
  state.satisfaction = Math.max(0, Math.min(100, state.satisfaction + delta));
  const pct = Math.round(state.satisfaction);
  const col = pct > 60 ? "#22c55e" : pct > 30 ? "#f97316" : "#ef4444";
  document.getElementById("sat-fill").style.width      = pct + "%";
  document.getElementById("sat-fill").style.background = col;
  document.getElementById("sat-pct").textContent       = pct + "%";
  document.getElementById("sat-pct").style.color       = col;
  const ei = document.getElementById("sat-emoji");
  if (ei) ei.textContent = (pct > 60 ? "😊" : pct > 30 ? "😰" : "💀") + " 患者満足度";
  document.body.dataset.satLevel = pct <= 30 ? "low" : pct <= 60 ? "mid" : "high";
  if (state.satisfaction <= 0 && !state.gameOver) triggerGameOver();
}

const ENDLESS_HS_KEY = 'codeRedEndlessHS';

export function triggerGameOver() {
  if (state.gameOver || state.gameClear) return;
  state.gameOver    = true;
  state.gameRunning = false;
  if (state.mainLoop) { clearInterval(state.mainLoop); state.mainLoop = null; }
  const gr = calcGrade();
  document.getElementById("go-score").textContent = state.score.toLocaleString();
  document.getElementById("go-disp").textContent  = state.dispCountVal;
  const m = Math.floor(state.shiftElapsed / 60), s = state.shiftElapsed % 60;
  document.getElementById("go-time").textContent  = m + ":" + (s < 10 ? "0" + s : s);
  document.getElementById("go-grade").textContent = gr.g;
  document.getElementById("go-grade").className   = "gbadge " + gr.cls;

  // エンドレスモードのハイスコア処理
  if (state.currentStage === "stageE") {
    const prev = parseInt(localStorage.getItem(ENDLESS_HS_KEY) || "0");
    const isNew = state.score > prev;
    if (isNew) localStorage.setItem(ENDLESS_HS_KEY, String(state.score));
    const hsLine = isNew
      ? `🏆 NEW RECORD！ ${state.score.toLocaleString()}pt`
      : `ベスト：${prev.toLocaleString()}pt`;
    document.getElementById("go-comment").textContent = hsLine;
    document.getElementById("go-grade").textContent = isNew ? "🏆" : gr.g;
    document.getElementById("go-grade").className   = "gbadge " + (isNew ? "gS" : gr.cls);
  } else {
    document.getElementById("go-comment").textContent = gr.c;
  }

  document.getElementById("screen-go").classList.add("show");
}

export function triggerClear(msg = "クリア！", sub = "") {
  if (state.gameOver || state.gameClear) return;
  state.gameClear   = true;
  state.gameRunning = false;
  if (state.currentStage) window.markStageCleared?.(state.currentStage);
  if (state.mainLoop) { clearInterval(state.mainLoop); state.mainLoop = null; }
  const gr  = calcGrade();
  const sat = Math.round(state.satisfaction);
  document.getElementById("cl-title").textContent   = msg;
  document.getElementById("cl-sub").textContent     = sub || `転帰${state.dispCountVal}名・満足度${sat}%`;
  document.getElementById("cl-score").textContent   = state.score.toLocaleString();
  document.getElementById("cl-disp").textContent    = state.dispCountVal;
  document.getElementById("cl-sat").textContent     = sat + "%";
  document.getElementById("cl-grade").textContent   = gr.g;
  document.getElementById("cl-grade").className     = "gbadge " + gr.cls;
  document.getElementById("cl-comment").textContent = gr.c;
  document.getElementById("screen-cl").classList.add("show");
}
