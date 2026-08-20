/* UNWRITTEN LAW — period clearance node. Hall sysop. No modern agencies. */
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const DEGREES = ["neophyte", "fellowcraft", "adept"];
  const DEPTH_NAME = {
    signal: "EXOTERIC",
    translation: "ACROAMATIC",
    folio: "ADYTUM",
  };

  const state = {
    catalog: null,
    who: null,
    hour: null,
    chapters: {},
    echo: "all",
    selected: null,
    depth: "signal",
    degree: localStorage.getItem("hall.degree") || "neophyte",
    handle: localStorage.getItem("hall.handle") || "GUEST",
  };

  function rankOf(d) { return DEGREES.indexOf(d); }
  function canSee(depth) {
    if (depth === "signal") return true;
    if (depth === "translation") return rankOf(state.degree) >= 1;
    if (depth === "folio") return rankOf(state.degree) >= 2;
    return false;
  }
  function esc(s) {
    return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
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

  function banner() {
    const h = state.hour;
    $("#b-clear").textContent = `CLEARANCE ${state.degree.toUpperCase()}  (${state.handle})`;
    $("#b-hour").textContent = h ? `HOUR OF ${h.planet.toUpperCase()}` : "";
  }

  function renderComps() {
    const echoes = [{ id: "all", name: "ALL SHELVES" }, ...(state.catalog?.echoes || [])];
    $("#comps").innerHTML = echoes.map((e) =>
      `<button data-echo="${esc(e.id)}" class="${state.echo === e.id ? "on" : ""}">${esc(e.id === "all" ? "ALL SHELVES" : e.id)}</button>`
    ).join("");
    $$("#comps [data-echo]").forEach((b) => {
      b.addEventListener("click", () => {
        state.echo = b.dataset.echo;
        if (!state.selected || currentMeta()?.echo !== state.echo && state.echo !== "all") {
          const first = listChapters()[0];
          state.selected = first ? first.id : null;
        }
        renderComps();
        renderDoc();
      });
    });
  }

  function listChapters() {
    return (state.catalog?.chapters || []).filter((c) =>
      state.echo === "all" || c.echo === state.echo
    );
  }
  function currentMeta() {
    return (state.catalog?.chapters || []).find((c) => c.id === state.selected);
  }

  function renderDoc() {
    const box = $("#doc");
    const rows = listChapters();
    const meta = currentMeta();
    if (!meta) {
      box.innerHTML = "<p class='meta'>No scroll in this compartment.</p>";
      return;
    }
    const rec = state.chapters[meta.id];
    const cls = DEPTH_NAME[state.depth];
    let body;
    if (!meta.ready) {
      body = `<p class="denied">NOT COPIED FROM THE FOLIO.\nThe shelf lists it. The copyist has not yet sat with p.${meta.page}.</p>`;
    } else if (!canSee(state.depth)) {
      const need = state.depth === "translation" ? "FELLOWCRAFT" : "ADEPT";
      body = `<p class="denied">THE VEIL HOLDS.\n${cls} requires ${need}.\nThe rite is still taken in the lodge, not at this gate.</p>`;
    } else {
      markRead(meta.id, state.depth);
      let text = "";
      if (state.depth === "signal") {
        text = (rec?.signal || meta.blurb || "")
          .replace(/^.*\.NFO.*$/gm, "").replace(/^=+\s*$/gm, "")
          .replace(/^DEGREE.*$/gm, "").replace(/^SEE ALSO.*$/gm, "").trim();
      } else if (state.depth === "translation") text = rec?.translation || "";
      else text = rec?.folio || "";
      const also = (rec?.see_also || []).slice(0, 6).map((id) => {
        const ch = (state.catalog.chapters || []).find((c) => c.id === id);
        return ch ? `<a href="#" data-open="${esc(id)}">${esc(id)} (p.${ch.page})</a>` : esc(id);
      });
      body = `<div>${esc(text)}</div>` +
        (also.length ? `<div class="also">SEE ALSO  ${also.join(" · ")}</div>` : "");
    }
    const copied = rows.filter((c) => c.ready);
    const index = copied.map((c) =>
      `<a href="#" data-open="${esc(c.id)}"${c.id === meta.id ? " class='on'" : ""}>${esc(c.id)}</a>`
    ).join("  ");
    box.innerHTML = `
      <h2>${esc(meta.title)}</h2>
      <div class="meta">${esc(meta.echo)} · p.${meta.page} · ${cls} · ${meta.ready ? "COPIED" : "SHELF ONLY"}</div>
      ${body}
      <div class="also">COPIED IN COMPARTMENT  ${index || "—"}</div>`;
    box.querySelectorAll("[data-open]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        openDoc(a.dataset.open);
      });
    });
    $$("#depths [data-depth]").forEach((b) => b.classList.toggle("on", b.dataset.depth === state.depth));
  }

  function openDoc(id) {
    const meta = (state.catalog?.chapters || []).find((c) => c.id === id);
    if (!meta) return;
    state.selected = id;
    if (state.echo !== "all" && meta.echo !== state.echo) state.echo = meta.echo;
    renderComps();
    renderDoc();
  }

  $$("#depths [data-depth]").forEach((b) => {
    b.addEventListener("click", () => {
      state.depth = b.dataset.depth;
      renderDoc();
    });
  });

  async function exec(raw) {
    const t = raw.trim();
    if (!t) return;
    const [verb, ...rest] = t.split(/\s+/);
    const arg = rest.join(" ");
    const v = verb.toLowerCase();
    if (v === "help" || v === "?") {
      $("#doc").innerHTML = `<h2>GATE COMMANDS</h2><div class="meta">The rite remains in the lodge.</div><div>list
open &lt;id|page&gt;
exo  |  acro  |  adytum
who  |  hour
lodge  |  ceefax  |  diskmag  |  win95</div>`;
      return;
    }
    if (v === "list") { state.echo = "all"; renderComps(); renderDoc(); return; }
    if (v === "exo" || v === "exoteric") { state.depth = "signal"; renderDoc(); return; }
    if (v === "acro" || v === "acroamatic") { state.depth = "translation"; renderDoc(); return; }
    if (v === "adytum" || v === "inner") { state.depth = "folio"; renderDoc(); return; }
    if (v === "who") {
      const lines = (state.who?.seers || []).map((u) => `${u.handle.padEnd(10)} ${u.status}`).join("\n");
      $("#doc").innerHTML = `<h2>WHO IS IN THE LIBRARY</h2><div>${esc(lines)}</div>`;
      return;
    }
    if (v === "hour") {
      const h = state.hour || {};
      $("#doc").innerHTML = `<h2>HOUR</h2><div>${esc(h.planet)} · ${esc(h.metal)} · ${esc(h.period)}</div>`;
      return;
    }
    if (v === "lodge" || v === "bbs") { location.href = "/"; return; }
    if (v === "ceefax") { location.href = "/ceefax/"; return; }
    if (v === "diskmag") { location.href = "/diskmag/"; return; }
    if (v === "win95" || v === "windows") { location.href = "/win95/"; return; }
    if (v === "open" || v === "read" || v === "show") {
      const q = arg.toLowerCase();
      const ch = (state.catalog?.chapters || []).find((c) =>
        c.id === q || String(c.page) === q || String(c.rank) === q || c.id.startsWith(q)
      );
      if (ch) openDoc(ch.id);
      return;
    }
    const asEcho = (state.catalog?.echoes || []).find((e) => e.id.toLowerCase() === t.toLowerCase());
    if (asEcho) {
      state.echo = asEcho.id;
      const first = listChapters().find((c) => c.ready) || listChapters()[0];
      state.selected = first?.id || null;
      renderComps();
      renderDoc();
      return;
    }
    const ch = (state.catalog?.chapters || []).find((c) =>
      c.id === t.toLowerCase() || String(c.page) === t
    );
    if (ch) openDoc(ch.id);
  }

  $("#cmd").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const v = $("#cmd").value;
      $("#cmd").value = "";
      Promise.resolve(exec(v));
    }
  });

  const bootLines = [
    "THE LESSER GATE",
    "Station established MCMXXVIII",
    "Sysop: Manly P. Hall",
    "",
    "This text was always public.",
    "The veil was the method.",
    "",
    "Exoteric     — the written summary",
    "Acroamatic   — the key, mouth to ear",
    "Adytum       — the inner room",
    "",
    "Patrons: the lodge, Eleusis, the palace library.",
    "No modern service is named here.",
    "",
    `Handle ${state.handle}`,
    `Clearance ${state.degree.toUpperCase()}`,
  ];

  function typeBoot() {
    return new Promise((resolve) => {
      const log = $("#boot-log");
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        log.textContent = bootLines.join("\n");
        return resolve();
      }
      let i = 0;
      let acc = "";
      const tick = () => {
        if (i >= bootLines.length) return resolve();
        acc += bootLines[i] + "\n";
        log.textContent = acc;
        i += 1;
        setTimeout(tick, 70);
      };
      tick();
    });
  }

  async function enter() {
    $("#boot").hidden = true;
    $("#node").hidden = false;
    $("#cmd").focus();
    const [catalog, who, hour] = await Promise.all([
      api("/api/catalog"),
      api("/api/who"),
      api("/api/hour"),
    ]);
    state.catalog = catalog;
    state.who = who;
    state.hour = hour;
    const copied = (catalog.chapters || []).filter((c) => c.ready);
    await Promise.all(copied.map(async (c) => {
      try { state.chapters[c.id] = await api("/api/chapter?id=" + encodeURIComponent(c.id)); }
      catch { /* leave unread */ }
    }));
    state.selected = copied[0]?.id || catalog.chapters[0]?.id;
    banner();
    renderComps();
    renderDoc();
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !$("#boot").hidden) enter();
  });
  $("#boot").addEventListener("click", () => { if (!$("#boot").hidden) enter(); });

  typeBoot().then(() => setTimeout(() => { if (!$("#boot").hidden) enter(); }, 900));
})();
