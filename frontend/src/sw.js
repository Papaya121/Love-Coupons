/* eslint-disable no-restricted-globals */
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

const navigationHandler = createHandlerBoundToURL('/index.html')
registerRoute(
  new NavigationRoute(navigationHandler, {
    denylist: [/^\/api\//],
  })
)

const normalizePayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return {
      title: 'Love Coupons',
      body: 'У вас новое событие.',
      url: '/notifications',
    }
  }
  return {
    title: payload.title ?? 'Love Coupons',
    body: payload.body ?? 'У вас новое событие.',
    url: payload.url ?? '/notifications',
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    data: payload.data,
    actions: payload.actions,
    renotify: payload.renotify,
    requireInteraction: payload.requireInteraction,
  }
}

self.addEventListener('push', (event) => {
  let payload = null
  if (event.data) {
    try {
      payload = event.data.json()
    } catch (error) {
      payload = { body: event.data.text() }
    }
  }

  const data = normalizePayload(payload)
  const options = {
    body: data.body,
    icon: data.icon ?? '/pwa-192x192.png',
    badge: data.badge ?? '/pwa-192x192.png',
    tag: data.tag,
    data: { url: data.url, ...data.data },
    actions: Array.isArray(data.actions) ? data.actions : undefined,
    renotify: Boolean(data.renotify),
    requireInteraction: Boolean(data.requireInteraction),
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification?.data?.url || '/notifications'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client && client.url.includes(targetUrl)) {
            return client.focus()
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
        return undefined
      })
  )
})
