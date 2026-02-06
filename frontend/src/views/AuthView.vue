<template>
  <section class="auth-view">
    <header class="auth-hero">
      <p class="auth-eyebrow">Love Coupons</p>
      <h1 class="auth-title">Добро пожаловать</h1>
      <p class="auth-subtitle">
        Войдите, чтобы обмениваться купонами и хранить историю ваших моментов.
      </p>
    </header>

    <div class="auth-card">
      <div class="segment-control" role="tablist" aria-label="Переключение формы">
        <button
          type="button"
          class="segment-control__button"
          :class="{ 'is-active': mode === 'login' }"
          role="tab"
          :aria-selected="mode === 'login'"
          @click="setMode('login')"
        >
          Вход
        </button>
        <button
          type="button"
          class="segment-control__button"
          :class="{ 'is-active': mode === 'register' }"
          role="tab"
          :aria-selected="mode === 'register'"
          @click="setMode('register')"
        >
          Регистрация
        </button>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div v-if="mode === 'register'" class="field">
          <label class="field-label" for="auth-name">Имя</label>
          <input
            id="auth-name"
            v-model.trim="form.name"
            class="field-input"
            type="text"
            autocomplete="name"
            placeholder="Кисечка Л."
            required
          />
        </div>

        <div v-if="mode === 'register'" class="field">
          <label class="field-label" for="auth-email">Почта</label>
          <input
            id="auth-email"
            v-model.trim="form.email"
            class="field-input"
            type="email"
            autocomplete="email"
            placeholder="love@coupons.dev"
            required
          />
        </div>

        <div class="field">
          <label class="field-label" for="auth-login">Логин или почта</label>
          <input
            id="auth-login"
            v-model.trim="form.login"
            class="field-input"
            type="text"
            autocomplete="username"
            placeholder="yourlove"
            required
          />
        </div>

        <div class="field">
          <label class="field-label" for="auth-password">Пароль</label>
          <input
            id="auth-password"
            v-model="form.password"
            class="field-input"
            type="password"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            placeholder="••••••••"
            required
          />
        </div>

        <p v-if="error" class="auth-error">{{ error }}</p>
        <p v-if="success" class="auth-success">{{ success }}</p>

        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? 'Подключаемся...' : submitLabel }}
        </button>
      </form>
    </div>

    <div class="auth-footnote">
      <!-- <div class="auth-chip">🔐 Токен хранится 7 дней</div> -->
      <div class="auth-chip">Кися лох!</div>
      <!-- <div class="auth-chip">📱 Оптимизировано для iPhone</div> -->
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../lib/auth'

const router = useRouter()
const { login, register } = useAuth()

const mode = ref('login')
const loading = ref(false)
const error = ref('')
const success = ref('')

const form = reactive({
  email: '',
  login: '',
  name: '',
  password: '',
})

const submitLabel = computed(() =>
  mode.value === 'login' ? 'Войти' : 'Создать аккаунт'
)

const setMode = (nextMode) => {
  mode.value = nextMode
  error.value = ''
  success.value = ''
}

watch(mode, () => {
  error.value = ''
  success.value = ''
})

const handleSubmit = async () => {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await login(form.login, form.password)
      success.value = 'С возвращением!'
    } else {
      await register({
        email: form.email,
        login: form.login,
        name: form.name,
        password: form.password,
      })
      success.value = 'Аккаунт создан. Добро пожаловать!'
    }
    await router.push('/coupons')
  } catch (err) {
    error.value = err?.message ?? 'Не удалось войти. Попробуйте снова.'
  } finally {
    loading.value = false
  }
}
</script>
