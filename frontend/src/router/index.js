import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../lib/auth'

import CouponsView from '../views/CouponsView.vue'
import CreateView from '../views/CreateView.vue'
import ProfileView from '../views/ProfileView.vue'
import AuthView from '../views/AuthView.vue'
import NotificationsView from '../views/NotificationsView.vue'

const routes = [
  { path: '/', redirect: '/coupons' },
  { path: '/auth', name: 'auth', component: AuthView, meta: { hideTabBar: true } },
  { path: '/coupons', name: 'coupons', component: CouponsView },
  { path: '/create', name: 'create', component: CreateView },
  { path: '/notifications', name: 'notifications', component: NotificationsView },
  { path: '/profile', name: 'profile', component: ProfileView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated.value && to.path !== '/auth') {
    return { path: '/auth' }
  }
  if (isAuthenticated.value && to.path === '/auth') {
    return { path: '/coupons' }
  }
  return true
})

const setMeta = (name, content) => {
  if (!name) return
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

const setPwaMeta = () => {
  setMeta('theme-color', '#f24e6b')
  setMeta('apple-mobile-web-app-capable', 'yes')
  setMeta('mobile-web-app-capable', 'yes')
  setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent')
  setMeta('apple-mobile-web-app-title', 'Love Coupons')
}

const setLink = (rel, href) => {
  if (!rel) return
  let link = document.querySelector(`link[rel="${rel}"]`)
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', rel)
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

router.afterEach(() => {
  setPwaMeta()
  setLink('manifest', '/manifest.json')
})

export default router
