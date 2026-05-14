import { state, LOG_MAX } from '../state.js';

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
