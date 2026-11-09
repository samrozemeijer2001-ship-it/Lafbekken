/* =========================================================================
   BEZOEKERSTELLER
   Telt anoniem met GoatCounter (geen cookies, geen persoonsgegevens):
   - paginabezoeken (automatisch)
   - spel gestart (met aantal spelers), spel hervat
   - rondes gehaald (3, 5, 10, 20): zegt hoe lang groepen doorspelen
   - eigen kaart opgeslagen
   Stel je code in via GOATCOUNTER_CODE in js/config.js.
   ========================================================================= */
(function () {
  if (!GOATCOUNTER_CODE || IS_NATIVE || !location.protocol.startsWith("http")) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
  document.head.appendChild(s);
})();

// Telt een gebeurtenis. Werkt ook als het script nog aan het laden is.
const statQueue = [];
function track(name, title) {
  if (!GOATCOUNTER_CODE || IS_NATIVE) return;
  statQueue.push({ path: name, title: title || name, event: true });
  flushStats();
}
function flushStats() {
  if (!window.goatcounter || !window.goatcounter.count) { setTimeout(flushStats, 1500); return; }
  while (statQueue.length) { try { window.goatcounter.count(statQueue.shift()); } catch (e) { } }
}
