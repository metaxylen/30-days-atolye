import { useEffect, useRef, useState } from 'react'
import { dayOf } from '../data/days'
import { PARTS } from '../data/days'
import { t, useLang } from '../lib/i18n'
import { actions, getState, hasProgress, nextDay, useStore } from '../lib/store'
import { note } from '../lib/game'
import { snakeLength } from '../lib/snakeview'
import { dayHref } from '../lib/route'
import { PlayBoard } from './PlayBoard'
import { useReveal } from './bits'
import { LivePrompt } from './HomeConsole'
import { Hero, MapScene, Parts, How } from './HomeScenes'

const img = (name: string): string => `${import.meta.env.BASE_URL}img/${name}`
// Small (640-960px) copies for thumbnails and masks; the one large archive picture is used once, at full width.
const PHOTO = {
  lattice: img('s-618.jpg'),
  bridge: img('s-620.jpg'),
  stairs: img('s-954.jpg'),
  facade: img('s-887.jpg'),
  cardsStorage: img('small/s-card-storage-jpg.jpg'),
  cardBox: img('small/s-card-box-jpg.jpg'),
  cardsStorageLarge: img('ibm-card-storage-nara.jpg'),
}
const FIRST_DAY = PARTS.map((p) => p.from)

function Thumb({ src, alt, pos }: { src: string; alt: string; pos?: string }) {
  return (
    <span className="thumb">
      <img src={src} alt={alt} width="160" height="100" decoding="async" style={pos ? { objectPosition: pos } : undefined} />
    </span>
  )
}

function Intro() {
  return (
    <section className="intro" aria-label={t('home.introAria')}>
      <p data-reveal>
        {t('home.introA')} <Thumb src={PHOTO.stairs} alt={t('alt.stairs')} /> {t('home.introB')} <Thumb src={PHOTO.bridge} alt={t('alt.bridge')} pos="40% 60%" /> {t('home.introC')}{' '}
        <Thumb src={PHOTO.lattice} alt={t('alt.lattice')} /> {t('home.introD')}
      </p>
    </section>
  )
}

function Archive() {
  return (
    <figure className="archive" data-reveal>
      <div className="archive-pic">
        <img src={PHOTO.cardsStorageLarge} alt={t('alt.archive')} width="1920" height="1516" decoding="async" />
      </div>
      <figcaption>
        {t('home.archiveCap')}
        <small>{t('home.archiveCredit')}</small>
      </figcaption>
    </figure>
  )
}

const band = (): { src: string; alt: string; cap: string }[] => [
  { src: PHOTO.stairs, alt: t('alt.stairs'), cap: t('home.band1') },
  { src: PHOTO.bridge, alt: t('alt.bridge'), cap: t('home.band2') },
  { src: PHOTO.lattice, alt: t('alt.lattice'), cap: t('home.band3') },
  { src: PHOTO.facade, alt: t('alt.facade'), cap: t('home.band4') },
]

function Band() {
  return (
    <section className="band" aria-labelledby="band-h">
      <h2 id="band-h" data-reveal>
        {t('home.bandH')}
      </h2>
      <div className="band-row">
        {band().map((b, i) => (
          <figure key={b.src} className="band-pic" data-reveal style={{ ['--d' as string]: `${i * 80}ms` }}>
            <img src={b.src} alt={b.alt} width="480" height="640" loading="lazy" decoding="async" />
            <figcaption>{b.cap}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function Cta() {
  const s = useStore()
  const cont = hasProgress(s)
  const n = nextDay(s)
  const d = dayOf(cont ? n : 1)!
  const word = cont ? t('cta.continue') : t('cta.start')
  const size = Math.min(29, 92 / (word.length * 0.6))
  return (
    <a className="cta" href={dayHref(d.n)} style={{ ['--fit' as string]: `${size}vw` }}>
      <span className="cta-note">
        {cont ? t('cta.noteCont', { n: d.n, title: d.title }) : t('cta.noteNew', { title: d.title })}
      </span>
      <svg className="cta-arrow" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
        <path d="M12 36 L36 12 M16 12 H36 V32" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
      </svg>
      <h2 className="cta-word">{word}</h2>
    </a>
  )
}

/** The name, set large: the footer's close, with the prompt mark in front of it. */
function BigMark() {
  return (
    <p className="bigmark" role="img" aria-label={t('mark.aria')}>
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M7 6l14 10L7 26" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="square" />
        <rect x="19" y="23" width="9" height="4" fill="currentColor" />
      </svg>
      <span aria-hidden="true">Atölye</span>
    </p>
  )
}

function Footer() {
  return (
    <footer className="foot">
      <h2 className="sr-only">Atölye</h2>
      <BigMark />
      <div className="foot-grid">
        <nav className="foot-cols" aria-label={t('foot.nav')}>
          <div>
            <p className="foot-h">{t('foot.parts')}</p>
            <ul>
              {PARTS.map((p, i) => (
                <li key={p.id}>
                  <a href={dayHref(FIRST_DAY[i])}>{p.name}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="foot-h">{t('foot.site')}</p>
            <ul>
              <li>
                <a href="#/days">{t('foot.map')}</a>
              </li>
              <li>
                <a href="#/how">{t('foot.how')}</a>
              </li>
              <li>
                <a href={dayHref(1)}>{t('foot.day1')}</a>
              </li>
            </ul>
          </div>
          <div>
            <p className="foot-h">{t('foot.src')}</p>
            <ul>
              <li>
                <a href="https://github.com/Asabeneh/30-Days-Of-Python" target="_blank" rel="noopener noreferrer">
                  30 Days of Python
                </a>
              </li>
              <li>
                <a href="https://github.com/Asabeneh" target="_blank" rel="noopener noreferrer">
                  Asabeneh Yetayeh
                </a>
              </li>
              <li>
                <a href="https://pyodide.org" target="_blank" rel="noopener noreferrer">
                  Pyodide
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="foot-h">{t('foot.pics')}</p>
            <ul className="credits">
              <li>
                {t('foot.credit1')}{' '}
                <a href="https://commons.wikimedia.org/wiki/File:IBM_card_storage.NARA.jpg" target="_blank" rel="noopener noreferrer">
                  Wikimedia Commons
                </a>
              </li>
              <li>
                {t('foot.credit2')}{' '}
                <a href="https://commons.wikimedia.org/wiki/File:IBM_card_box_closed.agr.jpg" target="_blank" rel="noopener noreferrer">
                  Wikimedia Commons
                </a>
              </li>
              <li>
                {t('foot.credit3')}{' '}
                <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">
                  {t('foot.unsplash')}
                </a>
              </li>
            </ul>
          </div>
        </nav>
        <address className="foot-contact">
          <p>
            {t('foot.byA')} <strong>Asabeneh Yetayeh</strong>{t('foot.byB')}{' '}
            <a href="https://github.com/Asabeneh/30-Days-Of-Python" target="_blank" rel="noopener noreferrer">
              github.com/Asabeneh/30-Days-Of-Python
            </a>
          </p>
          <p>{t('foot.only')}</p>
        </address>
      </div>
      <div className="foot-last">
        <p>{t('foot.copy')}</p>
        <a className="btn btn-chev btn-sm" href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0 }) }}>
          {t('foot.top')}
        </a>
      </div>
    </footer>
  )
}

/** Scroll scenes (GSAP, Lenis, WebGL) are a separate chunk: the reader never downloads them, and the page is whole without them. */
const richMotion = (): boolean =>
  typeof matchMedia === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches && matchMedia('(min-width: 1101px)').matches

export function Home({ section }: { section: string }) {
  const lang = useLang()
  const s = useStore()
  useReveal(s.last)
  const first = useRef(true)
  const root = useRef<HTMLDivElement>(null)
  const [rich] = useState(richMotion)
  // The snake is 6 chevrons plus one per mastered concept. Segments the learner has not seen yet grow in on this load.
  const len = snakeLength(s)
  const [fresh] = useState(() => {
    const seen = getState().snakeSeen
    return seen > 0 ? Math.max(0, snakeLength(getState()) - seen) : 0
  })
  useEffect(() => {
    if (fresh > 0) {
      const t0 = window.setTimeout(() => note(t('home.snake', { n: fresh })), 900)
      const t1 = window.setTimeout(() => actions.setSnakeSeen(snakeLength(getState())), 1800)
      return () => {
        window.clearTimeout(t0)
        window.clearTimeout(t1)
      }
    }
    if (getState().snakeSeen !== len) actions.setSnakeSeen(len)
  }, [fresh, len])

  useEffect(() => {
    if (!rich || !root.current) return
    let stop: (() => void) | undefined
    let dead = false
    import('../home/scenes').then((m) => {
      if (dead || !root.current) return
      stop = m.initScenes(root.current)
    })
    return () => {
      dead = true
      stop?.()
    }
  }, [rich])

  useEffect(() => {
    const id = section === 'days' ? 'days' : section === 'how' ? 'how' : ''
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' })
    else if (!first.current || window.scrollY === 0) window.scrollTo(0, 0)
    first.current = false
  }, [section])

  useEffect(() => {
    document.title = t('title.home')
  }, [lang])

  return (
    <div ref={root} className="home" data-snake-len={len} data-fresh={fresh}>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        {t('home.skip')}
      </a>
      <Hero live={<LivePrompt />} />
      <main id="main" tabIndex={-1}>
        <MapScene fresh={fresh} />
        <Parts />
        <PlayBoard />
        <Intro />
        <Archive />
        <Band />
        <How />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
