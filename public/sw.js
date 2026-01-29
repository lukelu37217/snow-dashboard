/**
 * Service Worker for Snow Dashboard Push Notifications
 *
 * Handles:
 * - Push notification display
 * - Notification click actions
 * - Background sync for alert checking
 */

// Cache version for updates
const SW_VERSION = '1.0.0';

// Listen for push events from the server
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {
    title: 'Snow Alert',
    body: 'New weather alert received',
    icon: '/snow-icon.png',
    badge: '/badge-icon.png',
    tag: 'snow-alert',
    url: '/'
  };

  // Try to parse push data
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      // If not JSON, use text
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/snow-icon.png',
    badge: data.badge || '/badge-icon.png',
    tag: data.tag || 'snow-alert',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    requireInteraction: data.urgent || false,
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open the app or focus existing window
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// Service Worker install
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', SW_VERSION);
  self.skipWaiting();
});

// Service Worker activate
self.addEventListener('activate', (event) => {
  console.log('[SW] Activated version:', SW_VERSION);
  event.waitUntil(clients.claim());
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});
