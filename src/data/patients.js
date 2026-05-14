export const CALL_PATIENTS = [
  {
    name: "木村 義男", age: 62, sex: "男性", chief: "胸痛・呼吸困難",
    vitals: "HR 128 / BP 76/44 / SpO₂ 91%", triage: "赤（Level 1）", scene: "意識混濁",
    eta: 4, dist: "約2.1km",
    color: "red", HR: 128, BP_sys: 76, BP_dia: 44, SpO2: 91, GCS: 12, RR: 26, Temp: 36.4,
    disease: "acs",
  },
  {
    name: "高橋 由美", age: 70, sex: "女性", chief: "意識レベル低下",
    vitals: "HR 52 / BP 96/60 / SpO₂ 95%", triage: "橙（Level 2）", scene: "血糖 44",
    eta: 6, dist: "約4.2km",
    color: "orange", HR: 52, BP_sys: 96, BP_dia: 60, SpO2: 95, GCS: 10, RR: 18, Temp: 36.1,
    disease: "bp",
  },
];

export const CALL_UNITS = [
  { unit: "豊島第2救急隊",   station: "豊島消防署" },
  { unit: "新宿特別救助隊", station: "新宿消防署" },
];
