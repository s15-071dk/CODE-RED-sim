import { state } from '../state.js';
import { DISEASE_SIG, PATIENT_SPEECH } from '../data/diseases.js';
import { renderBeds, renderDetail } from '../ui/render.js';
import { logMsg, showToast } from '../ui/notifications.js';
import { changeSat } from './scoring.js';
import { checkTutEvent } from './tutorial.js';
import { pickRandom } from '../utils/random.js';

export function openDispModal(bedId) {
  state.dispTargetBedId = bedId;
  const bed = state.beds.find(b => b.id === bedId);
  document.getElementById("dm-title").textContent = `転帰を決定 — ${bed?.patient?.name}`;
  document.getElementById("disp-modal-bg").classList.add("show");
}

export function applyDisp(type, bedId) {
  document.getElementById("disp-modal-bg").classList.remove("show");
  const targetId = bedId || state.dispTargetBedId;
  const bed = state.beds.find(b => b.id === targetId);
  if (!bed || !bed.patient) return;
  state.dispTargetBedId = targetId;
  const p = bed.patient;

  const ds    = p.disease && DISEASE_SIG[p.disease];
  const isCorrect = ds ? type === ds.rec : type === "discharge";
  const doneOrderCnt = p.orders.filter(o => o.status === "done").length;

  let pts, effectivelyCorrect;
  if (p.noOrderNeeded) {
    effectivelyCorrect = type === "discharge";
    pts = effectivelyCorrect ? (doneOrderCnt === 0 ? 200 : 120) : 20;
  } else {
    effectivelyCorrect = isCorrect;
    pts = isCorrect ? 150 : 40;
  }
  pts += Math.round((p.urgency || 100) * 0.3);

  state.score += pts;
  state.dispCountVal++;
  changeSat(effectivelyCorrect ? 5 : -10);
  document.getElementById("score-disp").textContent = state.score.toLocaleString();
  document.getElementById("disp-count").textContent = state.dispCountVal;

  if (state.staffEnabled) {
    state.staffState.forEach(st => {
      if (st.assignedBedId === state.dispTargetBedId) st.assignedBedId = null;
    });
  }
  p.disposed = true;

  const labels    = { admit: "一般病棟入院", icu: "ICU転送", discharge: "帰宅" };
  const bonusNote = p.noOrderNeeded && type === "discharge" && doneOrderCnt === 0 ? " 🎯 処置なし帰宅" : "";
  showToast(`${p.name} — ${labels[type]}（+${pts}pt）${effectivelyCorrect ? "✓" : "⚠ 転帰を再確認"}${bonusNote}`);
  logMsg('system', '📋 ' + p.name + ' — ' + labels[type] + (effectivelyCorrect ? ' ✓' : ' ⚠') + bonusNote);

  const _ps3    = PATIENT_SPEECH[p.disease] || PATIENT_SPEECH.fever;
  const _dspeech = _ps3.disposed && _ps3.disposed[type];
  if (_dspeech) setTimeout(() => logMsg('patient', '👤 ' + p.name + '「' + _dspeech + '」'), 800);

  state.selectedBedId = state.dispTargetBedId;
  renderBeds();
  renderDetail();
  checkTutEvent("disposed");
}
