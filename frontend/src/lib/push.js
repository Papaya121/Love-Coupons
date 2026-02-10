import { apiRequest } from './api'

const SUBSCRIPTION_STORAGE_KEY = 'love-coupon-push-subscription'

const isPushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

const getPushPermission = () => {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const getServiceWorkerRegistration = async (timeoutMs = 5000) => {
  if (!('serviceWorker' in navigator)) return null
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) return existing
  const timeout = new Promise((resolve) => {
    window.setTimeout(() => resolve(null), timeoutMs)
  })
  const registration = await Promise.race([navigator.serviceWorker.ready, timeout])
  return registration ?? null
}

const getPushSubscription = async () => {
  const registration = await getServiceWorkerRegistration()
  if (!registration) return null
  return registration.pushManager.getSubscription()
}

const requestNotificationPermission = async () => {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

const fetchVapidPublicKey = async () => {
  const payload = await apiRequest('/push/vapid-public-key')
  return payload?.key ?? null
}

const persistSubscription = (subscription) => {
  try {
    if (!subscription) {
      localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY)
      return
    }
    const payload = subscription.toJSON ? subscription.toJSON() : subscription
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    // ignore storage errors
  }
}

const subscribeToPush = async () => {
  if (!isPushSupported()) {
    throw new Error('Push-уведомления не поддерживаются в этом браузере.')
  }

  const permission = await requestNotificationPermission()
  if (permission !== 'granted') {
    throw new Error('Разрешите уведомления в настройках браузера.')
  }

  const registration = await getServiceWorkerRegistration()
  if (!registration) {
    throw new Error('Service worker еще не готов. Попробуйте позже.')
  }

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    const vapidKey = await fetchVapidPublicKey()
    if (!vapidKey) {
      throw new Error('VAPID ключ не найден. Проверьте backend.')
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
  }

  persistSubscription(subscription)
  return subscription
}

const unsubscribeFromPush = async () => {
  const subscription = await getPushSubscription()
  if (!subscription) {
    persistSubscription(null)
    return false
  }
  const result = await subscription.unsubscribe()
  persistSubscription(null)
  return result
}

export {
  isPushSupported,
  getPushPermission,
  getPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
}
