/* =========================================================================
   TAAL EN STRAFWOORDEN
   - Alle teksten van de app staan hier in het Nederlands (nl) en Engels (en).
   - De groep kiest zelf het woord voor een kleine en een grote straf
     (standaard 'kleine straf' / 'grote straf'). Kaartteksten worden
     automatisch omgezet: "Neem 2 slokken" wordt "Neem 2 kleine straffen".
   Wil je een tekst aanpassen? Zoek hem hieronder op en verander hem in
   beide talen.
   ========================================================================= */

const LANG_KEY = "lafbekken.lang";
const WORDS_KEY = "lafbekken.words.v1";
let LANG = (() => { try { return localStorage.getItem(LANG_KEY) === "en" ? "en" : "nl"; } catch (e) { return "nl"; } })();

/* ---- Keuzes voor de strafwoorden ----
   s1/sN = kleine straf enkelvoud/meervoud, b1/bN = grote straf enkelvoud/meervoud */
const WORD_PRESETS = {
  nl: [
    { id: "straf", s1: "kleine straf", sN: "kleine straffen", b1: "grote straf", bN: "grote straffen" },
    { id: "slok", s1: "slok", sN: "slokken", b1: "atje", bN: "atjes" },
    { id: "punt", s1: "strafpunt", sN: "strafpunten", b1: "superstraf", bN: "superstraffen" },
  ],
  en: [
    { id: "straf", s1: "small penalty", sN: "small penalties", b1: "big penalty", bN: "big penalties" },
    { id: "slok", s1: "sip", sN: "sips", b1: "shot", bN: "shots" },
    { id: "punt", s1: "point", sN: "points", b1: "mega penalty", bN: "mega penalties" },
  ],
};

function loadWords() {
  try { const w = JSON.parse(localStorage.getItem(WORDS_KEY)); if (w && w.nl && w.en) return w; } catch (e) { }
  return { chosen: false, nl: { ...WORD_PRESETS.nl[0] }, en: { ...WORD_PRESETS.en[0] } };
}
let WORDS = loadWords();
function saveWords() { try { localStorage.setItem(WORDS_KEY, JSON.stringify(WORDS)); } catch (e) { } }
const W = () => WORDS[LANG];
const sipWord = n => (n === 1 ? W().s1 : W().sN);
const bigWord = n => (n === 1 ? W().b1 : W().bN);
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
// Weigerprijs als tekst: een aantal kleine straffen, of één grote straf ("atje").
const refuseLabel = n => (n === "atje" ? t("refuse", { n: "", w: bigWord(1) }) : t("refuse", { n, w: sipWord(n) })).replace(/\s+/g, " ");

/* ---- Kaartteksten omzetten naar de gekozen woorden ----
   Nederlandse kaarten gebruiken 'slok/slokken/atje', Engelse 'sip/sips/shot'. */
function applyWords(text) {
  if (!text) return text;
  const w = W();
  const keepCase = (m, word) => (/^[A-Z]/.test(m) ? cap(word) : word);
  if (LANG === "nl") {
    return text
      .replace(/\b(\d+) slok(ken)?\b/gi, (m, n) => `${n} ${sipWord(+n)}`)
      .replace(/\bslokken\b/gi, m => keepCase(m, w.sN))
      .replace(/\bslok\b/gi, m => keepCase(m, w.s1))
      .replace(/\b(\d+) atjes?\b/gi, (m, n) => `${n} ${bigWord(+n)}`)
      .replace(/\batjes\b/gi, m => keepCase(m, w.bN))
      .replace(/\batje\b/gi, m => keepCase(m, w.b1))
      .replace(/\batten\b/gi, () => `een ${w.b1} nemen`);
  }
  return text
    .replace(/\b(\d+) sips?\b/gi, (m, n) => `${n} ${sipWord(+n)}`)
    .replace(/\bsips\b/gi, m => keepCase(m, w.sN))
    .replace(/\bsip\b/gi, m => keepCase(m, w.s1))
    .replace(/\b(\d+) shots?\b/gi, (m, n) => `${n} ${bigWord(+n)}`)
    .replace(/\bshots\b/gi, m => keepCase(m, w.bN))
    .replace(/\bshot\b/gi, m => keepCase(m, w.b1));
}

/* ---- Alle interfaceteksten ---- */
const STR = {
  nl: {
    tagline: "Laf of lef?", newGame: "Nieuw spel", continue: "Verder spelen", manageCards: "Kaarten beheren", settings: "Instellingen",
    playResponsibly: "Speel verantwoord, alleen voor 18+", privacy: "Privacy",
    newGameQ: "Nieuw spel?", newGameText: "Het opgeslagen spel wordt dan gewist.",
    back: "Terug", next: "Verder", start: "Starten", cancel: "Annuleren", yes: "Ja", close: "Sluiten",
    stepOf: "Stap {a} van {b}", howMany: "Hoeveel<br>spelers?", playersRange: "{min} tot {max} spelers",
    names: "Namen", playerN: "Speler {n}", nameOfPlayer: "Naam speler {n}", defaultNames: "Standaardnamen gebruiken",
    ageTitle: "Hoe oud<br>ben jij?", ageText: "Lafbekken is alleen voor spelers van 18 jaar en ouder. Vul het geboortejaar in van degene met de telefoon.",
    ageLabel: "Geboortejaar", agePh: "JJJJ", ageInvalid: "Vul een geldig geboortejaar in", ageNo: "Helaas", ageNoText: "Lafbekken is alleen voor spelers van 18 jaar en ouder.", ageBack: "Terug naar het begin",
    wordsTitle: "Waar spelen<br>jullie om?", wordsText: "Kies hoe jullie een kleine en een grote straf noemen. Wat het betekent, bepalen jullie zelf.",
    wordsSmall: "Kleine straf", wordsBig: "Grote straf", wordsOwn: "Zelf kiezen", wordsOne: "Eén", wordsMany: "Meer",
    wordsExample: "Voorbeeld", wordsSaved: "Opgeslagen", wordsChange: "Je kunt dit later altijd aanpassen in de instellingen.",
    language: "Taal", penaltyWords: "Strafwoorden", settingsSaved: "Instellingen opgeslagen",
    round: "Ronde {n}", menu: "Menu", giveTo: "Geef aan<br>{name}", noStreak: "Nog geen streak", tapWhenReady: "Tik als je de telefoon hebt",
    mustChoose: "{name} moet {side} kiezen", untilTurnOf: "tot {name} beurt", roundsLeft1: "nog {n} ronde", roundsLeftN: "nog {n} rondes",
    everyone: "Iedereen", used: "gebruikt", nextTurn: "VOLGENDE BEURT", isUp: "{name} is aan de beurt", activeN: "{n} actief", activeSwipe: "swipe voor alle {n}",
    nothingActive: "Geen regels of powers actief", safeSub: "Veilig spelen", riskSub: "Alles of niets", toLevel: "naar level {n}", toHeat: "naar heat {n}",
    blocked: "{name} MOET {side}",
    fallbackWin: "{player}, hier staan geen actieve kaarten. Deel 2 slokken uit.", fallbackLose: "{player}, hier staan geen actieve kaarten. Neem 2 slokken.",
    reveal: "Kaart onthullen", tapReveal: "Tik om te onthullen",
    twoBig: "aan twee verschillende mensen", dealHintMany: "Verdeel ze zoals je wilt, over één of meer spelers.", dealHintOne: "Geef hem aan wie je wilt.", dealHintBig: "Geef hem aan één speler naar keuze.", deal: "uitdelen", forYou: "voor jou", othersThanYou: "iedereen behalve jij", forName: "voor {name}",
    kPower: "POWER", kAll: "IEDEREEN", kRule: "REGEL", untilUsed: "Blijft tot het gebruikt is", untilNextTurnOf: "Tot de volgende beurt van {name}", lasts: "Geldt {dur}",
    tapWho: "Tik hieronder wie het wordt", mustNext: "{name} moet volgende beurt {side}", otherBlocked: "{side} is dan geblokkeerd", replacesForce: ", vervangt de vorige force",
    kGone: "WEG", clearsAll: "Alle regels, powers en forces vervallen", whenPass: "Gebeurt zodra je doorgeeft",
    tapWhoCaps: "TIK WIE HET WORDT", doubleOrNothing: "DUBBEL OF NIKS", refuse: "Weigeren = {n} {w}",
    holdToPass: "Houd vast om door te geven", holding: "Houd vast…", passTo: "Door naar {name}!",
    doubleQ: "Dubbel of niks?", doubleSub: "Durf je nog een keer te gokken?", cashOut: "Cash<br>out", keepCard: "deze kaart houden", double: "Dubbel",
    orSelfBig: "of zelf {one}", doubleWinTwo: "2 {bigN} uitdelen", doubleWinN: "{n} {sN} uitdelen",
    doubleWonText: "{name}, gegokt en gewonnen.", doubleWonBig: " Geef twee verschillende mensen {one}.", doubleWonSips: " Verdeel ze over de tafel.", doubleLost: "{name}, te hebberig. {One} voor jou.",
    undo: "Terugdraaien", undoThis: "Deze keuze opnieuw doen", undoPrev: "Vorige beurt opnieuw doen", undoNone: "Nog niets om terug te draaien",
    players: "Spelers", playersLater: "Kan na deze beurt", playersSub: "Iemand toevoegen of verwijderen", cardsSub: "Opdrachten bekijken en aanpassen",
    settingsSub: "Strafwoorden en taal", stop: "Spel stoppen", stopSub: "Terug naar het begin", stopQ: "Spel stoppen?", stopText: "De voortgang van dit spel wordt gewist. Je kaarten blijven bewaard.", stopOk: "Stoppen",
    undone: "Teruggedraaid: {name} kiest opnieuw", isNowUp: "Is nu aan de beurt", noStreakShort: "Nog geen streak", removeName: "{name} verwijderen",
    newPlayerName: "Naam nieuwe speler", add: "Erbij", playersHint: "Nieuwe spelers sluiten achteraan aan. {min} tot {max} spelers.", minPlayers: "Minimaal {n} spelers",
    removeQ: "{name} eruit?", removeText: "Regels en powers van deze speler verdwijnen ook.", remove: "Verwijderen", removed: "{name} is verwijderd", joined: "{name} doet mee",
    // kaartenbeheer
    tokPlayer: "speler", tokLeft: "links", tokRight: "rechts", tokNext: "volgende", tokPrev: "vorige",
    shDeal: "UITDELEN", shSelf: "NEMEN", shOthers: "ANDEREN", shAll: "IEDEREEN", shRight: "RECHTS", shLeft: "LINKS",
    saveFailed: "Opslaan mislukt: deze browser bewaart niets. Wijzigingen gelden tot je de app sluit.",
    own: "EIGEN", off: "UIT", cardsCount: "{n} kaarten, {own} eigen", cards: "Kaarten", tapLevel: "Tik een level om de kaarten te zien", nCards: "{n} kaarten",
    resetDefaults: "Standaardkaarten herstellen", resetQ: "Standaard herstellen?", resetText: "Al je aanpassingen en eigen kaarten in deze taal worden gewist. De originele kaarten komen terug.", resetOk: "Herstellen", resetDone: "Standaardkaarten hersteld",
    toOverview: "Naar overzicht", prevLevel: "Vorig level", nextLevel: "Volgend level", noCardsYet: "Nog geen kaarten bij {o}.", newCard: "+ Nieuwe kaart",
    ruleLbl: "Regel", forceLbl: "Force", clearsLbl: "Wist alle regels en powers", newCardT: "Nieuwe kaart", editCard: "Kaart bewerken",
    fSide: "KANT", fOutcome: "UITKOMST", fType: "SOORT", fTitle: "GROTE TITEL", titlePh: "Bijv. FREEZE!", fText: "TEKST", cardText: "Kaarttekst",
    fNumber: "AANTAL (GROOT OP DE KAART)", less: "Minder", more: "Meer", noNumber: "geen getal", fForWho: "VOOR WIE", fRefuse: "WEIGEREN KOST", notRefusable: "niet weigerbaar",
    fRule: "REGEL DIE BLIJFT STAAN (OPTIONEEL)", rulePh: "Bijv. praat met een accent", fRuleFor: "REGEL GELDT VOOR", fHowLong: "HOE LANG", untilUsedPower: "Tot gebruikt (power)",
    fForce: "FORCE", fClears: "WIST ALLE REGELS EN POWERS", no: "Nee", yesRev: "Ja (revolutie)", fHowOften: "HOE VAAK", rarely: "Zelden", normal: "Normaal", often: "Vaak",
    fInGame: "IN HET SPEL", on: "Aan", offKeep: "Uit (bewaren)", addBtn: "Toevoegen", saveBtn: "Opslaan", holdDelete: "Houd vast om te verwijderen", keepHolding: "Blijf vasthouden…",
    writeText: "Schrijf eerst een tekst voor de kaart", addedTo: "Toegevoegd aan {side} {n}", saved: "Opgeslagen", deleted: "Kaart verwijderd",
  },
  en: {
    tagline: "Laf or lef?", newGame: "New game", continue: "Continue", manageCards: "Manage cards", settings: "Settings",
    playResponsibly: "Play responsibly, 18+ only", privacy: "Privacy",
    newGameQ: "New game?", newGameText: "Your saved game will be deleted.",
    back: "Back", next: "Next", start: "Start", cancel: "Cancel", yes: "Yes", close: "Close",
    stepOf: "Step {a} of {b}", howMany: "How many<br>players?", playersRange: "{min} to {max} players",
    names: "Names", playerN: "Player {n}", nameOfPlayer: "Name of player {n}", defaultNames: "Use default names",
    ageTitle: "How old<br>are you?", ageText: "Lafbekken is only for players aged 18 and over. Enter the birth year of whoever holds the phone.",
    ageLabel: "Birth year", agePh: "YYYY", ageInvalid: "Enter a valid birth year", ageNo: "Sorry", ageNoText: "Lafbekken is only for players aged 18 and over.", ageBack: "Back to the start",
    wordsTitle: "What are<br>you playing for?", wordsText: "Choose what you call a small and a big penalty. What it means is up to you.",
    wordsSmall: "Small penalty", wordsBig: "Big penalty", wordsOwn: "Make your own", wordsOne: "One", wordsMany: "Many",
    wordsExample: "Example", wordsSaved: "Saved", wordsChange: "You can always change this later in settings.",
    language: "Language", penaltyWords: "Penalty words", settingsSaved: "Settings saved",
    round: "Round {n}", menu: "Menu", giveTo: "Pass to<br>{name}", noStreak: "No streak yet", tapWhenReady: "Tap when you have the phone",
    mustChoose: "{name} has to pick {side}", untilTurnOf: "until {name} turn", roundsLeft1: "{n} round left", roundsLeftN: "{n} rounds left",
    everyone: "Everyone", used: "used", nextTurn: "NEXT TURN", isUp: "{name}'s turn", activeN: "{n} active", activeSwipe: "swipe to see all {n}",
    nothingActive: "No rules or powers active", safeSub: "Play it safe", infoBtn: "What do laf and lef mean?", gotIt: "Got it", riskSub: "All or nothing", toLevel: "to level {n}", toHeat: "to heat {n}",
    blocked: "{name} MUST PICK {side}",
    fallbackWin: "{player}, there are no active cards here. Hand out 2 sips.", fallbackLose: "{player}, there are no active cards here. Take 2 sips.",
    reveal: "Reveal card", tapReveal: "Tap to reveal",
    twoBig: "to two different people", dealHintMany: "Split them however you like, over one or more players.", dealHintOne: "Give it to anyone you like.", dealHintBig: "Give it to one player of your choice.", deal: "to hand out", forYou: "for you", othersThanYou: "everyone but you", forName: "for {name}",
    kPower: "POWER", kAll: "EVERYONE", kRule: "RULE", untilUsed: "Stays until it's used", untilNextTurnOf: "Until {name}'s next turn", lasts: "Lasts {dur}",
    tapWho: "Tap below who it'll be", mustNext: "{name} must pick {side} next turn", otherBlocked: "{side} will be blocked", replacesForce: ", replaces the previous force",
    kGone: "GONE", clearsAll: "All rules, powers and forces are wiped", whenPass: "Happens when you pass the phone",
    tapWhoCaps: "TAP WHO IT'LL BE", doubleOrNothing: "DOUBLE OR NOTHING", refuse: "Refusing = {n} {w}",
    holdToPass: "Hold to pass the phone", holding: "Keep holding…", passTo: "Over to {name}!",
    doubleQ: "Double or nothing?", doubleSub: "Dare to gamble one more time?", cashOut: "Cash<br>out", keepCard: "keep this card", double: "Double",
    orSelfBig: "or a {one} for you", doubleWinTwo: "hand out 2 {bigN}", doubleWinN: "hand out {n} {sN}",
    doubleWonText: "{name}, gambled and won.", doubleWonBig: " Give two different people a {one}.", doubleWonSips: " Spread them around the table.", doubleLost: "{name}, too greedy. A {one} for you.",
    undo: "Undo", undoThis: "Redo this choice", undoPrev: "Redo the previous turn", undoNone: "Nothing to undo yet",
    players: "Players", playersLater: "Possible after this turn", playersSub: "Add or remove someone", cardsSub: "View and edit the cards",
    settingsSub: "Penalty words and language", stop: "Stop game", stopSub: "Back to the start", stopQ: "Stop game?", stopText: "This game's progress will be deleted. Your cards are kept.", stopOk: "Stop",
    undone: "Undone: {name} picks again", isNowUp: "Up now", noStreakShort: "No streak yet", removeName: "Remove {name}",
    newPlayerName: "New player's name", add: "Add", playersHint: "New players join at the end. {min} to {max} players.", minPlayers: "At least {n} players",
    removeQ: "Remove {name}?", removeText: "This player's rules and powers disappear too.", remove: "Remove", removed: "{name} was removed", joined: "{name} joined",
    tokPlayer: "player", tokLeft: "left", tokRight: "right", tokNext: "next", tokPrev: "previous",
    shDeal: "HAND OUT", shSelf: "TAKE", shOthers: "OTHERS", shAll: "EVERYONE", shRight: "RIGHT", shLeft: "LEFT",
    saveFailed: "Saving failed: this browser doesn't store anything. Changes last until you close the app.",
    own: "OWN", off: "OFF", cardsCount: "{n} cards, {own} own", cards: "Cards", tapLevel: "Tap a level to see its cards", nCards: "{n} cards",
    resetDefaults: "Restore default cards", resetQ: "Restore defaults?", resetText: "All your changes and own cards in this language will be deleted. The original cards come back.", resetOk: "Restore", resetDone: "Default cards restored",
    toOverview: "To overview", prevLevel: "Previous level", nextLevel: "Next level", noCardsYet: "No cards for {o} yet.", newCard: "+ New card",
    ruleLbl: "Rule", forceLbl: "Force", clearsLbl: "Wipes all rules and powers", newCardT: "New card", editCard: "Edit card",
    fSide: "SIDE", fOutcome: "OUTCOME", fType: "TYPE", fTitle: "BIG TITLE", titlePh: "E.g. FREEZE!", fText: "TEXT", cardText: "Card text",
    fNumber: "AMOUNT (BIG ON THE CARD)", less: "Less", more: "More", noNumber: "no number", fForWho: "FOR WHO", fRefuse: "REFUSING COSTS", notRefusable: "can't refuse",
    fRule: "RULE THAT STAYS ACTIVE (OPTIONAL)", rulePh: "E.g. talk with an accent", fRuleFor: "RULE APPLIES TO", fHowLong: "HOW LONG", untilUsedPower: "Until used (power)",
    fForce: "FORCE", fClears: "WIPES ALL RULES AND POWERS", no: "No", yesRev: "Yes (revolution)", fHowOften: "HOW OFTEN", rarely: "Rarely", normal: "Normal", often: "Often",
    fInGame: "IN THE GAME", on: "On", offKeep: "Off (keep)", addBtn: "Add", saveBtn: "Save", holdDelete: "Hold to delete", keepHolding: "Keep holding…",
    writeText: "Write a text for the card first", addedTo: "Added to {side} {n}", saved: "Saved", deleted: "Card deleted",
  },
};

function t(key, vars) {
  let s = (STR[LANG] && STR[LANG][key]) ?? STR.nl[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return s;
}
const possessive = name => LANG === "en" ? name + "'s" : (/[sxz]$/i.test(name) ? name + "'" : name + "s");

/* ---- Taalafhankelijke labels (worden door setLang() gevuld) ---- */
const LANG_DATA = {
  nl: {
    SIDE_NAME: { laf: "LAF", lef: "LEF" }, LEVEL_NAME: { laf: "Level", lef: "Heat" },
    OUTCOME_NAME: { laf: { win: "Goed", lose: "Slecht" }, lef: { win: "Winst", lose: "Verlies" } },
    TYPE_NAME: { drink: "Straffen", challenge: "Opdracht", social: "Samen", punishment: "Strafregel", power: "Power", event: "Event" },
    SIPS_TO_NAME: { deal: "Uitdelen", self: "Zelf nemen", others: "Iedereen behalve jij", all: "Iedereen", right: "Rechts van jou", left: "Links van jou" },
    SCOPE_NAME: { self: "Zichzelf", all: "Iedereen", pick: "Speler kiest iemand", left: "Links", right: "Rechts" },
    FORCE_NAME: { "": "Geen", "next-risk": "Volgende: LEF", "next-safe": "Volgende: LAF", "self-risk": "Zelf: LEF", "self-safe": "Zelf: LAF" },
    DUR_NAME: { "tot volgende beurt": "tot volgende beurt", "1 ronde": "1 ronde", "2 rondes": "2 rondes", "3 rondes": "3 rondes", "tot gebruikt": "tot gebruikt" },
    LABELS: {
      lef: ["Neutraal", "Warm", "Risky", "Heet", "Oververhit", "Verbrand", "Geen controle", "Donkerrood", "Zwart randje", "Geen weg terug", "Opgebrand"],
      laf: ["Neutraal", "Safe", "Te veilig", "Verdacht", "Lafheidsmeter vol", "IJskoud", "Te stil", "Bevroren", "Wit alarm", "Geen lef gevonden", "Doorgelicht"],
    },
  },
  en: {
    SIDE_NAME: { laf: "LAF", lef: "LEF" }, LEVEL_NAME: { laf: "Level", lef: "Heat" },
    OUTCOME_NAME: { laf: { win: "Good", lose: "Bad" }, lef: { win: "Win", lose: "Loss" } },
    TYPE_NAME: { drink: "Penalties", challenge: "Challenge", social: "Together", punishment: "Penalty rule", power: "Power", event: "Event" },
    SIPS_TO_NAME: { deal: "Hand out", self: "Take yourself", others: "Everyone but you", all: "Everyone", right: "On your right", left: "On your left" },
    SCOPE_NAME: { self: "Themselves", all: "Everyone", pick: "Player picks someone", left: "Left", right: "Right" },
    FORCE_NAME: { "": "None", "next-risk": "Next: LEF", "next-safe": "Next: LAF", "self-risk": "Self: LEF", "self-safe": "Self: LAF" },
    DUR_NAME: { "tot volgende beurt": "until next turn", "1 ronde": "1 round", "2 rondes": "2 rounds", "3 rondes": "3 rounds", "tot gebruikt": "until used" },
    LABELS: {
      lef: ["Neutral", "Warm", "Risky", "Hot", "Overheated", "Burnt", "Out of control", "Dark red", "Black edges", "No way back", "Burnt out"],
      laf: ["Neutral", "Safe", "Too safe", "Suspicious", "Chicken meter full", "Ice cold", "Too quiet", "Frozen", "White alert", "No guts found", "Seen through"],
    },
  },
};
let SIDE_NAME, LEVEL_NAME, OUTCOME_NAME, TYPE_NAME, SIPS_TO_NAME, SCOPE_NAME, FORCE_NAME, DUR_NAME, LABELS;
function setLang(lang) {
  LANG = lang === "en" ? "en" : "nl";
  try { localStorage.setItem(LANG_KEY, LANG); } catch (e) { }
  ({ SIDE_NAME, LEVEL_NAME, OUTCOME_NAME, TYPE_NAME, SIPS_TO_NAME, SCOPE_NAME, FORCE_NAME, DUR_NAME, LABELS } = LANG_DATA[LANG]);
  document.documentElement.lang = LANG;
}
setLang(LANG);
