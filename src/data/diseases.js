export const DISEASE_SIG = {
  acs:   { blood: { color: "red",    text: "🔴 Troponin↑↑ 異常" }, ecg: { color: "red",    text: "🔴 ST上昇 — MI疑い" },       echo: { color: "red",    text: "🔴 EF低下・壁運動異常" }, xray: { color: "green",  text: "🟢 肺野清明" },     ct: { color: "yellow", text: "🟡 解離は除外" },           rec: "icu" },
  stroke:{ blood: { color: "yellow", text: "🟡 凝固系 要確認" },   ecg: { color: "yellow", text: "🟡 AF疑い" },              echo: { color: "yellow", text: "🟡 心原性塞栓 要評価" },  xray: { color: "green",  text: "🟢 異常なし" },     ct: { color: "red",    text: "🔴 頭蓋内出血あり" },       rec: "icu" },
  fever: { blood: { color: "yellow", text: "🟡 WBC軽度上昇" },     ecg: { color: "green",  text: "🟢 正常洞調律" },           echo: { color: "green",  text: "🟢 心機能正常" },          xray: { color: "green",  text: "🟢 両肺野清明" },    ct: { color: "green",  text: "🟢 異常なし" },             rec: "discharge" },
  abdo:  { blood: { color: "red",    text: "🔴 炎症反応高値" },     ecg: { color: "green",  text: "🟢 正常" },                echo: { color: "red",    text: "🔴 腹水・炎症所見" },       xray: { color: "yellow", text: "🟡 イレウス疑い" }, ct: { color: "red",    text: "🔴 腹膜炎所見" },           rec: "admit" },
  bp:    { blood: { color: "yellow", text: "🟡 電解質 軽度異常" },  ecg: { color: "yellow", text: "🟡 左室肥大パターン" },      echo: { color: "yellow", text: "🟡 軽度壁肥厚" },            xray: { color: "green",  text: "🟢 異常なし" },     ct: { color: "green",  text: "🟢 頭蓋内異常なし" },       rec: "admit" },
  sepsis:{ blood: { color: "red",    text: "🔴 乳酸高値・WBC高値" }, ecg: { color: "green",  text: "🟢 洞調律" },              echo: { color: "yellow", text: "🟡 心機能低下" },            xray: { color: "yellow", text: "🟡 浸潤影疑い" },   ct: { color: "red",    text: "🔴 感染巣あり" },           rec: "icu" },
  trauma:{ blood: { color: "red",    text: "🔴 出血・貧血疑い" },   ecg: { color: "green",  text: "🟢 致死的不整脈なし" },     echo: { color: "yellow", text: "🟡 心嚢液疑い" },            xray: { color: "red",    text: "🔴 骨折・気胸疑い" }, ct: { color: "red",  text: "🔴 臓器損傷疑い" },         rec: "icu" },
  minor: { blood: { color: "green",  text: "🟢 異常なし" },         ecg: { color: "green",  text: "🟢 正常洞調律" },           echo: { color: "green",  text: "🟢 異常なし" },            xray: { color: "green",  text: "🟢 異常なし" },     ct: { color: "green",  text: "🟢 異常なし" },             rec: "discharge" },
};

export const PATIENT_SPEECH = {
  acs: {
    assign:   ["先生…胸が…締め付けられます", "息が…苦しくて…", "左腕も…痛くて…", "助けてください…"],
    critical: ["痛い…もう限界です…", "先生…まずいですか…", "息ができない…"],
    iv_done:  ["点滴、ありがとうございます…", "少し…楽になった気が…"],
    disposed: { icu: "先生、ありがとうございます…ICUで頑張ります", admit: "よろしくお願いします…", discharge: "ありがとうございました" },
  },
  stroke: {
    assign:   ["あたま、がくがく…します", "ことばが、でにくくて…", "てが、しびれて…"],
    critical: ["せんせい…みえにくい…", "うごかない…からだが…"],
    iv_done:  ["てん、てき…ありがとう…"],
    disposed: { icu: "ありがとう…いってきます", admit: "お願い…します", discharge: "ありがとうございました" },
  },
  fever: {
    assign:   ["昨日から熱が下がらなくて", "体がだるくて、何もできなかったんです", "先生、お願いします", "寒くて…震えがとまらなくて"],
    critical: ["先生、まだ熱があります…", "体がつらいです…"],
    iv_done:  ["点滴していただいて、ありがとうございます"],
    disposed: { icu: "よろしくお願いします", admit: "お世話になります", discharge: "ありがとうございました。早く治します" },
  },
  abdo: {
    assign:   ["お腹が…ものすごく痛い…", "吐き気もあって…", "右下が…特に…", "動くと…痛みが走って…"],
    critical: ["痛みが…増してきてます…", "先生…大丈夫ですか…"],
    iv_done:  ["少し…楽になりました…"],
    disposed: { icu: "よろしくお願いします", admit: "ありがとうございます", discharge: "ありがとうございました" },
  },
  bp: {
    assign:   ["頭がずきずきして…", "めまいもあって、気持ち悪いです", "血圧が高いんですよね、私", "病院に来てよかった"],
    critical: ["先生、頭が痛い…", "視界がぼやけて…"],
    iv_done:  ["点滴ありがとうございます"],
    disposed: { icu: "よろしくお願いします", admit: "少し様子を見ます", discharge: "気をつけます。ありがとうございました" },
  },
  hypo: {
    assign:   ["あれ…ここは…？", "気分が悪くて…", "ぼーっとして…"],
    critical: ["先生…頭が…", "意識が…"],
    iv_done:  ["あ…少し頭が…はっきりしてきました"],
    disposed: { icu: "お願いします", admit: "ありがとうございます", discharge: "ありがとうございました。気をつけます" },
  },
  sepsis: {
    assign:   ["熱が高くて、ぼーっとします…", "寒くて震えが止まりません…", "体が全部つらいです…"],
    critical: ["先生、意識が遠くなります…", "震えが止まらなくて苦しいです…"],
    iv_done:  ["点滴で少し落ち着いた気がします…"],
    disposed: { icu: "よろしくお願いします…", admit: "お願いします", discharge: "ありがとうございました" },
  },
  trauma: {
    assign:   ["事故で…全身が痛いです…", "どこが痛いのか、わからないです…", "息をすると痛みます…"],
    critical: ["先生、痛くて動けません…", "だんだん苦しくなってきました…"],
    iv_done:  ["ありがとうございます…少し安心しました…"],
    disposed: { icu: "お願いします…", admit: "ありがとうございます", discharge: "ありがとうございました" },
  },
  minor: {
    assign:   ["足を捻って…歩けなくて", "ちょっと転んで痛くて来たんですが", "大したことないかもですが…"],
    critical: ["先生、まだ痛いです…", "どうですかね…"],
    iv_done:  ["ありがとうございます"],
    disposed: { icu: "よろしくお願いします", admit: "ありがとうございます", discharge: "ありがとうございました！助かりました" },
  },
};

export const SIG_COLORS = {
  red:    { border: "#ef4444", text: "#fca5a5", dot: "#ef4444", rowClass: "red-row" },
  yellow: { border: "#eab308", text: "#fde68a", dot: "#eab308", rowClass: "yellow-row" },
  green:  { border: "#22c55e", text: "#86efac", dot: "#22c55e", rowClass: "green-row" },
};
