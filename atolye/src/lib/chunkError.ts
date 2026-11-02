// A tab opened before a new build still points at hashed chunks that no longer exist.
// The first failure reloads the page once; a second one within RELOAD_WINDOW_MS is left to the error boundary.
const KEY = 'atolye:chunk-reload'
export const RELOAD_WINDOW_MS = 10_000

export function isChunkError(e: unknown): boolean {
  const m = String((e as { message?: string } | null)?.message ?? e)
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError/i.test(m)
}

/** Reloads once per window. Returns false when a reload already happened recently (or storage is unavailable). */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0)
    if (last && Date.now() - last < RELOAD_WINDOW_MS) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    return false
  }
  location.reload()
  return true
}

export function installPreloadGuard() {
  window.addEventListener('vite:preloadError', (ev) => {
    if (reloadOnce()) ev.preventDefault()
  })
}

/** import() for React.lazy: a failed chunk reloads once, otherwise the error reaches the boundary. */
export function loadChunk<T>(load: () => Promise<T>): Promise<T> {
  return load().catch((e) => {
    if (isChunkError(e) && reloadOnce()) return new Promise<T>(() => {})
    throw e
  })
}
