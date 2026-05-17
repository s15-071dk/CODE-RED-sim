import { state } from '../state.js';
import { fatigueState } from '../data/staff.js';
import { renderStaffList, renderBeds, renderDetail } from './render.js';
import { showToast } from './notifications.js';

export function openSpop(staffId) {
  state.selectedStaffId = staffId;
  const st = state.staffState.find(s => s.id === staffId);
  if (!st) return;
  const fs = fatigueState(st.fatigue);
  document.getElementById("spop-name").textContent  = `${fs.icon} ${st.name}`;
  document.getElementById("spop-role").textContent  = st.roleLabel;
  document.getElementById("spop-trait").textContent = st.trait;
  document.getElementById("spop-pct").textContent   = `${Math.round(st.fatigue)}%`;
  document.getElementById("spop-fill").style.width      = Math.round(st.fatigue) + "%";
  document.getElementById("spop-fill").style.background = fs.color;

  const statusEl = document.getElementById("spop-status");
  if (st.absent) {
    statusEl.style.cssText = "background:rgba(71,85,105,0.3);color:#94a3b8;";
    statusEl.textContent   = "本日欠勤中";
  } else if (st.onBreak) {
    statusEl.style.cssText = "background:rgba(249,115,22,0.12);color:#fdba74;";
    statusEl.textContent   = `休憩中 — 疲労${Math.round(st.fatigue)}%（回復中）`;
  } else if (st.assignedBedId) {
    const bed = state.beds.find(b => b.id === st.assignedBedId);
    statusEl.style.cssText = "background:rgba(59,130,246,0.1);color:#93c5fd;";
    statusEl.textContent   = `${bed ? bed.label : ""}に配置中 — ${fs.label}`;
  } else {
    statusEl.style.cssText = "background:rgba(34,197,94,0.1);color:#86efac;";
    statusEl.textContent   = `待機中 — ${fs.label}`;
  }

  const btn = document.getElementById("spop-btn");
  btn.style.display = "none";
  btn.onclick = null;
  document.getElementById("spop").style.display = "block";
}

export function closeSpop() {
  document.getElementById("spop").style.display = "none";
  state.selectedStaffId = null;
}

export function assignStaff(staffId, bedId) {
  const st = state.staffState.find(s => s.id === staffId);
  if (!st || st.onBreak || st.absent || st.assignedBedId) return;
  st.assignedBedId = bedId;
  renderStaffList();
  renderBeds();
  if (state.selectedBedId) renderDetail();
  showToast(`${st.short}（${st.roleLabel}）を${state.beds.find(b => b.id === bedId)?.label}に配置`);
  if (typeof window.checkTutEvent === 'function') window.checkTutEvent("staff_placed");
}

export function removeStaff(staffId) {
  const st = state.staffState.find(s => s.id === staffId);
  if (!st) return;
  st.assignedBedId = null;
  renderStaffList();
  renderBeds();
  if (state.selectedBedId) renderDetail();
}
