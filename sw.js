/* Service worker: bewaart de app op je telefoon zodat hij ook zonder
   internet opent. Verhoog VERSION als je bestanden aanpast; dan haalt de
   app de nieuwe versie op en ruimt de oude op. */
const VERSION = "v13";
const CACHE = "lafbekken-store-" + VERSION;
const FILES = [
  "./", "./index.html", "./style.css", "./manifest.webmanifest",
  "./js/native.js", "./js/config.js", "./js/stats.js", "./js/i18n.js", "./js/cards.js", "./js/cards-en.js", "./js/faces.js", "./js/store.js", "./js/manage.js", "./js/app.js",
  "./fonts/barlow-condensed-latin-900-normal.woff2",
  "./fonts/rubik-latin-400-normal.woff2", "./fonts/rubik-latin-600-normal.woff2", "./fonts/rubik-latin-700-normal.woff2",
  "./fonts/rubik-latin-800-normal.woff2", "./fonts/rubik-latin-900-normal.woff2",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  // Alleen eigen, oude caches opruimen.
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("lafbekken-store-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Eerst uit de cache (snel en offline), tegelijk op de achtergrond verversen.
// Na de volgende keer openen zie je dus de nieuwste bestanden.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    return res || (req.mode === "navigate" ? cache.match("./index.html") : Response.error());
  }));
});
