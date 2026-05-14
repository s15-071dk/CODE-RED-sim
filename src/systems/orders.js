import { state } from '../state.js';
import { DISEASE_SIG, PATIENT_SPEECH } from '../data/diseases.js';
import { ORDERS } from './triage.js';
import { fatigueState } from '../data/staff.js';
import { renderDetail } from '../ui/render.js';
import { logMsg, showToast } from '../ui/notifications.js';
import { checkTutEvent } from './tutorial.js';
import { pickRandom } from '../utils/random.js';

export function placeOrder(bedId, orderId) {
  const bed = state.beds.find(b => b.id === bedId);
  if (!bed || !bed.patient || bed.patient.disposed) return;
  if (bed.patient.orders.find(o => o.id === orderId)) return;
  const def = ORDERS.find(o => o.id === orderId);
  if (!def) return;

  bed.patient.orders.push({ id: orderId, status: "pending" });
  state.score += 10;
  document.getElementById("score-disp").textContent = state.score.toLocaleString();
  showToast(`${def.label} をオーダーしました`);
  renderDetail();

  const assigned   = state.staffEnabled ? state.staffState.filter(s => s.assignedBedId === bedId && !s.absent) : [];
  const speedMult  = assigned.length > 0 ? Math.min(...assigned.map(s => fatigueState(s.fatigue).speedMult)) : 1.0;
  state.orderCountForTut++;
  checkTutEvent("ordered");

  setTimeout(() => {
    if (!bed.patient) return;
    const o = bed.patient.orders.find(x => x.id === orderId);
    if (!o) return;
    o.status = "done";
    if (orderId === "iv") bed.patient.ivOrdered = true;

    const ds  = bed.patient.disease && DISEASE_SIG[bed.patient.disease];
    const sig = (ds && ds[orderId]) || { color: "green", text: "🟢 異常なし" };
    bed.patient.signals[orderId] = { ...sig, label: def.label };

    state.score += 10;
    document.getElementById("score-disp").textContent = state.score.toLocaleString();
    if (state.selectedBedId === bedId) renderDetail();
    checkTutEvent("ordered");
    logMsg('event', '✅ ' + bed.patient.name + ' — ' + def.label + ' 完了 ' + sig.text);

    if (orderId === 'iv') {
      const _ps2 = PATIENT_SPEECH[bed.patient.disease] || PATIENT_SPEECH.fever;
      setTimeout(() => {
        if (bed.patient) logMsg('patient', '👤 ' + bed.patient.name + '「' + pickRandom(_ps2.iv_done) + '」');
      }, 600);
    }
  }, Math.round(def.time / speedMult) * 1000);
}
