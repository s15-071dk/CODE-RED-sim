import { state } from '../state.js';
import { TUT_STEPS } from '../data/stages.js';

export function showTutStep(idx) {
  const step = TUT_STEPS[idx];
  if (!step) return;
  const nav = document.getElementById("tut-nav");
  nav.classList.add("show");
  document.getElementById("tut-icon").textContent  = step.icon;
  document.getElementById("tut-step").textContent  = step.step;
  document.getElementById("tut-text").textContent  = step.text;
  document.getElementById("tut-hint").textContent  = step.hint;
  const nb = document.getElementById("tut-next");
  if (step.nextLabel) {
    nb.style.display = "";
    nb.textContent   = step.nextLabel;
    nb.disabled      = false;
  } else {
    nb.style.display = "none";
  }
  showSpotlight(step.id);
}

export function showSpotlight(stepId) {
  const ring = document.getElementById("sp-ring");
  const map  = { drag: "wait-list", click_bed: "critical-beds", order: "rp-body", more_order: "rp-body", disp: "rp-body" };
  const targetId = map[stepId];
  if (!targetId) { ring.style.display = "none"; return; }
  const shell  = document.getElementById("er-area");
  const target = document.getElementById(targetId);
  if (!target)  { ring.style.display = "none"; return; }
  const sr  = shell.getBoundingClientRect();
  const tr  = target.getBoundingClientRect();
  const pad = 8;
  ring.style.display = "block";
  ring.style.left    = (tr.left - sr.left - pad) + "px";
  ring.style.top     = (tr.top  - sr.top  - pad) + "px";
  ring.style.width   = (tr.width  + pad * 2) + "px";
  ring.style.height  = (tr.height + pad * 2) + "px";
}

export function nextTutStep() {
  state.tutStepIdx++;
  if (state.tutStepIdx >= TUT_STEPS.length) return;
  showTutStep(state.tutStepIdx);
  if (TUT_STEPS[state.tutStepIdx].id === "done") completeTutorial();
}

export function skipTut() {
  document.getElementById("tut-nav").classList.remove("show");
  document.getElementById("sp-ring").style.display = "none";
  state.progress.tutDone = true;
  // updateUnlocks は main.js 経由で呼ぶ
  if (typeof window.updateUnlocks === 'function') window.updateUnlocks();
}

export function checkTutEvent(event) {
  if (state.currentStage !== "tutorial") return;
  const step = TUT_STEPS[state.tutStepIdx];
  if (!step || !step.waitFor) return;
  let match = false;
  if (step.waitFor === "assigned"   && event === "assigned")  match = true;
  if (step.waitFor === "bed_click"  && event === "bed_click") match = true;
  if (step.waitFor === "ordered"    && event === "ordered")   match = true;
  if (step.waitFor === "two_orders" && event === "ordered" && state.orderCountForTut >= 2) match = true;
  if (step.waitFor === "disposed"   && event === "disposed")  match = true;
  if (match) nextTutStep();
}

export function completeTutorial() {
  state.progress.tutDone = true;
  if (typeof window.updateUnlocks === 'function') window.updateUnlocks();
  setTimeout(() => {
    // triggerClear は main.js 経由
    if (typeof window._triggerClear === 'function') window._triggerClear("チュートリアル完了！", "基本操作をマスターしました");
    document.getElementById("btn-next-stage").textContent = "ステージ1へ →";
    document.getElementById("btn-next-stage").onclick = () => {
      if (typeof window.startStage === 'function') window.startStage("stage1");
    };
  }, 500);
}
