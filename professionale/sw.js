/* Service worker: avvisi nuovi lavori (raccoglitore professionale).
   Scope: /Scuola/professionale/ (o /professionale/ in locale). */
const FEED_URL = "./lavori-feed.json";
const PREFS_KEY = "prof-novita-v1";

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const target =
    (event.notification.data && event.notification.data.url) || "./";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (let i = 0; i < list.length; i += 1) {
        const client = list[i];
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            try {
              client.navigate(target);
            } catch (err) {
              /* ignore */
            }
          }
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});

self.addEventListener("message", function (event) {
  const data = event.data || {};
  if (data.type === "show-notification") {
    event.waitUntil(
      self.registration.showNotification(data.title || "Nuovo lavoro", {
        body: data.body || "",
        icon: data.icon || "../favicon.svg",
        badge: "../favicon.svg",
        tag: data.tag || "prof-novita",
        data: { url: data.url || "./" },
      })
    );
  }
  if (data.type === "check-feed") {
    event.waitUntil(controllaFeed(data.prefs || null));
  }
});

async function controllaFeed(prefs) {
  if (!prefs || !prefs.enabled || !prefs.anni || !prefs.anni.length) return;
  let lista = [];
  try {
    const res = await fetch(FEED_URL + "?t=" + Date.now(), {
      cache: "no-store",
      credentials: "omit",
    });
    if (!res.ok) return;
    lista = await res.json();
  } catch (err) {
    return;
  }
  if (!Array.isArray(lista)) return;

  const anni = prefs.anni.map(Number);
  const known = new Set(prefs.knownIds || []);
  const nuovi = lista.filter(function (item) {
    return (
      anni.indexOf(Number(item.annoProf)) !== -1 &&
      item.id &&
      !known.has(String(item.id))
    );
  });
  if (!nuovi.length) return;

  for (let i = 0; i < nuovi.length; i += 1) {
    const item = nuovi[i];
    const anno = Number(item.annoProf) === 3 ? "3ª" : "4ª";
    await self.registration.showNotification("Nuovo lavoro · " + anno, {
      body: item.titolo || item.id,
      icon: "../favicon.svg",
      badge: "../favicon.svg",
      tag: "prof-novita-" + item.id,
      data: {
        url: "../" + String(item.url || item.id + "/").replace(/^\//, ""),
      },
    });
    known.add(String(item.id));
  }

  const clientsList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  clientsList.forEach(function (client) {
    client.postMessage({
      type: "novita-known-update",
      knownIds: Array.from(known),
    });
  });
}
