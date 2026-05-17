export const COLORS = {
  red:    { frame: "#ef4444", mattress: "#7f1d1d", blanket: "#991b1b", pillow: "#6b1414", glow: "rgba(239,68,68,0.18)" },
  orange: { frame: "#f97316", mattress: "#7c2d12", blanket: "#9a3412", pillow: "#78280f", glow: "rgba(249,115,22,0.15)" },
  yellow: { frame: "#eab308", mattress: "#713f12", blanket: "#854d0e", pillow: "#6b3d0b", glow: "rgba(234,179,8,0.13)" },
  green:  { frame: "#22c55e", mattress: "#14532d", blanket: "#166534", pillow: "#134e29", glow: "rgba(34,197,94,0.13)" },
  empty:  { frame: "#2d3748", mattress: "#1e2736", blanket: "#243044", pillow: "#1a2234", glow: "rgba(0,0,0,0)" },
};

export const TRIAGE_BG  = { red: "#2d0f0f", orange: "#2d1f0a", yellow: "#2a250a", green: "#0f2e1a" };
export const TRIAGE_BDR = { red: "#ef4444", orange: "#f97316", yellow: "#eab308", green: "#22c55e" };
export const TRIAGE_LV  = { red: "lv1",     orange: "lv2",     yellow: "lv4",     green: "lv3" };

export const ORDERS = [
  { id: "iv",    label: "点滴",     icon: "ti-droplet",            time: 8  },
  { id: "blood", label: "血液検査", icon: "ti-test-pipe",          time: 22 },
  { id: "ecg",   label: "心電図",   icon: "ti-heart-rate-monitor", time: 10 },
  { id: "echo",  label: "エコー",   icon: "ti-wave-saw-tool",      time: 18 },
  { id: "xray",  label: "X線",     icon: "ti-scan",               time: 14 },
  { id: "ct",    label: "CT",      icon: "ti-circle-dotted",      time: 30 },
];
