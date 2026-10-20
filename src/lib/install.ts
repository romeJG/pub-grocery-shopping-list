import { useSyncExternalStore } from 'react'

/*
 * "Add to Home Screen" support.
 *
 * Chromium browsers (Android Chrome, Edge, Samsung Internet, desktop Chrome)
 * fire `beforeinstallprompt`, which we stash so a button can show the native
 * install dialog later. iOS has no install API at all, so there we can only
 * show the Share → Add to Home Screen steps. This module is imported before
 * React mounts so the event isn't missed.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallPlatform = 'ios' | 'android' | 'other'

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

function detectPlatform(): InstallPlatform {
  const ua = navigator.userAgent
  if (/Android/i.test(ua)) return 'android'
  // iPadOS reports itself as a Mac; touch support gives it away.
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios'
  return 'other'
}

let deferred: BeforeInstallPromptEvent | null = null
let installed = isStandalone()
let snapshot = { canPrompt: false, installed }
const listeners = new Set<() => void>()

function emit() {
  snapshot = { canPrompt: deferred != null, installed }
  listeners.forEach((l) => l())
}

window.addEventListener('beforeinstallprompt', (e) => {
  // Keep Chrome's mini-infobar from appearing; we offer install from Settings.
  e.preventDefault()
  deferred = e as BeforeInstallPromptEvent
  emit()
})

window.addEventListener('appinstalled', () => {
  deferred = null
  installed = true
  emit()
})

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Shows the browser's native install dialog. Resolves true if the user accepted. */
async function promptInstall() {
  if (!deferred) return false
  const e = deferred
  // A prompt event can only be used once.
  deferred = null
  emit()
  await e.prompt()
  const { outcome } = await e.userChoice
  return outcome === 'accepted'
}

const platform = detectPlatform()

export function useInstall() {
  const state = useSyncExternalStore(subscribe, () => snapshot)
  return { ...state, platform, promptInstall }
}
