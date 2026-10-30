/* =========================================================================
   LAFFAARD OF LEFGOZER · app.js
   Spellogica en schermen. Volgorde in dit bestand:
   1. Hulpfuncties      2. Spelstate        3. Gedeelde onderdelen
   4. Startschermen     5. Beurt            6. Resultaat
   7. Beurt afronden    8. Menu, spelers, ongedaan maken
   9. Start
   ========================================================================= */

/* ======================= 1. HULPFUNCTIES ======================= */
const app = document.getElementById("app");
let CARDS = loadCards();

const esc = s => String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
let rand = () => Math.random();     // los gezet zodat je de kans kunt sturen bij het testen
const sipWord = n => n === 1 ? "slok" : "slokken";
const fixSips = t => t.replace(/\b1 slokken\b/g, "1 slok");
const possessive = name => /[sxz]$/i.test(name) ? name + "'" : name + "s";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function weighted(items, w = it => it.weight ?? 1) {
  const total = items.reduce((s, it) => s + Math.max(0, w(it)), 0);
  if (total <= 0) return items[0];
  let v = rand() * total;
  for (const it of items) { v -= Math.max(0, w(it)); if (v <= 0) return it; }
  return items[items.length - 1];
}

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbToHex([r, g, b]) { return "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join(""); }
function mixHex(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => v + (B[i] - v) * t)); }
function isLight(h) { const [r, g, b] = hexToRgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6; }
const inkOn = bg => isLight(bg) ? "#141210" : "#fff6ea";

// Kleur bij een kant en visueel level (0 t/m 10).
function moodColor(side, v) {
  if (v <= 0) return NEUTRAL_COLOR;
  if (v <= 4) return LEVEL_COLORS[side][v];
  const t = (Math.min(v, 10) - 4) / 6;
  const [bg4, ink4] = LEVEL_COLORS[side][4], [bgE, inkE] = MOOD_END[side];
  const bg = mixHex(bg4, bgE, t);
  return [bg, side === "laf" && t > .45 ? inkE : (side === "laf" ? ink4 : mixHex(ink4, inkE, t))];
}

// Placeholders vervangen door namen.
function fillNames(text, idx) {
  const P = G.players, n = P.length;
  const name = i => P[(i + n) % n].name;
  return fixSips(text
    .replace(/\{player\}/g, name(idx))
    .replace(/\{leftPlayer\}/g, name(idx - 1)).replace(/\{previousPlayer\}/g, name(idx - 1))
    .replace(/\{rightPlayer\}/g, name(idx + 1)).replace(/\{nextPlayer\}/g, name(idx + 1)));
}

const ICON = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H6M11 6l-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 7h14M5 12h14M5 17h14"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="8.5" cy="8" r="3.5"/><circle cx="16.5" cy="9" r="3"/><path d="M2 20c0-4 3-6.5 6.5-6.5S15 16 15 20z"/><path d="M14.5 14.2c.6-.3 1.3-.5 2-.5 3 0 5.5 2.2 5.5 6.3h-5.4c0-2.4-.8-4.4-2.1-5.8z"/></svg>',
  cards: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2.5"/><rect x="13" y="3" width="8" height="8" rx="2.5"/><rect x="3" y="13" width="8" height="8" rx="2.5"/><rect x="13" y="13" width="8" height="8" rx="2.5"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="4"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z"/></svg>',
};

/* ======================= 2. SPELSTATE ======================= */
let G = null;                                 // het lopende spel
let R = null;                                 // het resultaat van de huidige beurt
let setup = { count: 4, names: [] };          // invoer voor een nieuw spel
let currentView = null;                       // functie om het huidige scherm opnieuw te tonen

function makePlayer(name, i) {
  return { id: uid(), name, color: PLAYER_COLORS[i % PLAYER_COLORS.length], safeStreak: 0, riskHeat: 0, force: null };
}
function newGame(names) {
  G = { players: names.map(makePlayer), current: 0, round: 1, turn: 0, history: { laf: [], lef: [] }, rules: [], powers: [], undo: [] };
  persist();
}
function persist() { if (G) saveGame(G); }
const cur = () => G.players[G.current];
const nextIdx = (i = G.current) => (i + 1) % G.players.length;
const playerById = id => G.players.find(p => p.id === id);
function snapshot() { const { undo, ...rest } = G; return JSON.stringify(rest); }

/* ======================= 3. GEDEELDE ONDERDELEN ======================= */
function mount(html, cls = "") {
  const el = document.createElement("div");
  el.className = "screen " + cls;
  el.innerHTML = html;
  app.querySelectorAll(":scope > .screen:not(.manage)").forEach(s => s.remove());
  app.prepend(el);
  animateFacesIn(el);
  return el;
}

function toast(text) {
  app.querySelectorAll(".toast").forEach(t => t.remove());
  const d = document.createElement("div");
  d.className = "toast"; d.setAttribute("role", "status"); d.textContent = text;
  app.appendChild(d);
  setTimeout(() => d.remove(), 2900);
}
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };

// Overlay met paneel van onderen. Geeft {el, close} terug.
function openPanel(html, { full = false } = {}) {
  const ov = document.createElement("div");
  ov.className = "overlay";
  ov.innerHTML = `<div class="dim"></div><div class="panel${full ? " full" : ""}" role="dialog" aria-modal="true">${html}</div>`;
  app.appendChild(ov);
  const close = () => { ov.classList.add("closing"); setTimeout(() => ov.remove(), 340); };
  ov.querySelector(".dim").onclick = close;
  ov.querySelectorAll("[data-close]").forEach(b => b.onclick = close);
  return { el: ov, close };
}

// Eigen bevestigingsvenster (in plaats van confirm()).
function confirmModal({ title, text, ok = "Ja", cancel = "Annuleren", danger = false, onOk }) {
  const ov = document.createElement("div");
  ov.className = "overlay";
  ov.innerHTML = `<div class="dim"></div><div class="modal" role="alertdialog" aria-modal="true">
    <div class="disp">${esc(title)}</div><p>${esc(text)}</p>
    <div class="row2"><button class="btn btn-soft btn-small" data-no>${esc(cancel)}</button><button class="btn btn-small ${danger ? "btn-danger" : "btn-ink"}" data-yes>${esc(ok)}</button></div></div>`;
  app.appendChild(ov);
  const close = () => { ov.classList.add("closing"); setTimeout(() => ov.remove(), 300); };
  ov.querySelector(".dim").onclick = close;
  ov.querySelector("[data-no]").onclick = close;
  ov.querySelector("[data-yes]").onclick = () => { close(); onOk && onOk(); };
  ov.querySelector("[data-yes]").focus();
}

// Knop die je moet vasthouden. onDone wordt aangeroepen als hij vol is.
function holdButton(btn, ms, onDone, doneLabel) {
  const fill = btn.querySelector(".fill"), lbl = btn.querySelector(".lbl");
  const base = lbl.textContent;
  let anim = null, finished = false;
  const run = () => {
    if (finished || btn.classList.contains("wait")) return;
    btn.classList.add("holding"); lbl.textContent = "Houd vast…";
    anim = fill.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: ms, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
    anim.onfinish = () => { finished = true; btn.classList.add("done"); if (doneLabel) lbl.textContent = doneLabel; buzz(40); setTimeout(onDone, 380); };
  };
  const cancel = () => {
    if (finished || !anim || anim.playState !== "running") return;
    btn.classList.remove("holding");
    const p = anim.effect.getComputedTiming().progress || 0; anim.cancel();
    fill.animate([{ transform: `scaleX(${p})` }, { transform: "scaleX(0)" }], { duration: 380, easing: "cubic-bezier(.34,1.56,.64,1)" });
    lbl.textContent = base;
  };
  btn.addEventListener("pointerdown", e => { e.preventDefault(); run(); });
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => btn.addEventListener(ev, cancel));
  // Toetsenbord: spatie/enter ingedrukt houden werkt ook.
  btn.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); run(); } });
  btn.addEventListener("keyup", e => { if (e.key === " " || e.key === "Enter") cancel(); });
}

// Horizontaal slepen met de muis (op telefoon swipe je gewoon).
function dragScroll(sc) {
  let down = false, sx = 0, sl = 0, moved = false;
  sc.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse" || e.target.closest("button")) return; down = true; moved = false; sx = e.clientX; sl = sc.scrollLeft; });
  window.addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; sc.classList.add("drag"); } sc.scrollLeft = sl - dx; });
  window.addEventListener("pointerup", () => { if (!down) return; down = false; sc.classList.remove("drag"); setTimeout(() => { moved = false; }, 0); });
  sc.addEventListener("click", e => { if (moved) { e.stopPropagation(); e.preventDefault(); } }, true);
}

/* ======================= 4. STARTSCHERMEN ======================= */
function showStart() {
  currentView = showStart;
  const saved = loadGame();
  const el = mount(`<div class="pad screen">
    <div class="tiles in"><div class="tile" style="background:${LEVEL_COLORS.laf[1][0]}">${FACES.relieved(LEVEL_COLORS.laf[1][1])}</div><div class="tile" style="background:${LEVEL_COLORS.lef[3][0]}">${FACES.shock(LEVEL_COLORS.lef[3][1])}</div></div>
    <h1 class="title disp in in-1">Laffaard<small>of</small>Lefgozer?</h1>
    <div class="grow"></div>
    <div class="actions in in-2">
      <button class="btn btn-ink" data-new>Nieuw spel</button>
      ${saved ? `<button class="btn btn-soft" data-continue>Verder spelen</button>` : ""}
      <button class="btn btn-soft" data-cards>Kaarten beheren</button>
    </div>
    <p class="foot">Speel verantwoord</p></div>`, "start");
  el.querySelector("[data-new]").onclick = () => saved
    ? confirmModal({ title: "Nieuw spel?", text: "Het opgeslagen spel wordt dan gewist.", ok: "Nieuw spel", onOk: () => { clearGame(); showCount(); } })
    : showCount();
  const c = el.querySelector("[data-continue]");
  if (c) c.onclick = () => { G = saved; G.undo = G.undo || []; showPass(); };
  el.querySelector("[data-cards]").onclick = () => openManage(showStart);
}

function showCount() {
  currentView = showCount;
  const el = mount(`<div class="pad screen">
    <div class="head"><button class="icon-btn" data-back aria-label="Terug">${ICON.back}</button><span class="lbl">Stap 1 van 2</span></div>
    <h2 class="h-big disp in">Hoeveel<br>spelers?</h2>
    <div class="stepper in in-1"><button class="sq" data-d="-1" aria-label="Minder spelers">−</button><span class="num disp" aria-live="polite">${setup.count}</span><button class="sq" data-d="1" aria-label="Meer spelers">+</button></div>
    <p class="hint">${MIN_PLAYERS} tot ${MAX_PLAYERS} spelers</p>
    <div class="grow"></div>
    <button class="btn btn-ink in in-2" data-next>Verder</button></div>`);
  el.querySelector("[data-back]").onclick = showStart;
  el.querySelectorAll("[data-d]").forEach(b => b.onclick = () => {
    setup.count = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, setup.count + +b.dataset.d));
    const n = el.querySelector(".num"); n.textContent = setup.count; n.classList.remove("bump"); void n.offsetWidth; n.classList.add("bump");
  });
  el.querySelector("[data-next]").onclick = showNames;
}

function showNames() {
  currentView = showNames;
  const el = mount(`<div class="pad screen">
    <div class="head"><button class="icon-btn" data-back aria-label="Terug">${ICON.back}</button><span class="lbl">Stap 2 van 2</span></div>
    <h2 class="h-big disp in">Namen</h2>
    <div class="names grow">${Array.from({ length: setup.count }, (_, i) => {
      const col = PLAYER_COLORS[i % PLAYER_COLORS.length];
      return `<label class="name-row in" style="animation-delay:${i * 30}ms"><span class="sw" style="background:${col};color:${inkOn(col)}">${i + 1}</span><span class="sr">Naam speler ${i + 1}</span><input class="inp" maxlength="14" data-i="${i}" placeholder="Speler ${i + 1}" value="${esc(setup.names[i] || "")}" autocomplete="off" enterkeyhint="next"></label>`;
    }).join("")}</div>
    <button class="btn btn-ink" data-go>Starten</button>
    <button class="textlink" data-skip>Standaardnamen gebruiken</button></div>`);
  el.querySelector("[data-back]").onclick = showCount;
  el.querySelectorAll(".inp").forEach(inp => {
    inp.oninput = () => { setup.names[+inp.dataset.i] = inp.value; };
    inp.onkeydown = e => { if (e.key === "Enter") { const n = el.querySelector(`.inp[data-i="${+inp.dataset.i + 1}"]`); n ? n.focus() : inp.blur(); } };
  });
  const start = useDefaults => {
    const names = Array.from({ length: setup.count }, (_, i) => (!useDefaults && (setup.names[i] || "").trim()) || "Speler " + (i + 1));
    newGame(names); showPass();
  };
  el.querySelector("[data-go]").onclick = () => start(false);
  el.querySelector("[data-skip]").onclick = () => start(true);
}

/* ======================= 5. BEURT ======================= */
function playerMood(p) {
  if (p.riskHeat > 0) return { side: "lef", v: p.riskHeat };
  if (p.safeStreak > 0) return { side: "laf", v: p.safeStreak };
  return null;
}

function showPass() {
  currentView = showPass;
  R = null;
  const p = cur(), m = playerMood(p);
  const [bg, ink] = m ? moodColor(m.side, m.v) : ["#141210", "#fff6ea"];
  const face = m ? tileFace(m.side, Math.min(m.v, 4)) : "happy";
  const status = m ? `${LEVEL_NAME[m.side]} ${m.v} · ${LABELS[m.side][Math.min(m.v, 10)]}` : "Nog geen streak";
  const el = mount(`<div class="pad screen">
    <div class="bar"><span>Ronde ${G.round}</span><button class="icon-btn" data-menu aria-label="Menu">${ICON.menu}</button></div>
    <div class="mid">
      <div class="tile pop" style="background:${bg}">${FACES[face](ink)}</div>
      <h2 class="who disp in in-1">Geef aan<br>${esc(p.name)}</h2>
      <p class="status in in-2">${esc(status)}</p>
      ${p.force ? `<p class="forced in in-2">${esc(p.name)} moet ${SIDE_NAME[p.force === "risk" ? "lef" : "laf"]} kiezen</p>` : ""}
    </div>
    <p class="tap in in-3">Tik als je de telefoon hebt</p></div>`, "pass");
  el.onclick = e => { if (!e.target.closest("[data-menu]")) showTurn(); };
  el.querySelector("[data-menu]").onclick = openMenu;
}

// Alle actieve regels, powers en forces als stickers.
function stickersHTML() {
  const items = [];
  const label = r => {
    if (r.dur === "tot volgende beurt") return `tot ${possessive(r.ownerName)} beurt`;
    const left = Math.max(1, Math.ceil((r.expiresAt - G.turn) / G.players.length));
    return `nog ${left} ${left === 1 ? "ronde" : "rondes"}`;
  };
  const colorOf = id => { const p = id === "all" ? null : playerById(id); const bg = p ? p.color : "#141210"; return [bg, p ? inkOn(bg) : "#7fe0a8"]; };
  const nameOf = id => id === "all" ? "Iedereen" : (playerById(id)?.name || "?");
  G.rules.forEach(r => { const [bg, ink] = colorOf(r.target);
    items.push(`<div class="st" style="background:${bg};color:${ink}"><div class="nm disp">${esc(nameOf(r.target))}</div><div class="tx">${esc(r.text)}</div><div class="du">${esc(label(r).toUpperCase())}</div></div>`); });
  G.powers.forEach(pw => { const [bg, ink] = colorOf(pw.target);
    items.push(`<div class="st" style="background:${bg};color:${ink}"><span class="star">${ICON.star}</span><div class="nm disp">${esc(nameOf(pw.target))}</div><div class="tx">${esc(pw.text)}</div><button class="use" data-use="${pw.id}">gebruikt</button></div>`); });
  G.players.filter(p => p.force).forEach(p => { const [bg, ink] = colorOf(p.id);
    items.push(`<div class="st" style="background:${bg};color:${ink}"><div class="nm disp">${esc(p.name)}</div><div class="tx">Moet ${SIDE_NAME[p.force === "risk" ? "lef" : "laf"]} kiezen</div><div class="du">VOLGENDE BEURT</div></div>`); });
  const n = items.length;
  return `<div class="stickers"><div class="st-head"><span class="who">${esc(cur().name)} is aan de beurt</span><span style="display:flex;gap:10px;align-items:center"><span class="count">${n ? (n > 2 ? `${n} actief · swipe` : `${n} actief`) : ""}</span><button class="icon-btn" data-menu aria-label="Menu">${ICON.menu}</button></span></div>
    <div class="st-scroll">${n ? items.join("") : `<div class="st empty">Geen regels of powers actief</div>`}</div></div>`;
}

function showTurn() {
  currentView = showTurn;
  const p = cur(), f = p.force;
  const nextLaf = Math.min(p.safeStreak + 1, 10), nextLef = Math.min(p.riskHeat + 1, 10);
  const el = mount(`${stickersHTML()}
    <button class="half safe ${f === "risk" ? "locked" : ""}" data-side="laf" ${f === "risk" ? 'aria-disabled="true"' : ""}><span class="big disp in">LAF</span><span class="sub in in-1">Veilig spelen</span><span class="next in in-1">naar level ${nextLaf}</span>${f === "risk" ? `<span class="lock">GEBLOKKEERD · ${esc(p.name.toUpperCase())} MOET LEF</span>` : ""}</button>
    <button class="half risk ${f === "safe" ? "locked" : ""}" data-side="lef" ${f === "safe" ? 'aria-disabled="true"' : ""}><span class="big disp in in-1">LEF</span><span class="sub in in-2">Alles of niets</span><span class="next in in-2">naar heat ${nextLef}</span>${f === "safe" ? `<span class="lock">GEBLOKKEERD · ${esc(p.name.toUpperCase())} MOET LAF</span>` : ""}</button>`);
  dragScroll(el.querySelector(".st-scroll"));
  el.querySelector("[data-menu]").onclick = openMenu;
  el.querySelectorAll("[data-use]").forEach(b => b.onclick = () => {
    b.closest(".st").classList.add("out");
    setTimeout(() => { G.powers = G.powers.filter(x => x.id !== b.dataset.use); persist(); showTurn(); }, 450);
  });
  el.querySelectorAll(".half").forEach(h => h.onclick = () => {
    if (h.classList.contains("locked")) { buzz(20); toast(`${p.name} moet ${SIDE_NAME[f === "risk" ? "lef" : "laf"]} kiezen`); return; }
    makeChoice(h.dataset.side);
  });
}

// Kies een kaart uit de bewerkte kaartenset.
function chooseCard(side, level, outcome) {
  const bucket = CARDS.filter(c => c.active && c.side === side && c.level === level && c.outcome === outcome);
  if (!bucket.length) {
    return normalizeCard({ id: "fallback", side, level, outcome, type: "drink", sips: 2, custom: false,
      text: outcome === "win" ? "{player}, hier staan geen actieve kaarten. Deel 2 slokken uit." : "{player}, hier staan geen actieve kaarten. Neem 2 slokken." });
  }
  const recent = G.history[side];
  let pool = bucket.filter(c => !recent.includes(c.id));
  if (!pool.length) pool = bucket;
  if (side === "lef") {
    const chances = RISK_TYPE_CHANCES[level][outcome];
    const types = [...new Set(pool.map(c => c.type))].map(t => ({ t, weight: chances[t] ?? 10 }));
    const t = weighted(types).t;
    pool = pool.filter(c => c.type === t);
  }
  return weighted(pool);
}

function makeChoice(side) {
  const p = cur();
  G.undo.push(snapshot());
  if (G.undo.length > UNDO_DEPTH) G.undo.shift();
  p.force = null;                       // een force geldt maar één beurt
  let level, v, outcome;
  if (side === "laf") {
    p.safeStreak += 1; p.riskHeat = Math.max(0, p.riskHeat - 1);
    v = Math.min(p.safeStreak, 10); level = Math.min(p.safeStreak, 4);
    outcome = rand() < SAFE_BAD_CHANCE[level] ? "lose" : "win";
  } else {
    p.safeStreak = 0; p.riskHeat += 1;
    v = Math.min(p.riskHeat, 10); level = Math.min(p.riskHeat, 4);
    outcome = rand() < RISK_WIN_CHANCE ? "win" : "lose";
  }
  const card = chooseCard(side, level, outcome);
  R = buildResult(card, side, level, v, outcome);
  R.canDouble = side === "lef" && outcome === "win" && level >= DOUBLE_MIN_HEAT && rand() < DOUBLE_CHANCE;
  showReveal();
}

function buildResult(card, side, level, v, outcome) {
  const isEvent = card.type === "event";
  const color = isEvent ? EVENT_COLOR[outcome] : moodColor(side, v);
  return {
    card, side, level, v, outcome, color,
    face: faceFor(side, level, outcome, card.type),
    title: card.title, text: fillNames(card.text, G.current),
    sips: card.sips, sipsTo: card.sipsTo, refuse: card.refuse,
    chosen: null, doubled: null, player: G.current,
  };
}

function showReveal() {
  currentView = showReveal;
  const el = mount(`<p class="meta2 in">${SIDE_NAME[R.side]} · ${LEVEL_NAME[R.side].toUpperCase()} ${R.v}</p>
    <button class="closed pop" aria-label="Kaart onthullen">${FACES.sleepy("#fff6ea")}</button>
    <p class="hint2 in in-2">Tik om te onthullen</p>`, "reveal");
  el.onclick = () => openResult(el.querySelector(".closed"));
}

/* ======================= 6. RESULTAAT ======================= */
function bigNumber() {
  if (!R.sips) return null;
  const n = R.sips, P = G.players, i = R.player;
  if (R.doubled === "win" && n === "atje2") return ["2 ATJES", "aan twee verschillende mensen"];
  if (n === "atje") return ["ATJE", { deal: "uitdelen", self: "voor jou", others: "iedereen behalve jij", all: "iedereen", right: "voor " + P[nextIdx(i)].name, left: "voor " + P[(i - 1 + P.length) % P.length].name }[R.sipsTo] || ""];
  const w = sipWord(n);
  const unit = { deal: `${w} uitdelen`, self: `${w} voor jou`, others: "iedereen behalve jij", all: "iedereen", right: `voor ${P[nextIdx(i)].name}`, left: `voor ${P[(i - 1 + P.length) % P.length].name}` }[R.sipsTo] || w;
  return [String(n), unit];
}

function ruleTarget(card, chosenId) {
  const P = G.players, i = R.player;
  return { self: P[i].id, all: "all", pick: chosenId, left: P[(i - 1 + P.length) % P.length].id, right: P[nextIdx(i)].id }[card.scope];
}

function bandsHTML() {
  const c = R.card, out = [];
  if (R.doubled) return "";
  const name = id => id === "all" ? "Iedereen" : (playerById(id)?.name || "");
  if (c.rule) {
    const target = ruleTarget(c, R.chosen);
    const ruleText = fillNames(c.rule, R.player);
    const k = c.dur === "tot gebruikt" ? "POWER" : c.scope === "all" ? "IEDEREEN" : "REGEL";
    const durText = c.dur === "tot gebruikt" ? "Blijft tot het gebruikt is"
      : c.dur === "tot volgende beurt" ? `Tot de volgende beurt van ${cur().name}` : `Geldt ${c.dur}`;
    const who = c.scope === "pick" ? (target ? name(target) : "Tik hieronder wie het wordt") : name(target);
    out.push(`<div class="band in in-3"><span class="k disp">${k}</span><b>${esc(ruleText)}</b><small>${esc(who)} · ${esc(durText)}</small></div>`);
  }
  if (c.force) {
    const [who, choice] = c.force.split("-");
    const target = who === "next" ? G.players[nextIdx(R.player)] : G.players[R.player];
    const sideName = SIDE_NAME[choice === "risk" ? "lef" : "laf"], other = SIDE_NAME[choice === "risk" ? "laf" : "lef"];
    out.push(`<div class="band in in-3"><span class="k disp">${sideName}!</span><b>${esc(target.name)} moet volgende beurt ${sideName}</b><small>${other} is dan geblokkeerd${target.force && target.force !== choice ? " · vervangt de vorige force" : ""}</small></div>`);
  }
  if (c.clears) out.push(`<div class="band in in-3"><span class="k disp">WEG</span><b>Alle regels, powers en forces vervallen</b><small>Gebeurt zodra je doorgeeft</small></div>`);
  return out.join("");
}

function pickerHTML() {
  if (R.doubled || R.card.scope !== "pick") return "";
  return `<div class="picker in in-3"><div class="ph">TIK WIE HET WORDT</div>${G.players.map((p, i) => i === R.player ? "" :
    `<button data-pick="${p.id}" class="${R.chosen === p.id ? "chosen" : ""}"><span>${esc(p.name)}</span></button>`).join("")}</div>`;
}

function resultHTML() {
  const c = R.card, isEvent = c.type === "event" && !R.doubled;
  const big = bigNumber();
  const status = LABELS[R.side][Math.min(R.v, 10)];
  const title = R.doubled ? "" : (isEvent && R.title ? R.title : "");
  const needsPick = !R.doubled && c.scope === "pick" && !R.chosen;
  return `
    <div class="meta in"><span>${SIDE_NAME[R.side]} · ${LEVEL_NAME[R.side].toUpperCase()} ${R.v}</span><span>${R.doubled ? "DUBBEL OF NIKS" : `${TYPE_NAME[c.type].toUpperCase()} · ${status.toUpperCase()}`}</span></div>
    ${title ? `<div class="evtitle disp${title.length > 8 ? " long" : ""}">${[...title].map(ch => `<span>${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("")}</div>` : ""}
    <div class="face">${FACES[R.face](R.color[1]).replace("<svg ", '<svg class="pop" ')}</div>
    ${big ? `<div class="bignum disp in in-1${big[0].length > 4 ? " long" : ""}">${esc(big[0])}</div><div class="bigunit disp in in-1">${esc(big[1])}</div>` : ""}
    <p class="text in in-2">${esc(R.text)}</p>
    ${R.refuse && !R.doubled ? `<p class="refuse in in-3">Weigeren = ${R.refuse} ${sipWord(R.refuse)}</p>` : ""}
    <div class="extra">${bandsHTML()}${pickerHTML()}</div>
    <div class="hold in in-4${needsPick ? " wait" : ""}" role="button" tabindex="0" aria-label="Houd vast om door te geven"><div class="fill"></div><div class="lbl disp">Houd vast om door te geven</div></div>`;
}

function openResult(fromEl) {
  currentView = () => renderResult(false);
  const pr = app.getBoundingClientRect(), tr = fromEl.getBoundingClientRect();
  const el = renderResult(true);
  if (el.animate) {
    const ins = `inset(${tr.top - pr.top}px ${pr.right - tr.right}px ${pr.bottom - tr.bottom}px ${tr.left - pr.left}px round 46px)`;
    el.animate([{ clipPath: ins }, { clipPath: "inset(0px 0px 0px 0px round 0px)" }], { duration: 620, easing: "cubic-bezier(.22,1,.36,1)" });
  }
  buzz(30);
  if (R.canDouble) { R.canDouble = false; setTimeout(() => el.isConnected && showDoubleSheet(el), 1400); }
}

function renderResult(fresh) {
  const isEvent = R.card.type === "event" && !R.doubled;
  const el = document.createElement("div");
  el.className = "screen res" + (isEvent ? " event" : "") + (R.card.scope === "pick" && !R.doubled ? " compact" : "");
  el.style.background = R.color[0]; el.style.color = R.color[1]; el.style.setProperty("--bg", R.color[0]);
  el.innerHTML = resultHTML();
  if (!fresh) el.querySelectorAll(".in, .pop").forEach(x => x.style.animation = "none");
  app.querySelectorAll(":scope > .screen:not(.manage)").forEach(s => s.remove());
  app.prepend(el);
  animateFacesIn(el);
  wireResult(el);
  return el;
}

function wireResult(el) {
  el.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => {
    R.chosen = b.dataset.pick;
    el.querySelectorAll("[data-pick]").forEach(x => x.classList.toggle("chosen", x === b));
    const band = el.querySelector(".band small");
    if (band) band.textContent = `${playerById(R.chosen).name} · ${R.card.dur === "tot volgende beurt" ? `Tot de volgende beurt van ${cur().name}` : `Geldt ${R.card.dur}`}`;
    el.querySelector(".hold").classList.remove("wait");
  });
  const next = G.players[nextIdx()].name;
  holdButton(el.querySelector(".hold"), HOLD_MS, confirmTurn, `Door naar ${next}!`);
}

function showDoubleSheet(el) {
  const base = typeof R.sips === "number" && R.sips > 0 && R.sipsTo === "deal" ? R.sips : STANDARD_REWARD[R.level];
  const winLabel = base === "atje" ? "2 atjes uitdelen" : `${base * 2} slokken uitdelen`;
  const keepLabel = R.sips ? (bigNumber() || []).join(" ").toLowerCase() : "deze kaart houden";
  const sh = document.createElement("div");
  sh.className = "sheet2";
  sh.innerHTML = `<div class="sh"><div class="disp">Dubbel of niks?</div><small>Durf je nog een keer te gokken?</small></div>
    <div class="opts"><button class="opt cash"><span class="disp">Cash<br>out</span><small>${esc(keepLabel)}</small></button>
    <button class="opt dbl"><span class="disp">Dubbel</span><small>${esc(winLabel)}<br>of zelf een atje</small></button></div>`;
  el.appendChild(sh);
  buzz(20);
  sh.querySelector(".cash").onclick = () => { sh.classList.add("away"); setTimeout(() => sh.remove(), 400); };
  sh.querySelector(".dbl").onclick = () => {
    const fl = document.createElement("div"); fl.className = "flash"; fl.innerHTML = `<div class="disp">50 / 50</div>`;
    app.appendChild(fl);
    setTimeout(() => {
      fl.remove();
      const win = rand() < .5;
      R.doubled = win ? "win" : "lose";
      if (win) {
        R.sips = base === "atje" ? "atje2" : base * 2; R.sipsTo = "deal";
        R.face = "stars"; R.color = ["#ff8fc8", "#6b0f3a"];
        R.text = `${cur().name}, gegokt en gewonnen.` + (base === "atje" ? " Geef twee verschillende mensen een atje." : " Verdeel ze over de tafel.");
      } else {
        R.sips = "atje"; R.sipsTo = "self"; R.face = "panic"; R.color = ["#3a1a6b", "#ff5a3c"];
        R.text = `${cur().name}, te hebberig. Eén atje voor jou.`;
      }
      const fake = document.createElement("div");
      fake.style.cssText = "position:absolute;left:50%;top:50%;width:10px;height:10px";
      app.appendChild(fake); openResult(fake); fake.remove();
    }, 1100);
  };
}

/* ======================= 7. BEURT AFRONDEN ======================= */
function confirmTurn() {
  const c = R.card, P = G.players;
  if (!R.doubled) {
    if (c.clears) { G.rules = []; G.powers = []; P.forEach(p => p.force = null); }
    if (c.rule) {
      const target = ruleTarget(c, R.chosen);
      if (target) {
        const text = fillNames(c.rule, R.player);
        if (c.dur === "tot gebruikt") G.powers.push({ id: uid(), target, text });
        else G.rules.push({ id: uid(), target, text, dur: c.dur, ownerName: P[R.player].name, expiresAt: G.turn + DURATIONS[c.dur] * P.length });
      }
    }
    if (c.force) {
      const [who, choice] = c.force.split("-");
      (who === "next" ? P[nextIdx(R.player)] : P[R.player]).force = choice;
    }
  }
  if (c.id !== "fallback") {
    const h = G.history[R.side]; h.push(c.id); while (h.length > HISTORY_SIZE) h.shift();
  }
  advance();
}

function advance() {
  G.turn += 1;
  G.current = nextIdx();
  if (G.current === 0) G.round += 1;
  G.rules = G.rules.filter(r => r.expiresAt > G.turn);   // verlopen regels weg
  R = null;
  if (!persist()) { /* opslaan mislukt: spel gaat gewoon door */ }
  showPass();
}

/* ======================= 8. MENU, SPELERS, ONGEDAAN MAKEN ======================= */
function openMenu() {
  const canUndo = G.undo.length > 0;
  const inResult = !!R;
  const { el, close } = openPanel(`<div class="ph2"><span class="disp">Menu</span><button class="icon-btn" data-close aria-label="Sluiten">${ICON.close}</button></div>
    <div class="pb"><div class="menu-list">
      <button class="menu-item" data-undo ${canUndo ? "" : "disabled"}><span class="ic" style="background:#ffcc2e;color:#a3300f">${ICON.undo}</span><span><b>Terugdraaien</b><small>${inResult ? "Deze keuze opnieuw doen" : canUndo ? "Vorige beurt opnieuw doen" : "Nog niets om terug te draaien"}</small></span></button>
      <button class="menu-item" data-players ${inResult ? "disabled" : ""}><span class="ic" style="background:#7fb7ff;color:#14306b">${ICON.people}</span><span><b>Spelers</b><small>${inResult ? "Kan na deze beurt" : "Iemand toevoegen of verwijderen"}</small></span></button>
      <button class="menu-item" data-cards><span class="ic" style="background:#7fe0a8;color:#0f5a3a">${ICON.cards}</span><span><b>Kaarten beheren</b><small>Opdrachten bekijken en aanpassen</small></span></button>
      <button class="menu-item" data-stop><span class="ic" style="background:#ff5a3c;color:#fff3c4">${ICON.stop}</span><span><b>Spel stoppen</b><small>Terug naar het begin</small></span></button>
    </div></div>`);
  el.querySelector("[data-undo]").onclick = () => { close(); undoTurn(); };
  el.querySelector("[data-players]").onclick = () => { close(); setTimeout(openPlayers, 200); };
  el.querySelector("[data-cards]").onclick = () => { close(); const back = currentView; openManage(() => back()); };
  el.querySelector("[data-stop]").onclick = () => { close(); confirmModal({ title: "Spel stoppen?", text: "De voortgang van dit spel wordt gewist. Je kaarten blijven bewaard.", ok: "Stoppen", danger: true, onOk: () => { clearGame(); G = null; R = null; showStart(); } }); };
}

function undoTurn() {
  if (!G.undo.length) return;
  const undo = G.undo, prev = JSON.parse(undo.pop());
  G = { ...prev, undo };
  R = null;
  persist();
  toast(`Teruggedraaid: ${cur().name} kiest opnieuw`);
  showTurn();
}

function openPlayers() {
  const draw = () => {
    const P = G.players;
    return `<div class="ph2"><span class="disp">Spelers</span><button class="icon-btn" data-close aria-label="Sluiten">${ICON.close}</button></div>
      <div class="pb"><div class="plist">${P.map((p, i) => `<div class="prow"><span class="sw" style="background:${p.color};color:${inkOn(p.color)}">${esc(p.name[0] || "?")}</span>
        <span class="nm">${esc(p.name)}<small>${i === G.current ? "Is nu aan de beurt" : p.riskHeat ? "Heat " + p.riskHeat : p.safeStreak ? "Level " + p.safeStreak : "Nog geen streak"}</small></span>
        <button class="icon-btn" data-rm="${p.id}" aria-label="${esc(p.name)} verwijderen">${ICON.close}</button></div>`).join("")}</div>
        <form class="addrow" data-add><input class="inp" maxlength="14" placeholder="Naam nieuwe speler" aria-label="Naam nieuwe speler" ${P.length >= MAX_PLAYERS ? "disabled" : ""}><button class="btn btn-ink" ${P.length >= MAX_PLAYERS ? "disabled" : ""}>Erbij</button></form>
        <p class="hint" style="margin-top:12px">Nieuwe spelers sluiten achteraan aan. ${MIN_PLAYERS} tot ${MAX_PLAYERS} spelers.</p></div>`;
  };
  const { el } = openPanel(draw());
  const panel = el.querySelector(".panel");
  const rewire = () => {
    panel.querySelectorAll("[data-close]").forEach(b => b.onclick = () => { el.classList.add("closing"); setTimeout(() => el.remove(), 340); showPass(); });
    panel.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => {
      if (G.players.length <= MIN_PLAYERS) { toast(`Minimaal ${MIN_PLAYERS} spelers`); return; }
      const idx = G.players.findIndex(p => p.id === b.dataset.rm), p = G.players[idx];
      confirmModal({ title: `${p.name} eruit?`, text: "Regels en powers van deze speler verdwijnen ook.", ok: "Verwijderen", danger: true, onOk: () => {
        G.players.splice(idx, 1);
        if (idx < G.current) G.current -= 1;
        if (G.current >= G.players.length) G.current = 0;
        G.rules = G.rules.filter(r => r.target !== p.id); G.powers = G.powers.filter(x => x.target !== p.id);
        G.undo = [];                      // oude beurten passen niet meer bij de nieuwe groep
        persist(); panel.innerHTML = draw(); rewire(); toast(`${p.name} is verwijderd`);
      } });
    });
    panel.querySelector("[data-add]").onsubmit = e => {
      e.preventDefault();
      const inp = panel.querySelector("[data-add] .inp"), name = inp.value.trim();
      if (!name) { inp.focus(); return; }
      if (G.players.length >= MAX_PLAYERS) return;
      G.players.push(makePlayer(name, G.players.length));
      G.undo = [];
      persist(); panel.innerHTML = draw(); rewire(); toast(`${name} doet mee`);
    };
  };
  rewire();
  el.querySelector(".dim").onclick = () => { el.classList.add("closing"); setTimeout(() => el.remove(), 340); showPass(); };
}

/* ======================= 9. START ======================= */
showStart();

// Service worker voor offline gebruik (alleen via http(s), niet vanaf een bestand).
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => { }));
}
