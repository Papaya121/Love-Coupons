import { computed, readonly, ref } from 'vue'
import { apiRequest } from './api'

const STORAGE_KEY = 'love-coupon-auth'

const user = ref(null)
const token = ref(null)

const loadStoredAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed?.token) {
      token.value = parsed.token
      user.value = parsed.user ?? null
    }
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY)
  }
}

const persistAuth = () => {
  if (!token.value) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ token: token.value, user: user.value })
  )
}

const setAuth = (payload) => {
  token.value = payload.accessToken
  user.value = payload.user
  persistAuth()
}

const clearAuth = () => {
  token.value = null
  user.value = null
  localStorage.removeItem(STORAGE_KEY)
}

loadStoredAuth()

export const useAuth = () => {
  const isAuthenticated = computed(() => Boolean(token.value))

  const login = async (loginValue, password) => {
    const payload = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        login: loginValue,
        password,
      },
    })
    setAuth(payload)
    return payload
  }

  const register = async ({ email, login, name, password }) => {
    const payload = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        email,
        login,
        name,
        password,
      },
    })
    setAuth(payload)
    return payload
  }

  const logout = () => {
    clearAuth()
  }

  return {
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    login,
    register,
    logout,
  }
}
