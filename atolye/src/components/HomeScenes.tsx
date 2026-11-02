import { useMemo, useState } from 'react'
import { DAYS, PARTS, dayOf, daysOfPart } from '../data/days'
import { t } from '../lib/i18n'
import { getPreview } from '../lib/preview'
import { dailyGoal, dayState, doneCount, dueReviews, hasProgress, nextDay, streak, useStore, type State } from '../lib/store'
import { dayHref } from '../lib/route'
import { segmentVar, snakeLength } from '../lib/snakeview'
import { Hud } from './Hud'
import { SettingsMenu } from './AppBar'
import { Wordmark } from './bits'
import { conquered } from './PlayBoard'

/**
 * The snake: a ribbon of flat chevrons, one per mastered concept (6 to start, 30 at most). Finished days take their part's
 * colour (or the skin's pair), the next day is accent-coloured. It sits under the map with a plain-words label.
 */
export function SnakeSvg({ s, fresh = 0 }: { s: State; fresh?: number }) {
  const next = nextDay(s)
  const len = snakeLength(s)
  const step = 40
  const W = 30 * step
  const H = 44
  const segs = useMemo(() => DAYS.map((d, i) => ({ n: d.n, x: 22 + i * step })), [])
  return (
    <svg className="snake-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" data-len={len}>
      {segs.slice(0, len).map((g) => (
        <g key={g.n} transform={`translate(${g.x} ${H / 2})`}>
          <polygon
            className={g.n > len - fresh ? 'seg-new' : undefined}
            style={g.n > len - fresh ? { animationDelay: `${(g.n - (len - fresh) - 1) * 160}ms` } : undefined}
            points="-12,-18 -2,-18 12,0 -2,18 -12,18 0,0"
            fill={`var(${segmentVar(s, g.n, next)})`}
          />
        </g>
      ))}
    </svg>
  )
}

/** The come-back line for phones (the XP unit is hidden there): streak, today's goal and what is due, in one row. */
function TodayLine() {
  const s = useStore()
  if (!hasProgress(s)) return null
  const due = dueReviews(s).length
  const goal = dailyGoal(s)
  const st = streak(s)
  return (
    <p className="hero-today" aria-label={t('today.aria')}>
      <a href="#/review" className={due ? 'has-due' : ''}>
        <span className="num">{due}</span> {due ? t('today.dueYes') : t('today.dueNo')}
      </a>
      <span>
        {t('today.streakA')} <span className="num">{st}</span> {t('today.streakB')}
      </span>
      <span className={goal.met ? 'is-met' : ''}>{t('today.goal', { v: goal.value, t: goal.target })}</span>
    </p>
  )
}

export function Hero({ live }: { live: React.ReactNode }) {
  const s = useStore()
  const cont = hasProgress(s)
  const next = nextDay(s)
  return (
    <header className="hero" id="top">
      <nav className="topnav" aria-label={t('hero.nav')}>
        <Wordmark />
        <div className="topnav-links">
          <a href="#/days">{t('reader.days')}</a>
          <a href="#/how">{t('foot.how')}</a>
          {cont && <Hud compact />}
          <SettingsMenu />
          <a className="btn btn-chev btn-sm" href={dayHref(cont ? next : 1)}>
            {cont ? t('cta.continue') : t('cta.start')}
          </a>
        </div>
      </nav>
      <div className="hero-grid">
        <div className="hero-copy">
          <h1 data-reveal style={{ ['--d' as string]: '0ms' }}>
            {t('hero.h1a')} <br />
            {t('hero.h1b')}
          </h1>
          <p className="hero-lead" data-reveal style={{ ['--d' as string]: '90ms' }}>
            {t('hero.lead')}
          </p>
          <TodayLine />
          <div className="hero-actions" data-reveal style={{ ['--d' as string]: '160ms' }}>
            <a className="btn btn-chev btn-lg" href={dayHref(cont ? next : 1)}>
              {cont ? t('hero.cont', { n: next }) : t('hero.start')}
            </a>
            <p className="hero-count">
              <span className="num">{doneCount(s)}</span> {t('hero.countB')}
            </p>
          </div>
          <p className="hero-games" data-reveal style={{ ['--d' as string]: '220ms' }}>
            <a href="#/speed">{t('hero.speed')} <small>{t('hero.speedS')}</small></a>
            <a href="#/hunt">{t('hero.hunt')} <small>{t('hero.huntS')}</small></a>
          </p>
        </div>
        <div className="hero-live" data-reveal style={{ ['--d' as string]: '120ms' }}>
          {live}
        </div>
      </div>
    </header>
  )
}

/**
 * The journey: five rows (one per part), a square per day, a boss at the end of each row. A panel beside it follows the
 * pointer or focus and tells what the day teaches; it never leaves the column, so nothing is clipped at any width.
 */
export function MapScene({ fresh = 0 }: { fresh?: number }) {
  const s = useStore()
  const next = nextDay(s)
  const [hot, setHot] = useState<number | null>(null)
  const shown = hot ?? next
  const shownMeta = dayOf(shown)!
  const prev = useMemo(() => getPreview(shown), [shown])
  const part = PARTS[shownMeta.part]
  const len = snakeLength(s)

  return (
    <section className="map-scene" id="days" aria-labelledby="map-h">
      <div className="map-head">
        <h2 id="map-h" data-reveal>{t('map.h')}</h2>
        <p data-reveal style={{ ['--d' as string]: '80ms' }}>{t('map.p')}</p>
        <ul className="map-legend" aria-label={t('map.lTitle')}>
          <li><i className="lg lg-done" /> {t('map.lDone')}</li>
          <li><i className="lg lg-next" /> {t('map.lNow')}</li>
          <li><i className="lg lg-todo" /> {t('map.lNext')}</li>
          <li><i className="lg lg-boss" /> {t('map.lBoss')}</li>
        </ul>
      </div>
      <div className="map-body">
        <div className="map-rows" onPointerLeave={() => setHot(null)}>
          {PARTS.map((p, pi) => {
            const days = DAYS.filter((d) => d.part === pi)
            const done = days.filter((d) => s.done[d.n]).length
            const won = conquered(s, pi)
            const open = done === days.length
            return (
              <div key={p.id} className={`map-part f${p.field}`} data-map-part>
                <p className="map-part-name">
                  <span>{p.name}</span>
                  <small className="num">{done} / {days.length}</small>
                </p>
                <ul className="map-slots">
                  {days.map((d) => {
                    const st = dayState(s, d.n)
                    return (
                      <li key={d.n}>
                        <a
                          href={dayHref(d.n)}
                          className={`slot slot-${st}${d.n === next ? ' is-next' : ''}${hot === d.n ? ' is-hot' : ''}`}
                          aria-label={`${t('pal.day', { n: d.n, title: d.title })}${st === 'done' ? t('dl.done') : st === 'progress' ? t('dl.progress') : ''}${d.local ? t('map.local') : ''}`}
                          onPointerEnter={(e) => e.pointerType === 'mouse' && setHot(d.n)}
                          onFocus={() => setHot(d.n)}
                          onBlur={() => setHot(null)}
                        >
                          <span className="slot-n num">{d.n}</span>
                          <span className="slot-t">{d.title}</span>
                        </a>
                      </li>
                    )
                  })}
                  <li>
                    <a className={`slot slot-boss${won ? ' is-won' : open ? ' is-open' : ''}`} href={`#/boss/${pi + 1}`} aria-label={t('boss.tileAria', { name: p.name, state: won ? t('boss.sWon') : open ? t('boss.sOpen') : t('boss.sLocked', { done, total: days.length }) })}>
                      <span className="slot-n">{won ? t('parts.flag') : t('map.lBoss')}</span>
                      <span className="slot-t">{won ? '' : open ? t('boss.start') : t('boss.dots', { done, total: days.length })}</span>
                    </a>
                  </li>
                </ul>
              </div>
            )
          })}
        </div>
        <aside className={`preview f${part.field}`} aria-hidden="true">
          <div className="preview-inner" key={shown}>
            <p className="preview-n num">{shown}</p>
            <p className="preview-title">{shownMeta.title}</p>
            <p className="preview-teaser">{shownMeta.teaser}</p>
            {prev.cards ? (
              <p className="preview-cards num">
                {t('learn.planCards', { n: prev.cards, min: prev.cardMin ?? 1 })}
                {(s.cards[shown]?.max ?? 0) > 0 ? ` · ${t('learn.planSeen', { seen: Math.min(prev.cards, s.cards[shown].max), n: prev.cards })}` : ''}
              </p>
            ) : null}
            <ul className="preview-topics">
              {prev.topics.slice(0, 4).map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
      <div className="snake">
        <div className="snake-text">
          <h3>{t('map.snakeH')}</h3>
          <p>{t('map.snakeP', { n: len })}</p>
        </div>
        <SnakeSvg s={s} fresh={fresh} />
      </div>
    </section>
  )
}

/** The five parts as colour bands: days, what you write, a real snippet from the part, your completion, its boss. */
export function Parts() {
  const s = useStore()
  return (
    <section className="parts" id="parts" aria-labelledby="parts-h">
      <h2 id="parts-h" data-reveal>{t('parts.h')}</h2>
      <div className="parts-track">
        {PARTS.map((p, pi) => {
          const days = daysOfPart(pi).map((n) => DAYS[n - 1])
          const done = days.filter((d) => s.done[d.n]).length
          const open = days.find((d) => !s.done[d.n]) ?? days[0]
          return (
            <article key={p.id} className={`part-card f${p.field}${s.boss[pi]?.done ? ' is-conquered' : ''}`} data-part-card data-reveal>
              <div className="part-body">
                <div className="part-info">
                  <h3 className="part-tab">
                    {p.name}
                    {s.boss[pi]?.done && <span className="part-flag">{t('parts.flag')}</span>}
                  </h3>
                  <p className="part-days num">{t('parts.days', { from: p.from, to: p.to })}</p>
                  <p className="part-blurb">{p.build}</p>
                  <p className="part-done">
                    <span className="num">{done} / {days.length}</span> {t('parts.doneB')}
                  </p>
                  <div className="part-dots" aria-hidden="true">
                    {days.map((d) => (
                      <span key={d.n} className={s.done[d.n] ? 'is-done' : ''} />
                    ))}
                  </div>
                  <div className="part-actions">
                    <a className="btn btn-chev" href={dayHref(open.n)}>
                      {done > 0 && done < days.length ? t('parts.cont', { n: open.n }) : done === days.length ? t('parts.reopen') : t('parts.begin', { n: open.n })}
                    </a>
                    <a className="part-boss" href={`#/boss/${pi + 1}`}>
                      {s.boss[pi]?.done ? t('parts.bossWon') : done === days.length ? t('parts.bossOpen') : t('parts.bossProg', { done, total: days.length })}
                    </a>
                  </div>
                </div>
                <figure className="part-code">
                  <pre translate="no">{p.sample}</pre>
                  <figcaption>{t('parts.cap')}</figcaption>
                </figure>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

const DEMO_CODE = 'numbers = [i for i in range(11)]\nsquares = [i * i for i in range(11)]\nprint(squares)'
const DEMO_OUT = '[0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100]'

const steps = (): { name: string; text: string }[] => [
  { name: t('how.s1n'), text: t('how.s1t') },
  { name: t('how.s2n'), text: t('how.s2t') },
  { name: t('how.s3n'), text: t('how.s3t') },
  { name: t('how.s4n'), text: t('how.s4t') },
]

/** The cell that runs itself. The markup holds the finished state; the scroll scene resets it and scrubs it back in. */
export function How() {
  return (
    <section className="how" id="how" aria-labelledby="how-h">
      <div className="how-pin">
        <div className="how-copy">
          <h2 id="how-h">{t('how.h')}</h2>
          <p>{t('how.p')}</p>
          <ol className="how-steps">
            {steps().map((st, i) => (
              <li key={st.name} className={i === 0 ? 'is-on' : ''} data-how-step>
                <span className="chev chev-done" aria-hidden="true" />
                <div>
                  <p className="how-step-name">{st.name}</p>
                  <p className="how-step-text">{st.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="demo" role="img" aria-label={t('how.demoAria')} data-ui>
          <div className="demo-code" aria-hidden="true">
            <pre translate="no" data-demo-code data-full={DEMO_CODE}>{DEMO_CODE}</pre>
          </div>
          <div className="demo-bar" aria-hidden="true">
            <span className="btn btn-chev demo-run" data-demo-run>{t('home.run')}</span>
            <span className="demo-hint">Shift+Enter</span>
          </div>
          <div className="demo-out" aria-hidden="true" data-demo-out>
            <pre translate="no">{DEMO_OUT}</pre>
            <p className="out-match">{t('how.match')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
