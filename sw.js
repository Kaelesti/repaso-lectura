/* Guarda la app en el celular para que funcione sin internet.
   Al cambiar archivos de la app, sube el número de VERSION. */
var VERSION = "repaso-v3";
var ARCHIVOS = [
  "./", "index.html", "manifest.json",
  "css/estilos.css", "js/comun.js", "js/juego.js", "js/app.js",
  "libros/papelucho-ji.json", "icons/icon-192.png", "icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

/* Primero responde con lo guardado y, en segundo plano, lo actualiza. */
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (guardado) {
    var red = fetch(e.request).then(function (r) {
      if (r.ok) { var copia = r.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, copia); }); }
      return r;
    }).catch(function () { return guardado; });
    return guardado || red;
  }));
});
