/* =========================================================================
   LAFBEKKEN app.js (winkelversie)
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
// sipWord, bigWord, possessive, applyWords en t() staan in js/i18n.js
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
  return applyWords(text
    .replace(/\{player\}/g, name(idx))
    .replace(/\{leftPlayer\}/g, name(idx - 1)).replace(/\{previousPlayer\}/g, name(idx - 1))
    .replace(/\{rightPlayer\}/g, name(idx + 1)).replace(/\{nextPlayer\}/g, name(idx + 1)))
    .replace(/\b1 (kleine straffen|slokken|strafpunten|small penalties|sips|points)\b/g, (m, w) => "1 " + sipWord(1));
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
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M4.2 7.4l2.3 1.3M17.5 15.3l2.3 1.3M4.2 16.6l2.3-1.3M17.5 8.7l2.3-1.3"/></svg>',
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
  nativeStatusFor("#fff6ea");
  return el;
}

function toast(text) {
  app.querySelectorAll(".toast").forEach(t => t.remove());
  const d = document.createElement("div");
  d.className = "toast"; d.setAttribute("role", "status"); d.textContent = text;
  app.appendChild(d);
  setTimeout(() => d.remove(), 2900);
}
const buzz = ms => { try { if (!nativeBuzz(ms)) navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };

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
function confirmModal({ title, text, ok = t("yes"), cancel = t("cancel"), danger = false, onOk }) {
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
    btn.classList.add("holding"); lbl.textContent = t("holding");
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
    <h1 class="title disp in in-1">Lafbekken<small>${t("tagline")}</small></h1>
    <div class="grow"></div>
    <div class="actions in in-2">
      <button class="btn btn-ink" data-new>${t("newGame")}</button>
      ${saved ? `<button class="btn btn-soft" data-continue>${t("continue")}</button>` : ""}
      <div class="row2"><button class="btn btn-soft" data-cards>${t("manageCards")}</button><button class="btn btn-soft btn-sq" data-settings aria-label="${t("settings")}">${ICON.gear}</button></div>
    </div>
    <div class="langsw in in-3" role="group" aria-label="${t("language")}"><button data-lang="nl" class="${LANG === "nl" ? "on" : ""}">NL</button><button data-lang="en" class="${LANG === "en" ? "on" : ""}">EN</button></div>
    <p class="foot">${t("playResponsibly")}<br><a href="privacy.html#${LANG}" class="footlink">${t("privacy")}</a></p></div>`, "start");
  el.querySelector("[data-new]").onclick = () => saved
    ? confirmModal({ title: t("newGameQ"), text: t("newGameText"), ok: t("newGame"), onOk: () => { clearGame(); showAge(); } })
    : showAge();
  const c = el.querySelector("[data-continue]");
  if (c) c.onclick = () => { G = saved; G.undo = G.undo || []; track("spel-hervat", "Spel hervat"); showPass(); };
  el.querySelector("[data-cards]").onclick = () => openManage(showStart);
  el.querySelector("[data-settings]").onclick = () => openSettings(showStart);
  el.querySelectorAll("[data-lang]").forEach(b => b.onclick = () => {
    if (b.dataset.lang === LANG) return;
    setLang(b.dataset.lang); CARDS = loadCards(); showStart();
  });
}

/* ---- Leeftijdscheck: bij elk nieuw spel het geboortejaar ---- */
function showAge() {
  currentView = showAge;
  const now = new Date().getFullYear();
  const el = mount(`<div class="pad screen">
    <div class="head"><button class="icon-btn" data-back aria-label="${t("back")}">${ICON.back}</button><span class="lbl">18+</span></div>
    <h2 class="h-big disp in">${t("ageTitle")}</h2>
    <p class="lead in in-1">${t("ageText")}</p>
    <label class="agefield in in-2"><span class="sr">${t("ageLabel")}</span><input class="inp age" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="${t("agePh")}" autocomplete="off" aria-label="${t("ageLabel")}"></label>
    <p class="err" aria-live="polite"></p>
    <div class="grow"></div>
    <button class="btn btn-ink in in-3" data-next>${t("next")}</button></div>`, "agecheck");
  const inp = el.querySelector(".age"), err = el.querySelector(".err");
  el.querySelector("[data-back]").onclick = showStart;
  inp.oninput = () => { inp.value = inp.value.replace(/\D/g, "").slice(0, 4); err.textContent = ""; };
  const go = () => {
    const y = +inp.value;
    if (!(y >= now - 110 && y <= now)) { err.textContent = t("ageInvalid"); inp.focus(); buzz(20); return; }
    if (now - y < 18) { track("leeftijd-te-jong", "Leeftijdscheck: jonger dan 18"); showUnderage(); return; }
    showCount();
  };
  inp.onkeydown = e => { if (e.key === "Enter") go(); };
  el.querySelector("[data-next]").onclick = go;
  setTimeout(() => inp.focus(), 350);
}
function showUnderage() {
  currentView = showUnderage;
  const el = mount(`<div class="pad screen">
    <div class="mid"><div class="tile pop" style="background:${LEVEL_COLORS.laf[3][0]}">${FACES.meh(LEVEL_COLORS.laf[3][1])}</div>
    <h2 class="who disp in in-1">${t("ageNo")}</h2><p class="status in in-2">${t("ageNoText")}</p></div>
    <button class="btn btn-ink in in-3" data-home>${t("ageBack")}</button></div>`, "pass");
  el.querySelector("[data-home]").onclick = showStart;
}

/* ---- Strafwoorden kiezen (eerste keer als stap, daarna in instellingen) ---- */
function wordsPickerHTML(sel) {
  const presets = WORD_PRESETS[LANG];
  const ex = w => (LANG === "nl" ? `Neem 2 ${w.sN}, deel een ${w.b1} uit` : `Take 2 ${w.sN}, hand out a ${w.b1}`);
  const own = sel.id === "eigen";
  return `<div class="wlist">${presets.map(p => `<button class="wopt${sel.id === p.id ? " on" : ""}" data-preset="${p.id}"><b class="disp">${esc(cap(p.s1))} / ${esc(cap(p.b1))}</b><small>${esc(ex(p))}</small></button>`).join("")}
    <button class="wopt${own ? " on" : ""}" data-preset="eigen"><b class="disp">${t("wordsOwn")}</b><small>${own ? esc(ex(sel)) : "…"}</small></button></div>
    ${own ? `<div class="wown">
      <div class="fl">${t("wordsSmall").toUpperCase()}</div><div class="w2"><input class="inp" data-w="s1" maxlength="18" placeholder="${t("wordsOne")}" value="${esc(sel.s1)}"><input class="inp" data-w="sN" maxlength="20" placeholder="${t("wordsMany")}" value="${esc(sel.sN)}"></div>
      <div class="fl">${t("wordsBig").toUpperCase()}</div><div class="w2"><input class="inp" data-w="b1" maxlength="18" placeholder="${t("wordsOne")}" value="${esc(sel.b1)}"><input class="inp" data-w="bN" maxlength="20" placeholder="${t("wordsMany")}" value="${esc(sel.bN)}"></div></div>` : ""}`;
}
function wireWordsPicker(box, sel, redraw) {
  box.querySelectorAll("[data-preset]").forEach(b => b.onclick = () => {
    const id = b.dataset.preset;
    if (id === "eigen") Object.assign(sel, { id: "eigen" });
    else Object.assign(sel, WORD_PRESETS[LANG].find(p => p.id === id));
    redraw();
  });
  box.querySelectorAll("[data-w]").forEach(i => i.oninput = () => { sel[i.dataset.w] = i.value; });
}
function commitWords(sel) {
  track(`woorden-${sel.id || "eigen"}`, `Strafwoorden: ${sel.id || "eigen"}`);
  const cleaned = { id: sel.id };
  ["s1", "sN", "b1", "bN"].forEach(k => cleaned[k] = (sel[k] || "").trim().toLowerCase());
  const def = WORD_PRESETS[LANG][0];
  if (!cleaned.s1) cleaned.s1 = def.s1; if (!cleaned.sN) cleaned.sN = cleaned.s1 === def.s1 ? def.sN : cleaned.s1;
  if (!cleaned.b1) cleaned.b1 = def.b1; if (!cleaned.bN) cleaned.bN = cleaned.b1 === def.b1 ? def.bN : cleaned.b1;
  WORDS[LANG] = cleaned; WORDS.chosen = true; saveWords();
}
function showWords(onDone) {
  currentView = () => showWords(onDone);
  const sel = { ...W() };
  const el = mount(`<div class="pad screen">
    <div class="head"><button class="icon-btn" data-back aria-label="${t("back")}">${ICON.back}</button><span class="lbl">${t("stepOf", { a: 3, b: 3 })}</span></div>
    <h2 class="h-big disp in">${t("wordsTitle")}</h2>
    <p class="lead in in-1">${t("wordsText")}</p>
    <div class="grow wbox in in-2"></div>
    <p class="hint">${t("wordsChange")}</p>
    <button class="btn btn-ink" data-go>${t("start")}</button></div>`, "words");
  const box = el.querySelector(".wbox");
  const draw = () => { box.innerHTML = wordsPickerHTML(sel); wireWordsPicker(box, sel, draw); };
  draw();
  el.querySelector("[data-back]").onclick = showNames;
  el.querySelector("[data-go]").onclick = () => { commitWords(sel); onDone(); };
}

/* ---- Instellingen: strafwoorden en taal ---- */
function openSettings(after) {
  const sel = { ...W() };
  const { el, close } = openPanel(`<div class="ph2"><span class="disp">${t("settings")}</span><button class="icon-btn" data-close aria-label="${t("close")}">${ICON.close}</button></div>
    <div class="pb"><div class="fl">${t("penaltyWords").toUpperCase()}</div><div class="wbox"></div>
      <button class="btn btn-ink" data-save style="margin-top:16px">${t("saveBtn")}</button></div>`, { full: true });
  const box = el.querySelector(".wbox");
  const draw = () => { box.innerHTML = wordsPickerHTML(sel); wireWordsPicker(box, sel, draw); };
  draw();
  el.querySelector("[data-save]").onclick = () => { commitWords(sel); close(); toast(t("settingsSaved")); if (after) setTimeout(after, 340); };
}

function showCount() {
  currentView = showCount;
  const el = mount(`<div class="pad screen">
    <div class="head"><button class="icon-btn" data-back aria-label="${t("back")}">${ICON.back}</button><span class="lbl">${t("stepOf", { a: 1, b: WORDS.chosen ? 2 : 3 })}</span></div>
    <h2 class="h-big disp in">${t("howMany")}</h2>
    <div class="stepper in in-1"><button class="sq" data-d="-1" aria-label="−">−</button><span class="num disp" aria-live="polite">${setup.count}</span><button class="sq" data-d="1" aria-label="+">+</button></div>
    <p class="hint">${t("playersRange", { min: MIN_PLAYERS, max: MAX_PLAYERS })}</p>
    <div class="grow"></div>
    <button class="btn btn-ink in in-2" data-next>${t("next")}</button></div>`);
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
    <div class="head"><button class="icon-btn" data-back aria-label="${t("back")}">${ICON.back}</button><span class="lbl">${t("stepOf", { a: 2, b: WORDS.chosen ? 2 : 3 })}</span></div>
    <h2 class="h-big disp in">${t("names")}</h2>
    <div class="names grow">${Array.from({ length: setup.count }, (_, i) => {
      const col = PLAYER_COLORS[i % PLAYER_COLORS.length];
      return `<label class="name-row in" style="animation-delay:${i * 30}ms"><span class="sw" style="background:${col};color:${inkOn(col)}">${i + 1}</span><span class="sr">${t("nameOfPlayer", { n: i + 1 })}</span><input class="inp" maxlength="14" data-i="${i}" placeholder="${t("playerN", { n: i + 1 })}" value="${esc(setup.names[i] || "")}" autocomplete="off" enterkeyhint="next"></label>`;
    }).join("")}</div>
    <button class="btn btn-ink" data-go>${WORDS.chosen ? t("start") : t("next")}</button>
    <button class="textlink" data-skip>${t("defaultNames")}</button></div>`);
  el.querySelector("[data-back]").onclick = showCount;
  el.querySelectorAll(".inp").forEach(inp => {
    inp.oninput = () => { setup.names[+inp.dataset.i] = inp.value; };
    inp.onkeydown = e => { if (e.key === "Enter") { const n = el.querySelector(`.inp[data-i="${+inp.dataset.i + 1}"]`); n ? n.focus() : inp.blur(); } };
  });
  const start = useDefaults => {
    const names = Array.from({ length: setup.count }, (_, i) => (!useDefaults && (setup.names[i] || "").trim()) || t("playerN", { n: i + 1 }));
    const begin = () => { newGame(names); track("spel-gestart", `Spel gestart (${names.length} spelers)`); track(`spelers-${names.length}`, `${names.length} spelers`); track(`taal-${LANG}`, `Taal ${LANG.toUpperCase()}`); showPass(); };
    WORDS.chosen ? begin() : showWords(begin);
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
  const status = m ? `${LEVEL_NAME[m.side]} ${m.v}<i class="gap"></i>${LABELS[m.side][Math.min(m.v, 10)]}` : t("noStreak");
  const el = mount(`<div class="pad screen">
    <div class="bar"><span>${t("round", { n: G.round })}</span><button class="icon-btn" data-menu aria-label="${t("menu")}">${ICON.menu}</button></div>
    <div class="mid">
      <div class="tile pop" style="background:${bg}">${FACES[face](ink)}</div>
      <h2 class="who disp in in-1">${t("giveTo", { name: esc(p.name) })}</h2>
      <p class="status in in-2">${status}</p>
      ${p.force ? `<p class="forced in in-2">${esc(t("mustChoose", { name: p.name, side: SIDE_NAME[p.force === "risk" ? "lef" : "laf"] }))}</p>` : ""}
    </div>
    <p class="tap in in-3">${t("tapWhenReady")}</p></div>`, "pass");
  el.onclick = e => { if (!e.target.closest("[data-menu]")) showTurn(); };
  el.querySelector("[data-menu]").onclick = openMenu;
}

// Alle actieve regels, powers en forces als stickers.
function stickersHTML() {
  const items = [];
  const label = r => {
    if (r.dur === "tot volgende beurt") return t("untilTurnOf", { name: possessive(r.ownerName) });
    const left = Math.max(1, Math.ceil((r.expiresAt - G.turn) / G.players.length));
    return t(left === 1 ? "roundsLeft1" : "roundsLeftN", { n: left });
  };
  const colorOf = id => { const p = id === "all" ? null : playerById(id); const bg = p ? p.color : "#141210"; return [bg, p ? inkOn(bg) : "#7fe0a8"]; };
  const nameOf = id => id === "all" ? t("everyone") : (playerById(id)?.name || "?");
  G.rules.forEach(r => { const [bg, ink] = colorOf(r.target);
    items.push(`<div class="st" style="background:${bg};color:${ink}"><div class="nm disp">${esc(nameOf(r.target))}</div><div class="tx">${esc(applyWords(r.text))}</div><div class="du">${esc(label(r).toUpperCase())}</div></div>`); });
  G.powers.forEach(pw => { const [bg, ink] = colorOf(pw.target);
    items.push(`<div class="st" style="background:${bg};color:${ink}"><span class="star">${ICON.star}</span><div class="nm disp">${esc(nameOf(pw.target))}</div><div class="tx">${esc(applyWords(pw.text))}</div><button class="use" data-use="${pw.id}">${t("used")}</button></div>`); });
  G.players.filter(p => p.force).forEach(p => { const [bg, ink] = colorOf(p.id);
    items.push(`<div class="st" style="background:${bg};color:${ink}"><div class="nm disp">${esc(p.name)}</div><div class="tx">${esc(t("mustChoose", { name: p.name, side: SIDE_NAME[p.force === "risk" ? "lef" : "laf"] }))}</div><div class="du">${t("nextTurn")}</div></div>`); });
  const n = items.length;
  return `<div class="stickers"><div class="st-head"><span class="who">${esc(t("isUp", { name: cur().name }))}</span><span style="display:flex;gap:10px;align-items:center"><span class="count">${n ? t(n > 2 ? "activeSwipe" : "activeN", { n }) : ""}</span><button class="icon-btn" data-menu aria-label="${t("menu")}">${ICON.menu}</button></span></div>
    <div class="st-scroll">${n ? items.join("") : `<div class="st empty">${t("nothingActive")}</div>`}</div></div>`;
}

function showTurn() {
  currentView = showTurn;
  const p = cur(), f = p.force;
  const nextLaf = Math.min(p.safeStreak + 1, 10), nextLef = Math.min(p.riskHeat + 1, 10);
  const el = mount(`${stickersHTML()}
    <button class="half safe ${f === "risk" ? "locked" : ""}" data-side="laf" ${f === "risk" ? 'aria-disabled="true"' : ""}><span class="big disp in">${SIDE_NAME.laf}</span><span class="sub in in-1">${t("safeSub")}</span><span class="next in in-1">${t("toLevel", { n: nextLaf })}</span>${f === "risk" ? `<span class="lock">${esc(t("blocked", { name: p.name.toUpperCase(), side: SIDE_NAME.lef }))}</span>` : ""}</button>
    <button class="half risk ${f === "safe" ? "locked" : ""}" data-side="lef" ${f === "safe" ? 'aria-disabled="true"' : ""}><span class="big disp in in-1">${SIDE_NAME.lef}</span><span class="sub in in-2">${t("riskSub")}</span><span class="next in in-2">${t("toHeat", { n: nextLef })}</span>${f === "safe" ? `<span class="lock">${esc(t("blocked", { name: p.name.toUpperCase(), side: SIDE_NAME.laf }))}</span>` : ""}</button>`);
  dragScroll(el.querySelector(".st-scroll"));
  el.querySelector("[data-menu]").onclick = openMenu;
  el.querySelectorAll("[data-use]").forEach(b => b.onclick = () => {
    b.closest(".st").classList.add("out");
    setTimeout(() => { G.powers = G.powers.filter(x => x.id !== b.dataset.use); persist(); showTurn(); }, 450);
  });
  el.querySelectorAll(".half").forEach(h => h.onclick = () => {
    if (h.classList.contains("locked")) { buzz(20); toast(t("mustChoose", { name: p.name, side: SIDE_NAME[f === "risk" ? "lef" : "laf"] })); return; }
    makeChoice(h.dataset.side);
  });
}

// Kies een kaart uit de bewerkte kaartenset.
function chooseCard(side, level, outcome) {
  const bucket = CARDS.filter(c => c.active && c.side === side && c.level === level && c.outcome === outcome);
  if (!bucket.length) {
    return normalizeCard({ id: "fallback", side, level, outcome, type: "drink", sips: 2, custom: false,
      text: outcome === "win" ? t("fallbackWin") : t("fallbackLose") });
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
  const el = mount(`<p class="meta2 in">${SIDE_NAME[R.side]}<i class="gap"></i>${LEVEL_NAME[R.side].toUpperCase()} ${R.v}</p>
    <button class="closed pop" aria-label="${t("reveal")}">${FACES.sleepy("#fff6ea")}</button>
    <p class="hint2 in in-2">${t("tapReveal")}</p>`, "reveal");
  el.onclick = () => openResult(el.querySelector(".closed"));
}

/* ======================= 6. RESULTAAT ======================= */
function bigNumber() {
  if (!R.sips) return null;
  const n = R.sips, P = G.players, i = R.player;
  const rightN = P[nextIdx(i)].name, leftN = P[(i - 1 + P.length) % P.length].name;
  const who = { deal: t("deal"), self: t("forYou"), others: t("othersThanYou"), all: t("everyone").toLowerCase(), right: t("forName", { name: rightN }), left: t("forName", { name: leftN }) };
  if (R.doubled === "win" && n === "atje2") return ["2 " + bigWord(2).toUpperCase(), t("twoBig")];
  if (n === "atje") return [bigWord(1).toUpperCase(), who[R.sipsTo] || ""];
  const w = sipWord(n);
  const unit = { deal: `${w} ${t("deal")}`, self: `${w} ${t("forYou")}` }[R.sipsTo] || (who[R.sipsTo] ? `${w}, ${who[R.sipsTo]}` : w);
  return [String(n), unit];
}

// Korte uitleg onder uitdeelkaarten: mag je verdelen of niet?
function dealHint() {
  if (R.doubled || R.sipsTo !== "deal" || !R.sips) return "";
  const key = R.sips === "atje" ? "dealHintBig" : R.sips === 1 ? "dealHintOne" : "dealHintMany";
  return `<p class="dealhint in in-1">${esc(t(key))}</p>`;
}

function ruleTarget(card, chosenId) {
  const P = G.players, i = R.player;
  return { self: P[i].id, all: "all", pick: chosenId, left: P[(i - 1 + P.length) % P.length].id, right: P[nextIdx(i)].id }[card.scope];
}

function durLabel(dur) {
  if (dur === "tot gebruikt") return t("untilUsed");
  if (dur === "tot volgende beurt") return t("untilNextTurnOf", { name: cur().name });
  return t("lasts", { dur: DUR_NAME[dur] || dur });
}

function bandsHTML() {
  const c = R.card, out = [];
  if (R.doubled) return "";
  const name = id => id === "all" ? t("everyone") : (playerById(id)?.name || "");
  if (c.rule) {
    const target = ruleTarget(c, R.chosen);
    const ruleText = fillNames(c.rule, R.player);
    const k = c.dur === "tot gebruikt" ? t("kPower") : c.scope === "all" ? t("kAll") : t("kRule");
    const durText = durLabel(c.dur);
    const who = c.scope === "pick" ? (target ? name(target) : t("tapWho")) : name(target);
    out.push(`<div class="band in in-3"><span class="k disp">${k}</span><b>${esc(ruleText)}</b><small>${esc(who)}<br>${esc(durText)}</small></div>`);
  }
  if (c.force) {
    const [who, choice] = c.force.split("-");
    const target = who === "next" ? G.players[nextIdx(R.player)] : G.players[R.player];
    const sideName = SIDE_NAME[choice === "risk" ? "lef" : "laf"], other = SIDE_NAME[choice === "risk" ? "laf" : "lef"];
    out.push(`<div class="band in in-3"><span class="k disp">${sideName}!</span><b>${esc(t("mustNext", { name: target.name, side: sideName }))}</b><small>${t("otherBlocked", { side: other })}${target.force && target.force !== choice ? t("replacesForce") : ""}</small></div>`);
  }
  if (c.clears) out.push(`<div class="band in in-3"><span class="k disp">${t("kGone")}</span><b>${t("clearsAll")}</b><small>${t("whenPass")}</small></div>`);
  return out.join("");
}

function pickerHTML() {
  if (R.doubled || R.card.scope !== "pick") return "";
  return `<div class="picker in in-3"><div class="ph">${t("tapWhoCaps")}</div>${G.players.map((p, i) => i === R.player ? "" :
    `<button data-pick="${p.id}" class="${R.chosen === p.id ? "chosen" : ""}"><span>${esc(p.name)}</span></button>`).join("")}</div>`;
}

function resultHTML() {
  const c = R.card, isEvent = c.type === "event" && !R.doubled;
  const big = bigNumber();
  const status = LABELS[R.side][Math.min(R.v, 10)];
  const title = R.doubled ? "" : (isEvent && R.title ? R.title : "");
  const needsPick = !R.doubled && c.scope === "pick" && !R.chosen;
  return `
    <div class="meta in"><span>${SIDE_NAME[R.side]}<i class="gap"></i>${LEVEL_NAME[R.side].toUpperCase()} ${R.v}</span><span>${R.doubled ? t("doubleOrNothing") : `${TYPE_NAME[c.type].toUpperCase()}<i class="gap"></i>${status.toUpperCase()}`}</span></div>
    ${title ? `<div class="evtitle disp${title.length > 8 ? " long" : ""}">${[...title].map(ch => `<span>${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("")}</div>` : ""}
    <div class="face">${FACES[R.face](R.color[1]).replace("<svg ", '<svg class="pop" ')}</div>
    ${big ? `<div class="bignum disp in in-1${big[0].length > 9 ? " xlong" : big[0].length > 4 ? " long" : ""}">${esc(big[0])}</div><div class="bigunit disp in in-1">${esc(big[1])}</div>${dealHint()}` : ""}
    <p class="text in in-2">${esc(R.text)}</p>
    ${R.refuse && !R.doubled ? `<p class="refuse in in-3">${esc(refuseLabel(R.refuse))}</p>` : ""}
    <div class="extra">${bandsHTML()}${pickerHTML()}</div>
    <div class="hold in in-4${needsPick ? " wait" : ""}" role="button" tabindex="0" aria-label="${t("holdToPass")}"><div class="fill"></div><div class="lbl disp">${t("holdToPass")}</div></div>`;
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
  nativeStatusFor(R.color[0]);
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
    if (band) band.innerHTML = `${esc(playerById(R.chosen).name)}<br>${esc(durLabel(R.card.dur))}`;
    el.querySelector(".hold").classList.remove("wait");
  });
  const next = G.players[nextIdx()].name;
  holdButton(el.querySelector(".hold"), HOLD_MS, confirmTurn, t("passTo", { name: next }));
}

function showDoubleSheet(el) {
  const base = typeof R.sips === "number" && R.sips > 0 && R.sipsTo === "deal" ? R.sips : STANDARD_REWARD[R.level];
  const winLabel = base === "atje" ? t("doubleWinTwo", { bigN: bigWord(2) }) : t("doubleWinN", { n: base * 2, sN: sipWord(base * 2) });
  const keepLabel = R.sips ? (bigNumber() || []).join(" ").toLowerCase() : t("keepCard");
  const sh = document.createElement("div");
  sh.className = "sheet2";
  sh.innerHTML = `<div class="sh"><div class="disp">${t("doubleQ")}</div><small>${t("doubleSub")}</small></div>
    <div class="opts"><button class="opt cash"><span class="disp">${t("cashOut")}</span><small>${esc(keepLabel)}</small></button>
    <button class="opt dbl"><span class="disp">${t("double")}</span><small>${esc(winLabel)}<br>${esc(t("orSelfBig", { one: bigWord(1) }))}</small></button></div>`;
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
        R.text = t("doubleWonText", { name: cur().name }) + (base === "atje" ? t("doubleWonBig", { one: bigWord(1) }) : t("doubleWonSips"));
      } else {
        R.sips = "atje"; R.sipsTo = "self"; R.face = "panic"; R.color = ["#3a1a6b", "#ff5a3c"];
        R.text = t("doubleLost", { name: cur().name, one: bigWord(1), One: cap(bigWord(1)) });
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
  if (G.current === 0) { G.round += 1; if ([3, 5, 10, 20].includes(G.round)) track(`ronde-${G.round}`, `Ronde ${G.round} gehaald`); }
  G.rules = G.rules.filter(r => r.expiresAt > G.turn);   // verlopen regels weg
  R = null;
  if (!persist()) { /* opslaan mislukt: spel gaat gewoon door */ }
  showPass();
}

/* ======================= 8. MENU, SPELERS, ONGEDAAN MAKEN ======================= */
function openMenu() {
  const canUndo = G.undo.length > 0;
  const inResult = !!R;
  const { el, close } = openPanel(`<div class="ph2"><span class="disp">${t("menu")}</span><button class="icon-btn" data-close aria-label="${t("close")}">${ICON.close}</button></div>
    <div class="pb"><div class="menu-list">
      <button class="menu-item" data-undo ${canUndo ? "" : "disabled"}><span class="ic" style="background:#ffcc2e;color:#a3300f">${ICON.undo}</span><span><b>${t("undo")}</b><small>${inResult ? t("undoThis") : canUndo ? t("undoPrev") : t("undoNone")}</small></span></button>
      <button class="menu-item" data-players ${inResult ? "disabled" : ""}><span class="ic" style="background:#7fb7ff;color:#14306b">${ICON.people}</span><span><b>${t("players")}</b><small>${inResult ? t("playersLater") : t("playersSub")}</small></span></button>
      <button class="menu-item" data-cards><span class="ic" style="background:#7fe0a8;color:#0f5a3a">${ICON.cards}</span><span><b>${t("manageCards")}</b><small>${t("cardsSub")}</small></span></button>
      <button class="menu-item" data-settings><span class="ic" style="background:#b98cff;color:#2b1360">${ICON.gear}</span><span><b>${t("settings")}</b><small>${t("penaltyWords")}</small></span></button>
      <button class="menu-item" data-stop><span class="ic" style="background:#ff5a3c;color:#fff3c4">${ICON.stop}</span><span><b>${t("stop")}</b><small>${t("stopSub")}</small></span></button>
    </div></div>`);
  el.querySelector("[data-undo]").onclick = () => { close(); undoTurn(); };
  el.querySelector("[data-players]").onclick = () => { close(); setTimeout(openPlayers, 200); };
  el.querySelector("[data-cards]").onclick = () => { close(); const back = currentView; openManage(() => back()); };
  el.querySelector("[data-settings]").onclick = () => { close(); const back = currentView; setTimeout(() => openSettings(() => back()), 250); };
  el.querySelector("[data-stop]").onclick = () => { close(); confirmModal({ title: t("stopQ"), text: t("stopText"), ok: t("stopOk"), danger: true, onOk: () => { clearGame(); G = null; R = null; showStart(); } }); };
}

function undoTurn() {
  if (!G.undo.length) return;
  const undo = G.undo, prev = JSON.parse(undo.pop());
  G = { ...prev, undo };
  R = null;
  persist();
  toast(t("undone", { name: cur().name }));
  showTurn();
}

function openPlayers() {
  const draw = () => {
    const P = G.players;
    return `<div class="ph2"><span class="disp">${t("players")}</span><button class="icon-btn" data-close aria-label="${t("close")}">${ICON.close}</button></div>
      <div class="pb"><div class="plist">${P.map((p, i) => `<div class="prow"><span class="sw" style="background:${p.color};color:${inkOn(p.color)}">${esc(p.name[0] || "?")}</span>
        <span class="nm">${esc(p.name)}<small>${i === G.current ? t("isNowUp") : p.riskHeat ? "Heat " + p.riskHeat : p.safeStreak ? "Level " + p.safeStreak : t("noStreakShort")}</small></span>
        <button class="icon-btn" data-rm="${p.id}" aria-label="${esc(t("removeName", { name: p.name }))}">${ICON.close}</button></div>`).join("")}</div>
        <form class="addrow" data-add><input class="inp" maxlength="14" placeholder="${t("newPlayerName")}" aria-label="${t("newPlayerName")}" ${P.length >= MAX_PLAYERS ? "disabled" : ""}><button class="btn btn-ink" ${P.length >= MAX_PLAYERS ? "disabled" : ""}>${t("add")}</button></form>
        <p class="hint" style="margin-top:12px">${t("playersHint", { min: MIN_PLAYERS, max: MAX_PLAYERS })}</p></div>`;
  };
  const { el } = openPanel(draw());
  const panel = el.querySelector(".panel");
  const rewire = () => {
    panel.querySelectorAll("[data-close]").forEach(b => b.onclick = () => { el.classList.add("closing"); setTimeout(() => el.remove(), 340); showPass(); });
    panel.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => {
      if (G.players.length <= MIN_PLAYERS) { toast(t("minPlayers", { n: MIN_PLAYERS })); return; }
      const idx = G.players.findIndex(p => p.id === b.dataset.rm), p = G.players[idx];
      confirmModal({ title: t("removeQ", { name: p.name }), text: t("removeText"), ok: t("remove"), danger: true, onOk: () => {
        G.players.splice(idx, 1);
        if (idx < G.current) G.current -= 1;
        if (G.current >= G.players.length) G.current = 0;
        G.rules = G.rules.filter(r => r.target !== p.id); G.powers = G.powers.filter(x => x.target !== p.id);
        G.undo = [];                      // oude beurten passen niet meer bij de nieuwe groep
        persist(); panel.innerHTML = draw(); rewire(); toast(t("removed", { name: p.name }));
      } });
    });
    panel.querySelector("[data-add]").onsubmit = e => {
      e.preventDefault();
      const inp = panel.querySelector("[data-add] .inp"), name = inp.value.trim();
      if (!name) { inp.focus(); return; }
      if (G.players.length >= MAX_PLAYERS) return;
      G.players.push(makePlayer(name, G.players.length));
      G.undo = [];
      persist(); panel.innerHTML = draw(); rewire(); toast(t("joined", { name }));
    };
  };
  rewire();
  el.querySelector(".dim").onclick = () => { el.classList.add("closing"); setTimeout(() => el.remove(), 340); showPass(); };
}

/* ======================= 9. START ======================= */
showStart();

// Service worker voor offline gebruik (alleen via http(s), niet vanaf een bestand).
if (!IS_NATIVE && "serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => { }));
}
