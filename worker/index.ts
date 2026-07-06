// Custom service worker script compiled by next-pwa
const sw = self as any;

sw.addEventListener("push", (event: any) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options: any = {
      body: data.body || "Tienes un traslado programado.",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/"
      }
    };
    event.waitUntil(
      sw.registration.showNotification(data.title || "Recordatorio TourFlow", options)
    );
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      sw.registration.showNotification("Recordatorio TourFlow", {
        body: text,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        vibrate: [100, 50, 100],
        data: { url: "/" }
      } as any)
    );
  }
});

sw.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    sw.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList: any[]) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (sw.clients.openWindow) {
        return sw.clients.openWindow(targetUrl);
      }
    })
  );
});
