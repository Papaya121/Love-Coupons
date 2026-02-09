const API_URL = import.meta.env.VITE_API_URL ?? '/api'

const parseJson = async (response) => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (error) {
    return text
  }
}

export const apiRequest = async (path, options = {}) => {
  const { method = 'GET', body, token } = options
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : null),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await parseJson(response)
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('love-coupon-auth')
      if (window.location.pathname !== '/auth') {
        window.location.assign('/auth')
      }
      const error = new Error('Сессия истекла. Войдите снова.')
      error.payload = payload
      throw error
    }
    const message =
      typeof payload === 'object' && payload && payload.message
        ? Array.isArray(payload.message)
          ? payload.message.join(' ')
          : payload.message
        : 'Ошибка запроса. Попробуйте снова.'
    const error = new Error(message)
    error.payload = payload
    throw error
  }

  return payload
}

export { API_URL }
