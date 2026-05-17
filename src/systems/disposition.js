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
  if (effectivelyCorrect) {
    let satBonus = 8;
    if (type === "icu" && p.color === "red") satBonus = 15;
    if (p.noOrderNeeded && type === "discharge" && doneOrderCnt === 0) satBonus = 12;
    changeSat(satBonus);
  } else {
    changeSat(-10);
  }
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

  // 転帰フィードバックを生成してstateに保存
  const sigs = Object.values(p.signals || {});
  const redCnt = sigs.filter(s => s.color === "red").length;
  const yelCnt = sigs.filter(s => s.color === "yellow").length;
  let reason;
  if (effectivelyCorrect) {
    if (type === "icu")       reason = redCnt >= 2 ? `赤サイン${redCnt}件 → ICU適応` : "重篤サインあり → ICU適応";
    else if (type === "admit") reason = redCnt === 1 ? "赤サイン1件 → 入院適応" : `黄サイン${yelCnt}件 → 経過観察入院`;
    else                       reason = p.noOrderNeeded ? "軽症 → 処置なし帰宅" : "異常サインなし → 帰宅可";
  } else {
    const recLabels = { icu: "ICU転送", admit: "入院", discharge: "帰宅" };
    const ds = p.disease && DISEASE_SIG[p.disease];
    const recType = ds ? ds.rec : "discharge";
    reason = `${recLabels[recType]}が適切でした`;
  }
  state.lastFeedback = { correct: effectivelyCorrect, label: labels[type], reason, pts, bedId: state.dispTargetBedId };
  checkTutEvent("disposed");

  // 5秒後にフィードバックを消去＋ベッドを空ける
  const capturedBedId = targetId;
  setTimeout(() => {
    if (state.lastFeedback && state.lastFeedback.bedId === capturedBedId) {
      state.lastFeedback = null;
    }
    const clearBed = state.beds.find(b => b.id === capturedBedId);
    if (clearBed && clearBed.patient && clearBed.patient.disposed) {
      clearBed.patient = null;
      if (state.selectedBedId === capturedBedId) {
        state.selectedBedId = null;
        renderDetail();
      }
      renderBeds();
    }
  }, 5000);

  const _ps3    = PATIENT_SPEECH[p.disease] || PATIENT_SPEECH.fever;
  const _dspeech = _ps3.disposed && _ps3.disposed[type];
  if (_dspeech) setTimeout(() => logMsg('patient', '👤 ' + p.name + '「' + _dspeech + '」'), 800);

  // Papers Please コールバック：25秒後に転帰結果を通知
  if (p.callBack) {
    const msg = effectivelyCorrect ? p.callBack.correct : p.callBack.incorrect;
    if (msg) {
      setTimeout(() => {
        if (!state.gameRunning && !state.gameClear) return;
        if (effectivelyCorrect) {
          logMsg('system', msg);
          changeSat(5);
        } else {
          logMsg('alert', msg);
          changeSat(-10);
        }
      }, 25000);
    }
  }

  state.selectedBedId = state.dispTargetBedId;
  renderBeds();
  renderDetail();
}
