/* =========================================================================
   GEZICHTEN
   Minimale tegelgezichten als SVG. Elke functie krijgt één kleur en geeft
   een <svg> terug. Ogen zitten in .eyes (met .blink voor knipperen), de
   mond in .mouth, zodat animateFace ze los kan bewegen.
   ========================================================================= */

const STAR = "l4 9 10 1 -8 6 3 10 -9 -6 -9 6 3 -10 -8 -6 10 -1z";

// Bouwt een gezicht. line = true tekent met lijnen, anders gevulde vormen
// met een ronde rand in dezelfde kleur (zo zijn er nergens harde hoeken).
function mkFace(c, eyes, mouth, line) {
  const st = line
    ? `fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"`
    : `fill="${c}" stroke="${c}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"`;
  return `<svg viewBox="8 10 84 84" aria-hidden="true"><g ${st}><g class="eyes">${eyes}</g><g class="mouth">${mouth}</g></g></svg>`;
}
const dotEyes = (r = 4) => `<g class="blink"><circle cx="34" cy="38" r="${r}"/><circle cx="66" cy="38" r="${r}"/></g>`;

const FACES = {
  relieved: c => mkFace(c, '<path d="M26 40 q8 -8 16 0 M58 40 q8 -8 16 0"/>', '<path d="M30 62 q20 16 40 0"/>', true),
  sleepy:   c => mkFace(c, '<path d="M27 40 q7 6 14 0 M59 40 q7 6 14 0"/>', '<path d="M44 66 q6 4 12 0"/>', true),
  meh:      c => `<svg viewBox="8 10 84 84" aria-hidden="true" fill="${c}"><g class="eyes"><g class="blink"><path d="M29 37.5 h10" stroke="${c}" stroke-width="7" stroke-linecap="round"/><circle cx="66" cy="38" r="5"/></g></g><g class="mouth"><path d="M34 66 h32" stroke="${c}" stroke-width="8" stroke-linecap="round"/></g></svg>`,
  happy:    c => mkFace(c, dotEyes(), '<path d="M24 54 q26 36 52 0 z"/>'),
  smirk:    c => mkFace(c, dotEyes(), '<path d="M32 62 q18 12 38 -6" fill="none" stroke-width="8"/>'),
  stars:    c => mkFace(c, `<path transform="translate(34 39) scale(.72) translate(-34 -39)" d="M34 26 ${STAR}"/><path transform="translate(66 39) scale(.72) translate(-66 -39)" d="M66 26 ${STAR}"/>`, '<path d="M26 62 q24 32 48 0 z"/>'),
  shock:    c => mkFace(c, dotEyes(6), '<ellipse cx="50" cy="70" rx="7" ry="10"/>'),
  panic:    c => mkFace(c, '<path d="M25 31 q15 7 15 9 q0 2 -15 9 M75 31 q-15 7 -15 9 q0 2 15 9"/>', '<path d="M26 76 q6 -12 12 0 q6 12 12 0 q6 -12 12 0 q6 12 12 0"/>', true),
};

// Welk gezicht hoort bij een uitkomst? Hoe hoger het level, hoe extremer.
function faceFor(side, level, outcome, type) {
  if (type === "event") return outcome === "win" ? "stars" : "shock";
  if (type === "power") return "stars";
  if (side === "laf") {
    if (outcome === "win") return ["relieved", "relieved", "happy", "smirk"][level - 1];
    return ["meh", "meh", "meh", "shock"][level - 1];
  }
  if (outcome === "win") return type === "challenge" || type === "social" ? (level >= 4 ? "stars" : "smirk") : ["relieved", "happy", "happy", "stars"][level - 1];
  return ["meh", "meh", "shock", "panic"][level - 1];
}

// Gezicht voor de level-tegels (kaartenbeheer en doorgeefscherm).
function tileFace(side, level) {
  return side === "laf" ? ["relieved", "meh", "meh", "sleepy"][level - 1] : ["happy", "smirk", "shock", "panic"][level - 1];
}

const REDUCED_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Natuurlijke animatie: willekeurig knipperen en af en toe rondkijken.
   Roep dit aan NADAT de svg in de pagina staat. De timers stoppen vanzelf
   zodra de svg uit de pagina verdwijnt. */
function animateFace(svg) {
  if (!svg || REDUCED_MOTION || !svg.animate) return;
  const eyes = svg.querySelector(".eyes"), mouth = svg.querySelector(".mouth"), lids = svg.querySelector(".blink");
  if (!eyes) return;
  let x = 0, y = 0;
  const r = (a, b) => a + Math.random() * (b - a);
  const blink = () => lids && svg.isConnected && lids.animate(
    [{ transform: "scaleY(1)" }, { transform: "scaleY(.08)", offset: .4 }, { transform: "scaleY(.08)", offset: .55 }, { transform: "scaleY(1)" }],
    { duration: r(170, 230), easing: "cubic-bezier(.4,0,.2,1)" });
  (function nextBlink() {
    setTimeout(() => {
      if (!svg.isConnected) return;
      blink(); if (Math.random() < .18) setTimeout(blink, 280);
      nextBlink();
    }, r(2400, 6500));
  })();
  (function look() {
    setTimeout(() => {
      if (!svg.isConnected) return;
      const spots = [[-7, 0], [-6, -2], [0, 0], [0, 0], [6, -1], [7, 1], [-3, 1], [3, 0]];
      let [nx, ny] = spots[Math.floor(Math.random() * spots.length)];
      if (nx === x) { nx = 0; ny = 0; }
      const d = Math.abs(nx - x), o = { duration: 380 + d * 45, easing: "cubic-bezier(.33,0,.15,1)", fill: "forwards" };
      eyes.animate([{ transform: `translate(${x}px,${y}px)` }, { transform: `translate(${nx}px,${ny}px)` }], o);
      mouth.animate([{ transform: `translate(${x * .3}px,${y * .3}px)` }, { transform: `translate(${nx * .3}px,${ny * .3}px)` }], { ...o, duration: o.duration + 140, delay: 60 });
      if (d > 6 && Math.random() < .55) setTimeout(blink, 40);
      x = nx; y = ny; look();
    }, r(1300, 3800));
  })();
}

// Start de animatie voor alle gezichten binnen een element.
function animateFacesIn(root) {
  root.querySelectorAll("svg").forEach(s => { if (s.querySelector(".eyes")) animateFace(s); });
}
