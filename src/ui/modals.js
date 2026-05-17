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
  if (st.absent) {
    btn.textContent  = "欠勤のため操作不可";
    btn.className    = "spop-btn";
    btn.style.cssText = "background:#1e2736;color:#475569;";
    btn.onclick      = null;
  } else if (st.onBreak) {
    btn.textContent  = "✓ 現場復帰させる";
    btn.className    = "spop-btn spop-work";
    btn.style.cssText = "";
    btn.onclick      = () => {
      st.onBreak = false;
      renderStaffList();
      closeSpop();
      showToast(`${st.short}が現場復帰しました`);
    };
  } else {
    btn.textContent  = "☕ 休憩させる（疲労回復）";
    btn.className    = "spop-btn spop-break";
    btn.style.cssText = "";
    btn.onclick      = () => {
      if (st.assignedBedId) st.assignedBedId = null;
      st.onBreak = true;
      renderStaffList();
      renderBeds();
      if (state.selectedBedId) renderDetail();
      closeSpop();
      showToast(`${st.short}を休憩させました`, "warn");
      if (typeof window.checkTutEvent === 'function') window.checkTutEvent("staff_rested");
    };
  }
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
