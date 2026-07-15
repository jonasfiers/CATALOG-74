import client from '../api/client'

const urlBase64ToUint8Array = base64 => {
    const padded = base64.replace(/-/g, '+').replace(/_/g, '/').padEnd(
        base64.length + (4 - base64.length % 4) % 4, '='
    )
    return Uint8Array.from(atob(padded), c => c.charCodeAt(0))
}

const getActiveRegistration = async () => {
    console.log('[sw] getActiveRegistration start')
    let reg = await navigator.serviceWorker.getRegistration('/')
    console.log('[sw] existing reg active:', reg?.active?.state, 'installing:', reg?.installing?.state, 'waiting:', reg?.waiting?.state)
    if (!reg) {
        console.log('[sw] no registration found, registering /sw.js')
        await navigator.serviceWorker.register('/sw.js')
    }
    const active = await withTimeout(
        navigator.serviceWorker.ready,
        12000,
        'service worker activation'
    )
    console.log('[sw] ready resolved, active state:', active?.active?.state)
    return active
}

const withTimeout = (promise, ms, label) =>
    Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out: ${label}`)), ms))
    ])

export const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported in this browser.')
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
        throw new Error('Notification permission denied.')
    }

    const reg = await getActiveRegistration()

    const { data } = await withTimeout(client.get('/notifications/vapid-key'), 8000, 'vapid-key fetch')
    let subscription
    try {
        subscription = await withTimeout(
            reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(data.publicKey)
            }),
            8000,
            'pushManager.subscribe'
        )
    } catch {
        const stale = await reg.pushManager.getSubscription()
        if (stale) await stale.unsubscribe()
        subscription = await withTimeout(
            reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(data.publicKey)
            }),
            8000,
            'pushManager.subscribe'
        )
    }

    await withTimeout(client.post('/notifications/subscribe', { subscription }), 8000, 'save subscription')
    return subscription
}

export const unsubscribeFromPush = async () => {
    if (!('serviceWorker' in navigator)) return
    const reg = await navigator.serviceWorker.getRegistration('/')
    if (!reg) return
    const subscription = await reg.pushManager.getSubscription()
    if (!subscription) return
    await Promise.allSettled([
        client.delete('/notifications/subscribe', { data: { endpoint: subscription.endpoint } }),
        subscription.unsubscribe(),
    ])
}

export const isPushSubscribed = async () => {
    if (!('serviceWorker' in navigator)) return false
    const reg = await navigator.serviceWorker.getRegistration('/')
    if (!reg) return false
    const sub = await reg.pushManager.getSubscription()
    return !!sub
}
