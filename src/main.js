import { state } from './state.js';
import { STAFF_DEFS, STAFF_SPEECH, fatigueState } from './data/staff.js';
import { setupTutorial, setupStage1, setupStage2, setupStage3, setupStage4 } from './data/stages.js';
import { renderBeds, renderWaitList, renderDetail, renderStaffList } from './ui/render.js';
import { showToast, showAlert, logMsg, renderLog } from './ui/notifications.js';
import { getUrgencyColor, changeSat, calcGrade, triggerGameOver, triggerClear } from './systems/scoring.js';
import { showTutStep, nextTutStep, skipTut, checkTutEvent, completeTutorial } from './systems/tutorial.js';
import { placeOrder } from './systems/orders.js';
import { openDispModal, applyDisp } from './systems/disposition.js';
import { triggerCall, acceptCall, declineCall } from './systems/ambulance.js';
import { openSpop, closeSpop, assignStaff, removeStaff } from './ui/modals.js';
import { selectPatientForAssign, assignPatient } from './ui/dragDrop.js';
import { pickRandom } from './utils/random.js';

// tutorial.js から completeTutorial が window._triggerClear を使うため公開
window._triggerClear = triggerClear;

// ===== 難易度 =====
function setDifficulty(d) {
  state.difficulty = d;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.diff-btn.' + d).classList.add('active');
}

// ===== ゲームリセット =====
export function resetGame() {
  state.score         = 0;
  state.dispCountVal  = 0;
  state.satisfaction  = 100;
  state.shiftElapsed  = 0;
  state.clockMin      = 8;
  state.clockSec      = 0;
  state.selectedBedId = null;
  state.dragPatient   = null;
  state.panelOpen     = true;
  state.gameRunning   = true;
  state.gameOver      = false;
  state.gameClear     = false;
  state.gamePaused    = false;
  state.tutStepIdx    = 0;

  if (state.mainLoop)  { clearInterval(state.mainLoop);  state.mainLoop  = null; }
  if (state.callTimer) { clearInterval(state.callTimer); state.callTimer = null; }

  state.staffState = STAFF_DEFS.map(s => ({ ...s, fatigue: 0, onBreak: false, assignedBedId: null, absent: false }));

  ["score-disp", "disp-count"].forEach(id => document.getElementById(id).textContent = "0");
  document.getElementById("sat-fill").style.cssText = "width:100%;background:#22c55e;";
  document.getElementById("sat-pct").style.cssText  = "color:#22c55e;";
  document.getElementById("sat-pct").textContent    = "100%";
  const _sei = document.getElementById("sat-emoji");
  if (_sei) _sei.textContent = "😊 患者満足度";
  document.getElementById("shift-fill").style.width    = "100%";
  document.getElementById("shift-time").textContent    = "4:00";

  ["screen-go", "screen-cl"].forEach(id => document.getElementById(id).classList.remove("show"));
  document.getElementById("alert-bar").classList.remove("show");
  document.getElementById("call-overlay").classList.remove("active");
  document.getElementById("top-alert").style.display = "none";

  state.shiftDuration    = 240;
  state.activeEvent      = null;
  state.stage4EventFired = false;
  state.lastFeedback     = null;
  state.eventLog = [];
  const lb = document.getElementById('log-body');
  if (lb) lb.innerHTML = '';
  setTimeout(() => logMsg('system', '🏥 シフト開始 — 救急外来の担当医として業務を開始します'), 100);
}

// ===== ステージ開始 =====
export function startStage(stageName) {
  state.currentStage = stageName;
  resetGame();
  document.getElementById("title-screen").style.display = "none";
  document.getElementById("game-screen").style.display  = "flex";

  if (stageName === "tutorial") {
    setupTutorial();
    showTutStep(0);
  } else if (stageName === "stage1") {
    setupStage1();
  } else if (stageName === "stage2") {
    setupStage2();
  } else if (stageName === "stage3") {
    setupStage3();
  } else if (stageName === "stage4") {
    state.shiftDuration = 180;
    document.getElementById("shift-time").textContent = "3:00";
    setupStage4();
  }

  renderBeds();
  renderWaitList();
  renderDetail();
  state.mainLoop = setInterval(gameLoop, 2000);
  if (state.callEnabled) setTimeout(triggerCall, 6000);
}

export function tryStage(stageName) {
  if (stageName === "stage1" && !state.progress.tutDone) {
    showToast("先にチュートリアルをクリアしてください", "warn");
    return;
  }
  // if (stageName === "stage2" && !state.progress.s1Done) {
  //   showToast("先にステージ1をクリアしてください", "warn");
  //   return;
  // }
  // if (stageName === "stage3" && !state.progress.s2Done) {
  //   showToast("先にステージ2をクリアしてください", "warn");
  //   return;
  // }
  if (stageName === "stage4" && !state.progress.s3Done) {
    showToast("先にステージ3をクリアしてください", "warn");
    return;
  }
  startStage(stageName);
}

export function backToTitle() {
  if (state.mainLoop)  { clearInterval(state.mainLoop);  state.mainLoop  = null; }
  if (state.callTimer) { clearInterval(state.callTimer); state.callTimer = null; }
  document.getElementById("game-screen").style.display  = "none";
  document.getElementById("title-screen").style.display = "flex";
  ["screen-go", "screen-cl"].forEach(id => document.getElementById(id).classList.remove("show"));
  document.getElementById("call-overlay").classList.remove("active");
  state.currentStage = null;
  updateUnlocks();
}

export function updateUnlocks() {
  if (state.progress.tutDone) {
    document.getElementById("card-s1").classList.remove("locked");
    document.getElementById("right-s1").innerHTML = `<div style="font-size:20px;font-weight:800;color:#60a5fa;">→</div>`;
    document.getElementById("grade-tut").textContent = "✓";
  }
  if (state.progress.s1Done) {
    const cs2 = document.getElementById("card-s2");
    const rs2 = document.getElementById("right-s2");
    const gs1 = document.getElementById("grade-s1");
    if (cs2) cs2.classList.remove("locked");
    if (rs2) rs2.innerHTML = `<div style="font-size:20px;font-weight:800;color:#f97316;">→</div>`;
    if (gs1) gs1.textContent = state.progress.s1Grade;
  }
  if (state.progress.s3Done) {
    const cs4 = document.getElementById("card-s4");
    const rs4 = document.getElementById("right-s4");
    const gs3 = document.getElementById("grade-s3");
    if (cs4) cs4.classList.remove("locked");
    if (rs4) rs4.innerHTML = `<div style="font-size:20px;font-weight:800;color:#a855f7;">→</div>`;
    if (gs3) gs3.textContent = state.progress.s3Grade;
    const tn = document.getElementById("title-note");
    if (tn) tn.textContent = "ステージ3クリア！ステージ4が解放されました";
  } else if (state.progress.s2Done) {
    const cs3 = document.getElementById("card-s3");
    const rs3 = document.getElementById("right-s3");
    const gs2 = document.getElementById("grade-s2");
    if (cs3) cs3.classList.remove("locked");
    if (rs3) rs3.innerHTML = `<div style="font-size:20px;font-weight:800;color:#ef4444;">→</div>`;
    if (gs2) gs2.textContent = state.progress.s2Grade;
    const tn = document.getElementById("title-note");
    if (tn) tn.textContent = "ステージ2クリア！ステージ3が解放されました";
  } else if (state.progress.s1Done) {
    const tn = document.getElementById("title-note");
    if (tn) tn.textContent = "ステージ1クリア！ステージ2が解放されました";
  }
}

export function togglePause() {
  if (!state.gameRunning) return;
  state.gamePaused = !state.gamePaused;
  const btn = document.getElementById("pause-btn");
  btn.textContent = state.gamePaused ? "▶ 再開" : "⏸ 一時停止";
  btn.classList.toggle("paused", state.gamePaused);
  if (state.gamePaused) showToast("⏸ 一時停止中", "warn");
  else                  showToast("▶ 再開しました");
}

function togglePanel() {
  state.panelOpen = !state.panelOpen;
  document.getElementById("right-panel").classList.toggle("collapsed", !state.panelOpen);
}

// ===== インシデント =====
function triggerIncident(staff, bed) {
  if (!bed.patient) return;
  changeSat(-8);
  state.score = Math.max(0, state.score - 30);
  document.getElementById("score-disp").textContent = state.score.toLocaleString();
  showAlert(`⚠ インシデント！${staff.short}（${staff.roleLabel}）がミス（−30pt）`);
  showToast(`${staff.short}を休憩させてください`, "err");
}

// ===== Stage4 ランダムイベント =====
function triggerStage4Event() {
  if (state.stage4EventFired || state.shiftElapsed < 90) return;
  state.stage4EventFired = true;

  const eventType = pickRandom(['ct_broken', 'staff_absent', 'mass_casualty']);
  if (eventType === 'ct_broken') {
    state.activeEvent = { type: 'ct_broken', until: state.shiftElapsed + 30 };
    showToast('⚠ CT装置が故障！30秒間使用不可', 'err');
    logMsg('system', '⚠ イベント発生：CT装置故障（30秒間）');
  } else if (eventType === 'staff_absent') {
    const available = state.staffState.filter(s => !s.absent && !s.onBreak);
    if (available.length > 0) {
      const target = pickRandom(available);
      target.absent = true;
      state.activeEvent = { type: 'staff_absent', staffId: target.id };
      showToast(`⚠ ${target.short}が突然欠勤！`, 'err');
      logMsg('system', `⚠ イベント発生：${target.short}（${target.roleLabel}）が欠勤`);
      renderStaffList();
    }
  } else {
    state.activeEvent = { type: 'mass_casualty' };
    showToast('🚑 多重事故！搬送要請が2件同時に来ています', 'err');
    logMsg('system', '⚠ イベント発生：多重入電（2台同時）');
    triggerCall();
    setTimeout(() => triggerCall(), 3000);
  }
}

// ===== メインループ =====
export function gameLoop() {
  if (!state.gameRunning || state.gamePaused) return;
  state.shiftElapsed += 2;
  state.clockSec += 2;
  if (state.clockSec >= 60) { state.clockSec -= 60; state.clockMin++; }
  if (state.clockMin >= 24)  state.clockMin = 0;
  document.getElementById("clock").textContent =
    String(state.clockMin).padStart(2, "0") + ":" + String(state.clockSec).padStart(2, "0");

  if (state.satEnabled) {
    const SHIFT = state.shiftDuration, rem = Math.max(0, SHIFT - state.shiftElapsed);
    document.getElementById("shift-fill").style.width = (rem / SHIFT * 100) + "%";
    const m = Math.floor(rem / 60), s = rem % 60;
    document.getElementById("shift-time").textContent = m + ":" + (s < 10 ? "0" + s : s);
    if (state.shiftElapsed >= SHIFT) {
      if (state.currentStage === "stage4") {
        state.progress.s4Done  = true;
        state.progress.s4Grade = calcGrade().g;
        updateUnlocks();
        triggerClear("ナイトシフト完了！", `転帰${state.dispCountVal}名・ランダムイベントを乗り越えた`);
      } else {
        triggerClear("シフト完了！");
      }
      return;
    }
  }

  if (state.staffEnabled) {
    state.staffState.forEach(st => {
      if (st.absent) return;
      if (st.onBreak) {
        st.fatigue = Math.max(0, st.fatigue - 3.0 * st.recoveryRate);
        if (st.fatigue <= 0) st.onBreak = false;
      } else if (st.assignedBedId) {
        const bed   = state.beds.find(b => b.id === st.assignedBedId);
        const heavy = bed && bed.patient && bed.patient.color === "red";
        st.fatigue  = Math.min(100, st.fatigue + 1.8 * st.fatigueRate * (heavy ? 1.5 : 1));
        const fs    = fatigueState(st.fatigue);
        if (fs.incidentChance > 0 && Math.random() < fs.incidentChance && bed && bed.patient && !bed.patient.disposed) {
          triggerIncident(st, bed);
        }
      }
    });
    renderStaffList();
  }

  let critAlert = null;
  state.beds.forEach(bed => {
    if (!bed.patient || bed.patient.disposed) return;
    const p  = bed.patient;
    const dr = v => +(v + (Math.random() - 0.5) * 0.4).toFixed(1);
    const iv = p.ivOrdered ? 0.5 : 1;
    p.HR    = Math.min(180, Math.max(30,  Math.round(p.HR    + dr(({ red: 2,    orange: 1,   yellow: 0, green: 0 }[p.color] || 0) * iv))));
    p.BP_sys= Math.min(200, Math.max(50,  Math.round(p.BP_sys+ dr(({ red: -2,   orange: -1,  yellow: 0, green: 0 }[p.color] || 0) * iv))));
    p.SpO2  = Math.min(100, Math.max(70,  Math.round(p.SpO2  + dr(({ red: -0.3, orange: -0.1,yellow: 0, green: 0 }[p.color] || 0) * iv))));
    if (p.BP_sys < 75 || p.SpO2 < 90) {
      changeSat(-2);
      critAlert = `${p.name} — BP${p.BP_sys}/SpO₂${p.SpO2}% 危険域！`;
    }
    if (p.color === "red" && state.satEnabled) changeSat(-0.3);
  });

  if (critAlert) {
    showAlert(critAlert);
    logMsg('alert', '🚨 ' + critAlert);
    if (Math.random() < 0.33) {
      const _cns = state.staffState.filter(s => !s.onBreak && !s.absent && s.role === 'nurse');
      if (_cns.length) {
        const _cn = _cns[Math.floor(Math.random() * _cns.length)];
        logMsg('nurse', _cn.short + '「' + pickRandom(STAFF_SPEECH[_cn.id].critical) + '」');
      }
    }
  }

  if (state.currentStage === "stage1") {
    const allDone = state.beds.every(b => !b.patient || b.patient.disposed) && state.waitPatients.length === 0;
    if (allDone) {
      state.progress.s1Done  = true;
      state.progress.s1Grade = calcGrade().g;
      updateUnlocks();
      triggerClear("ステージ1 クリア！", "全患者の転帰を決定しました");
    }
  }
  if (state.currentStage === "stage2") {
    const allDone = state.beds.every(b => !b.patient || b.patient.disposed) && state.waitPatients.length === 0;
    if (allDone) {
      state.progress.s2Done  = true;
      state.progress.s2Grade = calcGrade().g;
      updateUnlocks();
      triggerClear("ステージ2 クリア！", "重症患者も含め全員対応しました");
    }
  }
  if (state.currentStage === "stage3") {
    const allDone = state.beds.every(b => !b.patient || b.patient.disposed) && state.waitPatients.length === 0;
    if (allDone) {
      state.progress.s3Done  = true;
      state.progress.s3Grade = calcGrade().g;
      updateUnlocks();
      triggerClear("ステージ3 クリア！", "スタッフ管理もこなしました");
    }
  }
  if (state.currentStage === "stage4") {
    triggerStage4Event();
    if (state.activeEvent?.type === 'ct_broken' && state.shiftElapsed >= state.activeEvent.until) {
      state.activeEvent = null;
      showToast('CT装置が復旧しました');
      logMsg('system', '✅ CT装置が復旧しました');
    }
    const allDone = state.beds.every(b => !b.patient || b.patient.disposed) && state.waitPatients.length === 0;
    if (allDone) {
      state.progress.s4Done  = true;
      state.progress.s4Grade = calcGrade().g;
      triggerClear("ステージ4 クリア！", "最難関ステージを制覇しました！");
    }
  }

  renderBeds();
  if (state.selectedBedId) renderDetail();
}

// ===== 初期化 =====
updateUnlocks();

// ===== window への公開 =====
Object.assign(window, {
  startStage,
  tryStage,
  backToTitle,
  togglePause,
  togglePanel,
  setDifficulty,
  updateUnlocks,
  selectPatientForAssign,
  assignPatient,
  placeOrder,
  applyDisp,
  openDispModal,
  openSpop,
  closeSpop,
  assignStaff,
  removeStaff,
  acceptCall,
  declineCall,
  nextTutStep,
  skipTut,
  checkTutEvent,
  // tutorial.js 内から dispTargetBedId を直接参照する onclick 文字列用
  get dispTargetBedId() { return state.dispTargetBedId; },
  set dispTargetBedId(v) { state.dispTargetBedId = v; },
});
