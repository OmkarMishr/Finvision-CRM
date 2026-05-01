import { useEffect } from 'react'
import axiosInstance from '../config/axios'
import { API_ENDPOINTS } from '../config/api'

const APPLY_KEY = 'fv_appearance'

const applyTheme = (theme) => {
  const root = document.documentElement
  let resolved = theme
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  root.classList.toggle('dark', resolved === 'dark')
  root.dataset.theme = resolved
}

const applySidebar = (collapsed) => {
  document.documentElement.dataset.sidebar = collapsed ? 'collapsed' : 'expanded'
}

const applyDateFormat = (fmt) => {
  document.documentElement.dataset.dateFormat = fmt || 'DD/MM/YYYY'
}

// Pulls Admin Settings once on mount and applies the appearance preferences
// to the <html> element. Cached in localStorage so it applies before the
// network call returns on subsequent visits.
//
// Tabs / pages that change appearance call refreshAppearance() to reapply.
export const refreshAppearance = (appearance) => {
  if (!appearance) return
  applyTheme(appearance.theme || 'light')
  applySidebar(!!appearance.sidebarCollapsed)
  applyDateFormat(appearance.dateFormat || 'DD/MM/YYYY')
  try { localStorage.setItem(APPLY_KEY, JSON.stringify(appearance)) } catch (_) {}
}

export const useAppearance = (isAuthenticated) => {
  useEffect(() => {
    // 1) Apply cached preference immediately (no flash)
    try {
      const cached = JSON.parse(localStorage.getItem(APPLY_KEY) || 'null')
      if (cached) refreshAppearance(cached)
    } catch (_) { /* ignore */ }

    // 2) When authenticated, pull the canonical version from the server.
    if (!isAuthenticated) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await axiosInstance.get(API_ENDPOINTS.adminSettings.base)
        if (cancelled) return
        const appearance = res.data?.data?.appearance
        refreshAppearance(appearance)
      } catch (_) { /* settings endpoint is admin-only — staff/students are fine without it */ }
    })()

    return () => { cancelled = true }
  }, [isAuthenticated])
}

export const formatDate = (date) => {
  if (!date) return ''
  const d   = new Date(date)
  if (isNaN(d.getTime())) return ''
  const dd  = String(d.getDate()).padStart(2, '0')
  const mm  = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const fmt = document.documentElement.dataset.dateFormat || 'DD/MM/YYYY'
  if (fmt === 'MM/DD/YYYY') return `${mm}/${dd}/${yyyy}`
  if (fmt === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`
  return `${dd}/${mm}/${yyyy}`
}
