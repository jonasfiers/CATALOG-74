self._wbManifest = self.__WB_MANIFEST

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(clients.claim()))

self.addEventListener('push', event => {
    const data = event.data?.json()
    if (!data) return
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.icon ? `${data.icon} ${data.body}` : data.body,
            data: { url: data.url }
        })
    )
})

self.addEventListener('notificationclick', event => {
    event.notification.close()
    const target = self.location.origin + (event.notification.data?.url || '/')
    event.waitUntil(clients.openWindow(target))
})