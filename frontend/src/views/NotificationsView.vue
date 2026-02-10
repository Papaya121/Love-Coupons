<template>
  <section class="view">
    <header class="view-header">
      <p class="view-eyebrow">Coupons for Couples</p>
      <h1 class="view-title">Уведомления</h1>
    </header>

    <div class="notice-summary">
      <div class="notice-summary__card">
        <p class="notice-summary__label">Новые события</p>
        <p class="notice-summary__value">{{ unreadCount }}</p>
      </div>
      <div class="notice-summary__card">
        <p class="notice-summary__label">За 7 дней</p>
        <p class="notice-summary__value">{{ lastSevenDaysCount }}</p>
      </div>
    </div>

    <section v-if="pushSupported === true" class="notice-push-card">
      <div class="notice-push-row">
        <div>
          <p class="notice-push-label">Push-уведомления</p>
          <p class="notice-push-title">Новые события без ожидания</p>
        </div>
        <span class="notice-push-status" :class="pushStatusClass">
          {{ pushStatusLabel }}
        </span>
      </div>
      <p class="notice-push-text">{{ pushHint }}</p>
      <div class="notice-push-actions">
        <button
          type="button"
          class="secondary-button"
          :disabled="pushButtonDisabled"
          @click="handlePushToggle"
        >
          {{
            pushLoading
              ? pushSubscription
                ? 'Отключаем...'
                : 'Подключаем...'
              : pushButtonLabel
          }}
        </button>
        <button
          v-if="pushSubscription"
          type="button"
          class="secondary-button"
          :disabled="pushTestLoading"
          @click="handlePushTest"
        >
          {{ pushTestLoading ? 'Отправляем...' : 'Тестовый push' }}
        </button>
      </div>
      <p v-if="pushError" class="helper-text helper-text--error">{{ pushError }}</p>
      <p v-if="pushSuccess" class="helper-text helper-text--success">{{ pushSuccess }}</p>
      <p v-if="pushTestError" class="helper-text helper-text--error">{{ pushTestError }}</p>
      <p v-if="pushTestSuccess" class="helper-text helper-text--success">
        {{ pushTestSuccess }}
      </p>
    </section>
    <p v-else-if="pushSupported === false" class="helper-text helper-text--error">
      Push-уведомления недоступны в этом браузере.
    </p>

    <div class="notice-tabs segment-control" role="tablist" aria-label="Фильтр уведомлений">
      <button
        class="segment-control__button"
        :class="{ 'is-active': viewMode === 'inbox' }"
        role="tab"
        :aria-selected="viewMode === 'inbox'"
        @click="viewMode = 'inbox'"
      >
        Входящие
      </button>
      <button
        class="segment-control__button"
        :class="{ 'is-active': viewMode === 'archive' }"
        role="tab"
        :aria-selected="viewMode === 'archive'"
        @click="viewMode = 'archive'"
      >
        Архив
      </button>
    </div>

    <div class="notice-groups">
      <p v-if="showLoading" class="helper-text">
        Загружаем события...
      </p>
      <p v-else-if="loadError" class="helper-text helper-text--error">
        {{ loadError }}
      </p>
      <template v-else>
        <section
          v-for="group in grouped"
          :key="group.label"
          class="notice-group"
        >
          <header class="notice-group__header">
            <h2 class="notice-group__title">{{ group.label }}</h2>
            <span class="notice-group__count">{{ group.items.length }}</span>
          </header>

          <div class="notice-list">
            <article
              v-for="item in group.items"
              :key="item.id"
              class="notice-item"
              :class="{ 'notice-item--unread': item.unread }"
              role="button"
              tabindex="0"
              ref="noticeItems"
              :data-id="item.id"
              @click="openDetails(item)"
              @keydown.enter.prevent="openDetails(item)"
              @keydown.space.prevent="openDetails(item)"
            >
              <div class="notice-icon" :class="`notice-icon--${item.type}`">
                <span aria-hidden="true">{{ item.icon }}</span>
              </div>
              <div class="notice-content">
                <p class="notice-title">{{ item.title }}</p>
                <p class="notice-text">{{ item.text }}</p>
                <div class="notice-meta">
                  <span class="notice-time">{{ item.time }}</span>
                  <span v-if="item.status" class="notice-status">
                    {{ item.status }}
                  </span>
                </div>
              </div>
            </article>
          </div>
        </section>
      </template>
    </div>

    <p v-if="!showLoading && !loadError && filteredNotifications.length === 0" class="helper-text">
      Пока нет событий.
    </p>

    <div
      v-if="selectedNotification"
      class="redeem-sheet"
      role="dialog"
      aria-modal="true"
    >
      <div class="redeem-sheet__backdrop" @click="closeDetails"></div>
      <div class="redeem-sheet__panel">
        <button class="notice-close" type="button" @click="closeDetails">
          Закрыть
        </button>
        <p class="redeem-sheet__eyebrow">Детали события</p>
        <h2 class="redeem-sheet__title">{{ detailTitle }}</h2>
        <p class="redeem-sheet__text">
          {{ detailSubtitle }}
        </p>
        <div class="notice-detail-list">
          <div
            v-for="line in detailLines"
            :key="line.label"
            class="notice-detail-line"
          >
            <span class="notice-detail-label">{{ line.label }}</span>
            <span class="notice-detail-value">{{ line.value }}</span>
          </div>
        </div>
        <div class="notice-actions">
          <button
            v-if="!isSelectedArchived"
            class="secondary-button"
            :disabled="archiveLoading"
            @click="archiveSelected"
          >
            {{ archiveButtonLabel }}
          </button>
          <button
            v-if="isSelectedArchived"
            class="secondary-button"
            :disabled="unarchiveLoading"
            @click="unarchiveSelected"
          >
            {{ unarchiveButtonLabel }}
          </button>
        </div>
        <p v-if="detailLoading" class="helper-text">Загружаем детали...</p>
        <p v-else-if="detailError" class="helper-text helper-text--error">
          {{ detailError }}
        </p>
        <p v-else-if="archiveError" class="helper-text helper-text--error">
          {{ archiveError }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'
import { usePartners } from '../lib/partners'
import {
  getPushPermission,
  getPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/push'

const { token, user } = useAuth()
const { users, refreshUsers } = usePartners()

const notifications = ref([])
const cachedRaw = ref([])
const isLoading = ref(false)
const loadError = ref('')
const CACHE_KEY = 'love-coupon-notifications'
const OPENED_KEY = 'love-coupon-notifications-opened'
const openedOnce = ref(new Set())
const viewMode = ref('inbox')
const couponTitles = ref(new Map())
const pushSupported = ref(null)
const pushPermission = ref('default')
const pushSubscription = ref(null)
const pushLoading = ref(false)
const pushError = ref('')
const pushSuccess = ref('')
const pushTestLoading = ref(false)
const pushTestError = ref('')
const pushTestSuccess = ref('')

const TYPE_META = {
  coupon: {
    icon: '🎟️',
    title: 'Новый купон',
    text: 'Партнер добавил новый купон в список.',
  },
  invite: {
    icon: '🤝',
    title: 'Приглашение',
    text: 'Партнер отправил приглашение на привязку.',
  },
  redeem: {
    icon: '✨',
    title: 'Купон использован',
    text: 'Партнер применил один из купонов.',
  },
  system: {
    icon: '🔔',
    title: 'Системное сообщение',
    text: 'Новая активность в приложении.',
  },
}

const STATUS_LABELS = {
  new: 'Новый',
  seen: 'Просмотрено',
  archived: 'Архив',
}

const INVITE_STATUS_LABELS = {
  available: 'Ожидает ответа',
  accepted: 'Принято',
  declined: 'Отклонено',
}

const showLoading = computed(
  () => isLoading.value && notifications.value.length === 0 && !loadError.value
)

const pushStatusLabel = computed(() => {
  if (pushSupported.value !== true) return 'Недоступно'
  if (pushPermission.value === 'denied') return 'Запрещено'
  if (pushSubscription.value) return 'Включено'
  return 'Выключено'
})

const pushStatusClass = computed(() => {
  if (pushSupported.value !== true) return 'notice-push-status--off'
  if (pushPermission.value === 'denied') return 'notice-push-status--blocked'
  if (pushSubscription.value) return 'notice-push-status--on'
  return 'notice-push-status--off'
})

const pushButtonLabel = computed(() => {
  if (pushSupported.value !== true) return 'Недоступно'
  if (pushPermission.value === 'denied') return 'Разрешите в настройках'
  if (pushSubscription.value) return 'Отключить push'
  return 'Включить push'
})

const pushButtonDisabled = computed(() => {
  if (pushSupported.value !== true) return true
  return pushLoading.value || pushPermission.value === 'denied'
})

const pushHint = computed(() => {
  if (pushSupported.value !== true) {
    return 'Браузер не поддерживает push-уведомления.'
  }
  if (pushPermission.value === 'denied') {
    return 'Разрешите уведомления в настройках браузера, чтобы получать новые события.'
  }
  if (pushSubscription.value) {
    return 'Мы будем присылать уведомления о новых событиях.'
  }
  return 'Включите push, чтобы не пропускать новые уведомления.'
})

const refreshPushState = async () => {
  pushSupported.value = isPushSupported()
  if (!pushSupported.value) return
  pushPermission.value = getPushPermission()
  try {
    pushSubscription.value = await getPushSubscription()
  } catch (error) {
    pushSubscription.value = null
  }
}

const buildSubscriptionPayload = (subscription) => {
  if (!subscription) return null
  const payload = subscription.toJSON ? subscription.toJSON() : subscription
  if (!payload?.endpoint || !payload?.keys?.p256dh || !payload?.keys?.auth) {
    return null
  }
  return {
    endpoint: payload.endpoint,
    keys: {
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
    },
  }
}

const registerPushOnServer = async (subscription) => {
  if (!token.value) {
    throw new Error('Сначала войдите в аккаунт.')
  }
  const body = buildSubscriptionPayload(subscription)
  if (!body) {
    throw new Error('Не удалось получить данные подписки.')
  }
  await apiRequest('/push/subscribe', {
    method: 'POST',
    token: token.value,
    body,
  })
}

const unregisterPushOnServer = async (subscription) => {
  if (!token.value) {
    throw new Error('Сначала войдите в аккаунт.')
  }
  const body = buildSubscriptionPayload(subscription)
  if (!body) return
  await apiRequest('/push/unsubscribe', {
    method: 'DELETE',
    token: token.value,
    body: { endpoint: body.endpoint },
  })
}

const sendTestPush = async () => {
  if (!token.value) {
    throw new Error('Сначала войдите в аккаунт.')
  }
  await apiRequest('/push/test', {
    method: 'POST',
    token: token.value,
  })
}

const enablePush = async () => {
  pushLoading.value = true
  pushError.value = ''
  pushSuccess.value = ''
  try {
    const subscription = await subscribeToPush()
    await registerPushOnServer(subscription)
    pushSubscription.value = subscription
    pushPermission.value = getPushPermission()
    pushSuccess.value = 'Push-уведомления включены.'
  } catch (error) {
    await unsubscribeFromPush()
    pushSubscription.value = null
    pushError.value = error?.message ?? 'Не удалось включить push.'
  } finally {
    pushLoading.value = false
  }
}

const disablePush = async () => {
  pushLoading.value = true
  pushError.value = ''
  pushSuccess.value = ''
  try {
    const subscription = pushSubscription.value ?? (await getPushSubscription())
    if (subscription) {
      try {
        await unregisterPushOnServer(subscription)
      } catch (error) {
        pushError.value = error?.message ?? 'Не удалось отключить push на сервере.'
      }
    }
    await unsubscribeFromPush()
    await refreshPushState()
    pushSuccess.value = 'Push-уведомления выключены.'
  } catch (error) {
    pushError.value = error?.message ?? 'Не удалось выключить push.'
  } finally {
    pushLoading.value = false
  }
}

const handlePushToggle = async () => {
  if (pushSubscription.value) {
    await disablePush()
  } else {
    await enablePush()
  }
}

const handlePushTest = async () => {
  pushTestLoading.value = true
  pushTestError.value = ''
  pushTestSuccess.value = ''
  try {
    await sendTestPush()
    pushTestSuccess.value = 'Тестовый push отправлен.'
  } catch (error) {
    pushTestError.value = error?.message ?? 'Не удалось отправить тестовый push.'
  } finally {
    pushTestLoading.value = false
  }
}

const isSameDay = (left, right) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()

const isYesterday = (date) => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  return isSameDay(date, yesterday)
}

const formatTime = (value) => {
  try {
    const date = new Date(value)
    const now = new Date()
    const time = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
    if (isSameDay(date, now)) {
      return `Сегодня, ${time}`
    }
    if (isYesterday(date)) {
      return `Вчера, ${time}`
    }
    const datePart = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    })
    return `${datePart}, ${time}`
  } catch (error) {
    return ''
  }
}

const groupLabel = (value) => {
  const date = new Date(value)
  const now = new Date()
  if (isSameDay(date, now)) return 'Сегодня'
  if (isYesterday(date)) return 'Вчера'
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 6) return 'На этой неделе'
  return 'Ранее'
}

const formatCouponText = (title) => `Новый купон "${title}"`

const setCouponTitle = (id, title) => {
  if (!id || !title) return
  if (couponTitles.value.get(id) === title) return
  const next = new Map(couponTitles.value)
  next.set(id, title)
  couponTitles.value = next
}

const applyCouponTitles = () => {
  notifications.value = notifications.value.map((item) => {
    if (item.type !== 'coupon' || !item.payloadId) return item
    const title = couponTitles.value.get(item.payloadId)
    if (!title) return item
    const text = formatCouponText(title)
    if (item.text === text) return item
    return { ...item, text }
  })
}

const mapNotification = (item) => {
  const meta = TYPE_META[item.type] ?? TYPE_META.system
  const payloadId =
    item?.data?.couponId ?? item?.data?.redeemId ?? item?.data?.inviteId ?? null
  const couponTitle =
    item.type === 'coupon' && payloadId
      ? couponTitles.value.get(payloadId)
      : null
  return {
    id: item.id,
    type: item.type ?? 'system',
    icon: meta.icon,
    title: meta.title,
    text: couponTitle ? formatCouponText(couponTitle) : meta.text,
    time: formatTime(item.createdAt),
    status: STATUS_LABELS[item.status] ?? '',
    statusRaw: item.status ?? '',
    unread: item.status === 'new',
    group: groupLabel(item.createdAt),
    createdAt: item.createdAt,
    data: item?.data ?? null,
    payloadId,
  }
}

const hydrateCouponTitles = async (items) => {
  const ids = [
    ...new Set(
      items
        .filter((item) => item.type === 'coupon' && item.payloadId)
        .map((item) => item.payloadId)
    ),
  ].filter((id) => !couponTitles.value.has(id))
  if (ids.length === 0) return

  const tokenValue = token.value ?? undefined
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const coupon = await apiRequest(`/coupons/${id}`, { token: tokenValue })
        if (coupon?.title) return [id, coupon.title]
      } catch (error) {
        return null
      }
      return null
    })
  )

  const next = new Map(couponTitles.value)
  let changed = false
  results.forEach((entry) => {
    if (!entry) return
    const [id, title] = entry
    if (next.has(id)) return
    next.set(id, title)
    changed = true
  })
  if (changed) {
    couponTitles.value = next
    applyCouponTitles()
  }
}

const loadCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      cachedRaw.value = parsed
      notifications.value = parsed.map(mapNotification)
      hydrateCouponTitles(notifications.value)
    }
  } catch (error) {
    sessionStorage.removeItem(CACHE_KEY)
  }
}

const loadOpenedOnce = () => {
  try {
    const raw = sessionStorage.getItem(OPENED_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      openedOnce.value = new Set(parsed.filter((id) => typeof id === 'string'))
    }
  } catch (error) {
    sessionStorage.removeItem(OPENED_KEY)
  }
}

const saveOpenedOnce = () => {
  sessionStorage.setItem(OPENED_KEY, JSON.stringify([...openedOnce.value]))
}

const saveCache = (payload) => {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  cachedRaw.value = payload
}

const payloadChanged = (payload) => {
  try {
    return JSON.stringify(payload) !== JSON.stringify(cachedRaw.value)
  } catch (error) {
    return true
  }
}

const fetchNotifications = async ({ background = false } = {}) => {
  if (!background) {
    isLoading.value = true
    loadError.value = ''
  }
  try {
    const payload = await apiRequest('/notifications', {
      token: token.value ?? undefined,
    })
    if (Array.isArray(payload)) {
      if (payloadChanged(payload)) {
        notifications.value = payload.map(mapNotification)
        saveCache(payload)
        await hydrateCouponTitles(notifications.value)
      }
    } else {
      notifications.value = []
    }
  } catch (error) {
    if (!background || notifications.value.length === 0) {
      loadError.value = error?.message || 'Не удалось загрузить события.'
    }
  } finally {
    isLoading.value = false
  }
}

const filteredNotifications = computed(() => {
  if (viewMode.value === 'archive') {
    return notifications.value.filter((item) => item.statusRaw === 'archived')
  }
  return notifications.value.filter((item) => item.statusRaw !== 'archived')
})

const grouped = computed(() => {
  const order = ['Сегодня', 'Вчера', 'На этой неделе', 'Ранее']
  return order
    .map((label) => ({
      label,
      items: filteredNotifications.value
        .filter((item) => item.group === label)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    }))
    .filter((group) => group.items.length > 0)
})

const unreadCount = computed(
  () =>
    notifications.value.filter(
      (item) => item.statusRaw !== 'archived' && item.unread
    ).length
)

const lastSevenDaysCount = computed(() => {
  const now = new Date()
  return notifications.value.filter((item) => {
    if (item.statusRaw === 'archived') return false
    const created = new Date(item.createdAt)
    const diffMs = now.getTime() - created.getTime()
    return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000
  }).length
})

const selectedNotification = ref(null)
const detailData = ref(null)
const detailLoading = ref(false)
const detailError = ref('')
const archiveLoading = ref(false)
const archiveError = ref('')
const unarchiveLoading = ref(false)
const detailCache = ref({})
const invitesCache = ref({ sent: [], received: [], loaded: false })
const noticeItems = ref([])
let noticeObserver = null
const seenInFlight = new Set()
const archiveInFlight = new Set()
const unarchiveInFlight = new Set()

const usersById = computed(() => {
  const map = new Map()
  users.value.forEach((item) => {
    if (item?.id) map.set(item.id, item)
  })
  return map
})

const resolveUserLabel = (id) => {
  if (!id) return 'Неизвестно'
  if (id === user.value?.id) return 'Вы'
  const profile = usersById.value.get(id)
  if (!profile) return id
  const name = profile.name ? ` · ${profile.name}` : ''
  return `@${profile.login}${name}`
}

const ensureUsers = async () => {
  if (users.value.length > 0) return
  try {
    await refreshUsers(token.value ?? undefined)
  } catch (error) {
    // silently ignore; fallback to ids
  }
}

const fetchInviteDetails = async (inviteId) => {
  if (!inviteId) return null
  if (!invitesCache.value.loaded) {
    const [sent, received] = await Promise.all([
      apiRequest('/couples/invite/sended', { token: token.value ?? undefined }),
      apiRequest('/couples/invite/recieved', { token: token.value ?? undefined }),
    ])
    invitesCache.value = {
      sent: Array.isArray(sent) ? sent : [],
      received: Array.isArray(received) ? received : [],
      loaded: true,
    }
  }
  const allInvites = [...invitesCache.value.sent, ...invitesCache.value.received]
  return allInvites.find((invite) => invite?.id === inviteId) ?? null
}

const fetchNotificationDetails = async (item) => {
  if (!item) return null
  const payloadId = item.payloadId
  if ((item.type === 'coupon' || item.type === 'redeem') && payloadId) {
    const coupon = await apiRequest(`/coupons/${payloadId}`, {
      token: token.value ?? undefined,
    })
    if (coupon?.title) {
      setCouponTitle(payloadId, coupon.title)
      applyCouponTitles()
    }
    return { kind: 'coupon', coupon }
  }
  if (item.type === 'invite' && payloadId) {
    const invite = await fetchInviteDetails(payloadId)
    return { kind: 'invite', invite }
  }
  return { kind: 'system' }
}

const updateLocalStatus = (id, status) => {
  const label = STATUS_LABELS[status] ?? ''
  notifications.value = notifications.value.map((item) => {
    if (item.id !== id) return item
    return {
      ...item,
      statusRaw: status,
      status: label,
      unread: status === 'new',
    }
  })
  if (selectedNotification.value?.id === id) {
    selectedNotification.value = {
      ...selectedNotification.value,
      statusRaw: status,
      status: label,
      unread: status === 'new',
    }
  }
}

const updateCacheStatus = (id, status, readAt = null) => {
  if (!Array.isArray(cachedRaw.value) || cachedRaw.value.length === 0) return
  const updated = cachedRaw.value.map((item) => {
    if (item.id !== id) return item
    return {
      ...item,
      status,
      readAt: readAt ?? item.readAt ?? null,
    }
  })
  saveCache(updated)
}

const markSeen = async (item) => {
  if (!item || item.statusRaw !== 'new') return
  if (seenInFlight.has(item.id)) return
  seenInFlight.add(item.id)
  try {
    await apiRequest(`/notifications/see/${item.id}`, {
      method: 'POST',
      token: token.value ?? undefined,
    })
    if (openedOnce.value.has(item.id)) {
      const now = new Date().toISOString()
      updateLocalStatus(item.id, 'seen')
      updateCacheStatus(item.id, 'seen', now)
    } else {
      openedOnce.value.add(item.id)
      saveOpenedOnce()
    }
  } catch (error) {
    // ignore to avoid blocking UI on transient errors
  } finally {
    seenInFlight.delete(item.id)
  }
}

const openDetails = async (item) => {
  selectedNotification.value = item
  detailError.value = ''
  archiveError.value = ''
  detailData.value = null
  await markSeen(item)
  await ensureUsers()
  if (detailCache.value[item.id]) {
    detailData.value = detailCache.value[item.id]
    return
  }
  detailLoading.value = true
  try {
    const details = await fetchNotificationDetails(item)
    detailData.value = details
    detailCache.value = { ...detailCache.value, [item.id]: details }
  } catch (error) {
    detailError.value = error?.message || 'Не удалось загрузить детали.'
  } finally {
    detailLoading.value = false
  }
}

const closeDetails = () => {
  selectedNotification.value = null
  detailData.value = null
  detailError.value = ''
  archiveError.value = ''
}

const detailTitle = computed(() => {
  if (!selectedNotification.value) return ''
  return selectedNotification.value.title
})

const detailSubtitle = computed(() => {
  if (!selectedNotification.value) return ''
  return selectedNotification.value.text
})

const detailLines = computed(() => {
  const item = selectedNotification.value
  if (!item) return []
  const lines = []
  if (item.time) lines.push({ label: 'Время', value: item.time })

  const details = detailData.value
  if (details?.kind === 'coupon') {
    const coupon = details.coupon
    if (coupon?.description)
      lines.push({ label: 'Описание', value: coupon.description })
    if (coupon?.authorId)
      lines.push({ label: 'Отправитель', value: resolveUserLabel(coupon.authorId) })
  }
  if (details?.kind === 'invite') {
    const invite = details.invite
    if (invite?.senderId)
      lines.push({ label: 'Отправитель', value: resolveUserLabel(invite.senderId) })
    if (invite?.recieverId)
      lines.push({
        label: 'Получатель',
        value: resolveUserLabel(invite.recieverId),
      })
    if (invite?.status)
      lines.push({
        label: 'Статус приглашения',
        value: INVITE_STATUS_LABELS[invite.status] ?? invite.status,
      })
  }

  if (lines.length === 0) {
    return [{ label: 'Детали', value: 'Нет дополнительной информации.' }]
  }
  return lines
})

const isSelectedArchived = computed(
  () => selectedNotification.value?.statusRaw === 'archived'
)

const archiveButtonLabel = computed(() => {
  if (archiveLoading.value) return 'Переносим в архив...'
  return 'Убрать в архив'
})

const archiveSelected = async () => {
  const item = selectedNotification.value
  if (!item || item.statusRaw === 'archived') return
  if (archiveInFlight.has(item.id)) return
  archiveInFlight.add(item.id)
  archiveLoading.value = true
  archiveError.value = ''
  try {
    await apiRequest(`/notifications/archive/${item.id}`, {
      method: 'POST',
      token: token.value ?? undefined,
    })
    updateLocalStatus(item.id, 'archived')
    updateCacheStatus(item.id, 'archived')
  } catch (error) {
    archiveError.value = error?.message || 'Не удалось перенести в архив.'
  } finally {
    archiveLoading.value = false
    archiveInFlight.delete(item.id)
  }
}

const unarchiveButtonLabel = computed(() => {
  if (unarchiveLoading.value) return 'Возвращаем из архива...'
  return 'Разархивировать'
})

const unarchiveSelected = async () => {
  const item = selectedNotification.value
  if (!item || item.statusRaw !== 'archived') return
  if (unarchiveInFlight.has(item.id)) return
  unarchiveInFlight.add(item.id)
  unarchiveLoading.value = true
  archiveError.value = ''
  try {
    await apiRequest(`/notifications/see/${item.id}`, {
      method: 'POST',
      token: token.value ?? undefined,
    })
    const now = new Date().toISOString()
    updateLocalStatus(item.id, 'seen')
    updateCacheStatus(item.id, 'seen', now)
  } catch (error) {
    archiveError.value = error?.message || 'Не удалось разархивировать.'
  } finally {
    unarchiveLoading.value = false
    unarchiveInFlight.delete(item.id)
  }
}

const handleIntersect = (entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return
    const id = entry.target?.dataset?.id
    if (!id) return
    const item = notifications.value.find((notice) => notice.id === id)
    if (!item || item.statusRaw !== 'new') return
    markSeen(item)
  })
}

const observeNotices = async () => {
  await nextTick()
  if (!noticeObserver) {
    noticeObserver = new IntersectionObserver(handleIntersect, {
      threshold: 0.6,
    })
  }
  noticeObserver.disconnect()
  const elements = Array.isArray(noticeItems.value) ? noticeItems.value : []
  elements.forEach((element) => {
    if (element?.dataset?.id) noticeObserver.observe(element)
  })
}

if (typeof window !== 'undefined') {
  loadCache()
  loadOpenedOnce()
}

onMounted(() => {
  const hasCache = notifications.value.length > 0
  fetchNotifications({ background: hasCache })
  observeNotices()
  refreshPushState()
})

watch(notifications, () => {
  observeNotices()
})

onBeforeUnmount(() => {
  if (noticeObserver) {
    noticeObserver.disconnect()
    noticeObserver = null
  }
})
</script>
