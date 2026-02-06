<template>
  <section class="view">
    <header class="view-header">
      <p class="view-eyebrow">Новый купон</p>
      <h1 class="view-title">Создать</h1>
    </header>

    <form class="form-card" @submit.prevent="handleCreate">
      <p v-if="createError" class="helper-text helper-text--error">
        {{ createError }}
      </p>
      <p v-else-if="createSuccess" class="helper-text helper-text--success">
        Купон отправлен партнеру.
      </p>
      <fieldset class="form-fields" :disabled="!partnerId">
        <label class="field">
          <span class="field-label">Название</span>
          <input
            v-model="title"
            class="field-input"
            type="text"
            placeholder="Например: Ужин при свечах"
            maxlength="80"
            required
          />
        </label>

        <label class="field">
          <span class="field-label">Описание</span>
          <textarea
            v-model="description"
            class="field-input field-textarea"
            rows="4"
            placeholder="Пара тёплых строк о купоне"
            maxlength="280"
          ></textarea>
        </label>

        <label class="field">
          <span class="field-label">Срок действия (дней, необязательно)</span>
          <input
            v-model="expiresInDays"
            class="field-input"
            type="number"
            min="1"
            max="365"
            placeholder="Например: 7"
          />
        </label>
      </fieldset>

      <p v-if="!partnerId" class="helper-text">
        Привяжите партнера в профиле, чтобы отправлять купоны.
      </p>

      <button
        v-if="partnerId"
        class="primary-button"
        type="submit"
        :disabled="isCreating"
      >
        {{ isCreating ? 'Отправляем...' : 'Отправить' }}
      </button>
      <button
        v-else
        class="secondary-button"
        type="button"
        @click="goToProfile"
      >
        Перейти в профиль
      </button>
    </form>

    <section class="history-card">
      <div class="history-card__header">
        <h2 class="history-card__title">История отправленных</h2>
        <span class="history-card__count">{{ sentCoupons.length }}</span>
      </div>
      <p v-if="showSentLoading" class="helper-text">Загружаем отправленные...</p>
      <p v-else-if="sentError && sentCoupons.length === 0" class="helper-text helper-text--error">
        {{ sentError }}
      </p>
      <p v-else-if="sentCoupons.length === 0" class="helper-text">
        Пока нет отправленных купонов.
      </p>
      <p v-if="sentError && sentCoupons.length > 0" class="helper-text helper-text--error">
        {{ sentError }}
      </p>
      <ul v-if="sentCoupons.length > 0" class="history-list">
        <li v-for="coupon in sentCoupons" :key="coupon.id">
          <button class="history-item" type="button" @click="openSentDetails(coupon)">
          <div>
            <p class="history-item__title">{{ coupon.title }}</p>
            <p class="history-item__meta">
              Отправлен {{ formatDate(coupon.createdAt) }}
            </p>
          </div>
          <span class="history-item__status">{{ coupon.statusLabel }}</span>
          </button>
        </li>
      </ul>
    </section>

    <div
      v-if="selectedSentCoupon"
      class="redeem-sheet"
      role="dialog"
      aria-modal="true"
    >
      <div class="redeem-sheet__backdrop" @click="closeSentDetails"></div>
      <div class="redeem-sheet__panel">
        <p class="redeem-sheet__eyebrow">Детали купона</p>
        <h2 class="redeem-sheet__title">{{ selectedSentCoupon.title }}</h2>
        <p class="redeem-sheet__text">
          {{ selectedSentCoupon.description || 'Без описания.' }}
        </p>
        <div class="redeem-sheet__meta">
          <span>Статус: {{ selectedSentCoupon.statusLabel }}</span>
          <span>
            Отправлен: {{ formatDate(selectedSentCoupon.createdAt) }}
          </span>
          <span v-if="selectedSentCoupon.expiresAt">
            Действует до: {{ formatDate(selectedSentCoupon.expiresAt) }}
          </span>
          <span v-else>Без срока действия</span>
        </div>
        <button class="secondary-button" type="button" @click="closeSentDetails">
          Закрыть
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'
import { usePartners } from '../lib/partners'

const router = useRouter()
const { token, user } = useAuth()
const { couple, refreshCouple } = usePartners()

const title = ref('')
const description = ref('')
const expiresInDays = ref('')
const isCreating = ref(false)
const createError = ref('')
const createSuccess = ref(false)

const sentCoupons = ref([])
const cachedSentRaw = ref([])
const isLoadingSent = ref(false)
const sentError = ref('')
const selectedSentCoupon = ref(null)
const SENT_CACHE_KEY = 'love-coupon-sent-coupons'

const STATUS_LABELS = {
  available: 'Активен',
  redeemed: 'Использован',
  expired: 'Истек',
}

const partnerId = computed(() => {
  if (!couple.value) return null
  const currentId = user.value?.id
  if (!currentId) return null
  const firstId = couple.value.firstUserId ?? couple.value.firstUser?.id ?? null
  const secondId = couple.value.secondUserId ?? couple.value.secondUser?.id ?? null
  if (!firstId || !secondId) return null
  return firstId === currentId ? secondId : firstId
})

const formatDate = (value) => {
  if (!value) return ''
  try {
    const date = new Date(value)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch (error) {
    return ''
  }
}

const mapCoupon = (coupon) => ({
  ...coupon,
  statusLabel: STATUS_LABELS[coupon.status] ?? coupon.status,
})

const showSentLoading = computed(
  () => isLoadingSent.value && sentCoupons.value.length === 0 && !sentError.value
)

const loadSentCache = () => {
  try {
    const raw = sessionStorage.getItem(SENT_CACHE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      cachedSentRaw.value = parsed
      sentCoupons.value = parsed.map(mapCoupon)
    }
  } catch (error) {
    sessionStorage.removeItem(SENT_CACHE_KEY)
  }
}

const saveSentCache = (payload) => {
  sessionStorage.setItem(SENT_CACHE_KEY, JSON.stringify(payload))
  cachedSentRaw.value = payload
}

const sentPayloadChanged = (payload) => {
  try {
    return JSON.stringify(payload) !== JSON.stringify(cachedSentRaw.value)
  } catch (error) {
    return true
  }
}

const fetchSentCoupons = async () => {
  isLoadingSent.value = true
  sentError.value = ''
  try {
    const payload = await apiRequest('/coupons/sended', {
      token: token.value ?? undefined,
    })
    if (Array.isArray(payload)) {
      if (sentPayloadChanged(payload)) {
        sentCoupons.value = payload.map(mapCoupon)
        saveSentCache(payload)
      }
    } else {
      sentCoupons.value = []
    }
  } catch (error) {
    sentError.value = error?.message || 'Не удалось загрузить отправленные купоны.'
  } finally {
    isLoadingSent.value = false
  }
}

const handleCreate = async () => {
  if (isCreating.value || !partnerId.value) return
  isCreating.value = true
  createError.value = ''
  createSuccess.value = false
  if (!title.value.trim()) {
    createError.value = 'Введите название купона.'
    isCreating.value = false
    return
  }
  try {
    const days = Number.parseInt(expiresInDays.value, 10)
    const payload = await apiRequest('/coupons/create', {
      method: 'POST',
      token: token.value ?? undefined,
      body: {
        ownerId: partnerId.value,
        title: title.value.trim(),
        description: description.value.trim(),
        expiresInDays: Number.isNaN(days) || days <= 0 ? null : days,
      },
    })
    sentCoupons.value = [mapCoupon(payload), ...sentCoupons.value]
    if (Array.isArray(cachedSentRaw.value)) {
      saveSentCache([payload, ...cachedSentRaw.value])
    }
    title.value = ''
    description.value = ''
    expiresInDays.value = ''
    createSuccess.value = true
  } catch (error) {
    createError.value = error?.message || 'Не удалось отправить купон.'
  } finally {
    isCreating.value = false
  }
}

const openSentDetails = (coupon) => {
  selectedSentCoupon.value = coupon
}

const closeSentDetails = () => {
  selectedSentCoupon.value = null
}

const goToProfile = () => {
  router.push('/profile')
}

onMounted(() => {
  refreshCouple(token.value)
  loadSentCache()
  fetchSentCoupons()
})
</script>
