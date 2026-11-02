import { useSyncExternalStore } from 'react'

/** Which side columns the screen has room for: both (wide), only the right one (mid), none and a Notlar sheet (narrow). */
export type RailMode = 'wide' | 'mid' | 'narrow'

const WIDE = '(min-width: 1280px)'
const MID = '(min-width: 1024px)'

function subscribe(f: () => void) {
  const a = matchMedia(WIDE)
  const b = matchMedia(MID)
  a.addEventListener('change', f)
  b.addEventListener('change', f)
  return () => {
    a.removeEventListener('change', f)
    b.removeEventListener('change', f)
  }
}
const mode = (): RailMode => (matchMedia(WIDE).matches ? 'wide' : matchMedia(MID).matches ? 'mid' : 'narrow')

export function useRailMode(): RailMode {
  return useSyncExternalStore(subscribe, mode, () => 'narrow')
}
