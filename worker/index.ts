/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener("push", (event) => {
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

  const options: NotificationOptions = {
    body: body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: { url }
  } as unknown as NotificationOptions;

  event.waitUntil(
    sw.registration.showNotification(title, options)
  );
});

sw.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data as { url?: string } | undefined)?.url || "/";
  event.waitUntil(
    sw.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return (client as WindowClient).focus();
        }
      }
      if (sw.clients.openWindow) {
        return sw.clients.openWindow(targetUrl);
      }
    })
  );
});
