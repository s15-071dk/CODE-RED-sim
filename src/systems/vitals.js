import { state } from '../state.js';

export function makeVitalHtml(p) {
  function vs(val, thr) {
    for (const t of thr) { if (val <= t.max) return t; }
    return thr[thr.length - 1];
  }
  const hrS = vs(p.HR,    [{ max: 54,  icon: '🔴', label: '危険',    c: '#ef4444' }, { max: 100, icon: '🟢', label: '正常', c: '#22c55e' }, { max: 119, icon: '🟡', label: '速め',   c: '#eab308' }, { max: 999, icon: '🔴', label: '危険',    c: '#ef4444' }]);
  const bpS = vs(p.BP_sys,[{ max: 79,  icon: '🔴', label: '危険',    c: '#ef4444' }, { max: 89,  icon: '🟠', label: '低め', c: '#f97316' }, { max: 139, icon: '🟢', label: '正常',   c: '#22c55e' }, { max: 179, icon: '🟡', label: '高め',    c: '#eab308' }, { max: 999, icon: '🔴', label: '危険', c: '#ef4444' }]);
  const spS = vs(p.SpO2,  [{ max: 89,  icon: '🔴', label: '危険',    c: '#ef4444' }, { max: 94,  icon: '🟠', label: '低め', c: '#f97316' }, { max: 999, icon: '🟢', label: '正常',   c: '#22c55e' }]);
  const gcS = vs(p.GCS,   [{ max: 8,   icon: '🔴', label: '意識不明', c: '#ef4444' }, { max: 12,  icon: '🟡', label: '意識低下', c: '#eab308' }, { max: 14, icon: '🟡', label: 'やや低下', c: '#eab308' }, { max: 999, icon: '🟢', label: '清明', c: '#22c55e' }]);
  const rrS = vs(p.RR,    [{ max: 9,   icon: '🔴', label: '危険',    c: '#ef4444' }, { max: 11,  icon: '🟠', label: '遅め', c: '#f97316' }, { max: 20,  icon: '🟢', label: '正常',   c: '#22c55e' }, { max: 24,  icon: '🟡', label: '速め',    c: '#eab308' }, { max: 999, icon: '🔴', label: '危険', c: '#ef4444' }]);
  const tmp = typeof p.Temp === 'number' ? p.Temp : parseFloat(p.Temp) || 36.5;
  const tpS = vs(Math.round(tmp * 10), [{ max: 349, icon: '🔴', label: '低体温', c: '#ef4444' }, { max: 359, icon: '🟡', label: '低め', c: '#eab308' }, { max: 374, icon: '🟢', label: '正常', c: '#22c55e' }, { max: 384, icon: '🟡', label: '微熱', c: '#eab308' }, { max: 999, icon: '🔴', label: '発熱', c: '#ef4444' }]);

  if (state.difficulty === 'easy') {
    return `<div class="vgrid">
      <div class="vbox"><div class="vlbl">脈拍</div><div class="vval" style="color:${hrS.c};">${hrS.icon} ${hrS.label}</div></div>
      <div class="vbox"><div class="vlbl">血圧</div><div class="vval" style="color:${bpS.c};">${bpS.icon} ${bpS.label}</div></div>
      <div class="vbox"><div class="vlbl">酸素</div><div class="vval" style="color:${spS.c};">${spS.icon} ${spS.label}</div></div>
      <div class="vbox"><div class="vlbl">意識</div><div class="vval" style="color:${gcS.c};">${gcS.icon} ${gcS.label}</div></div>
      <div class="vbox"><div class="vlbl">呼吸</div><div class="vval" style="color:${rrS.c};">${rrS.icon} ${rrS.label}</div></div>
      <div class="vbox"><div class="vlbl">体温</div><div class="vval" style="color:${tpS.c};">${tpS.icon} ${tpS.label}</div></div>
    </div>`;
  }

  const aHR = p.HR > 110 || p.HR < 55;
  const aBP = p.BP_sys < 90;
  const aSp = p.SpO2 < 95;

  if (state.difficulty === 'hard' || state.difficulty === 'normal' || state.difficulty === 'expert') {
    return `<div class="vgrid">
      <div class="vbox ${aHR ? 'w' : ''}"><div class="vlbl">HR</div><div class="vval${aHR ? ' ab' : ''}">${p.HR}<span class="vunit">bpm</span></div></div>
      <div class="vbox ${aBP ? 'w' : ''}"><div class="vlbl">BP</div><div class="vval${aBP ? ' ab' : ''}">${p.BP_sys}/${p.BP_dia}<span class="vunit">mmHg</span></div></div>
      <div class="vbox ${aSp ? 'w' : ''}"><div class="vlbl">SpO₂</div><div class="vval${aSp ? ' ab' : ''}">${p.SpO2}<span class="vunit">%</span></div></div>
      <div class="vbox"><div class="vlbl">GCS</div><div class="vval">${p.GCS}<span class="vunit">/15</span></div></div>
      <div class="vbox"><div class="vlbl">RR</div><div class="vval">${p.RR}<span class="vunit">/min</span></div></div>
      <div class="vbox"><div class="vlbl">体温</div><div class="vval">${tmp.toFixed(1)}<span class="vunit">°C</span></div></div>
    </div>`;
  }

  return `<div class="vgrid">
    <div class="vbox ${aHR ? 'w' : ''}"><div class="vlbl">HR</div><div class="vval${aHR ? ' ab' : ''}">${p.HR}<span class="vunit">bpm</span></div></div>
    <div class="vbox ${aBP ? 'w' : ''}"><div class="vlbl">BP</div><div class="vval${aBP ? ' ab' : ''}">${p.BP_sys}/${p.BP_dia}<span class="vunit">mmHg</span></div></div>
    <div class="vbox ${aSp ? 'w' : ''}"><div class="vlbl">SpO₂</div><div class="vval${aSp ? ' ab' : ''}">${p.SpO2}<span class="vunit">%</span></div></div>
    <div class="vbox"><div class="vlbl">GCS</div><div class="vval">${p.GCS}<span class="vunit">/15</span></div></div>
    <div class="vbox"><div class="vlbl">RR</div><div class="vval">${p.RR}<span class="vunit">/min</span></div></div>
    <div class="vbox"><div class="vlbl">体温</div><div class="vval">${tmp.toFixed(1)}<span class="vunit">°C</span></div></div>
  </div>`;
}

export function waitVitals(p) {
  if (state.difficulty === 'hard' || state.difficulty === 'normal' || state.difficulty === 'expert') return `<span class="vbadge hr">HR${p.HR}</span><span class="vbadge bp">BP${p.BP_sys}</span><span class="vbadge spo2">SpO₂${p.SpO2}%</span>`;
  return '';
}
