// Custom service worker script compiled by next-pwa

self.addEventListener("push", (event: any) => {
  if (!event.data) return;

  const payloadText = event.data.text();
  let title = "Recordatorio TourFlow";
  let body = payloadText;
  let url = "/";

  try {
    const data = JSON.parse(payloadText);
    if (data.title) title = data.title;
    if (data.body) body = data.body;
    if (data.url) url = data.url;
  } catch (err) {
    // Si no es JSON, se usa el texto crudo como cuerpo
  }

  const options: any = {
    body: body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: { url }
  };

  event.waitUntil(
    (self as any).registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    (self as any).clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList: any[]) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if ((self as any).clients.openWindow) {
        return (self as any).clients.openWindow(targetUrl);
      }
    })
  );
});
