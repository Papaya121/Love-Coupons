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
        <p class="notice-summary__value">{{ notifications.length }}</p>
      </div>
    </div>

    <div class="notice-groups">
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
    </div>

    <p v-if="notifications.length === 0" class="helper-text">
      Пока нет событий.
    </p>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const notifications = [
  {
    id: 'n1',
    type: 'coupon',
    icon: '🎟️',
    title: 'Аня отправила вам купон',
    text: '«Кино на двоих» добавлен в список купонов.',
    time: 'Сегодня, 12:40',
    status: 'Новый',
    unread: true,
    group: 'Сегодня',
  },
  {
    id: 'n2',
    type: 'invite',
    icon: '🤝',
    title: 'Максим прислал приглашение',
    text: 'Запрос на привязку аккаунтов.',
    time: 'Сегодня, 09:05',
    status: 'Ожидает',
    unread: true,
    group: 'Сегодня',
  },
  {
    id: 'n3',
    type: 'redeem',
    icon: '✨',
    title: 'Купон применен',
    text: '«Завтрак в постель» использован партнером.',
    time: 'Вчера, 20:18',
    status: 'Готово',
    unread: false,
    group: 'Вчера',
  },
  {
    id: 'n4',
    type: 'system',
    icon: '🔔',
    title: 'Напоминание',
    text: 'Пора создать новый купон на выходные.',
    time: 'Вчера, 08:12',
    status: 'Совет',
    unread: false,
    group: 'Вчера',
  },
  {
    id: 'n5',
    type: 'coupon',
    icon: '🎁',
    title: 'Новый купон от партнера',
    text: '«Обнимашки на 10 минут» уже ждут вас.',
    time: '02.02, 19:44',
    status: 'Новый',
    unread: false,
    group: 'На этой неделе',
  },
  {
    id: 'n6',
    type: 'invite',
    icon: '💌',
    title: 'Ответ на приглашение',
    text: 'Партнер принял привязку.',
    time: '01.02, 14:20',
    status: 'Принято',
    unread: false,
    group: 'На этой неделе',
  },
]

const grouped = computed(() => {
  const order = ['Сегодня', 'Вчера', 'На этой неделе']
  return order
    .map((label) => ({
      label,
      items: notifications.filter((item) => item.group === label),
    }))
    .filter((group) => group.items.length > 0)
})

const unreadCount = computed(
  () => notifications.filter((item) => item.unread).length
)
</script>
