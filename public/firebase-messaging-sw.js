self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { title: "Project update", body: event.data.text() } };
  }
  const notification = payload.notification || payload.data || {};
  event.waitUntil(
    self.registration.showNotification(notification.title || "Orbit Projects", {
      body: notification.body || "There is new activity in your workspace.",
      icon: "/orbit-mark.svg",
      badge: "/orbit-mark.svg",
      tag: payload.data?.notificationId || "orbit-update",
      data: { route: payload.data?.route || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.route || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.startsWith(self.location.origin));
      if (existing) {
        existing.navigate(target);
        return existing.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
