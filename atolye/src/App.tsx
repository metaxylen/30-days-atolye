import { Suspense, lazy, useEffect } from 'react'
import { runner } from './lib/runner'
import { useRoute } from './lib/route'
import { useTheme } from './components/bits'
import { GameFeedback } from './components/Toasts'
import { PaletteHost } from './components/Palette'
import { BadgesPanel, SettingsPanel } from './components/Hud'
import { LangSwitch } from './components/LangSwitch'
import { VersionBar } from './components/VersionBar'
import { t, useLang } from './lib/i18n'
import { armSound } from './lib/sound'
import { setUi, useUi } from './lib/ui'
import { loadChunk } from './lib/chunkError'
import { RouteBoundary } from './components/RouteBoundary'
import { LessonSkeleton } from './components/Skeleton'

// The reader pulls in CodeMirror and the lesson renderer; the home page does not need them.
const Home = lazy(() => loadChunk(() => import('./components/Home')).then((m) => ({ default: m.Home })))
const Reader = lazy(() => loadChunk(() => import('./components/Reader')).then((m) => ({ default: m.Reader })))
// The games (speed round, bug hunt, boss) are their own chunks: the reader never downloads them.
const SpeedRound = lazy(() => loadChunk(() => import('./components/game/SpeedRound')).then((m) => ({ default: m.SpeedRound })))
const Hunt = lazy(() => loadChunk(() => import('./components/game/Hunt')).then((m) => ({ default: m.Hunt })))
const Boss = lazy(() => loadChunk(() => import('./components/game/Boss')).then((m) => ({ default: m.Boss })))
const ReviewPage = lazy(() => loadChunk(() => import('./components/learn/ReviewPage')).then((m) => ({ default: m.ReviewPage })))

export default function App() {
  const route = useRoute()
  const ui = useUi()
  // The whole tree re-renders when the language changes: every text is read from the dictionary at render time.
  useLang()
  useTheme()
  // sound waits for the first user gesture (see lib/sound)
  useEffect(() => armSound(), [])
  // Start downloading Python as soon as the browser is idle, wherever the learner lands (home prompt, reader, review).
  // Skipped when the browser asks to save data; the first Run starts it then.
  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (saveData) return
    const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => runner.warm(), { timeout: 2500 })
      return () => w.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(() => runner.warm(), 1500)
    return () => window.clearTimeout(id)
  }, [])
  let page
  if (route.name === 'day') {
    page = (
      <Suspense fallback={<LessonSkeleton cards={route.view === 'cards' || route.view === 'auto'} />}>
        <Reader day={route.n} view={route.view} />
      </Suspense>
    )
  } else if (route.name === 'speed') {
    page = (
      <Suspense fallback={<p className="boot" role="status">{t('boot.speed')}</p>}>
        <SpeedRound />
      </Suspense>
    )
  } else if (route.name === 'hunt') {
    page = (
      <Suspense fallback={<p className="boot" role="status">{t('boot.hunt')}</p>}>
        <Hunt />
      </Suspense>
    )
  } else if (route.name === 'boss') {
    page = (
      <Suspense fallback={<p className="boot" role="status">{t('boot.boss')}</p>}>
        <Boss part={route.part} key={route.part} />
      </Suspense>
    )
  } else if (route.name === 'review') {
    page = (
      <Suspense fallback={<p className="boot" role="status">{t('boot.review')}</p>}>
        <ReviewPage />
      </Suspense>
    )
  } else {
    page = (
      <Suspense fallback={<p className="boot" role="status">{t('boot.home')}</p>}>
        <Home section={route.section} />
      </Suspense>
    )
  }
  return (
    <>
      <RouteBoundary key={route.name}>{page}</RouteBoundary>
      <GameFeedback />
      <PaletteHost />
      {ui.badges && <BadgesPanel onClose={() => setUi({ badges: false })} />}
      {ui.settings && <SettingsPanel onClose={() => setUi({ settings: false })} />}
      <LangSwitch />
      <VersionBar />
    </>
  )
}
