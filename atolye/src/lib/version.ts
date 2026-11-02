import { useSyncExternalStore } from 'react'
import { flushStore } from './store'

// A tab that never opens a new lazy route would keep running the old build forever. The build writes dist/version.json with a
// unique id (vite.config.ts) and bakes the same id into the bundle; this module compares them: on load, every minute while the
// tab is visible, when it becomes visible again, and at every route change. A newer build reloads the page at once, unless the
// learner is typing: then a bar offers "Şimdi yenile" and the next route change reloads. Everything the learner did lives in
// localStorage (pending drafts are flushed first), and the hash route is part of the URL, so a reload is safe.

declare const __BUILD_ID__: string | undefined
export const BUILD_ID: string = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev'

export const POLL_MS = 60_000
/** Typing counts as "mid-input" for this long after the last keystroke. */
const TYPING_MS = 45_000
/** sessionStorage: the build id the tab last reloaded for. The same id never reloads twice, so a stale CDN cannot cause a loop. */
const GUARD = 'atolye:ver-reload'

let fresh: string | null = null
const subs = new Set<() => void>()
const setFresh = (id: string | null) => {
  if (fresh === id) return
  fresh = id
  subs.forEach((f) => f())
}
/** The newer build id once one was seen and the page did not reload (the learner is typing, or a reload for it already failed). */
export const useNewVersion = (): string | null =>
  useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => fresh,
    () => null,
  )

let lastTyped = 0
const isEditable = (el: Element | null): boolean => {
  if (!(el instanceof HTMLElement)) return false
  if (el.isContentEditable || el instanceof HTMLTextAreaElement) return true
  return el instanceof HTMLInputElement && /^(text|search|email|url|tel|number|password)$/.test(el.type)
}
/** A focused editor or textarea that received input recently. */
export const midInput = (): boolean => isEditable(document.activeElement) && Date.now() - lastTyped < TYPING_MS

async function latest(): Promise<string | null> {
  try {
    const r = await fetch(`${new URL('version.json', document.baseURI).href}?t=${Date.now()}`, { cache: 'no-store' })
    if (!r.ok) return null
    const j = (await r.json()) as { id?: unknown }
    return typeof j.id === 'string' && j.id ? j.id : null
  } catch {
    return null // offline, or a host that answers with index.html: nothing to compare
  }
}

/** Reloads once per build id. False when it already did for this id (or storage is unavailable, where a loop could not be ruled out). */
function reloadFor(id: string): boolean {
  try {
    if (sessionStorage.getItem(GUARD) === id) return false
    sessionStorage.setItem(GUARD, id)
  } catch {
    return false
  }
  reloadNow()
  return true
}

/** The "Şimdi yenile" button: saves pending drafts, then reloads (the hash route stays in the URL). */
export function reloadNow() {
  flushStore()
  location.reload()
}

let pending: Promise<void> | null = null
/** Compares the served build id with the one in this bundle; reacts to a difference. Concurrent calls share one request. */
export function checkVersion(): Promise<void> {
  pending ??= latest().then((id) => {
    pending = null
    if (!id || id === BUILD_ID) {
      setFresh(null)
      return
    }
    if (!midInput() && reloadFor(id)) return
    setFresh(id)
  })
  return pending
}

export function installVersionWatch() {
  const type = () => {
    lastTyped = Date.now()
  }
  document.addEventListener('input', type, true)
  document.addEventListener('keydown', type, true)
  const visible = () => document.visibilityState === 'visible'
  document.addEventListener('visibilitychange', () => visible() && void checkVersion())
  window.setInterval(() => visible() && void checkVersion(), POLL_MS)
  // a route change: a build already known to be newer reloads now (even mid-typing: the drafts are flushed); otherwise ask first
  window.addEventListener('hashchange', () => {
    if (fresh && reloadFor(fresh)) return
    void checkVersion().then(() => {
      if (fresh) reloadFor(fresh)
    })
  })
  void checkVersion()
}
