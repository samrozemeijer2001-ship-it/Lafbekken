/* =========================================================================
   OPSLAG
   Alles wordt lokaal op deze telefoon bewaard (localStorage). Kaarten worden
   per taal bewaard (Nederlands en Engels hebben elk hun eigen set).
   ========================================================================= */

const STORE_KEYS = { cards: () => "lafbekken.cards." + LANG + ".v1", game: "lafbekken.game.v1" };
const defaultCards = () => (LANG === "en" ? DEFAULT_CARDS_EN : DEFAULT_CARDS);

function storeRead(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
// Geeft true terug als opslaan lukte.
function storeWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) { return false; }
}
function storeRemove(key) {
  try { localStorage.removeItem(key); } catch (e) { /* niets aan te doen */ }
}

/* ---- Kaarten ---- */
// Controleert een kaart en vult ontbrekende velden aan. Ongeldige kaarten
// worden overgeslagen zodat een fout nooit het spel laat vastlopen.
function normalizeCard(c) {
  if (!c || typeof c !== "object") return null;
  if (!["laf", "lef"].includes(c.side)) return null;
  const level = Number(c.level);
  if (!(level >= 1 && level <= 4)) return null;
  if (!["win", "lose"].includes(c.outcome)) return null;
  if (typeof c.text !== "string" || !c.text.trim()) return null;
  const type = TYPE_NAME[c.type] ? c.type : "drink";
  const sips = c.sips === "atje" ? "atje" : Math.max(0, Math.min(20, Number(c.sips) || 0));
  return {
    id: String(c.id || "own" + Date.now() + Math.random().toString(16).slice(2, 6)),
    side: c.side, level, outcome: c.outcome, type,
    title: typeof c.title === "string" ? c.title : "",
    text: c.text,
    sips, sipsTo: sips ? (SIPS_TO_NAME[c.sipsTo] ? c.sipsTo : (c.outcome === "win" ? "deal" : "self")) : "",
    refuse: c.refuse === "atje" ? "atje" : Math.max(0, Math.min(20, Number(c.refuse) || 0)),
    rule: typeof c.rule === "string" ? c.rule : "",
    scope: c.rule ? (SCOPE_NAME[c.scope] ? c.scope : "self") : "",
    dur: c.rule ? (c.dur in DURATIONS ? c.dur : "tot volgende beurt") : "",
    force: FORCE_NAME[c.force] !== undefined ? c.force : "",
    clears: !!c.clears,
    weight: [3, 6, 10].includes(Number(c.weight)) ? Number(c.weight) : 6,
    active: c.active !== false,
    custom: !!c.custom,
    edited: !!c.edited,       // standaardkaart die je zelf hebt aangepast
  };
}

function loadCards() {
  const saved = storeRead(STORE_KEYS.cards());
  const seenKey = STORE_KEYS.cards() + ".seen";
  const defaults = defaultCards();
  if (!(Array.isArray(saved) && saved.length)) {
    storeWrite(seenKey, defaults.map(c => c.id));
    return defaults.map(normalizeCard).filter(Boolean);
  }
  // Bijwerken na een update van de app:
  // - standaardkaarten die je niet zelf hebt aangepast krijgen de nieuwste tekst;
  // - standaardkaarten die uit de app zijn gehaald verdwijnen ook bij jou;
  // - nieuwe standaardkaarten worden toegevoegd;
  // - eigen kaarten, zelf aangepaste kaarten en kaarten die je zelf hebt
  //   verwijderd blijven zoals jij ze hebt gemaakt.
  const seen = new Set(storeRead(seenKey) || saved.map(c => c.id));
  const byId = new Map(defaults.map(c => [c.id, c]));
  const kept = saved.filter(c => c.custom || c.edited || byId.has(c.id))
                    .map(c => (c.custom || c.edited) ? c : { ...byId.get(c.id), active: c.active !== false });
  const have = new Set(kept.map(c => c.id));
  const added = defaults.filter(c => !seen.has(c.id) && !have.has(c.id));
  const list = [...kept, ...added].map(normalizeCard).filter(Boolean);
  storeWrite(seenKey, defaults.map(c => c.id).concat([...seen]).filter((v, i, a) => a.indexOf(v) === i));
  storeWrite(STORE_KEYS.cards(), list);
  return list.length ? list : defaults.map(normalizeCard);
}
function saveCards(list) { return storeWrite(STORE_KEYS.cards(), list); }
function resetCards() { storeRemove(STORE_KEYS.cards()); storeWrite(STORE_KEYS.cards() + ".seen", defaultCards().map(c => c.id)); return defaultCards().map(normalizeCard); }

/* ---- Lopend spel ---- */
function loadGame() {
  const g = storeRead(STORE_KEYS.game);
  return g && Array.isArray(g.players) && g.players.length >= 2 ? g : null;
}
function saveGame(game) { return storeWrite(STORE_KEYS.game, game); }
function clearGame() { storeRemove(STORE_KEYS.game); }
