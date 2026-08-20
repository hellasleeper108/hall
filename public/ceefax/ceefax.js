/* CEEFAX 1928 — Hall of Ages teletext skin */
(() => {
  const $ = (s) => document.querySelector(s);
  const COLS = 40;
  const BODY_ROWS = 20;

  const DEGREES = ["neophyte", "fellowcraft", "adept"];
  const degree = localStorage.getItem("hall.degree") || "neophyte";

  const MAGAZINE = [
    { page: 100, kind: "index" },
    { page: 93, id: "hermes" },
    { page: 107, id: "pyramid" },
    { page: 188, id: "pythagoras" },
    { page: 227, id: "hiramic" },
    { page: 346, id: "qabbalah" },
    { page: 372, id: "sephiroth" },
    { page: 394, id: "tarot" },
    { page: 562, id: "cryptogram" },
    { page: 33, kind: "cipher" },
    { page: 700, kind: "echoes" },
    { page: 800, kind: "hour" },
    { page: 900, kind: "who" },
  ];

  const state = {
    page: 100,
    depth: "signal",
    catalog: null,
    chapters: {},
    who: null,
    hour: null,
    reveal: false,
  };

  function pad(n, w = 3) {
    return String(n).padStart(w, "0");
  }
  function rankOf(d) {
    return DEGREES.indexOf(d);
  }
  function canSee(depth) {
    if (depth === "signal") return true;
    if (depth === "translation") return rankOf(degree) >= 1;
    if (depth === "folio") return rankOf(degree) >= 2;
    return false;
  }
  function wrap(text, width = COLS, max = BODY_ROWS) {
    const lines = [];
    const paras = String(text || "").replace(/\t/g, " ").split(/\n/);
    for (const para of paras) {
      if (!para.trim()) {
        if (lines.length && lines[lines.length - 1] !== "") lines.push("");
        continue;
      }
      let rest = para.trim();
      while (rest.length) {
        if (rest.length <= width) {
          lines.push(rest);
          break;
        }
        let cut = rest.lastIndexOf(" ", width);
        if (cut < 12) cut = width;
        lines.push(rest.slice(0, cut).trimEnd());
        rest = rest.slice(cut).trimStart();
      }
      if (lines.length >= max) break;
    }
    return lines.slice(0, max);
  }
  function fit(s, n = COLS) {
    s = String(s ?? "");
    return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
  }

  function header(p) {
    const d = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    const left = `P${pad(p)} CEEFAX HALL`;
    const right = `${days[d.getDay()]} ${hh}:${mm}/${ss}`;
    const gap = Math.max(1, COLS - left.length - right.length);
    return left + " ".repeat(gap) + right;
  }

  function mag(p) {
    return MAGAZINE.find((m) => m.page === p);
  }

  async function api(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  }

  async function load() {
    const [cat, who, hour] = await Promise.all([
      api("/api/catalog"),
      api("/api/who"),
      api("/api/hour"),
    ]);
    state.catalog = cat;
    state.who = who;
    state.hour = hour;
    const copied = (cat.chapters || []).filter((c) => c.ready);
    await Promise.all(copied.map(async (c) => {
      try {
        state.chapters[c.id] = await api("/api/chapter?id=" + encodeURIComponent(c.id));
      } catch {
        state.chapters[c.id] = null;
      }
    }));
  }

  function paintIndex() {
    const rows = [
      { t: "HALL OF AGES", cls: "dh" },
      { t: "Manly P. Hall  ·  1928  ·  no renewal" , cls: "c" },
      { t: "" },
      { t: "FOLIO PAGE                  CEEFAX", cls: "y" },
    ];
    for (const m of MAGAZINE.filter((x) => x.id)) {
      rows.push({ t: `  ${pad(m.page)}  ${m.id.toUpperCase()}` });
    }
    rows.push({ t: "" });
    rows.push({ t: "  700 ECHOES   800 HOUR   900 WHO", cls: "c" });
    rows.push({ t: "  100 INDEX    033  (not listed)", cls: "c" });
    rows.push({ t: "" });
    rows.push({ t: `Degree ${degree.toUpperCase()}   RED NFO  GRN TXT  YEL FOL`, cls: "y" });
    return rows;
  }

  function paintChapter(id) {
    const rec = state.chapters[id];
    const meta = (state.catalog?.chapters || []).find((c) => c.id === id);
    if (!rec && !meta) return [{ t: "PAGE NOT COPIED", cls: "r" }];
    const title = (rec?.title || meta?.title || id).toUpperCase();
    if (!canSee(state.depth)) {
      const need = state.depth === "translation" ? "FELLOWCRAFT" : "ADEPT";
      return [
        { t: title.slice(0, COLS), cls: "dh" },
        { t: "" },
        { t: "ACCESS DENIED", cls: "r" },
        { t: `Need ${need}.`, cls: "y" },
        { t: "Read three NFO on the BBS, pass a rite." },
        { t: "HOLD 100  or  WB 1.3 to return." },
      ];
    }
    let body = "";
    if (state.depth === "signal") {
      body = rec?.signal || meta?.blurb || "";
      body = body.replace(/^.*\.NFO.*$/gm, "")
        .replace(/^=+\s*$/gm, "")
        .replace(/^DEGREE.*$/gm, "")
        .replace(/^SEE ALSO.*$/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    } else if (state.depth === "translation") body = rec?.translation || "";
    else body = rec?.folio || "";
    const rows = [
      { t: title.slice(0, COLS), cls: "dh" },
      { t: `${(rec?.echo || meta?.echo || "").slice(0, 12)}  p.${meta?.page || "?"}  ${state.depth.toUpperCase()}`, cls: "c" },
      { t: "" },
    ];
    wrap(body, COLS, BODY_ROWS - 6).forEach((ln) => rows.push({ t: ln }));
    const also = (rec?.see_also || []).slice(0, 4).map((sid) => {
      const ch = (state.catalog?.chapters || []).find((c) => c.id === sid);
      return ch ? pad(ch.page) : sid;
    });
    if (also.length) rows.push({ t: "SEE ALSO  " + also.join("  "), cls: "y" });
    if (id === "cryptogram") rows.push({ t: "A PAGE THAT IS NOT IN THE MAGAZINE.", cls: "conceal" });
    markRead(id, state.depth);
    return rows;
  }

  function markRead(id, depth) {
    if (depth !== "signal" && depth !== "translation") return;
    let read;
    try {
      read = JSON.parse(localStorage.getItem("hall.read") || '{"signal":[],"translation":[]}');
    } catch {
      read = { signal: [], translation: [] };
    }
    if (!read[depth]) read[depth] = [];
    if (!read[depth].includes(id)) {
      read[depth].push(id);
      localStorage.setItem("hall.read", JSON.stringify(read));
    }
  }

  function paintCipher() {
    const lines = [
      "This page is not in the magazine.",
      "Hall padded the folio to hide a word.",
      "In Bacon the two alphabets are faces.",
      "Rosicrucians counted thirty-three.",
      "The lost word was never missing.",
      "You were not meant to read linearly.",
      "Type 562 for the toolbox.",
      "Hold 100 to leave.",
      "Red does nothing here.",
      "Enter 227 if a temple must be rebuilt.",
      "End of transmission.",
    ];
    const rows = [
      { t: "NOT IN THE MAGAZINE", cls: "dh" },
      { t: "biliteral  ·  acrostic  ·  33", cls: "c" },
      { t: "" },
    ];
    lines.forEach((ln) => {
      rows.push({ t: ln[0], rest: ln.slice(1) });
    });
    rows.push({ t: "" });
    rows.push({ t: "THE SIGNIFICANT NUMBER IS THIRTY-THREE", cls: "conceal" });
    return rows;
  }

  function paintEchoes() {
    const rows = [{ t: "ECHOES", cls: "dh" }, { t: "" }];
    (state.catalog?.echoes || []).forEach((e) => {
      rows.push({ t: e.id, cls: "y" });
      wrap(e.summary, COLS, 2).forEach((ln) => rows.push({ t: ln }));
    });
    return rows;
  }

  function paintHour() {
    const h = state.hour || {};
    return [
      { t: "PLANETARY HOUR", cls: "dh" },
      { t: "" },
      { t: `PLANET   ${h.planet || "—"}`, cls: "y" },
      { t: `METAL    ${h.metal || "—"}` },
      { t: `DAY      ${h.day_ruler || "—"}` },
      { t: `PERIOD   ${h.period || "—"}` },
      { t: `CLOCK    ${h.clock || "—"}  ${h.weekday || ""}` },
      { t: "" },
      { t: "Status only. No fifth Workbench colour.", cls: "c" },
    ];
  }

  function paintWho() {
    const rows = [{ t: "WHO'S ON", cls: "dh" }, { t: "" }];
    (state.who?.seers || []).forEach((u) => {
      rows.push({ t: fit(`${u.handle.padEnd(10)} ${u.status}`, COLS) });
    });
    return rows;
  }

  function paint404(p) {
    return [
      { t: "NO PAGE", cls: "dh" },
      { t: "" },
      { t: `P${pad(p)} is not on this magazine.`, cls: "r" },
      { t: "Copied folio pages only.", cls: "c" },
      { t: "HOLD 100 for the index." },
    ];
  }

  function render() {
    const p = state.page;
    $("#hdr").textContent = header(p);
    const m = mag(p);
    let rows;
    if (!m) rows = paint404(p);
    else if (m.kind === "index") rows = paintIndex();
    else if (m.kind === "cipher") rows = paintCipher();
    else if (m.kind === "echoes") rows = paintEchoes();
    else if (m.kind === "hour") rows = paintHour();
    else if (m.kind === "who") rows = paintWho();
    else rows = paintChapter(m.id);

    const pre = $("#page");
    pre.innerHTML = "";
    rows.slice(0, BODY_ROWS).forEach((row) => {
      const line = document.createElement("div");
      if (row.cls) line.className = row.cls;
      if (row.rest != null) {
        const ac = document.createElement("span");
        ac.className = "y";
        ac.textContent = row.t;
        line.appendChild(ac);
        line.appendChild(document.createTextNode(row.rest));
      } else {
        line.textContent = row.t;
      }
      pre.appendChild(line);
    });
    $("#digits").value = pad(p);
    document.body.classList.toggle("reveal", state.reveal);
    const chId = m && m.id;
    $$fastEnable(chId);
  }

  function $$fastEnable(chapterId) {
    const btns = document.querySelectorAll("#fast button");
    btns[0].disabled = !chapterId;
    btns[1].disabled = !chapterId;
    btns[2].disabled = !chapterId;
  }

  function go(n) {
    const p = Number(n);
    if (!Number.isFinite(p) || p < 0 || p > 999) return;
    state.page = p;
    state.reveal = false;
    if (!mag(p) || !mag(p).id) state.depth = "signal";
    history.replaceState(null, "", "#p" + pad(p));
    render();
  }

  function fromHash() {
    const h = location.hash.replace(/^#/, "");
    const m = h.match(/p?(\d{1,3})/i);
    if (m) state.page = Number(m[1]);
  }

  document.querySelectorAll("#fast button").forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.fast;
      if (k === "cyan") return go(100);
      const map = { red: "signal", green: "translation", yellow: "folio" };
      if (map[k]) {
        state.depth = map[k];
        render();
      }
    });
  });

  $("#go").addEventListener("click", () => go($("#digits").value));
  $("#digits").addEventListener("keydown", (e) => {
    if (e.key === "Enter") go($("#digits").value);
  });
  $("#hold").addEventListener("click", () => go(100));
  $("#reveal").addEventListener("click", () => {
    state.reveal = !state.reveal;
    render();
  });

  let buf = "";
  document.addEventListener("keydown", (e) => {
    if (e.target === $("#digits")) return;
    if (e.key === "Enter" || e.key === "#") {
      if (buf) go(buf);
      buf = "";
      return;
    }
    if (e.key === "Backspace") {
      buf = buf.slice(0, -1);
      $("#digits").value = buf || pad(state.page);
      return;
    }
    if (e.key === "*") {
      buf = "";
      return;
    }
    if (/^[0-9]$/.test(e.key)) {
      buf = (buf + e.key).slice(-3);
      $("#digits").value = buf;
      if (buf.length === 3) {
        go(buf);
        buf = "";
      }
    }
    if (e.key === "r" || e.key === "R") {
      state.reveal = !state.reveal;
      render();
    }
  });

  window.addEventListener("hashchange", () => {
    fromHash();
    render();
  });

  fromHash();
  load().then(render).catch((err) => {
    $("#page").textContent = "NO CARRIER\n" + err.message;
  });
  setInterval(() => {
    $("#hdr").textContent = header(state.page);
  }, 1000);
})();
