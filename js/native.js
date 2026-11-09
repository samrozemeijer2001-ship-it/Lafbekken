/* =========================================================================
   IPHONE-APP (Capacitor)
   Dezelfde code draait als website én als iPhone-app. In de app:
   - echte trillingen via de Taptic Engine (Haptics);
   - de statusbalk (klok, batterij) past zijn kleur aan het scherm aan;
   - geen service worker en geen bezoekersteller (Apple telt zelf downloads).
   Op de website doet dit bestand niets.
   ========================================================================= */
const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const NativeHaptics = IS_NATIVE ? window.Capacitor.registerPlugin("Haptics") : null;
const NativeStatusBar = IS_NATIVE ? window.Capacitor.registerPlugin("StatusBar") : null;
const NativeSplash = IS_NATIVE ? window.Capacitor.registerPlugin("SplashScreen") : null;

// Trillen: kort tikje (<30ms), gewone tik, of stevige tik (>=40ms).
function nativeBuzz(ms) {
  if (!NativeHaptics) return false;
  const style = ms >= 40 ? "MEDIUM" : ms >= 30 ? "LIGHT" : "LIGHT";
  NativeHaptics.impact({ style }).catch(() => { });
  return true;
}

// Statusbalk: donkere tekst op lichte schermen, lichte tekst op donkere.
let lastBarStyle = "";
function nativeStatusFor(bg) {
  if (!NativeStatusBar || !bg) return;
  const n = parseInt(String(bg).replace("#", ""), 16);
  const light = ((n >> 16 & 255) * .299 + (n >> 8 & 255) * .587 + (n & 255) * .114) / 255 > .6;
  const style = light ? "LIGHT" : "DARK";   // LIGHT = donkere tekst, DARK = lichte tekst
  if (style === lastBarStyle) return;
  lastBarStyle = style;
  NativeStatusBar.setStyle({ style }).catch(() => { });
}

if (IS_NATIVE) {
  document.documentElement.classList.add("native");
  window.addEventListener("load", () => setTimeout(() => NativeSplash && NativeSplash.hide().catch(() => { }), 250));
}
