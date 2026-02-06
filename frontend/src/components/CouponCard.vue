<template>
  <button class="coupon-card" :class="stateClass" type="button">
    <div class="coupon-card__media" aria-hidden="true">
      <span class="coupon-card__media-icon">✨</span>
    </div>
    <div class="coupon-card__content">
      <div class="coupon-card__header">
        <h3 class="coupon-card__title">{{ title }}</h3>
        <span class="coupon-card__status" :class="statusClass">{{ statusLabel }}</span>
      </div>
      <p class="coupon-card__description">{{ description }}</p>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  statusLabel: { type: String, required: true },
  statusKey: { type: String, required: true },
})

const normalizedStatus = computed(() => props.statusKey.toLowerCase())

const statusClass = computed(() => {
  if (normalizedStatus.value === 'redeemed') return 'coupon-card__status--used'
  if (normalizedStatus.value === 'expired') return 'coupon-card__status--expired'
  return 'coupon-card__status--active'
})

const stateClass = computed(() => {
  if (normalizedStatus.value === 'redeemed') return 'coupon-card--used'
  if (normalizedStatus.value === 'expired') return 'coupon-card--expired'
  return 'coupon-card--active'
})
</script>
