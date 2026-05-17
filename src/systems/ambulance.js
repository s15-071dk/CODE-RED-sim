import { state } from '../state.js';
import { CALL_PATIENTS, CALL_UNITS } from '../data/patients.js';
import { renderWaitList } from '../ui/render.js';
import { showToast, logMsg } from '../ui/notifications.js';
import { changeSat } from './scoring.js';

export function triggerCall() {
  if (!state.gameRunning || !state.callEnabled) return;
  const p = CALL_PATIENTS[Math.floor(Math.random() * CALL_PATIENTS.length)];
  const u = CALL_UNITS[Math.floor(Math.random() * CALL_UNITS.length)];
  state._pendingCall = p;

  document.getElementById("call-unit").textContent    = u.unit + " より入電";
  document.getElementById("call-station").textContent = u.station;
  ["c-patient", "c-chief", "c-vitals", "c-triage", "c-scene", "c-dist"].forEach((id, i) => {
    const vals = [`${p.name} / ${p.age}歳 ${p.sex}`, p.chief, p.vitals, p.triage, p.scene, p.dist];
    document.getElementById(id).textContent = vals[i];
  });
  document.getElementById("c-triage").className = "call-val" + (p.color === "red" ? " red" : " orange");

  let eta = p.eta;
  document.getElementById("c-eta").textContent = eta;
  if (state.callTimer) clearInterval(state.callTimer);
  state.callTimer = setInterval(() => {
    eta = Math.max(0, eta - 1);
    document.getElementById("c-eta").textContent = eta;
    if (eta === 0) { clearInterval(state.callTimer); state.callTimer = null; }
  }, 1000);

  document.getElementById("call-overlay").classList.add("active");
  document.getElementById("top-alert").style.display = "";
}

export function acceptCall() {
  if (state.callTimer) { clearInterval(state.callTimer); state.callTimer = null; }
  document.getElementById("call-overlay").classList.remove("active");
  document.getElementById("top-alert").style.display = "none";

  const p = state._pendingCall;
  if (p) {
    state.waitPatients.push({ ...p, id: "w" + Date.now() });
    renderWaitList();
    showToast(`${p.name}が到着 — ベッドへ割り当ててください`, "warn");
    state.score += 50;
    document.getElementById("score-disp").textContent = state.score.toLocaleString();
    changeSat(3);
    logMsg('system', '🚑 搬送承諾 — ' + p.name + ' / ' + p.chief);
  }
  state._pendingCall = null;
  if (state.callEnabled) setTimeout(triggerCall, 15000 + Math.random() * 10000);
}

export function declineCall() {
  if (state.callTimer) { clearInterval(state.callTimer); state.callTimer = null; }
  document.getElementById("call-overlay").classList.remove("active");
  document.getElementById("top-alert").style.display = "none";
  changeSat(-5);
  showToast("受け入れ不可 — 満足度が低下しました", "warn");
  state._pendingCall = null;
  if (state.callEnabled) setTimeout(triggerCall, 15000 + Math.random() * 10000);
}
