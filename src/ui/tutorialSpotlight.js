import { state } from '../state.js';
import { TUT_STEPS } from '../data/stages.js';

// チュートリアル中のハイライト枠。#body-wrap 基準で座標を合わせる（左待機・右パネル含む）。
// tutorial.js の showTutStep から sync が呼ばれる。

const TARGET_MAP = {
  drag: 'wait-list',
  click_bed: 'critical-beds',
  order: 'rp-body',
  more_order: 'rp-body',
  disp: 'rp-body',
};

let _observerInstalled = false;

export function syncTutorialSpotlightRing() {
  if (state.currentStage !== 'tutorial') return;
  const nav = document.getElementById('tut-nav');
  if (!nav || !nav.classList.contains('show')) return;

  const ring = document.getElementById('sp-ring');
  const shell = document.getElementById('body-wrap');
  const step = TUT_STEPS[state.tutStepIdx];
  if (!ring || !shell || !step) return;

  const targetId = TARGET_MAP[step.id];
  if (!targetId) {
    ring.style.display = 'none';
    return;
  }
  let target = document.getElementById(targetId);
  if (!target) {
    ring.style.display = 'none';
    return;
  }

  // STEP2: 患者がいるベッド枠を優先（診察室に割り当てた場合も枠が正しく乗る）
  if (step.id === 'click_bed') {
    const occ = state.beds.find(b => b.patient);
    if (occ) {
      const wrap = document.querySelector(`[data-bed-id="${occ.id}"]`);
      if (wrap) target = wrap;
    }
  }

  const sr = shell.getBoundingClientRect();
  const tr = target.getBoundingClientRect();
  const pad = 8;
  ring.style.display = 'block';
  ring.style.left = `${tr.left - sr.left - pad}px`;
  ring.style.top = `${tr.top - sr.top - pad}px`;
  ring.style.width = `${tr.width + pad * 2}px`;
  ring.style.height = `${tr.height + pad * 2}px`;
}

export function ensureTutorialSpotlightObserver() {
  if (_observerInstalled) return;
  const nav = document.getElementById('tut-nav');
  if (!nav) return;
  _observerInstalled = true;

  const schedule = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => syncTutorialSpotlightRing());
    });
  };

  new MutationObserver(schedule).observe(nav, {
    subtree: true,
    characterData: true,
    childList: true,
    attributes: true,
  });
  window.addEventListener('resize', schedule);
}
