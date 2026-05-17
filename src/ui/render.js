import { state } from '../state.js';
import { COLORS, TRIAGE_BG, TRIAGE_BDR, TRIAGE_LV, ORDERS } from '../systems/triage.js';
import { DISEASE_SIG, SIG_COLORS, CHIEF_FEEDBACK } from '../data/diseases.js';
import { fatigueState } from '../data/staff.js';
import { makeVitalHtml, waitVitals } from '../systems/vitals.js';
import { getUrgencyColor } from '../systems/scoring.js';
import { ensureTutorialSpotlightObserver, syncTutorialSpotlightRing } from './tutorialSpotlight.js';
import { syncCtEventBanner } from './notifications.js';

const DISEASE_LABELS = {
  acs: "ACS（急性冠症候群）",
  stroke: "脳卒中",
  fever: "発熱",
  abdo: "腹痛",
  bp: "高血圧",
  sepsis: "敗血症",
  trauma: "外傷",
  hypo: "低血糖",
  minor: "軽症",
  anaphylaxis: "アナフィラキシー",
  gi_bleed: "消化管出血",
};

const KEY_ORDER_DISEASES = [
  "acs",
  "stroke",
  "fever",
  "abdo",
  "bp",
  "sepsis",
  "trauma",
  "hypo",
  "anaphylaxis",
  "gi_bleed",
  "minor",
];

function getOrderLabel(orderId) {
  return ORDERS.find(o => o.id === orderId)?.label || orderId || "何でも1件";
}

function getKeyOrderLabel(keyOrder) {
  if (Array.isArray(keyOrder) && keyOrder.length) {
    return keyOrder.map(k => getOrderLabel(k)).join(" + ");
  }
  return keyOrder ? getOrderLabel(keyOrder) : "何でも1件";
}

export function openKeyOrderModal() {
  const bg = document.getElementById("key-order-modal-bg");
  const table = document.getElementById("key-order-table");
  if (!bg || !table) return;

  const rows = KEY_ORDER_DISEASES
    .filter(id => DISEASE_SIG[id])
    .map(id => {
      const sig = DISEASE_SIG[id];
      const required = getKeyOrderLabel(sig.keyOrder);
      return `<div class="key-order-row"><span class="key-order-disease">${DISEASE_LABELS[id] || id}</span><span class="key-order-required">${required}</span></div>`;
    })
    .join("");

  table.innerHTML = `<div class="key-order-row key-order-head"><span>疾患</span><span>必要な検査</span></div>${rows}`;
  bg.classList.add("show");
}

export function closeKeyOrderModal() {
  document.getElementById("key-order-modal-bg")?.classList.remove("show");
}

function bindKeyOrderButton() {
  const btn = document.getElementById("key-order-btn");
  if (!btn || btn.dataset.bound === "true") return;
  btn.dataset.bound = "true";
  btn.addEventListener("click", e => {
    e.stopPropagation();
    openKeyOrderModal();
  });
}

if (typeof window !== "undefined") {
  Object.assign(window, { openKeyOrderModal, closeKeyOrderModal });
  bindKeyOrderButton();
  document.addEventListener("DOMContentLoaded", bindKeyOrderButton);
}

export function makeBedSVG(bed, w, h, isSel) {
  const p = bed.patient, ck = p ? p.color : "empty", c = COLORS[ck], occ = !!p;
  const fw = 6, fr = 3, bx = fw, by = fw, bw = w - fw * 2, bh = h - fw * 2;
  const px = bx + 10, py = by + 7, pw = bw - 20, ph = Math.round(bh * 0.27);
  const mx = bx + 4,  my = by + ph + 9, mw = bw - 8, mh = bh - ph - 17;
  const bi = 6, blkx = mx + bi, blky = my + bi, blkw = mw - bi * 2, blkh = mh - bi * 2;
  const monX = w - 22, monY = by + 6;

  let dots = "";
  if (occ && state.staffEnabled) {
    let sx = 8;
    state.staffState.filter(s => s.assignedBedId === bed.id && !s.absent).forEach(st => {
      const fs = fatigueState(st.fatigue), isN = st.role === "nurse";
      dots += `<circle cx="${sx}" cy="${h - 12}" r="4.5" fill="${isN ? "#1e3a5f" : "#2d1b4e"}" stroke="${fs.color}" stroke-width="1.5"/>
        <text x="${sx}" y="${h - 8.5}" text-anchor="middle" font-size="4.5" fill="${isN ? "#93c5fd" : "#c4b5fd"}" font-family="sans-serif">${isN ? "N" : "D"}</text>`;
      sx += 11;
    });
  }

  const u  = occ ? Math.round(p.urgency || 100) : 100;
  const uC = getUrgencyColor(u);
  const uW = Math.round((bw - 8) * (u / 100));
  const uBar = occ
    ? `<rect x="${bx + 4}" y="${h - 5}" width="${bw - 8}" height="3" rx="1.5" fill="#1e2736"/><rect x="${bx + 4}" y="${h - 5}" width="${uW}" height="3" rx="1.5" fill="${uC}" opacity="0.9"/>`
    : "";

  const bpC = occ ? (p.BP_sys < 75 ? "#ef4444" : p.BP_sys < 90 ? "#f97316" : "#22c55e") : "#2d3748";
  let mon = "";
  if (occ) {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, x2 = monX - 8 + t * 16;
      let y2 = monY + 9;
      if (i === 4) y2 = monY + 2; else if (i === 5) y2 = monY + 16; else if (i === 6) y2 = monY + 9;
      else if (i === 10) y2 = monY + 4; else if (i === 11) y2 = monY + 2; else if (i === 12) y2 = monY + 16; else if (i === 13) y2 = monY + 4;
      pts.push(`${x2},${y2}`);
    }
    mon = `<rect x="${monX - 10}" y="${monY}" width="20" height="22" rx="2" fill="#0f172a" stroke="${bpC}" stroke-width="0.8"/><polyline points="${pts.join(" ")}" fill="none" stroke="${bpC}" stroke-width="1" opacity="0.9"/>`;
  }

  const sel = isSel ? `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="7" fill="none" stroke="#60a5fa" stroke-width="2"/>` : "";

  return `<svg width="${w}" height="${h + 3}" viewBox="0 0 ${w} ${h + 3}" xmlns="http://www.w3.org/2000/svg">
    ${occ ? `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="7" fill="${c.glow}"/>` : ""}
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${fr}" fill="${c.mattress}" stroke="${c.frame}" stroke-width="1.5"/>
    <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="4" fill="${c.pillow}" stroke="${c.frame}" stroke-width="0.8" opacity="0.85"/>
    <rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="3" fill="${c.blanket}" opacity="0.9"/>
    <rect x="${blkx}" y="${blky}" width="${blkw}" height="${blkh}" rx="2" fill="${c.mattress}" opacity="0.4"/>
    ${occ ? `<ellipse cx="${blkx + Math.round(blkw * 0.5)}" cy="${blky + 9}" rx="8" ry="8" fill="#b45309" opacity="0.75"/><rect x="${blkx + Math.round(blkw * 0.18)}" y="${blky + 4}" width="${Math.round(blkw * 0.64)}" height="${blkh - 8}" rx="3" fill="#2d3950" opacity="0.6"/>` : ""}
    ${occ ? `<line x1="${w - fw - 4}" y1="${by + 4}" x2="${w - fw - 4}" y2="${by + Math.round(bh * 0.52)}" stroke="#4b5563" stroke-width="1.5"/><ellipse cx="${w - fw - 4}" cy="${by + 4}" rx="4" ry="2" fill="#374151" stroke="#4b5563" stroke-width="1"/><rect x="${w - fw - 8}" y="${by + 10}" width="8" height="13" rx="2" fill="#1e3a5f" opacity="0.8"/>` : ""}
    ${mon}${dots}${uBar}${sel}
  </svg>`;
}

export function renderBeds() {
  ensureTutorialSpotlightObserver();
  ["critical-beds", "exam-beds"].forEach(id => document.getElementById(id).innerHTML = "");
  [
    { zone: "critical", cont: "critical-beds", w: 96,  h: 104 },
    { zone: "exam",     cont: "exam-beds",     w: 60,  h: 78  },
  ].forEach(({ zone, cont, w, h }) => {
    const container = document.getElementById(cont);
    state.beds.filter(b => b.zone === zone).forEach(bed => {
      const bedEmpty = !bed.patient || bed.patient.disposed;
      const wrap  = document.createElement("div");
      wrap.className    = "bed-wrap";
      wrap.dataset.bedId = bed.id;
      const isSel = bed.id === state.selectedBedId;
      const lbl = !bedEmpty
        ? `<div style="font-size:8px;color:#e2e8f0;font-weight:500;">${bed.label}</div><div style="font-size:7px;color:#94a3b8;max-width:${w}px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${bed.patient.chief}</div>`
        : `<div style="font-size:8px;color:#475569;">${bed.label}</div><div style="font-size:7px;color:#334155;">空き</div>`;
      wrap.innerHTML = `<div class="drop-ring"></div><div class="drop-ring-blocked"></div>${makeBedSVG(bed, w, h, isSel)}<div style="text-align:center;">${lbl}</div>`;

      if (state.selectedPatient && bedEmpty) wrap.classList.add("assign-target");

      // 判定：必須検査が完了しているか、または検査不要フラグが立っているか
      const p = bed.patient;
      const keyOrder = p?.disease ? (DISEASE_SIG[p.disease]?.keyOrder || null) : null;
      const keyDone = keyOrder
        ? keyOrder.every(k => !!p.signals?.[k])
        : (p?.orders ? p.orders.filter(o => o.status === 'done').length >= 1 : false);
      const showBadge = !!p && !p.disposed && (keyDone || !!p.noOrderNeeded);
      if (showBadge) {
        const rb = document.createElement('div');
        rb.className = 'ready-badge';
        rb.textContent = '転帰可';
        wrap.appendChild(rb);
      }

      wrap.addEventListener("click", () => {
        if (state.selectedPatient && bedEmpty) { window.assignPatient(bed.id); return; }
        if (!bed.patient) return;
        state.selectedBedId = bed.id;
        renderBeds();
        renderDetail();
        if (!state.panelOpen) window.togglePanel();
        // checkTutEvent は window 経由
        if (typeof window.checkTutEvent === 'function') window.checkTutEvent("bed_click");
      });
      wrap.addEventListener("dragover", e => {
        e.preventDefault();
        bedEmpty ? wrap.classList.add("drop-target") : wrap.classList.add("drop-blocked");
      });
      wrap.addEventListener("dragleave", () => {
        wrap.classList.remove("drop-target");
        wrap.classList.remove("drop-blocked");
      });
      wrap.addEventListener("drop", e => {
        e.preventDefault();
        wrap.classList.remove("drop-target");
        wrap.classList.remove("drop-blocked");
        window.assignPatient(bed.id);
      });
      container.appendChild(wrap);
    });
  });

  const crit = state.beds.filter(b => b.zone === "critical");
  const exam = state.beds.filter(b => b.zone === "exam");
  const co   = crit.filter(b => b.patient).length;
  const eo   = exam.filter(b => b.patient).length;
  const sc   = document.getElementById("stat-c");
  const se   = document.getElementById("stat-e");
  sc.textContent = co + "/" + crit.length; sc.className = "val" + (co === crit.length ? " red" : " grn");
  se.textContent = eo + "/" + exam.length; se.className = "val" + (eo === exam.length ? " red" : " grn");

  syncCtEventBanner();
  requestAnimationFrame(() => syncTutorialSpotlightRing());
}

export function renderWaitList() {
  const list = document.getElementById("wait-list");
  list.innerHTML = "";
  document.getElementById("wait-count").textContent   = state.waitPatients.length;
  document.getElementById("drag-hint").style.display  = state.waitPatients.length ? "" : "none";
  state.waitPatients.forEach(p => {
    const card  = document.createElement("div");
    const isSel = state.selectedPatient && state.selectedPatient.id === p.id;
    card.className  = `wait-card ${TRIAGE_LV[p.color] || "lv3"}${isSel ? " sel" : ""}`;
    card.innerHTML  = `<div style="display:flex;align-items:center;"><span style="width:6px;height:6px;border-radius:50%;background:${TRIAGE_BDR[p.color]};display:inline-block;margin-right:3px;flex-shrink:0;"></span><span class="pt-name">${p.name}/${p.age}歳</span></div>
      <div class="pt-chief">${p.chief}</div>
      <div class="pt-vitals">${waitVitals(p)}</div>`;

    card.onclick = () => window.selectPatientForAssign(p.id);
    list.appendChild(card);
  });
  requestAnimationFrame(() => syncTutorialSpotlightRing());
}

export function renderStaffList() {
  const el = document.getElementById("staff-list");
  el.innerHTML = "";
  state.staffState.forEach(st => {
    const fs  = fatigueState(st.fatigue);
    const div = document.createElement("div");
    div.className = "staff-item" + (st.onBreak ? " on-break" : "") + (st.id === state.selectedStaffId ? " sel" : "");
    div.onclick   = () => window.openSpop(st.id);
    const bed        = state.beds.find(b => b.id === st.assignedBedId);
    const statusText = st.absent ? "欠勤" : st.onBreak ? "休憩中" : bed ? bed.label : "待機中";
    div.innerHTML = `<div class="sn-row"><span style="font-size:10px;">${st.absent ? "⬛" : fs.icon}</span><span class="sname">${st.short}</span><span class="rbadge ${st.rbCls}">${st.roleLabel}</span></div>
      <div class="ss-row"><span style="font-size:8px;color:#475569;white-space:nowrap;">${statusText}</span></div>
      <div class="ss-row"><div class="ft"><div class="ff" style="width:${Math.round(st.fatigue)}%;background:${st.absent ? "#334155" : fs.color};"></div></div><span style="font-size:9px;font-weight:600;color:${fs.color};white-space:nowrap;">${st.absent ? "欠勤" : Math.round(st.fatigue) + "%"}</span></div>`;
    el.appendChild(div);
  });
}

export function renderDetail() {
  const bed   = state.beds.find(b => b.id === state.selectedBedId);
  const body  = document.getElementById("rp-body");
  const title = document.getElementById("rp-title");
  if (!bed || !bed.patient) {
    title.textContent = "患者詳細";
    body.innerHTML    = `<div class="no-sel"><i class="ti ti-user-search"></i>ベッドを選択するか<br>患者を割り当ててください</div>`;
    requestAnimationFrame(() => syncTutorialSpotlightRing());
    return;
  }
  const p         = bed.patient;
  title.textContent = bed.label;

  const pendingIds = new Set(p.orders.filter(o => o.status === "pending").map(o => o.id));
  const doneIds    = new Set(p.orders.filter(o => o.status === "done").map(o => o.id));
  const doneCnt    = doneIds.size;
  const keyOrder      = p.disease ? (DISEASE_SIG[p.disease]?.keyOrder || null) : null;
  const keyDone       = keyOrder ? keyOrder.every(k => !!p.signals[k]) : doneCnt >= 1;
  const canDispose    = keyDone || !!p.noOrderNeeded;
  const missingOrders = keyOrder ? keyOrder.filter(k => !p.signals[k]).map(k => ORDERS.find(o => o.id === k)?.label || k) : [];

  const sigs    = Object.values(p.signals || {});
  const redCnt  = sigs.filter(s => s.color === "red").length;
  const yelCnt  = sigs.filter(s => s.color === "yellow").length;
  let rec       = redCnt >= 2 ? "icu" : redCnt === 1 || yelCnt >= 2 ? "admit" : "discharge";
  if (p.disease && DISEASE_SIG[p.disease]) rec = DISEASE_SIG[p.disease].rec;

  const assigned   = state.staffEnabled ? state.staffState.filter(s => s.assignedBedId === bed.id && !s.absent) : [];
  const avail      = state.staffEnabled ? state.staffState.filter(s => !s.assignedBedId && !s.onBreak && !s.absent) : [];
  const speedMult  = assigned.length > 0 ? Math.min(...assigned.map(s => fatigueState(s.fatigue).speedMult)) : 1.0;

  const assignedHTML = state.staffEnabled
    ? (assigned.length
        ? assigned.map(st => {
            const fs = fatigueState(st.fatigue);
            return `<div class="sa-row"><div class="sa-name"><span>${fs.icon}</span><span style="font-weight:600;">${st.short}</span><span class="rbadge ${st.rbCls}" style="font-size:7px;">${st.roleLabel}</span></div><div style="display:flex;align-items:center;gap:3px;"><div style="width:32px;height:4px;background:#111827;border-radius:2px;overflow:hidden;"><div style="width:${Math.round(st.fatigue)}%;height:100%;background:${fs.color};border-radius:2px;"></div></div><span style="font-size:8px;color:${fs.color};">${Math.round(st.fatigue)}%</span></div><button class="btn-rm" onclick="removeStaff('${st.id}')">外す</button></div>`;
          }).join("")
        : `<div style="font-size:9px;color:#334155;padding:3px;">スタッフ未配置</div>`)
    : "";

  const addBtns = state.staffEnabled && avail.length && !p.disposed
    ? `<div style="margin-top:4px;font-size:8px;color:#475569;margin-bottom:2px;">追加配置：</div><div class="sa-add-row">${avail.map(st => `<button class="btn-asgn" onclick="assignStaff('${st.id}','${bed.id}')"><span class="ban">${st.short}</span><span class="bar">${st.roleShort}</span></button>`).join("")}</div>`
    : "";

  function obtn(o) {
    const isPend = pendingIds.has(o.id), isDone = doneIds.has(o.id), sig = p.signals && p.signals[o.id];
    let cls = "", icon = o.icon, sub = "";
    if (isPend)       { cls = "pending";        icon = "ti-loader-2"; sub = "処理中..."; }
    else if (isDone && sig) {
      cls  = `sig-${sig.color}`;
      icon = sig.color === "red" ? "ti-alert-triangle" : sig.color === "yellow" ? "ti-alert-circle" : "ti-circle-check";
      sub  = sig.text;
    }
    return `<button class="obtn ${cls}" ${isDone || isPend || p.disposed ? "disabled" : ""} ${isDone || isPend || p.disposed ? "" : `onclick="placeOrder('${bed.id}','${o.id}')"`}><i class="ti ${icon}"></i><span>${o.label}</span>${sub ? `<span style="font-size:8px;">${sub}</span>` : ""}</button>`;
  }

  const sigEntries = Object.entries(p.signals || {});
  const sigHTML    = sigEntries.length
    ? `<div class="sig-bar"><div class="sig-bar-title">検査結果サマリー</div><div class="sig-list">
    ${sigEntries.map(([id, sig]) => { const sc = SIG_COLORS[sig.color]; return `<div class="sig-row ${sc.rowClass}"><div class="sig-dot" style="background:${sc.dot};"></div><span class="sig-name">${sig.label}</span><span class="sig-res" style="color:${sc.text};">${sig.text}</span></div>`; }).join("")}
  </div></div>`
    : "";

  const dispOpts = [
    { id: "icu",       label: "ICU転送",      icon: "ti-heart-rate-monitor", color: "#ef4444", recBg: "background:#7f1d1d;color:#fca5a5;" },
    { id: "admit",     label: "一般病棟入院",  icon: "ti-building-hospital",  color: "#60a5fa", recBg: "background:#1e3a5f;color:#93c5fd;" },
    { id: "discharge", label: "帰宅",          icon: "ti-home",               color: "#22c55e", recBg: "background:#0f2e1a;color:#86efac;" },
  ];
  // 転帰直後のフィードバック（state.lastFeedback・bedId一致時のみ）
  const lf           = state.lastFeedback;
  const feedbackHere = lf && lf.bedId === bed.id;
  const fb = p.disease ? CHIEF_FEEDBACK[p.disease] : null;
  const showFeedback = state.difficulty !== 'expert' && fb && fb.steps && fb.steps.length;
  const fbStepsHtml = showFeedback
    ? `<div class="fb-steps">
        <div class="fb-steps-title">推奨検査順</div>
        ${fb.steps.map((s, i) =>
          `<div class="fb-step">
            <span class="fb-step-num">${i + 1}</span>
            <div class="fb-step-body">
              <span class="fb-step-order">${s.order.toUpperCase()}</span>
              <span class="fb-step-reason">${s.reason}</span>
            </div>
          </div>`
        ).join('')}
        <div class="fb-rec-reason">${fb.recReason}</div>
      </div>`
    : '';
  const dispHTML     = p.disposed
    ? feedbackHere
      ? `<div class="feedback-card ${lf.correct ? "feedback-correct" : "feedback-warn"}">
          <div class="feedback-card-head">${lf.correct ? "✓ 正解：" : "⚠ 要確認："}${lf.label}</div>
          <div class="feedback-card-reason">${lf.reason}</div>
          <div class="feedback-card-pts">獲得ポイント：+${lf.pts}pt</div>
          ${fbStepsHtml}
        </div>`
      : `<div class="disp-done"><i class="ti ti-circle-check"></i>転帰決定済み</div>`
    : `<div class="disp-sec"><div class="disp-sec-title">転帰の決定${canDispose ? '<span style="font-size:9px;color:#22c55e;margin-left:6px;">✓ 解放済み</span>' : `<span style="font-size:9px;color:#334155;margin-left:6px;">残り${missingOrders.length}件の検査が必要</span>`}</div>
    <div class="disp-opts">${dispOpts.map(opt => {
      const isRec = canDispose && rec === opt.id && state.difficulty !== 'expert';
      return `<button class="disp-btn${isRec ? " rec " + opt.id : ""}" ${canDispose && !p.disposed ? `onclick="applyDisp('${opt.id}','${bed.id}')"` : "disabled"}><i class="ti ${opt.icon}" style="font-size:14px;color:${opt.color};"></i><span style="color:#f1f5f9;">${opt.label}</span>${isRec ? `<span class="rec-badge" style="${opt.recBg}">推奨</span>` : ""}</button>`;
    }).join("")}</div>${!canDispose && !p.noOrderNeeded && missingOrders.length ? `<p class="disp-hint">未実施：${missingOrders.join("・")}</p>` : ''}</div>`;

  body.innerHTML = `
    <div class="det-sec">
      <div class="det-name">${p.name}${p.ivOrdered ? '<span style="font-size:8px;color:#6ee7b7;margin-left:6px;">輸液中</span>' : ""}</div>
      <div class="det-age">${p.age}歳 ${p.sex}・${p.pmh}</div>
      <div class="chief-badge" style="background:${TRIAGE_BG[p.color] || "#0f2e1a"};border:0.5px solid ${TRIAGE_BDR[p.color] || "#22c55e"};color:${TRIAGE_BDR[p.color] || "#22c55e"};">${p.chief}</div>
      ${p.noOrderNeeded && state.difficulty === 'easy' ? '<div style="font-size:9px;color:#86efac;margin-top:4px;padding:3px 6px;background:#0f2e1a;border-radius:4px;">💡 診察のみで帰宅できる可能性があります</div>' : ''}
      ${makeVitalHtml(p)}
    </div>
    ${state.staffEnabled ? `<div class="sa-sec"><div class="sa-title">スタッフ配置 <span style="font-size:8px;color:#475569;font-weight:normal;">— ${assigned.length > 0 ? "処置速度 ×" + speedMult.toFixed(1) : "配置で処置が速くなります"}</span></div><div class="sa-list">${assignedHTML}</div>${addBtns}</div>` : ""}
    <div class="ord-sec"><div class="ord-sec-title">検査・処置オーダー</div><div class="ord-grid">${ORDERS.map(obtn).join("")}</div></div>
    ${sigHTML}${dispHTML}`;
  requestAnimationFrame(() => syncTutorialSpotlightRing());
}
