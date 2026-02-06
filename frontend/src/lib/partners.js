import { computed, readonly, ref } from 'vue'
import { apiRequest } from './api'

const STORAGE_KEY = 'love-coupon-partners-cache'

const users = ref([])
const couple = ref(null)
const isLoadingUsers = ref(false)
const isLoadingCouple = ref(false)
const usersError = ref('')
const coupleError = ref('')

const loadCache = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    users.value = Array.isArray(parsed?.users) ? parsed.users : []
    couple.value = parsed?.couple ?? null
  } catch (error) {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

const saveCache = () => {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ users: users.value, couple: couple.value })
  )
}

loadCache()

const refreshUsers = async (token) => {
  isLoadingUsers.value = true
  usersError.value = ''
  try {
    const payload = await apiRequest('/users', {
      token: token ?? undefined,
    })
    users.value = Array.isArray(payload) ? payload : []
    saveCache()
  } catch (error) {
    usersError.value = error?.message || 'Не удалось загрузить пользователей.'
  } finally {
    isLoadingUsers.value = false
  }
}

const refreshCouple = async (token) => {
  isLoadingCouple.value = true
  coupleError.value = ''
  try {
    const payload = await apiRequest('/couples', {
      token: token ?? undefined,
    })
    couple.value = payload
    saveCache()
  } catch (error) {
    if (error?.payload?.statusCode === 404) {
      couple.value = null
      saveCache()
    } else {
      coupleError.value = error?.message || 'Не удалось получить данные о паре.'
    }
  } finally {
    isLoadingCouple.value = false
  }
}

const setCouple = (payload) => {
  couple.value = payload
  saveCache()
}

export const usePartners = () => ({
  users: readonly(users),
  couple: readonly(couple),
  usersError: readonly(usersError),
  coupleError: readonly(coupleError),
  isLoadingUsers: readonly(isLoadingUsers),
  isLoadingCouple: readonly(isLoadingCouple),
  refreshUsers,
  refreshCouple,
  setCouple,
})
