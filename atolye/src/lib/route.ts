import { useSyncExternalStore } from 'react'

/** auto: the Anlatım cards until the recap was reached, then Öğren. */
export type DayView = 'auto' | 'cards' | 'learn' | 'full'

export type Route =
  | { name: 'home'; section: string }
  | { name: 'day'; n: number; view: DayView }
  | { name: 'review' }
  | { name: 'speed' }
  | { name: 'hunt' }
  | { name: 'boss'; part: number }

export function parseHash(hash: string): Route {
  const m = /^#\/day\/(\d{1,2})(?:\/(text|learn|full))?\/?$/.exec(hash)
  if (m) {
    const n = Number(m[1])
    const view: DayView = m[2] === 'text' ? 'cards' : m[2] === 'learn' ? 'learn' : m[2] === 'full' ? 'full' : 'auto'
    if (n >= 1 && n <= 30) return { name: 'day', n, view }
  }
  if (/^#\/review\/?$/.test(hash)) return { name: 'review' }
  if (/^#\/speed\/?$/.test(hash)) return { name: 'speed' }
  if (/^#\/hunt\/?$/.test(hash)) return { name: 'hunt' }
  const b = /^#\/boss\/([1-5])\/?$/.exec(hash)
  if (b) return { name: 'boss', part: Number(b[1]) - 1 }
  const s = /^#\/([a-z-]+)$/.exec(hash)
  return { name: 'home', section: s ? s[1] : '' }
}

const subscribe = (f: () => void) => {
  window.addEventListener('hashchange', f)
  return () => window.removeEventListener('hashchange', f)
}
const snap = () => window.location.hash

export function useRoute(): Route {
  const h = useSyncExternalStore(subscribe, snap, () => '')
  return parseHash(h)
}

/** The day: opens on Anlatım until its recap is reached, then on Öğren. */
export const dayHref = (n: number): string => `#/day/${n}`
/** Anlatım: the interactive card player. */
export const cardsHref = (n: number): string => `#/day/${n}/text`
export const learnHref = (n: number): string => `#/day/${n}/learn`
/** The original long lesson page ("tam metin"). */
export const fullHref = (n: number): string => `#/day/${n}/full`
