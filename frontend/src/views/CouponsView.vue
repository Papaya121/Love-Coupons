<template>
  <section class="view">
    <header class="view-header">
      <p class="view-eyebrow">Coupons for Couples</p>
      <h1 class="view-title">Купоны</h1>
    </header>

    <div class="coupon-list">
      <template v-if="showSkeleton">
        <div
          v-for="index in 3"
          :key="index"
          class="coupon-card coupon-card--skeleton"
          aria-hidden="true"
        >
          <div class="coupon-card__media skeleton-block"></div>
          <div class="coupon-card__content">
            <div class="coupon-card__header">
              <div class="skeleton-line skeleton-line--title"></div>
              <div class="skeleton-pill"></div>
            </div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line skeleton-line--short"></div>
          </div>
        </div>
      </template>
      <p v-else-if="loadError" class="helper-text helper-text--error">
        {{ loadError }}
      </p>
      <p v-else-if="sortedCoupons.length === 0" class="helper-text">
        Пока нет купонов от партнера.
      </p>
      <template v-else>
        <CouponCard
          v-for="coupon in sortedCoupons"
          :key="coupon.id"
          :title="coupon.title"
          :description="coupon.description"
          :status-label="coupon.statusLabel"
          :status-key="coupon.status"
          @click="openRedeem(coupon)"
        />
      </template>
    </div>

    <div v-if="selectedCoupon" class="redeem-sheet" role="dialog" aria-modal="true">
      <div class="redeem-sheet__backdrop" @click="closeRedeem"></div>
      <div class="redeem-sheet__panel">
        <button class="notice-close" type="button" @click="closeRedeem">
          Закрыть
        </button>
        <p class="redeem-sheet__eyebrow">Применение купона</p>
        <h2 class="redeem-sheet__title">{{ selectedCoupon.title }}</h2>
        <p class="redeem-sheet__text">
          {{ selectedCoupon.description }}
        </p>
        <div class="redeem-sheet__meta">
          <span>Статус: {{ selectedCoupon.statusLabel }}</span>
          <span v-if="selectedCoupon.createdAt">
            Создан: {{ formatDate(selectedCoupon.createdAt) }}
          </span>
          <span v-if="selectedCoupon.expiresAt">
            Действует до: {{ formatDate(selectedCoupon.expiresAt) }}
          </span>
          <span v-else>Без срока действия</span>
        </div>
        <p v-if="redeemError" class="helper-text helper-text--error">
          {{ redeemError }}
        </p>
        <button
          v-if="selectedCoupon.status === 'available'"
          class="primary-button"
          type="button"
          :disabled="isRedeeming"
          @click="handleRedeem"
        >
          {{ isRedeeming ? 'Применяем...' : 'Применить' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import CouponCard from '../components/CouponCard.vue'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'

const { token } = useAuth()
const coupons = ref([])
const cachedRaw = ref([])
const isLoading = ref(false)
const loadError = ref('')
const redeemError = ref('')
const isRedeeming = ref(false)
const CACHE_KEY = 'love-coupon-owned-coupons'

const selectedCoupon = ref(null)

const STATUS_LABELS = {
  available: 'Активен',
  redeemed: 'Использован',
  expired: 'Истек',
}

const statusWeight = {
  available: 0,
  redeemed: 1,
  expired: 2,
}

const showSkeleton = computed(
  () => isLoading.value && coupons.value.length === 0 && !loadError.value
)

const sortedCoupons = computed(() => {
  const list = [...coupons.value]
  return list.sort((a, b) => {
    const aWeight = statusWeight[a.status] ?? 0
    const bWeight = statusWeight[b.status] ?? 0
    if (aWeight !== bWeight) return aWeight - bWeight
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

const openRedeem = (coupon) => {
  selectedCoupon.value = coupon
  redeemError.value = ''
}

const closeRedeem = () => {
  selectedCoupon.value = null
  redeemError.value = ''
  isRedeeming.value = false
}

const mapCoupon = (coupon) => ({
  ...coupon,
  statusLabel: STATUS_LABELS[coupon.status] ?? coupon.status,
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

const loadCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      cachedRaw.value = parsed
      coupons.value = parsed.map(mapCoupon)
    }
  } catch (error) {
    sessionStorage.removeItem(CACHE_KEY)
  }
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

const fetchCoupons = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const payload = await apiRequest('/coupons/owned', {
      token: token.value ?? undefined,
    })
    if (Array.isArray(payload)) {
      if (payloadChanged(payload)) {
        coupons.value = payload.map(mapCoupon)
        saveCache(payload)
      }
    } else {
      coupons.value = []
    }
  } catch (error) {
    loadError.value = error?.message || 'Не удалось загрузить купоны.'
  } finally {
    isLoading.value = false
  }
}

const handleRedeem = async () => {
  if (!selectedCoupon.value || selectedCoupon.value.status !== 'available') return
  isRedeeming.value = true
  redeemError.value = ''
  try {
    await apiRequest(`/coupons/redeem/${selectedCoupon.value.id}`, {
      method: 'POST',
      token: token.value ?? undefined,
    })
    coupons.value = coupons.value.map((coupon) =>
      coupon.id === selectedCoupon.value.id
        ? mapCoupon({ ...coupon, status: 'redeemed' })
        : coupon
    )
    selectedCoupon.value = mapCoupon({
      ...selectedCoupon.value,
      status: 'redeemed',
    })
    if (Array.isArray(cachedRaw.value)) {
      const updated = cachedRaw.value.map((coupon) =>
        coupon.id === selectedCoupon.value.id
          ? { ...coupon, status: 'redeemed' }
          : coupon
      )
      saveCache(updated)
    }
  } catch (error) {
    redeemError.value = error?.message || 'Не удалось применить купон.'
  } finally {
    isRedeeming.value = false
  }
}

onMounted(() => {
  loadCache()
  fetchCoupons()
})
</script>
