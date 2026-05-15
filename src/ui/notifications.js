import { state, LOG_MAX } from '../state.js';

const CT_BANNER_TEXT = '⚠ CT装置故障中 — 使用不可';

export function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show" + (type ? " " + type : "");
  setTimeout(() => t.className = "toast", 3200);
}

export function showAlert(msg) {
  document.getElementById("alert-msg").textContent = msg;
  document.getElementById("alert-bar").classList.add("show");
  setTimeout(() => document.getElementById("alert-bar").classList.remove("show"), 5000);
}

/** Stage4 CT故障などの常時バナー表示 */
export function showEventBanner(text) {
  const el = document.getElementById('event-banner');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
}

/** イベントバナーを非表示 */
export function hideEventBanner() {
  const el = document.getElementById('event-banner');
  if (!el) return;
  el.classList.remove('show');
}

/** state.activeEvent に応じてCT故障バナーを同期（renderBeds等から呼ぶ） */
export function syncCtEventBanner() {
  if (state.activeEvent?.type === 'ct_broken') {
    showEventBanner(CT_BANNER_TEXT);
  } else {
    hideEventBanner();
  }
}

/** スマホ用：待機リスト / 患者詳細タブ切り替え */
export function setMobilePanel(panel) {
  const wrap = document.getElementById('body-wrap');
  if (!wrap) return;
  wrap.dataset.mobilePanel = panel;
  document.querySelectorAll('.mobile-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.panel === panel);
  });
  if (panel === 'right') {
    const rp = document.getElementById('right-panel');
    if (rp) rp.classList.remove('collapsed');
    state.panelOpen = true;
  }
}

export function logMsg(type, text) {
  const time = String(state.clockMin).padStart(2, '0') + ':' + String(state.clockSec).padStart(2, '0');
  state.eventLog.unshift({ time, type, text });
  if (state.eventLog.length > LOG_MAX) state.eventLog.pop();
  renderLog();
}

export function renderLog() {
  const body = document.getElementById('log-body');
  if (!body) return;
  body.innerHTML = [...state.eventLog].reverse().map(e =>
    `<div class="log-entry ${e.type}"><span class="log-time">[${e.time}]</span>${e.text}</div>`
  ).join('');
}

// ゲームループ・onclick から呼べるよう window に公開
window.showEventBanner = showEventBanner;
window.hideEventBanner = hideEventBanner;
window.setMobilePanel  = setMobilePanel;
