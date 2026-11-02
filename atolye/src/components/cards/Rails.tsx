import { useEffect, useRef, useState } from 'react'
import { useRailMode, type RailMode } from '../../lib/railmode'
import { loadCards, pickList, type Card } from '../../lib/cards'
import { t, useLang, type Key, type Lang } from '../../lib/i18n'
import { cardsHref } from '../../lib/route'
import { hintKey, resourcesFor, termsFor, type Resource, type Term } from '../../lib/side'
import { cardSections } from '../../lib/original'

export { useRailMode, type RailMode }

/** Everything the boxes need to know about where the learner is. */
export interface SideProps {
  day: number
  cards: Card[]
  idx: number
  /** how many cards were reached (furthest index + 1) */
  max: number
  go: (i: number) => boolean
  terms: Term[] | null
  resources: Record<string, Resource[]> | null
  /** load an example into the card's editor (only offered when the card has one) */
  onTry: (code: string) => void
}

interface Group {
  section: string
  from: number
  to: number
}

/** The day's outline: runs of cards that share a section, in the order of the lesson (the recap closes it). */
function outlineOf(cards: Card[]): Group[] {
  const out: Group[] = []
  cards.forEach((c, i) => {
    const section = c.type === 'recap' ? '' : c.section
    const last = out[out.length - 1]
    if (last && last.section === section && section !== '') last.to = i
    else out.push({ section, from: i, to: i })
  })
  return out
}

function Outline({ day, cards, idx, max, go }: SideProps) {
  useLang()
  const groups = outlineOf(cards)
  return (
    <section className="rail-box rail-outline" aria-labelledby="rail-h-today">
      <h3 className="rail-h" id="rail-h-today">
        {t('side.today')}
      </h3>
      <ol aria-label={t('side.todayAria')} data-day={day}>
        {groups.map((g) => {
          const active = idx >= g.from && idx <= g.to
          const done = g.to < max - 1 && !active
          const locked = g.from >= max && !active
          const name = g.section || t('card.k.recap')
          const range = g.from === g.to ? t('side.cardN', { a: g.from + 1 }) : t('side.cardsN', { a: g.from + 1, b: g.to + 1 })
          return (
            <li key={g.from} className={`${active ? 'is-active' : ''}${done ? ' is-done' : ''}${locked ? ' is-locked' : ''}`} aria-current={active ? 'step' : undefined}>
              <button type="button" disabled={locked} onClick={() => go(g.from)} aria-label={`${name}, ${range}${done ? `, ${t('side.done')}` : active ? `, ${t('side.active')}` : locked ? `, ${t('side.locked')}` : ''}`}>
                <span className="out-mark" aria-hidden="true" />
                <span className="out-name">{name}</span>
                <span className="out-range num">{range}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

const KIND: Record<Resource['kind'], Key> = {
  docs: 'side.kind.docs',
  article: 'side.kind.article',
  video: 'side.kind.video',
  interactive: 'side.kind.interactive',
  practice: 'side.kind.practice',
}

/** Outside resources of this day; the ones for the section on screen come first. */
export function ResourceList({ list, lang }: { list: Resource[]; lang: Lang }) {
  return (
    <ul className="rail-res-list">
      {list.map((r) => {
        const why = (lang === 'tr' ? r.why_tr || r.why : r.why || r.why_tr) ?? ''
        return (
          <li className="rail-res" key={r.url}>
            <p className="res-meta">
              {t(KIND[r.kind])}
              {r.source ? ` · ${r.source}` : ''}
              {r.minutes ? ` · ${t('side.resMin', { n: r.minutes })}` : ''}
            </p>
            <a href={r.url} target="_blank" rel="noopener noreferrer">
              {r.title}
              <span className="sr-only"> ({t('side.newTab')})</span>
            </a>
            {why ? <p className="res-why">{why}</p> : null}
          </li>
        )
      })}
    </ul>
  )
}

function Resources({ day, cards, idx, resources }: SideProps) {
  const lang = useLang()
  const card = cards[idx]
  const list = resourcesFor(resources, day, card ? cardSections(card) : [])
  if (!list.length) return null
  return (
    <section className="rail-box" aria-labelledby="rail-h-res" key={card?.id}>
      <h3 className="rail-h" id="rail-h-res">
        {t('side.res')}
      </h3>
      <ResourceList list={list} lang={lang} />
    </section>
  )
}

/** Glossary entries as a list: name, definition, an expandable example. */
export function TermList({ list, canTry, onTry, lang }: { list: Term[]; canTry: boolean; onTry: (code: string) => void; lang: Lang }) {
  return (
    <ul className="term-list">
      {list.map((x) => {
        const name = lang === 'tr' ? x.term_tr || x.term : x.term
        const alt = lang === 'tr' && x.term_tr && x.term_tr !== x.term ? x.term : ''
        const def = (lang === 'tr' ? x.def_tr || x.def : x.def || x.def_tr) ?? ''
        return (
          <li className="term" key={x.id}>
            <p className="term-name">
              <span translate="no">{name}</span>
              {alt ? <span className="term-alt" translate="no">{alt}</span> : null}
            </p>
            <p className="term-def">{def}</p>
            {x.example ? (
              <details className="term-ex">
                <summary>{t('side.example')}</summary>
                <pre translate="no">{x.example}</pre>
                {canTry ? (
                  <button type="button" className="btn btn-quiet term-try" onClick={() => onTry(x.example ?? '')}>
                    {t('side.try')}
                  </button>
                ) : null}
              </details>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

const hasEditor = (c: Card | undefined): boolean => !!c && c.type === 'explain' && typeof c.code === 'string'

function Terms({ day, cards, idx, terms, onTry }: SideProps) {
  const lang = useLang()
  const card = cards[idx]
  const list = card && terms ? termsFor(card, terms, day) : []
  if (!list.length) return null
  return (
    <section className="rail-box" aria-labelledby="rail-h-terms" key={card.id}>
      <h3 className="rail-h" id="rail-h-terms">
        {t('side.terms')}
      </h3>
      <TermList list={list} canTry={hasEditor(card)} onTry={onTry} lang={lang} />
    </section>
  )
}

/** One or two points from the recap of an earlier day that touch a term used on this card. */
function Recall({ day, cards, idx, terms }: SideProps) {
  const lang = useLang()
  const card = cards[idx]
  const earlier = card && terms ? termsFor(card, terms, day, 4).filter((x) => x.day < day) : []
  const key = earlier.map((x) => x.id).join('|')
  const [found, setFound] = useState<{ key: string; items: { day: number; text: string }[] }>({ key: '', items: [] })
  const latest = useRef(key)
  latest.current = key

  useEffect(() => {
    if (!earlier.length) return
    let live = true
    const days = [...new Set(earlier.map((x) => x.day))]
    Promise.all(days.map((d) => loadCards(d).then((c) => ({ d, c })))).then((rs) => {
      if (!live) return
      const items: { day: number; text: string }[] = []
      for (const x of earlier) {
        const recap = rs.find((r) => r.d === x.day)?.c?.cards.find((c) => c.type === 'recap')
        if (!recap || recap.type !== 'recap') continue
        const names = [x.term, x.term_tr, ...(x.aliases ?? [])].filter((a): a is string => !!a).map((a) => a.toLowerCase())
        const point = [...pickList(lang, recap.points_tr, recap.points).text, ...pickList(lang, recap.points, recap.points_tr).text].find((p) => names.some((n) => p.toLowerCase().includes(n)))
        if (point && !items.some((i) => i.text === point)) items.push({ day: x.day, text: point })
      }
      setFound({ key, items: items.slice(0, 2) })
    })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, lang, day])

  if (!earlier.length || found.key !== key || !found.items.length) return null
  return (
    <section className="rail-box" aria-labelledby="rail-h-recall" key={card.id}>
      <h3 className="rail-h" id="rail-h-recall">
        {t('side.recall')}
      </h3>
      <ul className="recall-list">
        {found.items.map((i) => (
          <li key={i.text}>
            <p className="recall-text">{i.text.replace(/[`*]/g, '')}</p>
            <a className="recall-day" href={cardsHref(i.day)}>
              {t('side.dayN', { n: i.day })}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** A nudge on checkpoint cards. It is picked by card type, so it can never give an answer away. */
function Hint({ cards, idx }: SideProps) {
  useLang()
  const card = cards[idx]
  const k = card ? hintKey(card) : null
  if (!k) return null
  return (
    <section className="rail-box" aria-labelledby="rail-h-hint" key={card.id}>
      <h3 className="rail-h" id="rail-h-hint">
        {t('side.hint')}
      </h3>
      <p className="rail-p">{t(k)}</p>
    </section>
  )
}

function Keys() {
  useLang()
  const rows: [string, Key][] = [
    ['← →', 'side.key.arrows'],
    ['Shift+Enter', 'side.key.run'],
    ['F', 'side.key.flip'],
    ['Esc', 'side.key.esc'],
    ['Alt+L', 'side.key.lang'],
  ]
  return (
    <details className="rail-box rail-keys">
      <summary>
        <h3 className="rail-h">{t('side.keys')}</h3>
      </summary>
      <dl>
        {rows.map(([k, label]) => (
          <div key={k}>
            <dt>
              <kbd>{k}</kbd>
            </dt>
            <dd>{t(label)}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

/** Left column: where the learner is in the day, and what to read or watch next. */
export function LeftBoxes(p: SideProps) {
  return (
    <>
      <Outline {...p} />
      <Resources {...p} />
    </>
  )
}

/** Right column: the boxes that change with the card. */
export function RightBoxes(p: SideProps) {
  return (
    <>
      <Terms {...p} />
      <Recall {...p} />
      <Hint {...p} />
      <Keys />
    </>
  )
}

/**
 * The side columns stop above the language switch that floats at the bottom right: their height is what is left between
 * their own top edge (or the sticky offset, once they stick) and the bottom of the screen, minus the switch.
 */
function useRailFit(host: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    let raf = 0
    const fit = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        host.current?.querySelectorAll<HTMLElement>('.rail').forEach((el) => {
          el.style.maxHeight = ''
          const top = Math.max(el.getBoundingClientRect().top, 76)
          el.style.maxHeight = `${Math.max(160, window.innerHeight - top - 76)}px`
        })
      })
    }
    fit()
    window.addEventListener('scroll', fit, { passive: true })
    window.addEventListener('resize', fit)
    const ro = new ResizeObserver(fit)
    if (host.current) ro.observe(host.current)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', fit)
      window.removeEventListener('resize', fit)
      ro.disconnect()
    }
  }, [host])
}

/** 1024-1279 px: one column on the right, the left column's boxes folded into a group at its top. */
export function MidRail(p: SideProps) {
  useLang()
  const host = useRef<HTMLDivElement>(null)
  useRailFit(host)
  return (
    <div className="rail-host" ref={host}>
      <aside className="rail rail-right" aria-label={t('side.notes')}>
        <details className="rail-group">
          <summary>{t('side.today')} · {t('side.res')}</summary>
          <LeftBoxes {...p} />
        </details>
        <RightBoxes {...p} />
      </aside>
    </div>
  )
}

export function WideRails(p: SideProps) {
  useLang()
  const host = useRef<HTMLDivElement>(null)
  useRailFit(host)
  return (
    <div className="rail-host" ref={host}>
      <aside className="rail rail-left" aria-label={t('side.today')}>
        <LeftBoxes {...p} />
      </aside>
      <aside className="rail rail-right" aria-label={t('side.notes')}>
        <RightBoxes {...p} />
      </aside>
    </div>
  )
}

/** Phones and tablets: the same boxes in a full-height bottom sheet behind the Notlar button. */
export function NotesSheet({ onClose, ...p }: SideProps & { onClose: () => void }) {
  useLang()
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const f = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', f, true)
    return () => {
      window.removeEventListener('keydown', f, true)
      opener?.focus?.()
    }
  }, [onClose])
  return (
    <div className="sheet-wrap">
      <button type="button" className="sheet-scrim" tabIndex={-1} aria-label={t('side.close')} onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={t('side.notes')}>
        <div className="sheet-head">
          <h2>{t('side.notes')}</h2>
          <button ref={closeRef} type="button" className="btn btn-quiet" onClick={onClose}>
            {t('side.close')}
          </button>
        </div>
        <div className="sheet-body">
          <LeftBoxes {...p} />
          <RightBoxes {...p} />
        </div>
      </div>
    </div>
  )
}
