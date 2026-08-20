/* HALL DISKMAG 01 — Loadstar sitting for Hermes */
(() => {
  const crt = document.getElementById("crt");
  const line = document.getElementById("line");
  const DEGREES = ["neophyte", "fellowcraft", "adept"];
  const degree = localStorage.getItem("hall.degree") || "neophyte";
  const ISSUE_CH = "hermes";

  const state = {
    mode: "load",
    chapter: null,
    mag: null,
    hour: null,
  };

  function rankOf(d) { return DEGREES.indexOf(d); }
  function canSee(depth) {
    if (depth === "signal") return true;
    if (depth === "translation") return rankOf(degree) >= 1;
    if (depth === "folio") return rankOf(degree) >= 2;
    return false;
  }
  function esc(s) {
    return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }
  function paint(html) { crt.innerHTML = html; }
  function pre(text, cls) {
    return `<span class="${cls || ""}">${esc(text)}</span>`;
  }

  function markRead(id, depth) {
    if (depth !== "signal" && depth !== "translation") return;
    let read;
    try { read = JSON.parse(localStorage.getItem("hall.read") || '{"signal":[],"translation":[]}'); }
    catch { read = { signal: [], translation: [] }; }
    if (!read[depth]) read[depth] = [];
    if (!read[depth].includes(id)) {
      read[depth].push(id);
      localStorage.setItem("hall.read", JSON.stringify(read));
    }
  }

  async function api(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  }

  const HOUR_BAS = `10 REM HALL DISKMAG 01 - HOUR.BAS
20 REM PLANETARY HOUR. NO FIFTH COLOR.
30 PRINT "PLANETARY HOUR"
40 PRINT "PLANET: "; P$
50 PRINT "METAL : "; M$
60 PRINT "DAY   : "; D$
70 END`;

  const GEM_BAS = `10 REM HALL DISKMAG 01 - GEMATRIA.BAS
20 REM ENGLISH ORDINAL ON HALL. CODEX KEEPS HEBREW.
30 INPUT "WORD"; W$
40 GOSUB 100
50 PRINT W$; " = "; V
60 END
100 REM ORDINAL A=1
110 RETURN`;

  function menu() {
    const iss = state.mag?.issues?.[0] || { n: 1, title: "HERMES", side: "A", track: 18 };
    paint(
      pre("        **** HALL DISKMAG ****\n", "w") +
      pre(`     ISSUE ${String(iss.n).padStart(2, "0")}   SIDE ${iss.side}   TRACK ${iss.track}\n`, "c") +
      pre("     64K RAM SYSTEM  BYTES FREE\n\n", "c") +
      pre(iss.title + "\n", "y") +
      pre("MANLY P. HALL  ·  1928\n\n") +
      pre(" 1  EDITORIAL          NFO\n", "w") +
      pre(" 2  WALKTHROUGH        TXT\n") +
      pre(" 3  FOLIO EXTRACT      FOL\n") +
      pre(" 4  LIST HOUR.BAS\n", "c") +
      pre(" 5  RUN  HOUR.BAS\n", "c") +
      pre(" 6  LIST GEMATRIA.BAS\n", "c") +
      pre(" 7  RUN  GEMATRIA.BAS\n", "c") +
      pre(" 8  NEXT ISSUE (PYRAMID)\n") +
      pre(" 9  CEEFAX P093\n") +
      pre(" 0  WORKBENCH 1.3\n\n") +
      pre(`DEGREE ${degree.toUpperCase()}   READY.\n`, "y")
    );
    state.mode = "menu";
    line.placeholder = "1-9 OR 0";
    line.focus();
  }

  function gated(depth, title, body) {
    if (!canSee(depth)) {
      const need = depth === "translation" ? "FELLOWCRAFT" : "ADEPT";
      paint(
        pre(title + "\n", "y") +
        pre("\n?ACCESS DENIED  ERROR IN 20\n", "r") +
        pre(`NEED ${need}.\n`) +
        pre("READ THREE NFO, PASS A RITE ON THE BBS.\n\n") +
        pre("PRESS RETURN FOR MENU.\n", "c")
      );
      state.mode = "pause";
      return;
    }
    markRead(ISSUE_CH, depth);
    const text = (body || "").replace(/^=+\s*$/gm, "").replace(/^.*\.NFO.*$/gm, "").trim();
    paint(pre(title + "\n\n", "y") + pre(text.slice(0, 1800) + "\n\n") + pre("PRESS RETURN FOR MENU.\n", "c"));
    state.mode = "pause";
  }

  function showListing(name, src) {
    paint(pre(`LIST "${name}"\n\n`, "w") + pre(src + "\n\n", "c") + pre("READY.\nPRESS RETURN FOR MENU.\n", "y"));
    state.mode = "pause";
  }

  async function runHour() {
    const h = state.hour || await api("/api/hour");
    state.hour = h;
    paint(
      pre("RUN\n", "w") +
      pre("PLANETARY HOUR\n", "y") +
      pre(`PLANET: ${h.planet}\n`) +
      pre(`METAL : ${h.metal}\n`) +
      pre(`DAY   : ${h.day_ruler}\n`) +
      pre(`PERIOD: ${h.period}  ${h.clock}\n\n`) +
      pre("READY.\nPRESS RETURN FOR MENU.\n", "c")
    );
    state.mode = "pause";
  }

  function runGemPrompt() {
    paint(pre("RUN\n", "w") + pre("WORD? ", "y"));
    state.mode = "gem";
    line.placeholder = "HIRAM";
    line.focus();
  }

  async function runGem(word) {
    const rec = await api("/api/gematria?q=" + encodeURIComponent(word));
    const extra = (rec.hits || []).slice(0, 6).map((h) => h.word).join(", ");
    paint(
      pre("RUN\n", "w") +
      pre(`WORD? ${word.toUpperCase()}\n`, "y") +
      pre(`${(rec.letters || word).toUpperCase()} = ${rec.ordinal}  REDUCE ${rec.reduction}\n`) +
      pre(extra ? `ALSO: ${extra}\n\n` : "\n") +
      pre("CODEX KEEPS THE HEBREW DESK.\n", "c") +
      pre("READY.\nPRESS RETURN FOR MENU.\n", "c")
    );
    state.mode = "pause";
    line.placeholder = "";
  }

  function nextIssue() {
    paint(
      pre("ISSUE 02 IS STILL ON THE SHELF.\n", "y") +
      pre("THE PYRAMID CHAPTER IS COPIED ON THE BBS\n") +
      pre("AND ON CEEFAX 107.\n\n") +
      pre("THIS MAGAZINE IS ONE SITTING.\n") +
      pre("COME BACK WHEN SIDE B IS CUT.\n\n") +
      pre("PRESS RETURN FOR MENU.\n", "c")
    );
    state.mode = "pause";
  }

  async function choose(raw) {
    const k = raw.trim().toLowerCase();
    if (state.mode === "gem") {
      if (!k) return menu();
      await runGem(k);
      return;
    }
    if (state.mode === "pause" || k === "" || k === "menu") {
      menu();
      return;
    }
    if (state.mode !== "menu") return;
    if (k === "1") gated("signal", "EDITORIAL", state.chapter?.signal);
    else if (k === "2") gated("translation", "WALKTHROUGH", state.chapter?.translation);
    else if (k === "3") gated("folio", "FOLIO EXTRACT", state.chapter?.folio);
    else if (k === "4") showListing("HOUR.BAS", HOUR_BAS);
    else if (k === "5") await runHour();
    else if (k === "6") showListing("GEMATRIA.BAS", GEM_BAS);
    else if (k === "7") runGemPrompt();
    else if (k === "8") nextIssue();
    else if (k === "9") location.href = "/ceefax/#p093";
    else if (k === "0") location.href = "/";
    else paint(pre("?SYNTAX ERROR\n", "r") + pre("READY.\n"));
  }

  line.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const v = line.value;
    line.value = "";
    Promise.resolve(choose(v)).catch((err) => {
      paint(pre("?NET ERROR " + err.message + "\n", "r"));
      state.mode = "pause";
    });
  });

  async function boot() {
    const load = [
      "\n    **** COMMODORE 64 BASIC V2 ****\n",
      " 64K RAM SYSTEM  38911 BASIC BYTES FREE\n\n",
      "READY.\n",
      "LOAD\"HALL-01\",8,1\n\n",
      "SEARCHING FOR HALL-01\n",
      "LOADING",
    ];
    let acc = "";
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      paint(pre(load.join("") + "\nREADY.\nRUN\n"));
    } else {
      for (const chunk of load) {
        acc += chunk;
        paint(pre(acc, "w"));
        await new Promise((r) => setTimeout(r, chunk === "LOADING" ? 700 : 220));
      }
      acc += "\nREADY.\nRUN\n";
      paint(pre(acc, "w"));
      await new Promise((r) => setTimeout(r, 400));
    }
    const [ch, mag, hour] = await Promise.all([
      api("/api/chapter?id=hermes"),
      api("/api/diskmag"),
      api("/api/hour"),
    ]);
    state.chapter = ch;
    state.mag = mag;
    state.hour = hour;
    menu();
  }

  boot().catch((err) => paint(pre("?FILE NOT FOUND  " + err.message, "r")));
  line.focus();
})();
