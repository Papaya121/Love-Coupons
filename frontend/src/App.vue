<template>
  <div class="app-shell">
    <main class="app-main" :class="{ 'app-main--no-tabbar': !showTabBar }">
      <RouterView />
    </main>
    <BottomTabBar v-if="showTabBar" />
  </div>
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import BottomTabBar from './components/BottomTabBar.vue'

const route = useRoute()
const showTabBar = computed(() => !route.meta?.hideTabBar)
</script>
