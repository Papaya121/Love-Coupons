<template>
  <section class="view">
    <header class="view-header">
      <p class="view-eyebrow">Профиль</p>
      <h1 class="view-title">{{ user?.name || 'Профиль' }}</h1>
    </header>

    <div class="profile-card">
      <div class="profile-avatar" aria-hidden="true">{{ initials }}</div>
      <div class="profile-info">
        <p class="profile-name">{{ user?.login || 'love-coupon' }}</p>
        <p class="profile-subtitle">{{ user?.email || 'yourlove@coupons.dev' }}</p>
      </div>
    </div>

    <section class="partner-card">
      <header class="partner-card__header">
        <div>
          <p class="partner-card__eyebrow">Связь</p>
          <h2 class="partner-card__title">Привязка партнера</h2>
        </div>
        <span class="partner-card__status">
          {{ coupleStatus }}
        </span>
      </header>

      <div v-if="couple" class="partner-current">
        <div>
          <p class="partner-login">@{{ partnerLogin }}</p>
          <p class="partner-meta">
            Партнер привязан
          </p>
        </div>
        <button
          class="secondary-button partner-bind"
          type="button"
          :disabled="isUnpairing"
          @click="handleUnpair"
        >
          {{ isUnpairing ? 'Отвязываем...' : 'Отвязать' }}
        </button>
      </div>

      <label v-if="!couple" class="field">
        <span class="field-label">Поиск по логину</span>
        <div class="field-input partner-search">
          <input
            v-model="partnerQuery"
            type="text"
            autocomplete="off"
            placeholder="Например: okroshka"
          />
          <button
            v-if="partnerQuery"
            class="partner-clear"
            type="button"
            aria-label="Очистить поиск"
            @click="partnerQuery = ''"
          >
            x
          </button>
        </div>
      </label>

      <div v-if="!couple" class="partner-results">
        <p v-if="coupleError" class="partner-hint partner-hint--error">
          {{ coupleError }}
        </p>
        <p v-if="isLoadingUsers && users.length === 0" class="partner-hint">
          Загружаем список пользователей...
        </p>
        <p v-else-if="usersError" class="partner-hint partner-hint--error">
          {{ usersError }}
        </p>
        <p
          v-else-if="partnerQuery.trim() && filteredUsers.length === 0"
          class="partner-hint"
        >
          Ничего не найдено. Проверьте логин.
        </p>
        <ul v-else class="partner-list">
          <li v-for="result in filteredUsers" :key="result.id" class="partner-item">
            <div>
              <p class="partner-login">@{{ result.login }}</p>
              <p class="partner-meta">{{ result.name }}</p>
            </div>
            <button
              class="secondary-button partner-bind"
              type="button"
              :disabled="isSendingInvite || hasPendingInvite(result.id)"
              @click="handleSendInvite(result)"
            >
              {{
                isSendingInvite && sendingUserId === result.id
                  ? 'Отправляем...'
                  : hasPendingInvite(result.id)
                    ? 'Приглашение отправлено'
                    : 'Пригласить'
              }}
            </button>
          </li>
        </ul>
        <p v-if="inviteError" class="partner-hint partner-hint--error">
          {{ inviteError }}
        </p>
      </div>

      <div
        v-if="!couple && pendingReceivedInvites.length > 0"
        class="partner-results"
      >
        <p class="partner-hint">Входящие приглашения</p>
        <div class="partner-list">
          <div
            v-for="invite in pendingReceivedInvites"
            :key="invite.id"
            class="partner-invite"
          >
            <div>
              <p class="partner-login">
                @{{ getUserLogin(getInviteSenderId(invite)) }}
              </p>
              <p class="partner-meta">
                {{ getUserName(getInviteSenderId(invite)) || 'Партнер хочет связаться' }}
              </p>
            </div>
            <button
              class="secondary-button partner-bind"
              type="button"
              :disabled="isAcceptingInvite && acceptingInviteId === invite.id"
              @click="handleAcceptInvite(invite)"
            >
              {{
                isAcceptingInvite && acceptingInviteId === invite.id
                  ? 'Принимаем...'
                  : 'Принять приглашение'
              }}
            </button>
          </div>
        </div>
        <p v-if="inviteError" class="partner-hint partner-hint--error">
          {{ inviteError }}
        </p>
      </div>

      <div
        v-if="!couple && pendingSentInvites.length > 0"
        class="partner-results"
      >
        <p class="partner-hint">Отправленные приглашения</p>
        <div class="partner-list">
          <div
            v-for="invite in pendingSentInvites"
            :key="invite.id"
            class="partner-invite"
          >
            <div>
              <p class="partner-login">
                @{{ getUserLogin(getInviteReceiverId(invite)) }}
              </p>
              <p class="partner-meta">
                {{ getUserName(getInviteReceiverId(invite)) || 'Ожидает подтверждения' }}
              </p>
            </div>
            <span class="partner-hint">Ожидаем ответ</span>
          </div>
        </div>
        <p v-if="inviteError" class="partner-hint partner-hint--error">
          {{ inviteError }}
        </p>
      </div>
    </section>

    <div class="profile-actions">
      <button class="secondary-button" type="button" @click="handleLogout">Выйти</button>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../lib/auth'
import { apiRequest } from '../lib/api'
import { usePartners } from '../lib/partners'

const router = useRouter()
const { user, token, logout } = useAuth()

const partnerQuery = ref('')
const {
  users,
  couple,
  usersError,
  coupleError,
  isLoadingUsers,
  refreshUsers,
  refreshCouple,
  setCouple,
} = usePartners()
const isUnpairing = ref(false)
const sentInvites = ref([])
const receivedInvites = ref([])
const isLoadingInvites = ref(false)
const inviteError = ref('')
const isSendingInvite = ref(false)
const sendingUserId = ref(null)
const isAcceptingInvite = ref(false)
const acceptingInviteId = ref(null)
const partnerProfile = ref(null)
const isLoadingPartner = ref(false)
const INVITES_CACHE_KEY = 'love-coupon-invites-cache'

const loadInvitesCache = () => {
  try {
    const raw = sessionStorage.getItem(INVITES_CACHE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    sentInvites.value = Array.isArray(parsed?.sent) ? parsed.sent : []
    receivedInvites.value = Array.isArray(parsed?.received) ? parsed.received : []
  } catch (error) {
    sessionStorage.removeItem(INVITES_CACHE_KEY)
  }
}

const saveInvitesCache = (sent, received) => {
  sessionStorage.setItem(
    INVITES_CACHE_KEY,
    JSON.stringify({ sent, received })
  )
}

const invitesPayloadChanged = (sent, received) => {
  try {
    const current = JSON.stringify({
      sent: sentInvites.value,
      received: receivedInvites.value,
    })
    return (
      current !== JSON.stringify({ sent, received })
    )
  } catch (error) {
    return true
  }
}

const initials = computed(() => {
  const value = user.value?.name || user.value?.login || ''
  if (!value) return 'LC'
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
})

const getCoupleUserId = (coupleValue, key) =>
  coupleValue?.[key] ?? coupleValue?.[key.replace('Id', '')]?.id ?? null

const getPartnerId = () => {
  if (!couple.value) return null
  const currentId = user.value?.id
  if (!currentId) return null
  const firstId = getCoupleUserId(couple.value, 'firstUserId')
  const secondId = getCoupleUserId(couple.value, 'secondUserId')
  if (!firstId || !secondId) return null
  return firstId === currentId ? secondId : firstId
}

const partnerLogin = computed(() => {
  const partner = partnerProfile.value
  if (partner?.login) return partner.login
  const partnerId = getPartnerId()
  if (!partnerId) return ''
  return getUserLogin(partnerId)
})

const coupleStatus = computed(() => {
  if (couple.value) {
    return partnerLogin.value ? `@${partnerLogin.value}` : 'Привязан'
  }
  return 'Не привязан'
})

const filteredUsers = computed(() => {
  const currentUserId = user.value?.id
  const normalizedQuery = partnerQuery.value
    .trim()
    .replace(/^@+/, '')
    .toLocaleLowerCase()
  const list = users.value.filter((candidate) => candidate.id !== currentUserId)
  if (!normalizedQuery) return []
  return list.filter((candidate) =>
    candidate.login?.toLocaleLowerCase().includes(normalizedQuery)
  )
})

const getInviteSenderId = (invite) =>
  invite?.senderId ?? invite?.senderID ?? invite?.sender_id ?? ''

const getInviteReceiverId = (invite) =>
  invite?.recieverId ?? invite?.receiverId ?? invite?.receiverID ?? invite?.receiver_id ?? ''

const isInvitePending = (invite) => {
  const raw = invite?.status
  if (!raw) return true
  const normalized = String(raw).toLowerCase()
  return !['accepted', 'declined', 'rejected', 'canceled', 'cancelled'].includes(
    normalized
  )
}

const pendingSentInvites = computed(() =>
  sentInvites.value.filter((invite) => isInvitePending(invite))
)

const pendingReceivedInvites = computed(() =>
  receivedInvites.value.filter((invite) => isInvitePending(invite))
)

const hasPendingInvite = (userId) =>
  pendingSentInvites.value.some(
    (invite) => getInviteReceiverId(invite) === userId
  )

const getUserById = (id) => users.value.find((candidate) => candidate.id === id)

const getUserLogin = (id) => getUserById(id)?.login ?? 'unknown'

const getUserName = (id) => getUserById(id)?.name ?? ''

const refreshPartnerProfile = async () => {
  const partnerId = getPartnerId()
  if (!partnerId) {
    partnerProfile.value = null
    return
  }
  if (partnerProfile.value?.id === partnerId) return
  isLoadingPartner.value = true
  try {
    const payload = await apiRequest(`/users/${partnerId}`, {
      token: token.value ?? undefined,
    })
    partnerProfile.value = payload ?? null
  } catch (error) {
    partnerProfile.value = null
  } finally {
    isLoadingPartner.value = false
  }
}

const refreshInvites = async () => {
  isLoadingInvites.value = true
  inviteError.value = ''
  try {
    const [sentPayload, receivedPayload] = await Promise.all([
      apiRequest('/couples/invite/sended', {
        token: token.value ?? undefined,
      }),
      apiRequest('/couples/invite/recieved', {
        token: token.value ?? undefined,
      }),
    ])
    const nextSent = Array.isArray(sentPayload) ? sentPayload : []
    const nextReceived = Array.isArray(receivedPayload) ? receivedPayload : []
    if (invitesPayloadChanged(nextSent, nextReceived)) {
      sentInvites.value = nextSent
      receivedInvites.value = nextReceived
      saveInvitesCache(nextSent, nextReceived)
    }
  } catch (error) {
    inviteError.value = error?.message || 'Не удалось загрузить приглашения.'
  } finally {
    isLoadingInvites.value = false
  }
}

const handleSendInvite = async (selectedUser) => {
  if (!selectedUser || isSendingInvite.value || couple.value) return
  if (hasPendingInvite(selectedUser.id)) return
  isSendingInvite.value = true
  sendingUserId.value = selectedUser.id
  inviteError.value = ''
  try {
    await apiRequest(`/couples/invite/send/${selectedUser.id}`, {
      method: 'POST',
      token: token.value ?? undefined,
    })
    partnerQuery.value = ''
    await refreshInvites()
  } catch (error) {
    inviteError.value = error?.message || 'Не удалось отправить приглашение.'
  } finally {
    isSendingInvite.value = false
    sendingUserId.value = null
  }
}

const handleAcceptInvite = async (invite) => {
  if (!invite?.id || isAcceptingInvite.value || couple.value) return
  isAcceptingInvite.value = true
  acceptingInviteId.value = invite.id
  inviteError.value = ''
  try {
    const payload = await apiRequest(`/couples/invite/accept/${invite.id}`, {
      method: 'POST',
      token: token.value ?? undefined,
    })
    setCouple(payload)
    await refreshInvites()
  } catch (error) {
    inviteError.value = error?.message || 'Не удалось принять приглашение.'
  } finally {
    isAcceptingInvite.value = false
    acceptingInviteId.value = null
  }
}

const handleUnpair = async () => {
  if (!couple.value || isUnpairing.value) return
  isUnpairing.value = true
  inviteError.value = ''
  try {
    await apiRequest('/couples/unpair', {
      method: 'POST',
      token: token.value ?? undefined,
      body: { coupleUser: user.value?.id ?? '' },
    })
    setCouple(null)
  } catch (error) {
    inviteError.value = error?.message || 'Не удалось отвязать партнера.'
  } finally {
    isUnpairing.value = false
  }
}

const handleLogout = () => {
  logout()
  router.push('/auth')
}

onMounted(() => {
  refreshCouple(token.value)
  refreshUsers(token.value)
  loadInvitesCache()
  refreshInvites()
  refreshPartnerProfile()
})

watch([() => couple.value, () => user.value?.id], () => {
  refreshPartnerProfile()
})
</script>
