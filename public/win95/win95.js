/* HALL 95 — Windows 95 shell over the Hall of Ages folio */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const DEGREES = ["neophyte", "fellowcraft", "adept"];

  const state = {
    catalog: null,
    who: null,
    hour: null,
    guide: null,
    plates: null,
    chapters: {},
    echo: "all",
    selected: null,
    depth: "signal",
    plateId: null,
    guideNode: "mercury",
    z: 20,
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
    return String(s ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
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

  function clock() {
    const d = new Date();
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const am = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    $("#clock").textContent = `${days[d.getDay()]} ${h}:${m} ${am}`;
    const hr = state.hour;
    $("#hour-chip").textContent = hr ? hr.planet : "";
  }
  setInterval(clock, 1000);

  const WIN_TITLE = {
    explorer: "My Computer",
    wordpad: "WordPad",
    imaging: "Imaging",
    help: "Windows Help",
    calc: "Calculator",
    find: "Find: All Files",
    inbox: "Inbox",
    about: "About HALL 95",
    recycle: "Recycle Bin",
    run: "Run",
    shutdown: "Shut Down Windows",
  };
  const WIN_EL = {
    explorer: "win-explorer",
    wordpad: "win-wordpad",
    imaging: "win-imaging",
    help: "win-help",
    calc: "win-calc",
    find: "win-find",
    inbox: "win-inbox",
    about: "win-about",
    recycle: "win-recycle",
    run: "dlg-run",
    shutdown: "dlg-shutdown",
  };

  function elFor(id) { return document.getElementById(WIN_EL[id] || ("win-" + id)); }

  function focusWin(el) {
    if (!el) return;
    $$(".win").forEach((w) => w.classList.remove("active"));
    el.classList.add("active");
    el.style.zIndex = String(++state.z);
    renderTasks();
  }
  function isOpen(id) {
    const el = elFor(id);
    return el && !el.hidden && !el.classList.contains("min");
  }
  function openWin(id) {
    const el = elFor(id);
    if (!el) return;
    el.hidden = false;
    el.classList.remove("min");
    if (el.dataset.zoomed !== "1") {
      /* keep geometry */
    }
    focusWin(el);
    hideStart();
    if (id === "explorer") renderExplorer();
    if (id === "wordpad") renderPad();
    if (id === "imaging") renderImaging();
    if (id === "help") renderHelp(state.guideNode);
    if (id === "inbox") renderInbox();
    if (id === "about") renderAbout();
    if (id === "run") setTimeout(() => $("#run-q")?.focus(), 0);
    renderTasks();
  }
  function closeWin(el) {
    el.hidden = true;
    el.classList.remove("min", "active");
    delete el.dataset.zoomed;
    renderTasks();
  }
  function minWin(el) {
    el.classList.add("min");
    el.hidden = true;
    renderTasks();
  }
  function maxWin(el) {
    if (el.dataset.zoomed === "1") {
      el.style.left = el.dataset.l;
      el.style.top = el.dataset.t;
      el.style.width = el.dataset.w;
      el.style.height = el.dataset.h;
      delete el.dataset.zoomed;
    } else {
      el.dataset.l = el.style.left;
      el.dataset.t = el.style.top;
      el.dataset.w = el.style.width;
      el.dataset.h = el.style.height;
      el.dataset.zoomed = "1";
      el.style.left = "4px";
      el.style.top = "4px";
      el.style.width = "calc(100% - 8px)";
      el.style.height = "calc(100% - 8px)";
    }
  }

  function renderTasks() {
    const box = $("#tasks");
    const open = $$(".win").filter((w) => !w.hidden || w.classList.contains("min"));
    box.innerHTML = open.map((w) => {
      const id = Object.keys(WIN_EL).find((k) => WIN_EL[k] === w.id) || w.id;
      const title = w.querySelector(".caption")?.textContent || WIN_TITLE[id] || id;
      const on = w.classList.contains("active") && !w.hidden ? " on" : "";
      return `<button type="button" data-task="${esc(id)}" class="${on}">${esc(title)}</button>`;
    }).join("");
    box.querySelectorAll("[data-task]").forEach((b) => {
      b.addEventListener("click", () => {
        const el = elFor(b.dataset.task);
        if (!el) return;
        if (el.hidden && el.classList.contains("min")) {
          el.hidden = false;
          el.classList.remove("min");
        }
        focusWin(el);
      });
    });
  }

  function wireWindows() {
    $$(".win").forEach((win) => {
      win.addEventListener("pointerdown", () => focusWin(win));
      const bar = $(".titlebar", win);
      let drag = null;
      bar.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".cap")) return;
        const r = win.getBoundingClientRect();
        drag = { x: e.clientX - r.left, y: e.clientY - r.top };
        bar.setPointerCapture(e.pointerId);
        focusWin(win);
      });
      bar.addEventListener("pointermove", (e) => {
        if (!drag || win.dataset.zoomed === "1") return;
        win.style.left = Math.max(0, e.clientX - drag.x) + "px";
        win.style.top = Math.max(0, e.clientY - drag.y) + "px";
      });
      bar.addEventListener("pointerup", () => { drag = null; });
      win.querySelectorAll(".cap, [data-act]").forEach((b) => {
        b.addEventListener("click", (e) => {
          const act = b.dataset.act;
          if (act === "close") closeWin(win);
          if (act === "min") minWin(win);
          if (act === "max") maxWin(win);
          e.stopPropagation();
        });
      });
    });
  }

  function hideStart() {
    $("#start-menu").hidden = true;
    $("#start-btn").classList.remove("on");
  }
  function toggleStart() {
    const sm = $("#start-menu");
    sm.hidden = !sm.hidden;
    $("#start-btn").classList.toggle("on", !sm.hidden);
  }

  $$(".desk-icon").forEach((ic) => {
    ic.addEventListener("click", () => {
      $$(".desk-icon").forEach((x) => x.classList.remove("selected"));
      ic.classList.add("selected");
    });
    ic.addEventListener("dblclick", () => {
      if (ic.dataset.href) { location.href = ic.dataset.href; return; }
      if (ic.dataset.echo) state.echo = ic.dataset.echo;
      openWin(ic.dataset.open);
    });
  });

  $("#start-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleStart();
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#start-menu") && !e.target.closest("#start-btn")) hideStart();
  });
  $("#start-menu").addEventListener("click", (e) => {
    const b = e.target.closest("[data-open]");
    if (!b) return;
    const id = b.dataset.open;
    if (id === "run") openWin("run");
    else if (id === "shutdown") openWin("shutdown");
    else openWin(id);
  });

  function listChapters() {
    return (state.catalog?.chapters || []).filter((c) =>
      state.echo === "all" || c.echo === state.echo
    );
  }
  function findMeta(q) {
    const n = String(q || "").toLowerCase();
    return (state.catalog?.chapters || []).find((c) =>
      c.id === n ||
      String(c.rank) === n ||
      String(c.page) === n ||
      (c.title && c.title.toLowerCase() === n) ||
      c.id.startsWith(n)
    );
  }

  function renderExplorer() {
    const echoes = [{ id: "all", name: "C:\\HALL" }, ...(state.catalog?.echoes || [])];
    $("#tree").innerHTML = echoes.map((e) =>
      `<button type="button" data-echo="${esc(e.id)}" class="${state.echo === e.id ? "on" : ""}">${esc(e.id === "all" ? "C:\\HALL" : e.id)}</button>`
    ).join("");
    $$("#tree [data-echo]").forEach((b) => {
      b.addEventListener("click", () => {
        state.echo = b.dataset.echo;
        renderExplorer();
      });
    });
    const rows = listChapters();
    $("#list").innerHTML = rows.map((c) => {
      const ext = c.ready ? "NFO" : "TBA";
      const on = state.selected === c.id ? " on" : "";
      return `<div class="row${on}" data-id="${esc(c.id)}" tabindex="0">
        <span>${esc(c.id.toUpperCase())}.${ext}</span>
        <span>${esc(c.echo.split(".")[0])}</span>
        <span>p.${c.page}</span>
      </div>`;
    }).join("");
    $$("#list .row").forEach((row) => {
      row.addEventListener("click", () => {
        state.selected = row.dataset.id;
        renderExplorer();
      });
      row.addEventListener("dblclick", () => openPad(row.dataset.id));
    });
    $("#addr").value = state.echo === "all" ? "C:\\HALL\\" : `C:\\HALL\\${state.echo}\\`;
    $("#ex-status").textContent = `${rows.length} object(s)`;
    const cap = $("#win-explorer .caption");
    cap.textContent = state.echo === "all" ? "My Computer" : state.echo;
  }

  $("[data-up]")?.addEventListener("click", () => {
    state.echo = "all";
    renderExplorer();
  });

  async function openPad(id) {
    const rec = state.chapters[id] || await api("/api/chapter?id=" + encodeURIComponent(id));
    state.chapters[id] = rec;
    state.selected = rec.id;
    if (!canSee(state.depth)) state.depth = "signal";
    markRead(rec.id, "signal");
    openWin("wordpad");
    renderPad();
  }

  function renderPad() {
    const rec = state.chapters[state.selected];
    $$(".depths [data-depth]").forEach((b) => b.classList.toggle("on", b.dataset.depth === state.depth));
    const cap = $("#win-wordpad .caption");
    const meta = $("#pad-meta");
    const pad = $("#pad");
    const rite = $("#rite");
    if (!rec) {
      cap.textContent = "WordPad";
      meta.textContent = "Open a document from My Computer.";
      pad.textContent = "";
      rite.hidden = true;
      return;
    }
    const ext = state.depth === "signal" ? "NFO" : state.depth === "translation" ? "TXT" : "FOL";
    cap.textContent = `${rec.id.toUpperCase()}.${ext} - WordPad`;
    meta.textContent = `${rec.title}  ·  ${rec.echo}  ·  p.${rec.page}  ·  ${state.degree.toUpperCase()}`;
    if (!canSee(state.depth)) {
      pad.classList.add("locked");
      const need = state.depth === "translation" ? "FELLOWCRAFT" : "ADEPT";
      pad.textContent = `Access is denied.\nThis document requires ${need}.\nRead three files at the previous depth in the lodge, then answer a rite.`;
      rite.hidden = true;
      return;
    }
    pad.classList.remove("locked");
    let text = "";
    if (state.depth === "signal") text = rec.signal || rec.blurb || "";
    else if (state.depth === "translation") {
      text = rec.translation || "Translation not copied.";
      markRead(rec.id, "translation");
    } else text = rec.folio || "Folio not copied.";
    const also = (rec.see_also || []).map((id) =>
      `<a href="#" data-see="${esc(id)}">${esc(id)}</a>`
    ).join(" · ");
    pad.innerHTML = esc(text) + (also ? `\n\nSEE ALSO  ${also}` : "");
    pad.querySelectorAll("[data-see]").forEach((a) => {
      a.addEventListener("click", (e) => { e.preventDefault(); openPad(a.dataset.see); });
    });
    if (rec.rite?.prompt && rec.ready) {
      const passed = JSON.parse(localStorage.getItem("hall.rites") || "[]").includes(rec.id);
      rite.hidden = false;
      rite.innerHTML = passed
        ? `<b>Rite passed.</b>`
        : `<b>Rite.</b> ${esc(rec.rite.prompt)}<br>
           <input id="rite-q" spellcheck="false"> <button type="button" id="rite-go">OK</button>`;
      $("#rite-go")?.addEventListener("click", submitRite);
      $("#rite-q")?.addEventListener("keydown", (e) => { if (e.key === "Enter") submitRite(); });
    } else rite.hidden = true;
    $("#pad-status").textContent = `${ext}  ·  ${state.handle}`;
  }

  function submitRite() {
    const rec = state.chapters[state.selected];
    if (!rec?.rite) return;
    const ans = ($("#rite-q")?.value || "").trim().toLowerCase();
    if (!ans) return;
    const ok = (rec.rite.accept || []).some((a) =>
      ans.includes(String(a).toLowerCase()) || String(a).toLowerCase().includes(ans)
    );
    if (!ok) {
      padAlert("The initiator does not move the wand.");
      return;
    }
    const rites = JSON.parse(localStorage.getItem("hall.rites") || "[]");
    if (!rites.includes(rec.id)) rites.push(rec.id);
    localStorage.setItem("hall.rites", JSON.stringify(rites));
    maybePromote();
    renderPad();
  }
  function padAlert(msg) { $("#pad-status").textContent = msg; }

  function maybePromote() {
    let read;
    try { read = JSON.parse(localStorage.getItem("hall.read") || '{"signal":[],"translation":[]}'); }
    catch { read = { signal: [], translation: [] }; }
    const rites = JSON.parse(localStorage.getItem("hall.rites") || "[]");
    if (state.degree === "neophyte" && (read.signal || []).length >= 3 && rites.length >= 1) {
      state.degree = "fellowcraft";
      localStorage.setItem("hall.degree", "fellowcraft");
      $("#pad-status").textContent = "Raised Fellowcraft. TXT documents unlock.";
    } else if (state.degree === "fellowcraft" && (read.translation || []).length >= 3 && rites.length >= 2) {
      state.degree = "adept";
      localStorage.setItem("hall.degree", "adept");
      $("#pad-status").textContent = "Raised Adept. FOL documents unlock.";
    }
  }

  $$(".depths [data-depth]").forEach((b) => {
    b.addEventListener("click", () => {
      state.depth = b.dataset.depth;
      renderPad();
    });
  });

  function renderImaging() {
    const plates = state.plates?.plates || [];
    $("#img-list").innerHTML = plates.map((p) =>
      `<div class="row${state.plateId === p.id ? " on" : ""}" data-id="${esc(p.id)}">
        <span>${esc(p.title)}</span><span>p.${p.pdf_page}</span><span></span>
      </div>`
    ).join("");
    $$("#img-list .row").forEach((row) => {
      row.addEventListener("click", () => {
        state.plateId = row.dataset.id;
        renderImaging();
      });
    });
    const p = plates.find((x) => x.id === state.plateId) || plates[0];
    if (!p) return;
    state.plateId = p.id;
    const img = $("#img-full");
    img.src = p.src || "/plates/full/" + p.file;
    img.alt = p.title;
    const rank = rankOf(state.degree);
    let cap = `<b>${esc(p.title)}</b> — ${esc(p.legend || "")}`;
    if (rank >= 1 && p.caption) cap += ` ${esc(p.caption)}`;
    if (rank >= 2) cap += ` Folio p.${p.pdf_page}.`;
    if (p.chapter) cap += ` <a href="#" data-ch="${esc(p.chapter)}">Open ${esc(p.chapter)}</a>`;
    $("#img-cap").innerHTML = cap;
    $("#img-cap [data-ch]")?.addEventListener("click", (e) => {
      e.preventDefault();
      openPad(e.currentTarget.dataset.ch);
    });
    $("#img-status").textContent = `${p.id}  ·  ${plates.length} pictures`;
    $("#win-imaging .caption").textContent = p.title + " - Imaging";
  }

  function guideNode(id) {
    return (state.guide?.nodes || []).find((n) => n.id === id) || state.guide?.nodes?.[0];
  }
  function renderHelp(id) {
    const nodes = state.guide?.nodes || [];
    const node = guideNode(id || state.guideNode);
    $("#help-toc").innerHTML = nodes.map((n) =>
      `<button type="button" data-g="${esc(n.id)}" class="${node && n.id === node.id ? "on" : ""}">${esc(n.title)}</button>`
    ).join("");
    $$("#help-toc [data-g]").forEach((b) => {
      b.addEventListener("click", () => renderHelp(b.dataset.g));
    });
    if (!node) {
      $("#help-body").textContent = "Help file not found.";
      return;
    }
    state.guideNode = node.id;
    const jumps = (node.links || []).map((ln) =>
      `<a href="#" data-to="${esc(ln.to)}">${esc(ln.word)}</a>`
    ).join("  ");
    const ch = node.chapter ? ` <a href="#" data-ch="${esc(node.chapter)}">Open ${esc(node.chapter)}</a>` : "";
    $("#help-body").innerHTML = `<h3 style="margin:0 0 8px">${esc(node.title)}</h3><p>${esc(node.body)}</p><p>${jumps}${ch}</p>`;
    $$("#help-body [data-to]").forEach((a) => {
      a.addEventListener("click", (e) => { e.preventDefault(); renderHelp(a.dataset.to); });
    });
    $$("#help-body [data-ch]").forEach((a) => {
      a.addEventListener("click", (e) => { e.preventDefault(); openPad(a.dataset.ch); });
    });
  }
  $("#help-contents")?.addEventListener("click", () => renderHelp(state.guide?.start || "mercury"));
  $("#help-back")?.addEventListener("click", () => renderHelp(state.guide?.start || "mercury"));

  $("#calc-go").addEventListener("click", runCalc);
  $("#calc-in").addEventListener("keydown", (e) => { if (e.key === "Enter") runCalc(); });
  async function runCalc() {
    const q = $("#calc-in").value.trim();
    if (!q) return;
    const rec = await api("/api/gematria?q=" + encodeURIComponent(q));
    const extra = (rec.hits || []).slice(0, 4).map((h) => h.word).join(", ");
    $("#calc-out").textContent = `${rec.ordinal}  (r${rec.reduction})`;
    $(".calc .hint").textContent = extra ? extra : rec.note;
  }

  $("#find-go").addEventListener("click", runFind);
  $("#find-q").addEventListener("keydown", (e) => { if (e.key === "Enter") runFind(); });
  async function runFind() {
    const q = $("#find-q").value.trim();
    if (!q) return;
    const rec = await api("/api/xref?q=" + encodeURIComponent(q));
    $("#find-out").innerHTML = (rec.hits || []).map((h) =>
      `<div class="row" data-id="${esc(h.id)}"><span>${esc(h.title)}</span><span>${esc(h.echo || "")}</span><span></span></div>`
    ).join("") || `<div class="row"><span>No files found.</span></div>`;
    $$("#find-out .row[data-id]").forEach((row) => {
      row.addEventListener("dblclick", () => openPad(row.dataset.id));
    });
  }

  function renderInbox() {
    const seers = state.who?.seers || [];
    $("#inbox-body").innerHTML =
      `<p><b>Inbox — idle seers</b></p>` +
      seers.map((u) => `<div>${esc(u.handle)}    ${esc(u.status)}    idle ${esc(u.idle)}</div>`).join("") +
      `<p>Mail is not a door on this node. The lodge keeps the rites.</p>`;
  }

  function renderAbout() {
    const s = state.hour;
    $("#about-body").innerHTML = `
      <p><b>HALL 95</b></p>
      <p>Manly P. Hall, <i>The Secret Teachings of All Ages</i>, 1928 (no renewal). Public domain.</p>
      <p>This product is licensed to:<br>
      <b>${esc(state.handle)}</b><br>
      ${state.degree.toUpperCase()}</p>
      <p>Physical memory available: 16 MB<br>
      Hour of ${esc(s?.planet || "—")} (${esc(s?.metal || "")})</p>
      <p>Homage to Windows 95. Not a Microsoft product.<br>
      Codex keeps the Hebrew desk. This node <i>is</i> a board.</p>
      <div class="btns"><button type="button" data-act="close">OK</button></div>`;
    $("#about-body [data-act=close]")?.addEventListener("click", () => closeWin($("#win-about")));
  }

  $("#run-ok").addEventListener("click", () => {
    const q = $("#run-q").value.trim();
    hideStart();
    closeWin($("#dlg-run"));
    if (!q) return;
    const low = q.toLowerCase();
    if (low === "calc" || low === "calculator") return openWin("calc");
    if (low === "help") return openWin("help");
    if (low === "imaging" || low === "pbrush") return openWin("imaging");
    const meta = findMeta(q);
    if (meta) return openPad(meta.id);
    openWin("find");
    $("#find-q").value = q;
    runFind();
  });
  $("#run-q").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#run-ok").click();
  });

  $("#sd-ok").addEventListener("click", () => {
    const v = $$("input[name=sd]").find((r) => r.checked)?.value;
    closeWin($("#dlg-shutdown"));
    if (v === "restart") location.reload();
    else if (v === "lodge") location.href = "/";
    else {
      $("#desktop").classList.remove("on");
      $("#taskbar").style.display = "none";
      hideStart();
      $("#safe").hidden = false;
    }
  });

  function fillPrograms() {
    const box = $("#sm-programs");
    const acc = `<button type="button" data-open="wordpad">WordPad</button>
      <button type="button" data-open="imaging">Imaging</button>
      <button type="button" data-open="calc">Calculator</button>
      <button type="button" data-open="explorer">Windows Explorer</button>
      <hr>`;
    const echoes = (state.catalog?.echoes || []).map((e) =>
      `<button type="button" data-echo="${esc(e.id)}">${esc(e.name)}</button>`
    ).join("");
    box.innerHTML = acc + echoes;
    box.querySelectorAll("[data-echo]").forEach((b) => {
      b.addEventListener("click", () => {
        state.echo = b.dataset.echo;
        openWin("explorer");
      });
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "F1") { e.preventDefault(); openWin("help"); }
    if (e.key === "Escape") {
      if (!$("#start-menu").hidden) { hideStart(); return; }
      const top = [...$$(".win")].filter((w) => !w.hidden).sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
      if (top) closeWin(top);
    }
  });

  async function bootDesktop() {
    if ($("#boot").dataset.done) return;
    $("#boot").dataset.done = "1";
    $("#boot").style.display = "none";
    $("#desktop").classList.add("on");
    clock();
    try {
      const [catalog, who, hour, guide, plates] = await Promise.all([
        api("/api/catalog"),
        api("/api/who"),
        api("/api/hour"),
        api("/api/guide"),
        api("/api/plates"),
      ]);
      state.catalog = catalog;
      state.who = who;
      state.hour = hour;
      state.guide = guide;
      state.plates = plates;
      clock();
      fillPrograms();
      openWin("explorer");
    } catch (err) {
      $("#ex-status").textContent = "Network error: " + err.message;
      openWin("explorer");
    }
  }

  wireWindows();
  $("#skip-boot").addEventListener("click", bootDesktop);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !$("#desktop").classList.contains("on")) bootDesktop();
  });
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(bootDesktop, reduce ? 0 : 900);
})();
