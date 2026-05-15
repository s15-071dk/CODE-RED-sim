import { state } from '../state.js';
import { TRIAGE_BG, TRIAGE_BDR } from '../systems/triage.js';
import { PATIENT_SPEECH } from '../data/diseases.js';
import { STAFF_SPEECH } from '../data/staff.js';
import { renderBeds, renderWaitList, renderDetail } from './render.js';
import { logMsg, showToast, setMobilePanel } from './notifications.js';
import { changeSat } from '../systems/scoring.js';
import { checkTutEvent } from '../systems/tutorial.js';
import { pickRandom } from '../utils/random.js';

export function selectPatientForAssign(patientId) {
  if (state.selectedPatient && state.selectedPatient.id === patientId) {
    state.selectedPatient = null;
  } else {
    state.selectedPatient = state.waitPatients.find(p => p.id === patientId) || null;
  }
  renderWaitList();
  renderBeds();
}

export function assignPatient(bedId) {
  const patient = state.selectedPatient || state.dragPatient;
  if (!patient) return;
  const bed = state.beds.find(b => b.id === bedId);
  if (!bed || (bed.patient && !bed.patient.disposed)) { showToast("このベッドはすでに使用中です", "warn"); return; }

  const mm = bed.zone === "critical" && (patient.color === "green" || patient.color === "yellow");
  const uu = bed.zone === "exam"     && patient.color === "red";

  bed.patient = {
    ...patient,
    BP_dia: patient.BP_dia || 70,
    orders: [], signals: {}, disposed: false, urgency: 100, ivOrdered: false,
  };
  state.waitPatients = state.waitPatients.filter(p => p.id !== patient.id);

  let pts = patient.color === "red" ? 100 : patient.color === "orange" ? 60 : 30;
  if (mm) { pts -= 40; changeSat(-5); }
  if (uu) { pts -= 50; changeSat(-8); }

  state.score = Math.max(0, state.score + pts);
  document.getElementById("score-disp").textContent = state.score.toLocaleString();

  state.selectedBedId    = bedId;
  state.selectedPatient  = null;
  state.dragPatient      = null;

  renderBeds();
  renderWaitList();
  renderDetail();
  if (window.matchMedia('(max-width: 768px)').matches) setMobilePanel('right');
  else if (!state.panelOpen) window.togglePanel();

  const wrap = document.querySelector(`[data-bed-id="${bedId}"]`);
  if (wrap) {
    const fl = document.createElement("div");
    fl.className        = "afl";
    wrap.style.position = "relative";
    wrap.appendChild(fl);
    setTimeout(() => fl.remove(), 700);
  }

  if (mm)      showToast("⚠ 軽症患者を重症ベッドへ（−40pt）", "warn");
  else if (uu) showToast("⚠ 重症患者を診察室へ（−50pt）", "warn");
  else         showToast(`${patient.name}を「${bed.label}」に割り当てました`);

  checkTutEvent("assigned");

  const _ps = PATIENT_SPEECH[patient.disease] || PATIENT_SPEECH.fever;
  setTimeout(() => logMsg('patient', '👤 ' + patient.name + '「' + pickRandom(_ps.assign) + '」'), 800);

  if (state.staffEnabled) {
    const _avns = state.staffState.filter(s => !s.onBreak && !s.absent);
    if (_avns.length) {
      const _n = _avns[Math.floor(Math.random() * _avns.length)];
      setTimeout(() => logMsg('nurse', _n.short + '「' + pickRandom(STAFF_SPEECH[_n.id].assign) + '」'), 1600);
    }
  }
}
