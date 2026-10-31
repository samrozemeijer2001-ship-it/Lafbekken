/* =========================================================================
   INSTELLINGEN  >>> HIER PAS JE KANSEN, KLEUREN EN LABELS AAN <<<
   ========================================================================= */

/* ---- Kansen ---- */
// Kans op een SLECHTE uitkomst bij LAF, per level (1 t/m 4).
const SAFE_BAD_CHANCE = { 1: 0.15, 2: 0.30, 3: 0.60, 4: 0.80 };
// Kans op WINST bij LEF (altijd gelijk, de inzet stijgt wel).
const RISK_WIN_CHANCE = 0.5;
// Dubbel of niks: kans dat de keuze verschijnt na een gewonnen LEF,
// vanaf deze heat.
const DOUBLE_CHANCE = 0.10;
const DOUBLE_MIN_HEAT = 3;

// Bij LEF wordt eerst een kaartsoort gekozen met deze verdeling (procenten),
// daarna een kaart van die soort. Soorten zonder actieve kaarten worden
// overgeslagen.
const RISK_TYPE_CHANCES = {
  1: { win: { drink: 50, challenge: 20, social: 20, power: 10 },
       lose: { drink: 55, challenge: 20, social: 15, punishment: 10 } },
  2: { win: { drink: 40, challenge: 20, social: 25, power: 10, event: 5 },
       lose: { drink: 40, challenge: 20, social: 20, punishment: 15, event: 5 } },
  3: { win: { drink: 30, challenge: 20, social: 25, power: 15, event: 10 },
       lose: { drink: 30, challenge: 20, social: 20, punishment: 20, event: 10 } },
  4: { win: { drink: 20, challenge: 20, social: 25, power: 15, event: 20 },
       lose: { drink: 20, challenge: 20, social: 20, punishment: 20, event: 20 } },
};

// Standaardbeloning per heat, gebruikt bij dubbel of niks als de kaart zelf
// geen slokken heeft. Dubbel = twee keer dit (heat 4: twee atjes).
const STANDARD_REWARD = { 1: 2, 2: 4, 3: 6, 4: "atje" };

/* ---- Spelers ---- */
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;

/* ---- Overig ---- */
const HISTORY_SIZE = 40;     // zoveel recente kaarten per kant komen niet direct terug
const HOLD_MS = 750;         // zo lang moet je de doorgeefknop vasthouden
const DELETE_HOLD_MS = 900;  // zo lang moet je 'verwijderen' vasthouden
const UNDO_DEPTH = 15;       // zoveel beurten kun je terug

// Duur van tijdelijke regels, in rondes (1 ronde = iedereen één keer aan de beurt).
const DURATIONS = { "tot volgende beurt": 1, "1 ronde": 1, "2 rondes": 2, "3 rondes": 3, "tot gebruikt": null };

/* ---- Kleuren per level: [achtergrond, inkt] ---- */
const LEVEL_COLORS = {
  laf: { 1: ["#7fe0a8", "#0f5a3a"], 2: ["#7fb7ff", "#14306b"], 3: ["#b98cff", "#2b1360"], 4: ["#2747c9", "#d8e4ff"] },
  lef: { 1: ["#ffcc2e", "#a3300f"], 2: ["#ff8a3d", "#4a1a05"], 3: ["#ff5a3c", "#fff3c4"], 4: ["#3a1a6b", "#ff8fc8"] },
};
const NEUTRAL_COLOR = ["#fff6ea", "#141210"];
const EVENT_COLOR = { win: ["#141210", "#ffd84a"], lose: ["#141210", "#ff5a3c"] };

// Na level 4 groeit de sfeer nog door tot visueel level 10:
// LEF wordt steeds donkerder (verbrand), LAF steeds lichter (ijskoud).
const MOOD_END = { lef: ["#120712", "#ff5a3c"], laf: ["#eef4ff", "#1b2f8a"] };

/* ---- Teksten en labels staan in js/i18n.js (Nederlands en Engels) ---- */
const PLAYER_COLORS = ["#ff8a3d", "#7fb7ff", "#ff8fc8", "#7fe0a8", "#ffcc2e", "#b98cff", "#ff5a3c", "#2747c9", "#3a1a6b", "#0f5a3a", "#a3300f", "#14306b"];

/* ---- Bezoekersteller (GoatCounter) ----
   Je dashboard staat op lafbekken.goatcounter.com. Leeg = er wordt niets geteld. */
const GOATCOUNTER_CODE = "lafbekken";
