/* HALL 1.3 — Hall of Ages BBS on Workbench chrome */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const DEGREES = ["neophyte", "fellowcraft", "adept"];

  const state = {
    catalog: null,
    who: null,
    hour: null,
    status: null,
    guide: null,
    guideNode: "mercury",
    plates: null,
    plateId: null,
    hotspotId: null,
    plateEcho: "all",
    selected: null,
    chapter: null,
    depth: "signal",
    echo: "all",
    history: [],
    histIdx: -1,
    z: 20,
    busy: 0,
    handle: localStorage.getItem("hall.handle") || "GUEST",
    degree: localStorage.getItem("hall.degree") || "neophyte",
    read: loadRead(),
    rites: JSON.parse(localStorage.getItem("hall.rites") || "[]"),
  };

  function loadRead() {
    try {
      return JSON.parse(localStorage.getItem("hall.read") || '{"signal":[],"translation":[]}');
    } catch {
      return { signal: [], translation: [] };
    }
  }
  function saveRead() {
    localStorage.setItem("hall.read", JSON.stringify(state.read));
    localStorage.setItem("hall.degree", state.degree);
    localStorage.setItem("hall.handle", state.handle);
    localStorage.setItem("hall.rites", JSON.stringify(state.rites));
  }

  const pointer = $("#pointer");
  document.addEventListener("pointermove", (e) => {
    pointer.style.left = e.clientX + "px";
    pointer.style.top = e.clientY + "px";
  });

  function busy(on) {
    state.busy += on ? 1 : -1;
    if (state.busy < 0) state.busy = 0;
    document.body.classList.toggle("is-busy", state.busy > 0);
    $("#led").classList.toggle("on", state.busy > 0);
  }

  async function api(path) {
    busy(true);
    try {
      const r = await fetch(path);
      if (!r.ok) throw new Error(r.status + " " + r.statusText);
      return await r.json();
    } finally {
      busy(false);
    }
  }

  function clock() {
    const d = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const pad = (n) => String(n).padStart(2, "0");
    $("#clock").textContent =
      `${days[d.getDay()]} ${pad(d.getDate())}-${mon[d.getMonth()]}-${String(d.getFullYear()).slice(2)}  ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  setInterval(clock, 1000);
  clock();

  const bootLines = [
    "HALL KICKSTART  1.3  (40.068)",
    "A1200-class mystery school",
    "",
    "Copyright 1928  Manly P. Hall  SYS:Hall",
    "Not affiliated with Commodore-Amiga, Inc.",
    "",
    "Memory test ........ 8192K OK",
    "ROM checksum ....... OK",
    "CIA / custom chips .. OK",
    "",
    "ATDT 1928",
    "CONNECT 2400",
    "Reading  SECRET.OS",
    "Mounting DH0:Files  DH1:Scroll  DH2:Guide  DH3:Plates  NUM:Door",
    "The veil of the Temple was rent from top to bottom.",
  ];

  function typeBoot() {
    return new Promise((resolve) => {
      const rom = $("#boot .rom");
      const bar = $("#boot .bar > i");
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        rom.textContent = bootLines.join("\n");
        bar.style.width = "100%";
        return resolve();
      }
      let i = 0;
      let acc = "";
      const tick = () => {
        if (i >= bootLines.length) return resolve();
        acc += bootLines[i] + "\n";
        rom.textContent = acc;
        bar.style.width = Math.round(((i + 1) / bootLines.length) * 100) + "%";
        i += 1;
        setTimeout(tick, i < 6 ? 70 : 110);
      };
      tick();
    });
  }

  async function finishBoot() {
    if ($("#boot").dataset.done) return;
    $("#boot").dataset.done = "1";
    $("#boot").style.display = "none";
    $("#workbench").classList.add("on");
    openWin("cli");
    openWin("files");
    termPrint(banner(), "ora");
    termPrint("Type  help  — or double-click FILES. Three depths. One folio.", "dim");
    $("#cmdline").focus();
    try {
      await refreshAll();
    } catch (err) {
      termPrint("NET: " + err.message, "err");
    }
  }

  function openWin(id) {
    const el = document.getElementById("win-" + id);
    if (!el) return;
    el.hidden = false;
    focusWin(el);
    if (id === "cli") setTimeout(() => $("#cmdline").focus(), 0);
  }
  function closeWin(el) { el.hidden = true; }
  function focusWin(el) {
    $$(".win").forEach((w) => w.classList.remove("active"));
    el.classList.add("active");
    el.style.zIndex = String(++state.z);
  }

  function wireWindows() {
    $$(".win").forEach((win) => {
      win.addEventListener("pointerdown", () => focusWin(win));
      const bar = $(".titlebar", win);
      let drag = null;
      bar.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".gadget")) return;
        const r = win.getBoundingClientRect();
        drag = { x: e.clientX - r.left, y: e.clientY - r.top };
        bar.setPointerCapture(e.pointerId);
      });
      bar.addEventListener("pointermove", (e) => {
        if (!drag) return;
        win.style.left = Math.max(0, e.clientX - drag.x) + "px";
        win.style.top = Math.max(20, e.clientY - drag.y) + "px";
      });
      bar.addEventListener("pointerup", () => { drag = null; });
      $(".gadget.close", win)?.addEventListener("click", () => closeWin(win));
      $(".gadget.depth", win)?.addEventListener("click", () => {
        win.style.zIndex = "1";
        win.classList.remove("active");
      });
      $(".gadget.zoom", win)?.addEventListener("click", () => {
        if (win.dataset.zoomed) {
          win.style.left = win.dataset.l;
          win.style.top = win.dataset.t;
          win.style.width = win.dataset.w;
          win.style.height = win.dataset.h;
          delete win.dataset.zoomed;
        } else {
          win.dataset.l = win.style.left;
          win.dataset.t = win.style.top;
          win.dataset.w = win.style.width;
          win.dataset.h = win.style.height;
          win.dataset.zoomed = "1";
          win.style.left = "8px";
          win.style.top = "28px";
          win.style.width = "calc(100% - 16px)";
          win.style.height = "calc(100% - 50px)";
        }
      });
      const rz = $(".resize", win);
      if (rz) {
        let rs = null;
        rz.addEventListener("pointerdown", (e) => {
          e.stopPropagation();
          const r = win.getBoundingClientRect();
          rs = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
          rz.setPointerCapture(e.pointerId);
        });
        rz.addEventListener("pointermove", (e) => {
          if (!rs) return;
          win.style.width = Math.max(280, rs.w + (e.clientX - rs.x)) + "px";
          win.style.height = Math.max(160, rs.h + (e.clientY - rs.y)) + "px";
        });
        rz.addEventListener("pointerup", () => { rs = null; });
      }
    });
  }

  $$(".icon").forEach((ic) => {
    ic.addEventListener("click", () => {
      $$(".icon").forEach((x) => x.classList.remove("selected"));
      ic.classList.add("selected");
    });
    ic.addEventListener("dblclick", () => {
      if (ic.dataset.href) { location.href = ic.dataset.href; return; }
      openWin(ic.dataset.open);
      if (ic.dataset.open === "guide") renderGuide(state.guideNode);
      if (ic.dataset.open === "plates") renderPlates();
    });
    ic.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (ic.dataset.href) { location.href = ic.dataset.href; return; }
        openWin(ic.dataset.open);
        if (ic.dataset.open === "guide") renderGuide(state.guideNode);
        if (ic.dataset.open === "plates") renderPlates();
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "F1") { e.preventDefault(); openWin("cli"); termExec("help"); }
    if (e.key === "F2") { e.preventDefault(); openWin("files"); }
    if (e.key === "F3") { e.preventDefault(); openWin("scroll"); }
    if (e.key === "F4") { e.preventDefault(); openWin("xref"); }
    if (e.key === "F5") { e.preventDefault(); openWin("door"); }
    if (e.key === "F6") { e.preventDefault(); openWin("guide"); renderGuide(state.guideNode); }
    if (e.key === "F7") { e.preventDefault(); location.href = "/ceefax/"; }
    if (e.key === "F8") { e.preventDefault(); location.href = "/diskmag/"; }
    if (e.key === "F9") { e.preventDefault(); location.href = "/scif/"; }
    if (e.key === "F10") { e.preventDefault(); openWin("plates"); renderPlates(); }
    if (e.key === "Escape") {
      const top = [...$$(".win")].filter((w) => !w.hidden).sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
      if (top && document.activeElement?.id !== "cmdline") closeWin(top);
    }
  });

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  function rankOf(deg) {
    return DEGREES.indexOf(deg);
  }
  function canSee(depth) {
    if (depth === "signal") return true;
    if (depth === "translation") return rankOf(state.degree) >= 1;
    if (depth === "folio") return rankOf(state.degree) >= 2;
    return false;
  }

  function findMeta(q) {
    const n = String(q || "").toLowerCase();
    return (state.catalog?.chapters || []).find((c) =>
      c.id === n ||
      String(c.rank) === n ||
      (c.title && c.title.toLowerCase() === n) ||
      (c.title && c.title.toLowerCase().includes(n)) ||
      c.id.startsWith(n)
    );
  }

  function renderHour() {
    const h = state.hour;
    if (!h) return;
    $("#hour-pill").textContent = `${h.planet.toUpperCase()} ${h.metal}`;
  }

  function renderFiles() {
    const box = $("#file-list");
    if (!state.catalog) {
      box.innerHTML = "<p class='dim'>Mounting DH0: …</p>";
      return;
    }
    const rows = (state.catalog.chapters || []).filter((c) =>
      state.echo === "all" || c.echo === state.echo
    );
    const copied = state.catalog.copied ?? rows.filter((c) => c.ready).length;
    $("#file-src").textContent = `${copied} copied / ${state.catalog.chapters.length}  ${state.degree.toUpperCase()}`;
    box.innerHTML = rows.map((c) => {
      const on = state.selected === c.id ? " on" : "";
      const flag = c.ready ? "NFO" : "---";
      return `<div class="shelf-row${on}" data-id="${esc(c.id)}" tabindex="0">
        <div class="rk">${String(c.rank).padStart(2, "0")}</div>
        <div class="who">
          <div class="nm">${esc(c.id.toUpperCase())}.${flag === "NFO" ? "NFO" : "TBA"}</div>
          <div class="sub">${esc(c.title)}</div>
        </div>
        <div class="attr">${esc(c.echo.split(".")[0])}</div>
      </div>`;
    }).join("");
    box.querySelectorAll(".shelf-row").forEach((row) => {
      row.addEventListener("click", () => selectChapter(row.dataset.id));
      row.addEventListener("dblclick", () => { selectChapter(row.dataset.id); openScroll(row.dataset.id); });
      row.addEventListener("keydown", (e) => { if (e.key === "Enter") openScroll(row.dataset.id); });
    });
  }

  function renderEchoFilters() {
    const box = $("#echo-filters");
    if (!state.catalog) return;
    const echoes = [{ id: "all", name: "ALL" }, ...(state.catalog.echoes || [])];
    box.innerHTML = echoes.map((e) =>
      `<button data-echo="${esc(e.id)}" class="${state.echo === e.id ? "on" : ""}">${esc(e.id === "all" ? "ALL" : e.id)}</button>`
    ).join("");
    box.querySelectorAll("[data-echo]").forEach((b) => {
      b.addEventListener("click", () => {
        state.echo = b.dataset.echo;
        renderEchoFilters();
        renderFiles();
      });
    });
  }

  function selectChapter(id) {
    state.selected = id;
    renderFiles();
  }

  async function openScroll(id) {
    const rec = await api("/api/chapter?id=" + encodeURIComponent(id));
    state.chapter = rec;
    state.selected = rec.id;
    if (!canSee(state.depth)) state.depth = "signal";
    renderFiles();
    renderScroll();
    markRead(rec.id, "signal");
    openWin("scroll");
  }

  function markRead(id, depth) {
    if (depth !== "signal" && depth !== "translation") return;
    if (!state.read[depth].includes(id)) {
      state.read[depth].push(id);
      saveRead();
      maybePromote();
    }
  }

  function maybePromote() {
    if (state.degree === "neophyte" && state.read.signal.length >= 3 && state.rites.length >= 1) {
      state.degree = "fellowcraft";
      saveRead();
      termPrint("RAISED  FELLOWCRAFT.  TXT files unlock.", "ok");
      renderAbout();
      renderFiles();
      renderScroll();
      renderPlates();
      renderPlateView();
      return;
    }
    if (state.degree === "fellowcraft" && state.read.translation.length >= 3 && state.rites.length >= 2) {
      state.degree = "adept";
      saveRead();
      termPrint("RAISED  ADEPT.  FOL files unlock. The padded text is yours.", "ok");
      renderAbout();
      renderFiles();
      renderScroll();
      renderPlates();
      renderPlateView();
    }
  }

  function renderScroll() {
    const rec = state.chapter;
    const meta = $("#scroll-meta");
    const body = $("#scroll-body");
    const also = $("#scroll-also");
    const rite = $("#rite-box");
    $$("#depth-tabs [data-depth]").forEach((b) => b.classList.toggle("on", b.dataset.depth === state.depth));
    if (!rec) {
      meta.innerHTML = "<div class='dim'>No scroll mounted. Double-click a file.</div>";
      body.textContent = "";
      also.innerHTML = "";
      rite.hidden = true;
      return;
    }
    meta.innerHTML = `
      <div class="statline">
        <span>${String(rec.rank).padStart(2, "0")}  <b>${esc(rec.id)}</b></span>
        <span>${esc(rec.echo)}</span>
        <span>p.${rec.page}</span>
        <span>${state.degree.toUpperCase()}</span>
      </div>
      <h3 style="margin:0 0 8px">${esc(rec.title)}</h3>`;
    if (!canSee(state.depth)) {
      body.classList.add("locked");
      const need = state.depth === "translation" ? "FELLOWCRAFT" : "ADEPT";
      body.textContent = `ACCESS DENIED  need ${need}\nRead three files at the previous depth, then answer a rite.\nType  rite  in the CLI after reading.`;
      also.innerHTML = "";
      rite.hidden = true;
      return;
    }
    body.classList.remove("locked");
    if (state.depth === "signal") body.textContent = rec.signal || rec.blurb || "";
    else if (state.depth === "translation") {
      body.textContent = rec.translation || "Translation not copied.";
      markRead(rec.id, "translation");
    } else body.textContent = rec.folio || "Folio not copied from the 1928 text yet.";
    const alsoLinks = (rec.see_also || []).map((id) =>
      `<a class="stamp" href="#" data-see="${esc(id)}">${esc(id)}</a>`);
    const plate = (state.plates?.plates || []).find((p) => p.chapter === rec.id);
    if (plate) {
      alsoLinks.push(`<a class="stamp released" href="#" data-plate="${esc(plate.id)}">PLATE ${esc(plate.id)}</a>`);
    }
    also.innerHTML = alsoLinks.length
      ? `<div class="stamps">${(rec.see_also || []).length ? "SEE ALSO  " : ""}${alsoLinks.join("")}</div>`
      : "";
    also.querySelectorAll("[data-see]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        openScroll(a.dataset.see);
      });
    });
    also.querySelectorAll("[data-plate]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        openPlate(a.dataset.plate);
      });
    });
    if (rec.rite && rec.rite.prompt && rec.ready) {
      rite.hidden = false;
      const passed = state.rites.includes(rec.id);
      rite.innerHTML = passed
        ? `<div class="stamp public">RITE PASSED</div>`
        : `<div class="filetab">RITE</div>
           <p>${esc(rec.rite.prompt)}</p>
           <div class="filters">
             <input id="rite-q" autocomplete="off" spellcheck="false">
             <button id="rite-go">ANSWER</button>
           </div>`;
      $("#rite-go")?.addEventListener("click", submitRite);
      $("#rite-q")?.addEventListener("keydown", (e) => { if (e.key === "Enter") submitRite(); });
    } else rite.hidden = true;
  }

  function submitRite() {
    const rec = state.chapter;
    if (!rec?.rite) return;
    const ans = ($("#rite-q")?.value || "").trim().toLowerCase();
    const ok = (rec.rite.accept || []).some((a) => ans.includes(String(a).toLowerCase()) || String(a).toLowerCase().includes(ans));
    if (!ans) return;
    if (!ok) {
      termPrint("The initiator does not move the wand.", "err");
      return;
    }
    if (!state.rites.includes(rec.id)) state.rites.push(rec.id);
    saveRead();
    termPrint("The veil stirs. Rite accepted.", "ok");
    maybePromote();
    renderScroll();
  }

  $$("#depth-tabs [data-depth]").forEach((b) => {
    b.addEventListener("click", () => {
      state.depth = b.dataset.depth;
      renderScroll();
    });
  });

  async function runXref(q) {
    const rec = await api("/api/xref?q=" + encodeURIComponent(q));
    const box = $("#xref-body");
    if (!rec.hits?.length) {
      box.innerHTML = `<p class="dim">No correspondence for ${esc(q)}.</p>`;
      return rec;
    }
    box.innerHTML = rec.hits.map((h) => `
      <div class="aid-item" data-id="${esc(h.id)}" tabindex="0">
        <div><span class="who">${esc(h.title)}</span>
          <span class="pill">${esc(h.echo || "")}</span>
          ${h.ready ? "<span class='pill online'>COPIED</span>" : ""}</div>
        <div>${esc(h.blurb || "")}</div>
        <div class="dim">${esc((h.correspondences || []).join(" · "))}</div>
      </div>`).join("");
    box.querySelectorAll(".aid-item").forEach((el) => {
      el.addEventListener("click", () => openScroll(el.dataset.id));
    });
    return rec;
  }

  $("#xref-go").addEventListener("click", () => runXref($("#xref-q").value));
  $("#xref-q").addEventListener("keydown", (e) => { if (e.key === "Enter") runXref($("#xref-q").value); });

  async function runGem(q) {
    const rec = await api("/api/gematria?q=" + encodeURIComponent(q));
    const box = $("#gem-body");
    box.innerHTML = `
      <div class="callslip">
        <div><b>ORDINAL</b><span>${rec.ordinal}</span></div>
        <div><b>REDUCE</b><span>${rec.reduction}</span></div>
        <div><b>REVERSE</b><span>${rec.reverse}</span></div>
        <div><b>LETTERS</b><span>${esc(rec.letters || "—")}</span></div>
      </div>
      <p class="dim">${esc(rec.note)}</p>
      ${(rec.hits || []).map((h) =>
        `<div class="aid-item" data-id="${esc(h.chapter)}">
           <div><span class="who">${esc(h.word)}</span> = ${h.value}
             <span class="pill">${esc(h.chapter)}</span></div>
         </div>`
      ).join("") || "<p class='dim'>No other folio word shares this number yet.</p>"}`;
    box.querySelectorAll(".aid-item").forEach((el) => {
      el.addEventListener("click", () => openScroll(el.dataset.id));
    });
    return rec;
  }

  $("#gem-go").addEventListener("click", () => runGem($("#gem-q").value));
  $("#gem-q").addEventListener("keydown", (e) => { if (e.key === "Enter") runGem($("#gem-q").value); });

  function guideNode(id) {
    const nodes = state.guide?.nodes || [];
    return nodes.find((n) => n.id === id) || nodes[0];
  }

  function renderGuide(id) {
    const start = id || state.guide?.start || "mercury";
    const node = guideNode(start);
    const box = $("#guide-body");
    const src = $("#guide-src");
    if (!node) {
      box.innerHTML = "<p class='dim'>Guide not mounted.</p>";
      return;
    }
    state.guideNode = node.id;
    if (src) src.textContent = "@node " + node.id;
    const body = esc(node.body || "");
    box.innerHTML = `
      <h3 style="margin:0 0 8px">${esc(node.title)}</h3>
      <p>${body}</p>
      <div class="stamps">
        ${(node.links || []).map((ln) =>
          `<a class="stamp" href="#" data-to="${esc(ln.to)}">${esc(ln.word)}</a>`
        ).join("")}
        ${node.chapter ? `<a class="stamp public" href="#" data-ch="${esc(node.chapter)}">READ ${esc(node.chapter)}</a>` : ""}
      </div>`;
    box.querySelectorAll("[data-to]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        renderGuide(a.dataset.to);
      });
    });
    box.querySelectorAll("[data-ch]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        openScroll(a.dataset.ch);
      });
    });
  }

  function plateById(id) {
    return (state.plates?.plates || []).find((p) => p.id === id);
  }

  function findPlate(q) {
    const n = String(q || "").toLowerCase().trim();
    if (!n) return null;
    const plates = state.plates?.plates || [];
    return (
      plates.find((p) => p.id === n) ||
      plates.find((p) => p.title && p.title.toLowerCase() === n) ||
      plates.find((p) => p.id.startsWith(n + "-")) ||
      plates.find((p) => p.title && p.title.toLowerCase().includes(n)) ||
      null
    );
  }

  function findHotspot(q) {
    const n = String(q || "").toLowerCase().trim();
    if (!n) return null;
    for (const p of state.plates?.plates || []) {
      const hit = (p.hotspots || []).find((h) =>
        h.id === n || (h.label && h.label.toLowerCase() === n)
      );
      if (hit) return { plate: p, hotspot: hit };
    }
    return null;
  }

  function renderPlateFilters() {
    const box = $("#plate-filters");
    if (!box) return;
    const echoes = [{ id: "all", name: "ALL" }, ...(state.catalog?.echoes || [])];
    box.innerHTML = echoes.map((e) =>
      `<button data-pecho="${esc(e.id)}" class="${state.plateEcho === e.id ? "on" : ""}">${esc(e.id === "all" ? "ALL" : e.id)}</button>`
    ).join("");
    box.querySelectorAll("[data-pecho]").forEach((b) => {
      b.addEventListener("click", () => {
        state.plateEcho = b.dataset.pecho;
        renderPlateFilters();
        renderPlates();
      });
    });
  }

  function renderPlates() {
    const box = $("#plate-list");
    const src = $("#plate-src");
    if (!box) return;
    const all = state.plates?.plates || [];
    const plates = all.filter((p) =>
      state.plateEcho === "all" || p.echo === state.plateEcho
    );
    if (src) src.textContent = `${plates.length} / ${all.length}  ${state.degree.toUpperCase()}`;
    if (!all.length) {
      box.innerHTML = "<p class='dim'>DH3 not mounted.</p>";
      return;
    }
    box.innerHTML = plates.map((p) => `
      <button class="plate-stamp${state.plateId === p.id ? " on" : ""}" data-id="${esc(p.id)}" type="button">
        <img src="${esc(p.stamp || "/plates/stamps/" + p.id + "@2.png")}" alt="" width="96" height="80">
        <span class="name">${esc((p.title || p.id).toUpperCase())}</span>
      </button>`).join("");
    box.querySelectorAll(".plate-stamp").forEach((el) => {
      el.addEventListener("click", () => {
        state.plateId = el.dataset.id;
        renderPlates();
      });
      el.addEventListener("dblclick", () => openPlate(el.dataset.id));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") openPlate(el.dataset.id);
      });
    });
  }

  function openPlate(id, hotspotId) {
    const p = plateById(id);
    if (!p) return;
    state.plateId = p.id;
    state.hotspotId = hotspotId || null;
    renderPlates();
    renderPlateView();
    openWin("plate");
    const title = $("#win-plate .title");
    if (title) title.textContent = "PIC:" + p.id;
  }

  function renderPlateView() {
    const p = plateById(state.plateId);
    const stage = $("#plate-stage");
    const cap = $("#plate-caption");
    if (!stage || !cap) return;
    if (!p) {
      stage.innerHTML = "<p class='dim'>No plate.</p>";
      cap.innerHTML = "";
      return;
    }
    const hotspots = p.hotspots || [];
    stage.innerHTML = `
      <div class="plate-frame">
        <img id="plate-full" src="${esc(p.src || "/plates/full/" + p.file)}" alt="${esc(p.title)}">
        <div class="plate-map">${hotspots.map((h) =>
          `<button class="hotspot${state.hotspotId === h.id ? " on" : ""}" data-id="${esc(h.id)}" type="button"
             style="left:${Number(h.x)}%;top:${Number(h.y)}%;width:${Number(h.w)}%;height:${Number(h.h)}%"
             title="${esc(h.label)}"></button>`
        ).join("")}</div>
      </div>`;
    stage.querySelectorAll(".hotspot").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        state.hotspotId = el.dataset.id;
        renderPlateView();
      });
    });
    const rank = rankOf(state.degree);
    const hs = hotspots.find((h) => h.id === state.hotspotId);
    let html = `<div class="filetab">${esc(p.title)}</div><p>${esc(p.legend || "")}</p>`;
    if (rank >= 1 && p.caption) html += `<p>${esc(p.caption)}</p>`;
    if (rank >= 2) html += `<p class="dim">Folio p.${p.pdf_page} · ${esc(p.chapter || "")}</p>`;
    const stamps = [];
    if (hs) {
      stamps.push(`<span class="stamp released">${esc(hs.label.toUpperCase())}</span>`);
      if (hs.chapter) stamps.push(`<a class="stamp public" href="#" data-ch="${esc(hs.chapter)}">READ ${esc(hs.chapter)}</a>`);
      if (hs.guide) stamps.push(`<a class="stamp" href="#" data-g="${esc(hs.guide)}">@${esc(hs.guide)}</a>`);
    } else {
      if (p.chapter) stamps.push(`<a class="stamp public" href="#" data-ch="${esc(p.chapter)}">READ ${esc(p.chapter)}</a>`);
      if (hotspots.length) stamps.push(`<span class="stamp">CLICK A GLOBE</span>`);
    }
    if (stamps.length) html += `<div class="stamps">${stamps.join("")}</div>`;
    cap.innerHTML = html;
    cap.querySelectorAll("[data-ch]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        openScroll(a.dataset.ch);
      });
    });
    cap.querySelectorAll("[data-g]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        openWin("guide");
        renderGuide(a.dataset.g);
      });
    });
  }

  function renderAbout() {
    const box = $("#about-body");
    const s = state.status;
    const seers = state.who?.seers || [];
    box.innerHTML = `
      <div class="filetab">HALL OF AGES BBS</div>
      <p>Manly P. Hall, <i>The Secret Teachings of All Ages</i>, 1928 (no renewal). Public domain. Sysop quotes the folio; we write the translations.</p>
      <div class="statline">
        <span>handle <b>${esc(state.handle)}</b></span>
        <span>degree <b>${state.degree.toUpperCase()}</b></span>
        <span>node <b>${esc(s?.node || "1:1928/1")}</b></span>
      </div>
      <p>Copied ${s?.copied ?? "—"} / ${s?.chapters ?? 50} chapters. Three depths: NFO / TXT / FOL.</p>
      <p><a href="/ceefax/">CEEFAX 1928</a> · <a href="/diskmag/">DISKMAG 01</a> · <a href="/scif/">UNWRITTEN LAW</a> · DH2:Guide is a correspondence stub, not Codex's Tree. DH3:Plates is the folio's figures; the Tree is a file map.</p>
      <p>CODEX keeps the Hebrew desk and the Tree gadget. BBSBENCH dials other boards. This node <i>is</i> a board.</p>
      <p>Homage to Workbench 1.3 / Kickstart — not a Commodore product.</p>
      <h3>WHO</h3>
      ${seers.map((u) =>
        `<div>${esc(u.handle)}  ${esc(u.status)}  idle ${esc(u.idle)}</div>`
      ).join("")}`;
  }

  const term = $("#term-log");
  const cmd = $("#cmdline");

  function banner() {
    const h = state.hour;
    return [
      "HALL OF AGES BBS  node 1:1928/1",
      "SysOp: Manly P. Hall     2400/N81     est. 1928",
      h ? `Hour of ${h.planet} (${h.metal})  ${h.weekday} ${h.clock}` : "",
      `Handle ${state.handle}   Degree ${state.degree.toUpperCase()}`,
      "",
    ].join("\n");
  }

  function termPrint(text, cls) {
    const d = document.createElement("div");
    d.className = "out" + (cls ? " " + cls : "");
    d.textContent = text;
    term.appendChild(d);
    const body = $("#win-cli .body");
    body.scrollTop = body.scrollHeight;
  }

  cmd.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const line = cmd.value;
      cmd.value = "";
      if (line.trim()) {
        state.history.push(line);
        state.histIdx = state.history.length;
      }
      termExec(line);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!state.history.length) return;
      state.histIdx = Math.max(0, state.histIdx - 1);
      cmd.value = state.history[state.histIdx];
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      state.histIdx = Math.min(state.history.length, state.histIdx + 1);
      cmd.value = state.history[state.histIdx] || "";
    }
  });

  function termExec(line) {
    const raw = line.trim();
    termPrint("1> " + raw, "ora");
    if (!raw) return;
    const [verb, ...rest] = raw.split(/\s+/);
    const arg = rest.join(" ");
    const fn = commands[verb.toLowerCase()] || commands[aliases[verb.toLowerCase()]];
    if (!fn) {
      termPrint(`Unknown command "${verb}".  help  for the binder.`, "err");
      return;
    }
    Promise.resolve(fn(arg)).catch((err) => termPrint(String(err.message || err), "err"));
  }

  const aliases = {
    ls: "files", "?": "help", man: "help", dir: "files",
    cat: "read", type: "read", open: "read", show: "read",
    q: "find", search: "find",
    whois: "who", users: "who",
    sum: "gematria", gem: "gematria", number: "gematria",
    planet: "hour", planets: "hour",
    login: "handle", name: "handle",
    echo: "echoes", mail: "echoes",
    pin: "degree",
    amigaguide: "guide", node: "guide",
    teletext: "ceefax", minitel: "ceefax", prestel: "ceefax",
    loadstar: "diskmag", mag: "diskmag",
    scif: "scif", adytum: "scif", veil: "scif",
    plate: "plates", gfile: "plates", knapp: "plates", pic: "plates",

  };

  const HELP = `HALL 1.3 command binder

  help                 this text
  files [echo]         DH0 file area
  read <id|rank>       mount a scroll (NFO/TXT/FOL)
  echoes               message bases
  who                  idle seers
  xref <q>             correspondence
  gematria <word>      English ordinal vs the folio
  hour                 planetary hour (status only)
  handle <name>        set login
  degree               show / hint the raise
  rite                 show the mounted scroll's question
  find <q>             search titles and translations
  guide [node]         DH2:Guide correspondence stub
  plates [id]          DH3:Plates  (tree, kether, cover…)
  ceefax               hang up into CEEFAX 1928
  diskmag              load issue 01 (Hermes)
  scif                 the unwritten-law gate
  about                SYS:About

F1 help · F2 FILES · F3 SCROLL · F4 XREF · F5 DOOR · F6 GUIDE · F7 CEEFAX · F10 PLATES.

Three depths. Neophyte sees NFO. Fellowcraft unlocks TXT.
Adept unlocks FOL. Read three, pass a rite.`;

  const commands = {
    help() { termPrint(HELP, "dim"); },
    files(arg) {
      if (arg) state.echo = arg.toUpperCase() === "ALL" ? "all" : arg.toUpperCase();
      renderEchoFilters();
      renderFiles();
      openWin("files");
      const n = (state.catalog?.chapters || []).length;
      termPrint(`DH0:Files  ${n} nodes  filter ${state.echo}`, "dim");
    },
    async read(arg) {
      if (!arg) {
        openWin("scroll");
        return;
      }
      const meta = findMeta(arg);
      if (!meta) {
        termPrint("No scroll by that name.  files  to list.", "err");
        return;
      }
      if (!meta.ready) {
        termPrint(`${meta.id} is in the catalog. The copyist has not yet taken it from the folio.`, "dim");
        state.selected = meta.id;
        renderFiles();
        openWin("files");
        return;
      }
      await openScroll(meta.id);
      termPrint(`Mounted ${meta.id}.NFO  degree ${state.degree}`, "ok");
    },
    echoes() {
      const list = (state.catalog?.echoes || []).map((e) =>
        `  ${e.id.padEnd(12)}  ${e.name} — ${e.summary}`
      ).join("\n");
      termPrint(list || "No echoes.", "dim");
    },
    who() {
      const list = (state.who?.seers || []).map((u) =>
        `  ${u.handle.padEnd(10)} ${u.status} (${u.idle})`
      ).join("\n");
      termPrint(list || "No carrier.", "dim");
      renderAbout();
      openWin("about");
    },
    async xref(arg) {
      openWin("xref");
      if (!arg) {
        termPrint("xref <word>   e.g.  xref mercury", "dim");
        return;
      }
      $("#xref-q").value = arg;
      const rec = await runXref(arg);
      termPrint(`${rec.hits.length} correspondence(s) for ${arg}`, "dim");
    },
    async gematria(arg) {
      openWin("door");
      if (!arg) {
        termPrint("gematria <word>   English ordinal on Hall.", "dim");
        return;
      }
      $("#gem-q").value = arg;
      const rec = await runGem(arg);
      const extra = rec.hits.slice(0, 6).map((h) => h.word).join(", ");
      termPrint(`${arg.toUpperCase()} = ${rec.ordinal} (reduce ${rec.reduction})${extra ? " · " + extra : ""}`, "ok");
    },
    hour() {
      const h = state.hour;
      if (!h) return;
      termPrint(`Hour of ${h.planet}  metal ${h.metal}  ${h.period}  day-ruler ${h.day_ruler}`, "ora");
    },
    handle(arg) {
      if (!arg) {
        termPrint(`Handle ${state.handle}`, "dim");
        return;
      }
      state.handle = arg.split(/\s+/)[0].slice(0, 12).toUpperCase();
      saveRead();
      termPrint(`Logged as ${state.handle}`, "ok");
      renderAbout();
    },
    degree() {
      const need = state.degree === "neophyte"
        ? `Read 3 NFO (${state.read.signal.length}/3) and pass 1 rite (${state.rites.length}/1).`
        : state.degree === "fellowcraft"
          ? `Read 3 TXT (${state.read.translation.length}/3) and pass a second rite (${state.rites.length}/2).`
          : "The padded text is open.";
      termPrint(`${state.handle}  ${state.degree.toUpperCase()}\n${need}`, "dim");
    },
    rite() {
      if (!state.chapter?.rite) {
        termPrint("Mount a copied scroll first (read hermes).", "dim");
        return;
      }
      openWin("scroll");
      termPrint(state.chapter.rite.prompt, "ora");
    },
    async find(arg) {
      if (!arg) {
        termPrint("find <word>", "dim");
        return;
      }
      const rec = await api("/api/search?q=" + encodeURIComponent(arg));
      if (!rec.hits.length) {
        termPrint("No hits.", "dim");
        return;
      }
      rec.hits.slice(0, 12).forEach((h) => {
        termPrint(`  [${h.kind}] ${h.id}  ${h.name}`, "dim");
      });
    },
    about() {
      renderAbout();
      openWin("about");
    },
    guide(arg) {
      const id = (arg || state.guideNode || "mercury").toLowerCase().replace(/\s+/g, "-");
      openWin("guide");
      renderGuide(id);
      termPrint(`@node ${state.guideNode}`, "dim");
    },
    ceefax() {
      termPrint("HOLD 100. Tuning CEEFAX…", "ora");
      location.href = "/ceefax/";
    },
    diskmag() {
      termPrint("LOAD\"HALL-01\",8,1", "ora");
      location.href = "/diskmag/";
    },
    scif() {
      termPrint("The veil was the method.", "ora");
      location.href = "/scif/";
    },
    plates(arg) {
      openWin("plates");
      renderPlates();
      if (!arg) {
        const n = (state.plates?.plates || []).length;
        termPrint(`DH3:Plates  ${n} figures. Stamps four-color; viewer is the source. The Tree is a map.`, "dim");
        return;
      }
      const p = findPlate(arg);
      if (p) {
        openPlate(p.id);
        termPrint(`PIC:${p.id}  ${p.title}`, "ok");
        return;
      }
      const hit = findHotspot(arg);
      if (hit) {
        openPlate(hit.plate.id, hit.hotspot.id);
        termPrint(`PIC:${hit.plate.id}  ${hit.hotspot.label}`, "ok");
        return;
      }
      termPrint("No plate by that name.  plates  to list.", "err");
    },
  };

  async function refreshAll() {
    const [catalog, who, hour, status, guide, plates] = await Promise.all([
      api("/api/catalog"),
      api("/api/who"),
      api("/api/hour"),
      api("/api/status"),
      api("/api/guide"),
      api("/api/plates"),
    ]);
    state.catalog = catalog;
    state.who = who;
    state.hour = hour;
    state.status = status;
    state.guide = guide;
    state.plates = plates;
    renderHour();
    renderEchoFilters();
    renderFiles();
    renderPlateFilters();
    renderPlates();
    renderAbout();
  }

  wireWindows();
  $("#skip").addEventListener("click", finishBoot);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !$("#workbench").classList.contains("on")) finishBoot();
  });
  typeBoot().then(() => setTimeout(finishBoot, 400));
})();
