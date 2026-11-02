import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DAYS, PARTS, dayOf, partOfDay } from '../data/days'
import type { CellDef, ParsedLesson } from '../lib/lesson'
import { runner } from '../lib/runner'
import { actions, cellsRunIn, dayState, doneCount, getState, useStore } from '../lib/store'
import { cardsHref, dayHref, fullHref, learnHref, type DayView } from '../lib/route'
import { awardXp, checkBadges, claimStreakBonuses } from '../lib/game'
import { loadDay } from '../lib/exercises'
import { loadCards, type CardsDay } from '../lib/cards'
import { loadChunk } from '../lib/chunkError'
import { getLang, t, useLang } from '../lib/i18n'
import { setCtx } from '../lib/ui'
import { Cell, cellRegistry } from './Cell'
import { Celebrate } from './Celebrate'
import { Learn } from './learn/Learn'
import { AppBar } from './AppBar'
import { Chev, Wordmark } from './bits'
import { CardSkeleton } from './Skeleton'

// The card player (and its editor, tracer and Markdown) downloads only when the Anlatım tab opens.
const Cards = lazy(() => loadChunk(() => import('./cards/Cards')).then((m) => ({ default: m.Cards })))

/** XP for closing a day: paid once per day, and only after the end-of-day quiz was passed. */
const DAY_XP = 20

/** Stored dates are local YYYY-MM-DD; show them the way the reader's language writes them. */
const fmtDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat(getLang() === 'en' ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d))
}

/** Course progress as one line and one segmented bar: a segment per day, filled when the day is done. */
function CourseBar() {
  const s = useStore()
  const n = doneCount(s)
  return (
    <div className="course-bar">
      <p className="num">{t('bar.course', { n })}</p>
      <ol aria-hidden="true">
        {DAYS.map((d) => (
          <li key={d.n} className={s.done[d.n] ? 'is-done' : ''} />
        ))}
      </ol>
    </div>
  )
}

function DayList({ current, onNavigate }: { current: number; onNavigate?: () => void }) {
  const s = useStore()
  const activeRef = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [current])
  return (
    <nav aria-label={t('dl.aria')} className="daylist">
      {PARTS.map((p, pi) => (
        <div key={p.id} className="daylist-group">
          <p className="daylist-part">{p.name}</p>
          <ul>
            {DAYS.filter((d) => d.part === pi).map((d) => {
              const st = dayState(s, d.n)
              const active = d.n === current
              return (
                <li key={d.n}>
                  <a ref={active ? activeRef : undefined} href={dayHref(d.n)} className={`daylist-row${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={onNavigate}>
                    <Chev state={st} />
                    <span className="daylist-n num">{d.n}</span>
                    <span className="daylist-t">{d.title}</span>
                    <span className="sr-only">{st === 'done' ? t('dl.done') : st === 'progress' ? t('dl.progress') : ''}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

/** The lesson Markdown and its renderer download only when the text view (or a paste check) needs them. */
function useLesson(day: number, enabled: boolean): ParsedLesson | null {
  const [p, setP] = useState<ParsedLesson | null>(null)
  useEffect(() => {
    setP(null)
    if (!enabled) return
    let live = true
    import('../lib/lesson').then((m) => m.loadLesson(day)).then((r) => live && setP(r))
    return () => {
      live = false
    }
  }, [day, enabled])
  return p
}

function LessonBody({ day, parsed, onToc }: { day: number; parsed: ParsedLesson; onToc: (ids: string[]) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const [slots, setSlots] = useState<{ def: CellDef; el: Element }[]>([])

  useLayoutEffect(() => {
    const root = host.current
    if (!root) return
    const byId = new Map(parsed.cells.map((c) => [c.id, c]))
    const found: { def: CellDef; el: Element }[] = []
    root.querySelectorAll('.cell-slot').forEach((el) => {
      const def = byId.get((el as HTMLElement).dataset.cell ?? '')
      if (def) found.push({ def, el })
    })
    setSlots(found)
    onToc(parsed.headings.map((h) => h.id))
  }, [parsed, onToc])

  // Restore the scroll position for this day once the cells are mounted.
  const restored = useRef(false)
  useEffect(() => {
    if (restored.current) return
    if (parsed.cells.length > 0 && slots.length === 0) return
    restored.current = true
    const y = getState().scroll[day] ?? 0
    requestAnimationFrame(() => window.scrollTo(0, y))
  }, [slots, day, parsed.cells.length])

  const onClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a')
    const href = a?.getAttribute('href')
    if (a && href && href.startsWith('#') && !href.startsWith('#/')) {
      e.preventDefault()
      document.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView({ behavior: 'auto', block: 'start' })
    }
  }

  const counters = { code: 0, scratch: 0 }
  return (
    <>
      {/* The lesson HTML is trusted: it is rendered from the course repository's own Markdown at build time. */}
      <div ref={host} className="md" onClick={onClick} dangerouslySetInnerHTML={{ __html: parsed.html }} />
      {slots.map(({ def, el }) => {
        const index = def.kind === 'code' ? counters.code++ : counters.scratch++
        return createPortal(<Cell def={def} day={day} session={`day-${day}`} index={index} />, el, def.id)
      })}
    </>
  )
}

/** Thin bar at the very top; written straight to the DOM so scrolling never re-renders React. */
function ReadingBar() {
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const f = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - innerHeight
        const p = h > 0 ? Math.min(1, scrollY / h) : 0
        if (bar.current) bar.current.style.transform = `scaleX(${p})`
      })
    }
    f()
    window.addEventListener('scroll', f, { passive: true })
    window.addEventListener('resize', f)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', f)
      window.removeEventListener('resize', f)
    }
  }, [])
  return <div className="read-bar" aria-hidden="true"><div ref={bar} /></div>
}

function Toc({ items, active }: { items: { id: string; text: string; level: number }[]; active: string }) {
  if (items.length < 2) return null
  return (
    <nav className="toc" aria-label={t('toc.h')}>
      <p className="toc-h">{t('toc.h')}</p>
      <ul>
        {items.map((h) => (
          <li key={h.id} className={h.level === 3 ? 'is-sub' : ''}>
            <a
              href={`#${h.id}`}
              aria-current={active === h.id ? 'location' : undefined}
              className={active === h.id ? 'is-active' : ''}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(h.id)?.scrollIntoView({ block: 'start' })
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Reader({ day, view: want }: { day: number; view: DayView }) {
  const lang = useLang()
  const s = useStore()
  const meta = dayOf(day)!
  const part = partOfDay(day)

  // The bare day link opens on Anlatım until the day's recap card was reached, then on Öğren. Without a card file it is Öğren.
  // kept with its day: after a day change the previous day's file must never decide the new day's tab
  const [loaded, setLoaded] = useState<{ day: number; data: CardsDay | null } | null>(null)
  useEffect(() => {
    let live = true
    loadCards(day).then((d) => live && setLoaded({ day, data: d }))
    return () => {
      live = false
    }
  }, [day])
  const cardsData: CardsDay | null | undefined = loaded && loaded.day === day ? loaded.data : undefined
  const recapSeen = !!s.cards[day]?.recap
  const view: Exclude<DayView, 'auto'> | null = want !== 'auto' ? want : cardsData === undefined ? null : cardsData && !recapSeen ? 'cards' : 'learn'
  useEffect(() => {
    if (want === 'auto' && view) window.location.replace(view === 'cards' ? cardsHref(day) : learnHref(day))
  }, [want, view, day])
  const cards = view === 'cards'
  /** the original long lesson page */
  const text = view === 'full'
  const parsed = useLesson(day, text)
  const [drawer, setDrawer] = useState(false)
  const [celebrate, setCelebrate] = useState<{ x: number; y: number; xp: number } | null>(null)
  const [active, setActive] = useState('')
  const [hasEx, setHasEx] = useState<boolean | null>(null)
  const [ranAll, setRanAll] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  const st = dayState(s, day)
  const done = s.done[day]
  const ranHere = cellsRunIn(s, day)
  const minutes = useMemo(() => (parsed ? Math.max(3, Math.round(parsed.html.replace(/<[^>]+>/g, ' ').split(/\s+/).length / 190)) : 0), [parsed])
  const prev = day > 1 ? dayOf(day - 1) : undefined
  const next = day < 30 ? dayOf(day + 1) : undefined
  const focus = s.settings.focus

  useEffect(() => {
    actions.visit(day)
    window.scrollTo(0, 0)
    setHasEx(null)
    loadDay(day).then((d) => setHasEx(!!d))
    return () => {
      runner.drop(`day-${day}`)
    }
  }, [day])

  useEffect(() => {
    document.title = t('title.day', { n: day, title: meta.title })
  }, [day, meta.title, lang])

  // Save the scroll position per lesson (text mode only: the learn flow keeps its place in the step list).
  useEffect(() => {
    if (!text) return
    let t: number | undefined
    const f = () => {
      window.clearTimeout(t)
      t = window.setTimeout(() => actions.setScroll(day, window.scrollY), 200)
    }
    window.addEventListener('scroll', f, { passive: true })
    return () => {
      window.removeEventListener('scroll', f)
      window.clearTimeout(t)
    }
  }, [day, text])

  // Warm up Python while the reader reads the first paragraphs.
  useEffect(() => {
    const id = window.setTimeout(() => runner.warm(), 1200)
    return () => window.clearTimeout(id)
  }, [day])

  // Section highlight for the mini table of contents and the palette's section jumps.
  const [tocIds, setTocIds] = useState<string[]>([])
  const onToc = useCallback((ids: string[]) => setTocIds(ids), [])
  useEffect(() => {
    if (!text || tocIds.length === 0) return
    const els = tocIds.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e)
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (vis) setActive(vis.target.id)
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [text, tocIds])

  useEffect(() => {
    if (!text || !parsed) return
    setCtx({
      day,
      sections: parsed.headings.filter((h) => h.level === 2).map((h) => ({ label: h.text, go: () => document.getElementById(h.id)?.scrollIntoView({ block: 'start' }) })),
    })
    return () => setCtx({ day: null, sections: [] })
  }, [text, day, parsed])

  // j / k: next / previous day.
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || el.closest('input, textarea, select, [contenteditable], .cm-editor, dialog')) return
      if (e.key === 'j' && next) window.location.hash = dayHref(next.n)
      if (e.key === 'k' && prev) window.location.hash = dayHref(prev.n)
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [next, prev])

  useEffect(() => {
    if (!drawer) return
    closeRef.current?.focus()
    const f = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [drawer])

  const finish = useCallback(
    (anchor?: Element | null) => {
      if (getState().done[day]) return
      actions.markDone(day)
      // Day-done XP: only after a passed quiz, and only once per day ever (un-marking cannot farm it).
      const st = getState()
      const q = st.quiz[day]
      const pays = !!q && q.total > 0 && q.good / q.total >= 0.6 && !st.dayXpPaid[day]
      if (pays) {
        actions.markDayXpPaid(day)
        awardXp(DAY_XP, t('xp.dayDone'), anchor)
      }
      claimStreakBonuses(anchor)
      checkBadges()
      const r = anchor?.getBoundingClientRect()
      setCelebrate({ x: r ? r.left + r.width / 2 : innerWidth / 2, y: r ? r.top + r.height / 2 : innerHeight / 2, xp: pays ? DAY_XP : 0 })
    },
    [day],
  )

  const runAll = async () => {
    setRanAll(true)
    const list = [...cellRegistry.entries()].sort((a, b) => a[1].order - b[1].order)
    for (const [, c] of list) {
      c.expand()
      await c.run()
    }
    setRanAll(false)
  }

  const textSize = ['small', 'mid', 'large'][s.settings.textStep] ?? 'mid'

  return (
    <div className={`reader${focus ? ' is-focus' : ''}`} data-text-size={textSize}>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        {t('reader.skip')}
      </a>
      {text && <ReadingBar />}
      <AppBar reader>
        <button type="button" className="btn btn-quiet bar-days" onClick={() => setDrawer(true)} aria-haspopup="dialog" aria-expanded={drawer}>
          <span className="bar-days-n num">{t('common.dayN', { n: day })}</span>
          <span className="bar-days-t">{meta.title}</span>
          <svg viewBox="0 0 12 8" width="12" height="8" aria-hidden="true" className="menu-caret">
            <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="sr-only">{t('reader.days')}</span>
        </button>
      </AppBar>

      {drawer && (
        <div className="drawer-wrap">
          <button type="button" className="drawer-scrim" tabIndex={-1} aria-label={t('common.close')} onClick={() => setDrawer(false)} />
          <div className="drawer" role="dialog" aria-modal="true" aria-label={t('reader.listAria')}>
            <div className="drawer-head">
              <Wordmark />
              <button ref={closeRef} type="button" className="btn btn-quiet" onClick={() => setDrawer(false)}>
                {t('common.close')}
              </button>
            </div>
            <CourseBar />
            <DayList current={day} onNavigate={() => setDrawer(false)} />
            <div className="drawer-foot">
              <a className="btn btn-quiet" href="#/" onClick={() => setDrawer(false)}>
                {t('common.homeLink')}
              </a>
            </div>
          </div>
        </div>
      )}

      <main className="canvas" id="main" tabIndex={-1} inert={drawer}>
        <article className={`lesson${text ? '' : ' lesson-learn'}${cards ? ' lesson-cards' : ''}`}>
          <header className="lesson-head">
            <div>
              <h1>
                <span className="lesson-day num">{t('common.dayN', { n: day })}</span> {meta.title}
              </h1>
              <p className="lesson-sub">
                {t('reader.part', { part: part.name })} · {text ? (parsed ? t('reader.subFull', { min: minutes, n: parsed.codeCount }) : t('reader.subFullLoading')) : cards ? (cardsData ? t('reader.subCards', { n: cardsData.cards.length, min: Math.max(1, Math.round(cardsData.est_minutes ?? cardsData.cards.length * 0.7)) }) : t('reader.subCardsIdle')) : t('reader.subLearn')}
              </p>
            </div>
            <p className={`lesson-state is-${st}`} role="status">
              <Chev state={st} />
              {st === 'done' ? t('reader.stDone', { date: fmtDate(done) }) : st === 'progress' ? (ranHere ? t('reader.stRuns', { n: ranHere }) : t('reader.stProgress')) : t('reader.stNew')}
            </p>
          </header>

          <div className="tabs" role="tablist" aria-label={t('tab.aria')}>
            <a role="tab" aria-selected={cards} className={`tab${cards ? ' is-on' : ''}`} href={cardsHref(day)}>
              {t('tab.lesson')}
            </a>
            <a role="tab" aria-selected={view === 'learn'} className={`tab${view === 'learn' ? ' is-on' : ''}`} href={learnHref(day)}>
              {t('tab.practice')}
            </a>
            {text && (
              <a role="tab" aria-selected className="tab is-on" href={fullHref(day)}>
                {t('tab.full')}
              </a>
            )}
          </div>

          {meta.local && (
            <div className="notice" role="note">
              <strong>{t('reader.localH')}</strong> {t('reader.localA')} <code>source .venv/bin/activate</code> {t('reader.localB')}
            </div>
          )}

          {view === null ? (
            <CardSkeleton />
          ) : cards ? (
            <Suspense fallback={<CardSkeleton />}>
              <Cards key={day} day={day} title={meta.title} />
            </Suspense>
          ) : !text ? (
            <Learn day={day} title={meta.title} done={!!done} onShowText={() => (window.location.hash = fullHref(day))} onFinishDay={() => finish(document.querySelector('.quiz-card .btn-lg'))} />
          ) : (
            <div className="lesson-cols">
              <div className="lesson-main">
                <div className="text-tools">
                  <p>{t('reader.toolsA')} <a href={cardsHref(day)}>{t('tab.lesson')}</a>{t('reader.toolsB')} <a href={learnHref(day)}>{t('tab.practice')}</a> {t('reader.toolsC')}</p>
                  <button type="button" className="btn btn-quiet" onClick={runAll} disabled={ranAll || !parsed || parsed.codeCount === 0}>
                    {ranAll ? t('common.running') : t('reader.runAll')}
                  </button>
                </div>
                {parsed ? <LessonBody key={day} day={day} parsed={parsed} onToc={onToc} /> : <p className="boot" role="status">{t('boot.text')}</p>}
                <section className="finish" aria-labelledby="finish-h">
                  <h2 id="finish-h">{done ? t('fin.doneH') : t('fin.h')}</h2>
                  <p>
                    {done
                      ? t('fin.doneP', { n: day, date: fmtDate(done) })
                      : hasEx
                        ? t('fin.hasEx')
                        : t('fin.noEx')}
                  </p>
                  <div className="finish-actions">
                    {done ? (
                      <button type="button" className="btn btn-quiet" onClick={() => actions.unmarkDone(day)}>
                        {t('fin.undo')}
                      </button>
                    ) : hasEx ? (
                      <a className="btn btn-chev btn-lg" href={learnHref(day)}>
                        {t('fin.toPractice')}
                      </a>
                    ) : (
                      <button type="button" className="btn btn-chev btn-lg" onClick={(e) => finish(e.currentTarget)}>
                        {t('fin.mark')}
                      </button>
                    )}
                  </div>
                </section>
              </div>
              <aside className="lesson-aside">
                <Toc items={parsed?.headings ?? []} active={active} />
              </aside>
            </div>
          )}

          <nav className="pager" aria-label={t('pager.aria')}>
            {prev ? (
              <a href={dayHref(prev.n)} rel="prev">
                <span className="pager-dir">{t('pager.prev')}</span>
                <span className="pager-t">
                  {prev.n} · {prev.title}
                </span>
              </a>
            ) : (
              <span />
            )}
            {next ? (
              <a href={dayHref(next.n)} rel="next" className="pager-next">
                <span className="pager-dir">{t('pager.next')}</span>
                <span className="pager-t">
                  {next.n} · {next.title}
                </span>
              </a>
            ) : (
              <a href="#/" className="pager-next">
                <span className="pager-dir">{t('pager.finished')}</span>
                <span className="pager-t">{t('pager.home')}</span>
              </a>
            )}
          </nav>
        </article>
      </main>
      {celebrate && <Celebrate day={day} bonusXp={celebrate.xp} origin={celebrate} onClose={() => setCelebrate(null)} />}
    </div>
  )
}
