<template>
  <nav class="tab-bar" aria-label="Основная навигация">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="tab-item"
      active-class="is-active"
    >
      <span class="tab-icon" aria-hidden="true">{{ item.icon }}</span>
      <span class="tab-label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink } from 'vue-router'

const items = [
  { to: '/coupons', label: 'Купоны', icon: '🎟️' },
  { to: '/create', label: 'Создать', icon: '➕' },
  { to: '/notifications', label: 'События', icon: '🔔' },
  { to: '/profile', label: 'Профиль', icon: '👤' },
]
</script>
