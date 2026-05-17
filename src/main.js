import { state } from './state.js';
import { STAFF_DEFS, STAFF_SPEECH, fatigueState } from './data/staff.js';
import { STAGES_META, setupTutorial, setupStage1, setupStage2, setupStage3, setupStage4, setupStage5, setupStageReverse, setupStageEndless } from './data/stages.js';
import { STAGE4_POOL, STAGE5_POOL } from './data/patients.js';
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

// スタッフ選択画面からの選択結果を一時保持
let _pendingStaffIds = null;

// tutorial.js から completeTutorial が window._triggerClear を使うため公開
window._triggerClear = triggerClear;

// ===== 難易度 =====
function setDifficulty(d) {
  state.difficulty = d;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.diff-btn.' + d).classList.add('active');
  showStageSelect();
}

// ===== ステージ選択 =====
function getClearedStages() {
  try { return JSON.parse(localStorage.getItem('clearedStages') || '["tutorial"]'); }
  catch { return ["tutorial"]; }
}

export function markStageCleared(stageId) {
  const cleared = getClearedStages();
  if (!cleared.includes(stageId)) {
    cleared.push(stageId);
    localStorage.setItem('clearedStages', JSON.stringify(cleared));
  }
  // stageEクリアで超むずかしい解放
  if (stageId === 'stageE') {
    localStorage.setItem('expert_unlocked', '1');
    const btn = document.getElementById('diff-expert');
    if (btn) btn.style.display = '';
  }
}

function showStageSelect() {
  const cleared = getClearedStages();
  const list = document.getElementById('stage-list');
  list.innerHTML = '';
  STAGES_META.forEach(stage => {
    const unlocked = !stage.unlockAfter || cleared.includes(stage.unlockAfter);
    const item = document.createElement('div');
    item.className = 'stage-item' + (unlocked ? '' : ' locked');
    item.innerHTML = `
      <i class="ti ${stage.icon} stage-item-icon"></i>
      <div class="stage-item-body">
        <div class="stage-item-title">${stage.title}</div>
        <div class="stage-item-subtitle">${stage.subtitle}</div>
      </div>
      ${unlocked ? '' : '<i class="ti ti-lock stage-item-lock"></i>'}
    `;
    if (unlocked) {
      item.onclick = () => {
        document.getElementById('stage-select-screen').style.display = 'none';
        showStoryScreen(stage.id);
      };
    }
    list.appendChild(item);
  });
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('stage-select-screen').style.display = 'flex';
}

window.showStageSelect = showStageSelect;
window.markStageCleared = markStageCleared;

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
  state.stage5EventCount = 0;
  state.endlessCount     = 0;
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

  // スタッフ選択画面で選ばれなかったスタッフを不在扱いにする
  if (_pendingStaffIds) {
    state.staffState.forEach(s => {
      if (!_pendingStaffIds.includes(s.id)) s.absent = true;
    });
    _pendingStaffIds = null;
  }

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
  } else if (stageName === "stage5") {
    setupStage5();
  } else if (stageName === "stageR") {
    setupStageReverse();
  } else if (stageName === "stageE") {
    setupStageEndless();
  }

  renderBeds();
  renderWaitList();
  renderDetail();
  state.mainLoop = setInterval(gameLoop, 2000);
  if (state.callEnabled) setTimeout(triggerCall, 6000);
}

// ===== ブリーフィング画面 =====
const STAGE_STORIES = {
  tutorial: {
    label: "チュートリアル",
    title: "救急外来へようこそ",
    body: "本日から救急外来を担当していただきます。\nまずは基本的な患者対応の流れを覚えてもらいましょう。\n\n患者カードをクリックしてベッドへ割り当て、検査をオーダーし、転帰を決定してください。",
    speaker: "チーフ看護師・青木 沙耶",
  },
  stage1: {
    label: "Stage 1",
    title: "初日のシフト",
    body: "今日はあなたの救急外来デビュー日。\n軽症の患者が中心で、比較的穏やかなシフトになるはずです。\n\n基本の流れをしっかり確認しながら、一人ひとりに丁寧に対応しましょう。",
    speaker: "チーフ看護師・青木 沙耶",
  },
  stage2: {
    label: "Stage 2",
    title: "入電が入り始めた",
    body: "2週目のシフト。今夜は救急車からの入電が来る。\n重症患者の対応もあり、判断を誤ると患者満足度が一気に落ちる。\n\n入電は承諾するか慎重に判断し、重症患者を優先すること。",
    speaker: "研修医・松本 拓海",
  },
  stage3: {
    label: "Stage 3",
    title: "スタッフの限界",
    body: "先輩医師が急病で抜けた。\nスタッフに過度な負担をかけると疲労が蓄積し、インシデントが起きる。\n\n疲れたスタッフを適切に休ませながら回すことが、このシフトの鍵だ。",
    speaker: "チーフ看護師・青木 沙耶",
  },
  stage4: {
    label: "Stage 4",
    title: "ナイトシフト",
    body: "深夜のシフトに急遽呼ばれた。\n3分間のタイムリミット。さらに今夜は何かが起きる予感がする。\n\n想定外の事態にも冷静に対応できるか。",
    speaker: "当直調整・中川 遥",
  },
  stage5: {
    label: "Stage 5",
    title: "午前2時、あなただけが残っている",
    body: "午前2時。スタッフは2名だけ。8床がフル稼働している。\n今夜は2度、想定外の事態が訪れる。\n\n一人で判断し、一人で動かなければならない。",
    speaker: "— システムログ 02:00:00 —",
  },
  stageR: {
    label: "チャレンジ — 逆転の引き継ぎ",
    title: "「先生、助けてください！」",
    body: "担当医が急病で倒れました。\n引き継ぎを頼まれたとき、すでに患者が溢れ、満足度は崩壊寸前です。\n\nここから立て直せるか。あなたの腕が問われます。",
    speaker: "研修医・小野 結衣（声が震えている）",
  },
  stageE: {
    label: "チャレンジ — エンドレスシフト",
    title: "終わりのないシフトが始まる",
    body: "患者は止まらない。スコアを稼げ。\n時間が経つほど重症患者の割合が増えていく。\n\n満足度がゼロになるまで、どれだけ耐えられるか。",
    speaker: "— ハイスコアアタックモード —",
  },
};

function showStoryScreen(stageName) {
  const s = STAGE_STORIES[stageName];
  if (!s) { startStage(stageName); return; }

  document.getElementById("story-stage-lbl").textContent = s.label;
  document.getElementById("story-title").textContent     = s.title;
  document.getElementById("story-body").textContent      = s.body;
  document.getElementById("story-speaker").textContent   = s.speaker;

  const card = document.querySelector(".story-card");
  if (card) card.dataset.stage = stageName;

  const btn = document.getElementById("story-start-btn");
  btn.onclick = () => {
    document.getElementById("story-screen").classList.remove("show");
    const meta = STAGES_META.find(m => m.id === stageName);
    if (meta && meta.staffMode === "select") {
      showStaffSelect(meta, () => startStage(stageName));
    } else {
      startStage(stageName);
    }
  };

  document.getElementById("story-screen").classList.add("show");
}

function showStaffSelect(meta, onConfirm) {
  const screen   = document.getElementById("staff-select-screen");
  const subtitle = document.getElementById("staff-select-subtitle");
  const list     = document.getElementById("staff-select-list");
  const btn      = document.getElementById("staff-select-btn");

  subtitle.textContent = `${meta.staffPool.length}名から${meta.staffCount}名を選んでください`;
  list.innerHTML = "";
  const selected = new Set();

  meta.staffPool.forEach(id => {
    const def = STAFF_DEFS.find(d => d.id === id);
    if (!def) return;
    const card = document.createElement("div");
    card.className = "staff-sel-card";
    card.innerHTML = `
      <div class="staff-sel-name">${def.name}</div>
      <div class="staff-sel-role">${def.roleLabel}</div>
      <div class="staff-sel-trait">${def.trait}</div>
    `;
    card.onclick = () => {
      if (selected.has(id)) {
        selected.delete(id);
        card.classList.remove("selected");
      } else if (selected.size < meta.staffCount) {
        selected.add(id);
        card.classList.add("selected");
      }
      btn.disabled = selected.size !== meta.staffCount;
    };
    list.appendChild(card);
  });

  btn.disabled = true;
  btn.onclick = () => {
    _pendingStaffIds = [...selected];
    screen.style.display = "none";
    onConfirm();
  };

  screen.style.display = "flex";
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
  if (stageName === "stage5" && !state.progress.s4Done) {
    showToast("先にステージ4をクリアしてください", "warn");
    return;
  }
  if (stageName === "stageR" && !state.progress.tutDone) {
    showToast("先にチュートリアルをクリアしてください", "warn");
    return;
  }
  if (stageName === "stageE" && !state.progress.tutDone) {
    showToast("先にチュートリアルをクリアしてください", "warn");
    return;
  }
  showStoryScreen(stageName);
}

export function backToTitle() {
  if (state.mainLoop)  { clearInterval(state.mainLoop);  state.mainLoop  = null; }
  if (state.callTimer) { clearInterval(state.callTimer); state.callTimer = null; }
  document.getElementById("game-screen").style.display        = "none";
  document.getElementById("stage-select-screen").style.display = "none";
  document.getElementById("title-screen").style.display        = "flex";
  ["screen-go", "screen-cl"].forEach(id => document.getElementById(id).classList.remove("show"));
  document.getElementById("call-overlay").classList.remove("active");
  state.currentStage = null;
  updateUnlocks();
}

export function updateUnlocks() {
  saveProgress();
  // ステージ解放はSTAGES_META + markStageCleared() + showStageSelect() で管理するため、
  // 旧HTMLカード操作は廃止
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
  showToast(`${staff.short}の疲労が限界に近づいています`, "err");
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

// ===== Stage5 夜間イベント（2回発火）=====
function triggerStage5Events() {
  if (state.stage5EventCount === 0 && state.shiftElapsed >= 90) {
    state.stage5EventCount = 1;
    const eventType = pickRandom(['ct_broken', 'mass_casualty']);
    if (eventType === 'ct_broken') {
      state.activeEvent = { type: 'ct_broken', until: state.shiftElapsed + 30 };
      showToast('⚠ CT装置が故障！30秒間使用不可', 'err');
      logMsg('system', '⚠ 夜間イベント①：CT装置故障（30秒間）');
    } else {
      state.activeEvent = { type: 'mass_casualty' };
      showToast('🚑 多重事故！搬送要請が2件同時に来ています', 'err');
      logMsg('system', '⚠ 夜間イベント①：多重入電（2台同時）');
      triggerCall();
      setTimeout(() => triggerCall(), 3000);
    }
  }
  if (state.stage5EventCount === 1 && state.shiftElapsed >= 180) {
    state.stage5EventCount = 2;
    const available = state.staffState.filter(s => !s.absent && !s.onBreak);
    if (available.length > 0) {
      const target = pickRandom(available);
      target.absent = true;
      showToast(`⚠ ${target.short}が急病で離脱！`, 'err');
      logMsg('system', `⚠ 夜間イベント②：${target.short}（${target.roleLabel}）が急病のため離脱`);
      renderStaffList();
    }
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
        if (!st.onBreak && !st.absent && st.fatigue >= 100) {
          st.fatigue = 100;
          if (st.assignedBedId) st.assignedBedId = null;
          st.onBreak = true;
          renderStaffList();
          renderBeds();
          if (state.selectedBedId) renderDetail();
          logMsg('nurse', `${st.short}「もう限界です…少し休ませてください」`);
          showToast(`${st.short}が限界に達し休憩に入りました`, "warn");
          if (typeof window.checkTutEvent === 'function') window.checkTutEvent("staff_rested");
          return;
        }
        const fs    = fatigueState(st.fatigue);
        if (fs.incidentChance > 0 && Math.random() < fs.incidentChance && bed && bed.patient && !bed.patient.disposed) {
          triggerIncident(st, bed);
        }
      }
    });
    renderStaffList();
  }

  // 悪化システム：オーダーなし60秒でトリアージ1段階エスカレーション
  const ESCALATE_MAP = { green: "yellow", yellow: "orange", orange: "red" };

  let critAlert = null;
  state.beds.forEach(bed => {
    if (!bed.patient || bed.patient.disposed) return;
    const p  = bed.patient;

    if (!p.noOrderNeeded && p.color !== "red" && !(p.orders && p.orders.length > 0)) {
      p.waitSeconds = (p.waitSeconds || 0) + 2;
      if (p.waitSeconds >= 60 && ESCALATE_MAP[p.color]) {
        const prev = p.color;
        p.color       = ESCALATE_MAP[p.color];
        p.waitSeconds = 0;
        logMsg('alert', `⚠️ ${p.name} — 対応遅延：トリアージ ${prev} → ${p.color} に悪化`);
        if (state.satEnabled) changeSat(-5);
        renderBeds();
        renderWaitList();
      }
    } else {
      p.waitSeconds = 0;
    }

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
  if (state.currentStage === "stageE") {
    // 難易度フェーズ（90秒ごとに赤患者の割合が増える）
    const phase = Math.min(3, Math.floor(state.shiftElapsed / 90));
    const PHASE_WEIGHTS = [
      { red: 0, orange: 3, green: 5 },   // フェーズ0: 緑多め
      { red: 2, orange: 4, green: 2 },   // フェーズ1: 混合
      { red: 4, orange: 3, green: 1 },   // フェーズ2: 赤増加
      { red: 6, orange: 2, green: 1 },   // フェーズ3: 赤支配
    ];
    const pool = [...STAGE4_POOL, ...STAGE5_POOL];

    // 20秒ごと・待機が2名未満なら患者を補充
    if (state.shiftElapsed % 20 === 0 && state.waitPatients.length < 2) {
      const w = PHASE_WEIGHTS[phase];
      const weighted = [
        ...pool.filter(p => p.color === 'red').flatMap(p => Array(w.red).fill(p)),
        ...pool.filter(p => p.color === 'orange').flatMap(p => Array(w.orange).fill(p)),
        ...pool.filter(p => p.color === 'green').flatMap(p => Array(w.green).fill(p)),
      ];
      if (weighted.length > 0) {
        const base = pickRandom(weighted);
        state.endlessCount++;
        const np = { ...base, id: 'se-' + state.endlessCount, orders: [], signals: {}, urgency: 100, ivOrdered: false, disposed: false };
        state.waitPatients.push(np);
        renderWaitList();
        if (phase >= 2) logMsg('nurse', `青木「次の患者さんが来ています（フェーズ${phase + 1}）」`);
      }
    }
  }
  if (state.currentStage === "stageR") {
    const allDone = state.beds.every(b => !b.patient || b.patient.disposed) && state.waitPatients.length === 0;
    if (allDone) {
      state.progress.sRDone  = true;
      state.progress.sRGrade = calcGrade().g;
      updateUnlocks();
      triggerClear("逆転シフト クリア！", "崩壊した現場を立て直しました");
    }
  }
  if (state.currentStage === "stage5") {
    triggerStage5Events();
    if (state.activeEvent?.type === 'ct_broken' && state.shiftElapsed >= state.activeEvent.until) {
      state.activeEvent = null;
      showToast('CT装置が復旧しました');
      logMsg('system', '✅ CT装置が復旧しました');
    }
    const allDone = state.beds.every(b => !b.patient || b.patient.disposed) && state.waitPatients.length === 0;
    if (allDone) {
      state.progress.s5Done  = true;
      state.progress.s5Grade = calcGrade().g;
      updateUnlocks();
      triggerClear("ステージ5 クリア！", "過酷な夜間単独シフトを乗り切りました！");
    }
  }

  renderBeds();
  if (state.selectedBedId) renderDetail();
}

// ===== ローカルストレージ永続化 =====
const PROGRESS_KEY = 'codeRedProgress';

function saveProgress() {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress)); } catch (_) {}
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) Object.assign(state.progress, JSON.parse(raw));
  } catch (_) {}
}

// ===== 初期化 =====
loadProgress();
updateUnlocks();

// ===== window への公開 =====
// 開発用：コンソールから window.unlockAll() でステージを全解放できる
window.unlockAll = () => {
  Object.assign(state.progress, { tutDone: true, s1Done: true, s1Grade: 'A', s2Done: true, s2Grade: 'A', s3Done: true, s3Grade: 'A', s4Done: true, s4Grade: 'A', s5Done: false, s5Grade: '--' });
  saveProgress();
  updateUnlocks();
  console.info('[DEV] All stages unlocked');
};
window.resetProgress = () => {
  localStorage.removeItem(PROGRESS_KEY);
  Object.assign(state.progress, { tutDone: false, s1Done: false, s1Grade: '--', s2Done: false, s2Grade: '--', s3Done: false, s3Grade: '--', s4Done: false, s4Grade: '--' });
  updateUnlocks();
  console.info('[DEV] Progress reset');
};

// ページ読み込み時に超むずかしい解放状態をチェック
if (localStorage.getItem('expert_unlocked')) {
  const btn = document.getElementById('diff-expert');
  if (btn) btn.style.display = '';
}

Object.assign(window, {
  startStage,
  tryStage,
  showStoryScreen,
  showStaffSelect,
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
