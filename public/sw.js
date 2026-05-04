const CACHE_NAME = "croplet-web-shell-v4";
const APP_SHELL = [
  "/web",
  "/manifest.webmanifest",
  "/site.webmanifest",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
];
const OFFLINE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Croplet</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f4f7f4;
        color: #16302b;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      main {
        max-width: 28rem;
        padding: 2rem;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Croplet is offline</h1>
      <p>Open Croplet once while online so the app shell can be saved for offline use.</p>
    </main>
  </body>
</html>`;

function updateCache(request, response) {
  if (!response.ok) {
    return;
  }

  const copy = response.clone();
  void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }

          return Promise.resolve(false);
        }),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate" && requestUrl.pathname === "/web") {
    event.respondWith(
      caches.match("/web").then((cachedResponse) => {
        const networkResponse = fetch(event.request)
          .then((response) => {
            updateCache("/web", response);
            return response;
          })
          .catch(
            () =>
              cachedResponse ??
              new Response(OFFLINE_HTML, {
                headers: { "Content-Type": "text/html; charset=utf-8" },
              }),
          );

        return cachedResponse ?? networkResponse;
      }),
    );
    return;
  }

  if (requestUrl.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          updateCache(event.request, response);
          return response;
        });
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (
          response.ok &&
          requestUrl.origin === self.location.origin &&
          (requestUrl.pathname === "/web" || APP_SHELL.includes(requestUrl.pathname))
        ) {
          updateCache(event.request, response);
        }

        return response;
      });
    }),
  );
});
