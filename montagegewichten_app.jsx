// Montagegewichten — PWA installatie en service worker (offline fallback: cached root)
// In deze versie: geen extra bestanden (icons, CSS, JS) toegevoegd aan cache
// Offline fallback-gedrag: bij gemiste resources toont de app de gecachte hoofdpagina ('./')

// --------------------
// Bestand: manifest.json
// --------------------
{
  "name": "Montagegewichten",
  "short_name": "Montagegewichten",
  "description": "Zoek gewichten per kraantype en gieklengte",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "./icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "./icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}

// --------------------
// Bestand: service-worker.js
// --------------------
(function () {
  'use strict';

  const CACHE_NAME = 'montagegewichten-cache-v1';
  const urlsToCache = [
    './',
    './index.html',
    './manifest.json'
  ];

  self.addEventListener('install', event => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache))
        .then(() => self.skipWaiting())
    );
  });

  self.addEventListener('activate', event => {
    event.waitUntil(
      caches.keys().then(keys =>
        Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        )
      ).then(() => self.clients.claim())
    );
  });

  self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        }).catch(() => caches.match('./'));
      })
    );
  });
})();

// --------------------
// Snippet: index.html toevoegingen
// --------------------
/* IN HEAD: */
// <link rel="manifest" href="./manifest.json">
// <meta name="theme-color" content="#2563eb">

/* VÓÓR </body>: */
/*
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./service-worker.js')
        .then(function(reg) { console.info('ServiceWorker geregistreerd, scope:', reg.scope); })
        .catch(function(err) { console.error('ServiceWorker registratie faalde:', err); });
    });
  }
</script>
*/


// --------------------
// Lokale testinstructies
// --------------------
// Om de PWA lokaal te testen, volg deze stappen:
// 1. Zorg dat je project correct buildt:
//    - Voor React (Vite of CRA): run `npm run build`
// 2. Start een lokale server vanuit de build- of dist-map (NIET met `file://`):
//    - Bijvoorbeeld met Vite: `npm run preview`
//    - Of met een eenvoudige server: `npx serve -s build` of `python -m http.server`
// 3. Open de app in je browser (bijv. http://localhost:4173 of http://localhost:5000)
// 4. Open de DevTools (F12) → tabblad *Application* → sectie *Service Workers*:
//    - Controleer dat de service worker actief is.
// 5. Voeg de app toe aan het startscherm op Android via Chrome-menu → 'Toevoegen aan startscherm'.
// 6. Zet je netwerk tijdelijk uit (offline) en herlaad de app:
//    - De app zou nu nog steeds de laatst bezochte pagina tonen (fallback naar cached root).
//
// ✅ Als dit alles werkt, is je PWA correct ingesteld en klaar voor publicatie!
