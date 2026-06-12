"use strict";

const CACHE_NAME = "mycoachnutri-v14";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=14",
  "./app.js?v=14",
  "./manifest.json?v=14"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );

  // Force le nouveau service worker à passer en attente d'activation immédiatement.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              const isAppCache = cacheName.startsWith("objectif-equilibre-") || cacheName.startsWith("mycoachnutri-");
              return isAppCache && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (isCoreRequest(event.request)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

function isCoreRequest(request) {
  const url = new URL(request.url);
  const corePaths = ["/", "/index.html", "/style.css", "/app.js", "/manifest.json"];
  return request.mode === "navigate" || corePaths.some((path) => url.pathname.endsWith(path));
}

// Fichiers principaux : internet d'abord pour récupérer GitHub Pages à jour, cache seulement si hors ligne.
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const freshResponse = await fetch(request, { cache: "no-store" });
    if (freshResponse.ok) {
      await cache.put(request, freshResponse.clone());
    }
    return freshResponse;
  } catch {
    const cachedResponse = await cache.match(request, { ignoreSearch: true });
    return cachedResponse || cache.match("./index.html");
  }
}

// Autres ressources : cache d'abord pour garder un usage hors ligne simple.
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response("", { status: 504, statusText: "Offline" });
  }
}
