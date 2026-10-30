/* =========================================================================
   KAARTEN BEHEREN
   Overzicht met 8 level-tegels (LAF links, LEF rechts), een levelpagina met
   vaste kop en een bewerkvenster met live voorbeeld. Wijzigingen worden
   direct in localStorage bewaard en het spel gebruikt ze meteen.
   ========================================================================= */

const TOKENS = { player: "speler", leftPlayer: "links", rightPlayer: "rechts", nextPlayer: "volgende" };
const SIPS_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, "atje"];

// Tekst met {player} enz. als leesbare labeltjes.
const richText = t => esc(t).replace(/\{(\w+)\}/g, (m, k) => `<span class="tok">${TOKENS[k] || (k === "previousPlayer" ? "vorige" : k)}</span>`);

// Kort label voor het getal rechts in de lijst.
const SIPS_SHORT = { deal: "UITDELEN", self: "NEMEN", others: "ANDEREN", all: "IEDEREEN", right: "RECHTS", left: "LINKS" };
function cardNumber(c) {
  if (c.sips) return [c.sips === "atje" ? "ATJE" : String(c.sips), SIPS_SHORT[c.sipsTo] || ""];
  return ["", TYPE_NAME[c.type].toUpperCase()];
}

function openManage(onClose) {
  const M = { open: null, outcome: "win" };
  const root = document.createElement("div");
  root.className = "screen manage";
  app.appendChild(root);

  const persistCards = () => { if (!saveCards(CARDS)) toast("Opslaan mislukt: deze browser bewaart niets. Wijzigingen gelden tot je de app sluit."); };
  const group = (side, level, outcome) => CARDS.filter(c => c.side === side && c.level === level && (!outcome || c.outcome === outcome));
  const close = () => { root.remove(); onClose && onClose(); };

  function rowHTML(c) {
    const [bg, ink] = LEVEL_COLORS[c.side][c.level];
    const [n, lab] = cardNumber(c);
    return `<button class="crow${c.active ? "" : " off"}" data-id="${esc(c.id)}" style="color:${ink}">
      <span class="mf" style="background:${ink}">${FACES[faceFor(c.side, c.level, c.outcome, c.type)](bg)}</span>
      <span class="tx">${c.title ? `<b>${esc(c.title)}</b> ` : ""}${richText(c.text)}${c.custom ? '<span class="own">EIGEN</span>' : ""}${c.active ? "" : '<span class="own">UIT</span>'}</span>
      <span class="rt">${n ? `<span class="n disp">${esc(n)}</span>` : ""}<small>${esc(lab)}</small></span></button>`;
  }

  function home() {
    root.style.background = "var(--paper)"; root.style.color = "var(--ink)";
    root.innerHTML = `<div class="m-home">
      <div class="head"><button class="icon-btn" data-back aria-label="Terug">${ICON.back}</button><span class="lbl">${CARDS.length} kaarten · ${CARDS.filter(c => c.custom).length} eigen</span></div>
      <h2 class="ttl disp">Kaarten</h2><p class="sub">Tik een level om de kaarten te zien</p>
      <div class="m-cols"><div class="m-colh disp" style="color:#14306b">LAF</div><div class="m-colh disp" style="color:#a3300f">LEF</div>
      ${[1, 2, 3, 4].map(l => ["laf", "lef"].map(s => { const [bg, ink] = LEVEL_COLORS[s][l]; return `<button class="m-tile" data-s="${s}" data-l="${l}" style="background:${bg};color:${ink}">
        <span class="tf">${FACES[tileFace(s, l)](ink)}</span><span><span class="disp">${LEVEL_NAME[s]} ${l}</span><small>${group(s, l).length} kaarten</small></span></button>`; }).join("")).join("")}</div>
      <button class="textlink" data-reset style="display:block;margin:18px auto 0">Standaardkaarten herstellen</button></div>`;
    animateFacesIn(root);
    root.querySelector("[data-back]").onclick = close;
    root.querySelectorAll(".m-tile").forEach(t => t.onclick = () => { M.open = { side: t.dataset.s, level: +t.dataset.l }; M.outcome = "win"; detail(true); });
    root.querySelector("[data-reset]").onclick = () => confirmModal({
      title: "Standaard herstellen?", text: "Al je aanpassingen en eigen kaarten worden gewist. De originele kaarten komen terug.", ok: "Herstellen", danger: true,
      onOk: () => { CARDS = resetCards(); home(); toast("Standaardkaarten hersteld"); } });
  }

  function detail(animate) {
    const { side, level } = M.open, [bg, ink] = LEVEL_COLORS[side][level];
    const list = group(side, level, M.outcome);
    root.style.background = bg; root.style.color = ink;
    root.innerHTML = `<div class="m-det">
      <div class="m-dethead" style="background:${bg}">
        <div class="h"><button class="icon-btn" data-home aria-label="Naar overzicht"><span style="color:${ink};display:grid">${ICON.cards}</span></button>
          <span class="disp">${SIDE_NAME[side]} · ${level}</span>
          <button class="icon-btn" data-nav="-1" aria-label="Vorig level" ${level === 1 ? "disabled style=\"opacity:.3\"" : ""}>${ICON.back}</button>
          <button class="icon-btn" data-nav="1" aria-label="Volgend level" ${level === 4 ? "disabled style=\"opacity:.3\"" : ""}>${ICON.next}</button></div>
        <div class="seg" style="--on:${bg};--onbg:${ink}">${["win", "lose"].map(o => `<button data-o="${o}" class="${M.outcome === o ? "on" : ""}">${OUTCOME_NAME[side][o]} · ${group(side, level, o).length}</button>`).join("")}</div>
      </div>
      <div class="m-list">${list.length ? list.map(rowHTML).join("") : `<p class="m-empty">Nog geen kaarten bij ${OUTCOME_NAME[side][M.outcome].toLowerCase()}.</p>`}
        <button class="m-add" style="background:${ink};color:${bg}">+ Nieuwe kaart</button></div></div>`;
    if (animate && root.animate) root.animate([{ clipPath: "circle(0% at 50% 40%)" }, { clipPath: "circle(150% at 50% 40%)" }], { duration: 600, easing: "cubic-bezier(.22,1,.36,1)" });
    const sl = root.querySelector(".m-list"), hd = root.querySelector(".m-dethead");
    sl.addEventListener("scroll", () => hd.classList.toggle("lifted", sl.scrollTop > 4));
    root.querySelector("[data-home]").onclick = home;
    root.querySelectorAll("[data-nav]").forEach(b => b.onclick = () => { const nl = level + +b.dataset.nav; if (nl < 1 || nl > 4) return; M.open = { side, level: nl }; detail(true); });
    root.querySelectorAll("[data-o]").forEach(b => b.onclick = () => { M.outcome = b.dataset.o; detail(false); });
    root.querySelector(".m-add").onclick = () => editor(null, { side, level, outcome: M.outcome });
    root.querySelectorAll(".crow").forEach(r => r.onclick = () => editor(CARDS.find(c => c.id === r.dataset.id)));
  }

  function refresh() { if (M.open) { const st = root.querySelector(".m-list")?.scrollTop || 0; detail(false); const l = root.querySelector(".m-list"); if (l) l.scrollTop = st; } else home(); }

  /* ---------- bewerkvenster ---------- */
  function editor(card, def) {
    const isNew = !card;
    const c = card ? JSON.parse(JSON.stringify(card)) : normalizeCard({ id: "own" + uid(), side: def.side, level: def.level, outcome: def.outcome, type: "drink", text: "{player}, ", sips: 2, custom: true });
    if (isNew) c.text = "{player}, ";
    const ov = document.createElement("div");
    ov.className = "overlay";
    root.appendChild(ov);
    const opt = (key, val, label, extra = "") => `<button type="button" data-k="${key}" data-v="${esc(String(val))}" class="${String(c[key]) === String(val) ? "on" : ""} ${extra}">${label}</button>`;

    function previewHTML() {
      const [bg, ink] = LEVEL_COLORS[c.side][c.level];
      const [n, lab] = cardNumber(c);
      return `<div class="ed-prev" style="background:${bg};color:${ink}">
        <span class="pf">${FACES[faceFor(c.side, c.level, c.outcome, c.type)](ink)}</span>
        <span class="pm">${SIDE_NAME[c.side]} · ${LEVEL_NAME[c.side].toUpperCase()} ${c.level} · ${TYPE_NAME[c.type].toUpperCase()}</span>
        <span class="pn disp">${c.type === "event" && c.title ? esc(c.title) : n ? esc(n) : TYPE_NAME[c.type]}</span>${n ? `<span class="pm">${esc((SIPS_TO_NAME[c.sipsTo] || "").toUpperCase())}</span>` : ""}
        <span class="px">${richText(c.text) || "&nbsp;"}</span>
        ${c.refuse ? `<span class="pr">Weigeren = ${c.refuse} ${sipWord(c.refuse)}</span>` : ""}
        ${c.rule ? `<span class="pr">Regel: ${richText(c.rule)} · ${esc(SCOPE_NAME[c.scope] || "")} · ${esc(c.dur)}</span>` : ""}
        ${c.force ? `<span class="pr">Force: ${FORCE_NAME[c.force]}</span>` : ""}${c.clears ? `<span class="pr">Wist alle regels en powers</span>` : ""}</div>`;
    }

    function draw(keep) {
      const st = keep ? ov.querySelector(".pb")?.scrollTop : 0;
      const [bg, ink] = LEVEL_COLORS[c.side][c.level];
      ov.innerHTML = `<div class="dim"${keep ? ' style="animation:none"' : ""}></div><div class="panel full"${keep ? ' style="animation:none"' : ""} role="dialog" aria-modal="true">
        <div class="ph2"><span class="disp">${isNew ? "Nieuwe kaart" : "Kaart bewerken"}</span><button class="icon-btn" data-x aria-label="Sluiten">${ICON.close}</button></div>
        <div class="pb">
          <div data-prev>${previewHTML()}</div>
          <div class="fl">KANT</div><div class="opts c2">${["laf", "lef"].map(s => `<button type="button" data-k="side" data-v="${s}" class="big ${c.side === s ? "on" : ""}" style="--bg:${s === "laf" ? "#7fb7ff" : "#ff5a3c"};--fg:${s === "laf" ? "#14306b" : "#3b0d06"}">${SIDE_NAME[s]}</button>`).join("")}</div>
          <div class="fl">${LEVEL_NAME[c.side].toUpperCase()}</div><div class="opts c4">${[1, 2, 3, 4].map(l => `<button type="button" data-k="level" data-v="${l}" class="big ${c.level === l ? "on" : ""}" style="--bg:${LEVEL_COLORS[c.side][l][0]};--fg:${LEVEL_COLORS[c.side][l][1]};background:${LEVEL_COLORS[c.side][l][0]}55">${l}</button>`).join("")}</div>
          <div class="fl">UITKOMST</div><div class="opts c2">${["win", "lose"].map(o => opt("outcome", o, OUTCOME_NAME[c.side][o])).join("")}</div>
          <div class="fl">SOORT</div><div class="opts c3">${Object.entries(TYPE_NAME).map(([k, v]) => opt("type", k, v)).join("")}</div>
          ${c.type === "event" ? `<div class="fl">GROTE TITEL</div><input class="inp" data-title maxlength="14" placeholder="Bijv. FREEZE!" value="${esc(c.title)}">` : ""}
          <div class="fl">TEKST</div><textarea class="ta" data-text aria-label="Kaarttekst">${esc(c.text)}</textarea>
          <div class="toks">${Object.entries(TOKENS).map(([k, v]) => `<button type="button" data-tok="${k}">+ ${v}</button>`).join("")}</div>
          ${c.type === "drink" ? `<div class="fl">SLOKKEN (GROOT OP DE KAART)</div><div class="step"><button type="button" data-sip="-1" aria-label="Minder">−</button><span class="v disp">${c.sips === "atje" ? "ATJE" : c.sips || "—"}<small>${c.sips ? "" : "geen getal"}</small></span><button type="button" data-sip="1" aria-label="Meer">+</button></div>
            ${c.sips ? `<div class="fl">VOOR WIE</div><div class="opts c3">${Object.entries(SIPS_TO_NAME).map(([k, v]) => opt("sipsTo", k, v)).join("")}</div>` : ""}` : ""}
          <div class="fl">WEIGEREN KOST</div><div class="step"><button type="button" data-ref="-1" aria-label="Minder">−</button><span class="v disp">${c.refuse || "—"}<small>${c.refuse ? sipWord(c.refuse) : "niet weigerbaar"}</small></span><button type="button" data-ref="1" aria-label="Meer">+</button></div>
          <div class="fl">REGEL DIE BLIJFT STAAN (OPTIONEEL)</div><input class="inp" data-rule maxlength="60" placeholder="Bijv. praat met een accent" value="${esc(c.rule)}">
          ${c.rule ? `<div class="fl">REGEL GELDT VOOR</div><div class="opts c3">${Object.entries(SCOPE_NAME).map(([k, v]) => opt("scope", k, v)).join("")}</div>
            <div class="fl">HOE LANG</div><div class="opts c2">${Object.keys(DURATIONS).map(d => opt("dur", d, d === "tot gebruikt" ? "Tot gebruikt (power)" : d[0].toUpperCase() + d.slice(1))).join("")}</div>` : ""}
          <div class="fl">FORCE</div><div class="opts c3">${Object.entries(FORCE_NAME).map(([v, l]) => opt("force", v, l)).join("")}</div>
          <div class="fl">WIST ALLE REGELS EN POWERS</div><div class="opts c2">${opt("clears", false, "Nee")}${opt("clears", true, "Ja (revolutie)")}</div>
          <div class="fl">HOE VAAK</div><div class="opts c3">${opt("weight", 3, "Zelden")}${opt("weight", 6, "Normaal")}${opt("weight", 10, "Vaak")}</div>
          <div class="fl">IN HET SPEL</div><div class="opts c2">${opt("active", true, "Aan")}${opt("active", false, "Uit (bewaren)")}</div>
        </div>
        <div class="ed-foot"><button class="btn" data-save style="background:${bg};color:${ink}">${isNew ? "Toevoegen" : "Opslaan"}</button>
          ${isNew ? "" : `<div class="del" role="button" tabindex="0"><div class="fill"></div><div class="lbl">Houd vast om te verwijderen</div></div>`}</div></div>`;
      if (keep) ov.querySelector(".pb").scrollTop = st;
      animateFacesIn(ov.querySelector("[data-prev]"));
      wire();
    }

    const shut = () => { ov.classList.add("closing"); setTimeout(() => ov.remove(), 340); };
    const readInputs = () => {
      c.text = ov.querySelector("[data-text]").value;
      c.rule = ov.querySelector("[data-rule]").value.trim();
      const t = ov.querySelector("[data-title]"); if (t) c.title = t.value.trim().toUpperCase();
    };
    const updatePreview = () => { readInputs(); const p = ov.querySelector("[data-prev]"); p.innerHTML = previewHTML(); animateFacesIn(p); };

    function wire() {
      ov.querySelector("[data-x]").onclick = shut;
      ov.querySelector(".dim").onclick = shut;
      ov.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
        readInputs();
        let v = b.dataset.v; const k = b.dataset.k;
        if (k === "level" || k === "weight") v = +v;
        if (k === "active" || k === "clears") v = v === "true";
        c[k] = v;
        if (k === "type" && v !== "drink") { c.sips = 0; c.sipsTo = ""; }
        if (k === "type" && v === "drink" && !c.sips) { c.sips = 2; c.sipsTo = c.outcome === "win" ? "deal" : "self"; }
        draw(true);
      });
      const ta = ov.querySelector("[data-text]");
      ta.oninput = updatePreview;
      const ti = ov.querySelector("[data-title]"); if (ti) ti.oninput = updatePreview;
      ov.querySelectorAll("[data-tok]").forEach(b => b.onclick = () => {
        readInputs();
        const s = ta.selectionStart ?? ta.value.length, e = ta.selectionEnd ?? s, ins = `{${b.dataset.tok}}`;
        c.text = ta.value.slice(0, s) + ins + ta.value.slice(e);
        draw(true);
        const t2 = ov.querySelector("[data-text]"); t2.focus(); t2.selectionStart = t2.selectionEnd = s + ins.length;
      });
      ov.querySelectorAll("[data-sip]").forEach(b => b.onclick = () => {
        readInputs();
        const i = Math.max(0, SIPS_STEPS.indexOf(c.sips));
        c.sips = SIPS_STEPS[Math.max(0, Math.min(SIPS_STEPS.length - 1, i + +b.dataset.sip))];
        c.sipsTo = c.sips ? (c.sipsTo || (c.outcome === "win" ? "deal" : "self")) : "";
        draw(true);
      });
      ov.querySelectorAll("[data-ref]").forEach(b => b.onclick = () => { readInputs(); c.refuse = Math.max(0, Math.min(20, c.refuse + +b.dataset.ref)); draw(true); });
      const ri = ov.querySelector("[data-rule]");
      ri.onchange = () => { readInputs(); if (c.rule && !c.scope) c.scope = "self"; if (c.rule && !c.dur) c.dur = "tot volgende beurt"; if (!c.rule) { c.scope = ""; c.dur = ""; } draw(true); };
      ov.querySelector("[data-save]").onclick = () => {
        readInputs();
        if (c.text.replace(/\{\w+\}/g, "").replace(/[,.\s]/g, "").length < 3) { toast("Schrijf eerst een tekst voor de kaart"); ta.focus(); return; }
        if (c.type === "event" && !c.title) c.title = "EVENT";
        const clean = normalizeCard(c);
        if (isNew) CARDS.push(clean); else CARDS[CARDS.findIndex(x => x.id === c.id)] = clean;
        persistCards();
        shut();
        // Na het opslaan naar het level van de kaart, zodat je hem terugziet.
        M.open = { side: clean.side, level: clean.level }; M.outcome = clean.outcome;
        setTimeout(() => { refresh(); toast(isNew ? `Toegevoegd aan ${SIDE_NAME[clean.side]} ${clean.level}` : "Opgeslagen"); }, 340);
      };
      const del = ov.querySelector(".del");
      if (del) {
        const fill = del.querySelector(".fill"), lbl = del.querySelector(".lbl");
        let a = null, done = false;
        const start = e => { e && e.preventDefault(); del.classList.add("holding"); lbl.textContent = "Blijf vasthouden…";
          a = fill.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: DELETE_HOLD_MS, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
          a.onfinish = () => { done = true; buzz(50); CARDS = CARDS.filter(x => x.id !== c.id); persistCards(); shut(); setTimeout(() => { refresh(); toast("Kaart verwijderd"); }, 340); }; };
        const stop = () => { if (done || !a || a.playState !== "running") return; del.classList.remove("holding"); const pr = a.effect.getComputedTiming().progress || 0; a.cancel();
          fill.animate([{ transform: `scaleX(${pr})` }, { transform: "scaleX(0)" }], { duration: 350, easing: "cubic-bezier(.34,1.56,.64,1)" }); lbl.textContent = "Houd vast om te verwijderen"; };
        del.addEventListener("pointerdown", start);
        ["pointerup", "pointerleave", "pointercancel"].forEach(ev => del.addEventListener(ev, stop));
        del.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && !e.repeat) start(e); });
        del.addEventListener("keyup", stop);
      }
    }
    draw(false);
  }

  home();
}
