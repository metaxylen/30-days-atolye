import { useSyncExternalStore } from 'react'

/** Which global overlays are open. Kept outside React so any component (or a key handler) can open one. */
export interface UiState {
  palette: boolean
  badges: boolean
  settings: boolean
  levelUp: number | null
}

let ui: UiState = { palette: false, badges: false, settings: false, levelUp: null }
const subs = new Set<() => void>()

export const getUi = (): UiState => ui
export const setUi = (p: Partial<UiState>) => {
  ui = { ...ui, ...p }
  subs.forEach((f) => f())
}
export const useUi = (): UiState =>
  useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    getUi,
    getUi,
  )

export const reducedMotion = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export interface PageCtx {
  day: number | null
  sections: { label: string; go: () => void }[]
}

let ctx: PageCtx = { day: null, sections: [] }
const ctxSubs = new Set<() => void>()
export const getCtx = (): PageCtx => ctx
export const setCtx = (c: PageCtx) => {
  ctx = c
  ctxSubs.forEach((f) => f())
}
export const useCtx = (): PageCtx =>
  useSyncExternalStore(
    (f) => {
      ctxSubs.add(f)
      return () => ctxSubs.delete(f)
    },
    getCtx,
    getCtx,
  )
