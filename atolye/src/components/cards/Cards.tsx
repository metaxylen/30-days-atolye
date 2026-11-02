import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CARD_XP, cardTitle, isCheckpoint, loadCards, pickText, type Card, type CardsDay } from '../../lib/cards'
import { t, useLang } from '../../lib/i18n'
import { awardXp, checkBadges } from '../../lib/game'
import { answerOk } from '../../lib/juice'
import { fullHref, learnHref } from '../../lib/route'
import { actions, getState, useStore } from '../../lib/store'
import { reducedMotion } from '../../lib/ui'
import { runner } from '../../lib/runner'
import { ExplainView, FillView, OrderView, PredictView, RecapView, TrueFalseView, type Outcome } from './CardViews'
import { Original } from './Original'

/** Getters over the dictionary, so a label read at render time follows the language switch. */
const KICKER = {
  get explain() {
    return t('card.k.explain')
  },
  get predict() {
    return t('card.k.predict')
  },
  get fill() {
    return t('card.k.fill')
  },
  get truefalse() {
    return t('card.k.truefalse')
  },
  get order() {
    return t('card.k.order')
  },
  get recap() {
    return t('card.k.recap')
  },
} as Record<Card['type'], string>

/** Places where a drag must not start a swipe: things you press, type into, select or scroll sideways. */
const NO_SWIPE = 'input, textarea, select, button, a, summary, label, .cm-editor, .pyview, .parsons, .trace, .orig-body, [data-noswipe]'

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n))

/** iOS-style rubber band: the further past the edge, the less the card follows. */
const rubber = (dx: number, w: number): number => {
  const a = Math.abs(dx)
  return Math.sign(dx) * ((0.55 * a * w) / (w + 0.55 * a))
}

/** A damped spring from the release point back to rest, keeping the release velocity (px/ms). Transform only. */
function settle(el: HTMLElement, x0: number, v0: number) {
  el.style.transform = ''
  if (reducedMotion() || Math.abs(x0) < 0.5) return
  const k = 0.0004
  const c = 0.03
  const dt = 8
  let x = x0
  let v = clamp(v0, -1.2, 1.2)
  let t = 0
  const xs = [x]
  while (t < 900 && (Math.abs(x) > 0.3 || Math.abs(v) > 0.004)) {
    v += (-k * x - c * v) * dt
    x += v * dt
    t += dt
    xs.push(x)
  }
  xs.push(0)
  el.animate(
    xs.map((p, i) => ({ transform: `translateX(${p.toFixed(2)}px)`, offset: i / (xs.length - 1) })),
    { duration: t + dt, easing: 'linear' },
  )
}

export function Cards({ day, title }: { day: number; title: string }) {
  const lang = useLang()
  const s = useStore()
  const prog = s.cards[day]
  const [data, setData] = useState<CardsDay | null | undefined>(undefined)
  const [idx, setIdx] = useState<number | null>(null)
  const [nudge, setNudge] = useState(0)
  const stage = useRef<HTMLDivElement>(null)
  const slide = useRef<HTMLDivElement>(null)
  const face = useRef<HTMLElement>(null)
  const shown = useRef(false)
  const dirRef = useRef(1)
  const drag = useRef<{ id: number; x0: number; y0: number; locked: boolean; dx: number; w: number; samples: { t: number; x: number }[] } | null>(null)

  useEffect(() => {
    let live = true
    setData(undefined)
    setIdx(null)
    shown.current = false
    loadCards(day).then((d) => {
      if (!live) return
      setData(d)
      if (d) {
        const at = clamp(getState().cards[day]?.pos ?? 0, 0, d.cards.length - 1)
        setIdx(at)
        actions.setCardPos(day, at)
      }
    })
    return () => {
      live = false
    }
  }, [day])

  useEffect(() => {
    const id = window.setTimeout(() => runner.warm(), 800)
    return () => window.clearTimeout(id)
  }, [])

  const cards = data?.cards ?? []
  const n = cards.length
  const card = idx !== null ? cards[idx] : undefined
  const max = prog?.max ?? 0
  const needsAnswer = (c: Card | undefined): boolean => !!c && isCheckpoint(c) && !getState().cards[day]?.res[c.id]?.done
  const gated = needsAnswer(card)

  // the recap card closes the "first visit" phase: from now on the day opens on Öğren
  useEffect(() => {
    if (card?.type === 'recap') actions.reachRecap(day)
  }, [card?.type, card?.id, day])

  // a card slides in from the side it came from (a plain fade with reduced motion)
  useLayoutEffect(() => {
    const el = slide.current
    if (!el || card === undefined) return
    if (!shown.current) {
      shown.current = true
      return
    }
    if (reducedMotion()) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' })
    else el.animate([{ opacity: 0, transform: `translateX(${dirRef.current * 36}px)` }, { opacity: 1, transform: 'translateX(0)' }], { duration: 220, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' })
  }, [card?.id])

  /** The card that is leaving stays as a snapshot for a moment and slides away while the next one slides in. */
  const leave = useCallback((dir: number, from: number) => {
    const el = slide.current
    const host = stage.current
    if (!el || !host) return
    const ghost = el.cloneNode(true) as HTMLElement
    ghost.classList.add('is-leaving')
    ghost.setAttribute('aria-hidden', 'true')
    ghost.removeAttribute('id')
    ghost.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'))
    ghost.querySelectorAll('a, button, input, textarea, [tabindex]').forEach((e) => e.setAttribute('tabindex', '-1'))
    ghost.style.transform = ''
    host.appendChild(ghost)
    const frames = reducedMotion() ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: `translateX(${from}px)` }, { opacity: 0, transform: `translateX(${from - dir * 56}px)` }]
    const a = ghost.animate(frames, { duration: reducedMotion() ? 120 : 190, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' })
    a.onfinish = () => ghost.remove()
    a.oncancel = () => ghost.remove()
  }, [])

  /** Move to another card. Going forward past an unanswered checkpoint is held back with a nudge ("Geç" is the way around). */
  const go = useCallback(
    (to: number, o: { from?: number } = {}): boolean => {
      if (idx === null || n === 0) return false
      const target = clamp(to, 0, n - 1)
      if (target === idx) return false
      const dir = target > idx ? 1 : -1
      if (dir > 0 && needsAnswer(cards[idx])) {
        setNudge((k) => k + 1)
        return false
      }
      leave(dir, o.from ?? 0)
      dirRef.current = dir
      setIdx(target)
      actions.setCardPos(day, target)
      return true
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idx, n, cards, day, leave],
  )
  const goRef = useRef(go)
  goRef.current = go
  const idxRef = useRef(idx)
  idxRef.current = idx

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable], .cm-editor, dialog, [data-own-arrows]')) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goRef.current((idxRef.current ?? 0) + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goRef.current((idxRef.current ?? 0) - 1)
      }
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])

  const finish = (c: Card, o: Outcome) => {
    const had = getState().cards[day]?.res[c.id]
    const paid = !!had && had.r !== 'skip'
    const anchor = face.current
    if (o.ok) {
      // a first-try answer feeds the combo; its multiplier applies to this card's XP, and a card pays once
      const mult = answerOk(anchor ?? undefined, { combo: o.clean && !paid, card: anchor })
      if (o.clean && !paid) awardXp((CARD_XP[c.type] ?? 1) * mult, mult > 1 ? `${t('card.xp')} ×${mult}` : t('card.xp'), anchor)
    }
    actions.recordCard(day, c.id, { r: o.ok && o.clean ? 'ok' : 'bad', done: true })
    checkBadges()
  }

  const skip = () => {
    if (!card) return
    actions.recordCard(day, card.id, { r: 'skip', done: true })
    go((idx ?? 0) + 1)
  }

  // ---- swipe ---------------------------------------------------------------------------------------------------------
  const offsetFor = (dx: number, w: number): number => {
    const i = idxRef.current ?? 0
    const atStart = i === 0 && dx > 0
    const atEnd = i === n - 1 && dx < 0
    const held = dx < 0 && needsAnswer(cards[i])
    return atStart || atEnd || held ? rubber(dx, w) : dx
  }

  const onDown = (e: React.PointerEvent) => {
    if (drag.current || (e.pointerType === 'mouse' && e.button !== 0)) return
    if ((e.target as HTMLElement).closest(NO_SWIPE)) return
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, locked: false, dx: 0, w: stage.current?.clientWidth ?? 600, samples: [{ t: e.timeStamp, x: e.clientX }] }
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    const el = slide.current
    if (!d || !el || e.pointerId !== d.id) return
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    if (!d.locked) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null
        return
      }
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.2) return
      d.locked = true
      stage.current?.setPointerCapture(e.pointerId)
      el.getAnimations().forEach((a) => a.cancel())
      stage.current?.classList.add('is-dragging')
    }
    d.dx = dx
    d.samples.push({ t: e.timeStamp, x: e.clientX })
    if (d.samples.length > 8) d.samples.shift()
    el.style.transform = `translateX(${offsetFor(dx, d.w).toFixed(1)}px)`
  }
  const end = (e: React.PointerEvent, cancelled: boolean) => {
    const d = drag.current
    const el = slide.current
    if (!d || e.pointerId !== d.id) return
    drag.current = null
    stage.current?.classList.remove('is-dragging')
    if (!d.locked || !el) return
    const off = offsetFor(d.dx, d.w)
    // velocity over the last ~120 ms: a quick flick is enough, no matter how short
    const last = d.samples[d.samples.length - 1]
    const ref = d.samples.find((p) => last.t - p.t <= 120) ?? d.samples[0]
    // a finger that stopped before lifting is not a flick
    const v = last.t > ref.t && e.timeStamp - last.t < 90 ? (last.x - ref.x) / (last.t - ref.t) : 0
    const far = Math.abs(d.dx) > Math.max(60, d.w * 0.28)
    const flick = Math.abs(v) > 0.3 && Math.abs(d.dx) > 24
    if (!cancelled && (far || flick)) {
      const dir = (far ? d.dx : v) < 0 ? 1 : -1
      if (go((idxRef.current ?? 0) + dir, { from: off })) return
    }
    settle(el, off, v)
  }

  // ---- render --------------------------------------------------------------------------------------------------------
  if (data === undefined) return <p className="boot" role="status">{t('boot.cards')}</p>
  if (data === null || idx === null || !card) {
    return (
      <section className="learn-missing" aria-labelledby="miss-h">
        <h2 id="miss-h">{t('cards.missH')}</h2>
        <p>{t('cards.missP', { day })}</p>
        <div className="step-actions">
          <a className="btn btn-chev" href={learnHref(day)}>
            {t('cards.toPractice')}
          </a>
          <a className="btn btn-quiet" href={fullHref(day)}>
            {t('cards.openFull')}
          </a>
        </div>
      </section>
    )
  }

  const checkpoints = cards.filter(isCheckpoint)
  const body = (() => {
    const common = { face, prior: prog?.res[card.id], onDone: (o: Outcome) => finish(card, o) }
    switch (card.type) {
      case 'explain':
        return <ExplainView card={card} day={day} />
      case 'predict':
        return <PredictView card={card} {...common} />
      case 'fill':
        return <FillView card={card} {...common} />
      case 'truefalse':
        return <TrueFalseView card={card} {...common} />
      case 'order':
        return <OrderView card={card} {...common} />
      case 'recap':
        return <RecapView card={card} day={day} results={checkpoints.map((c) => ({ id: c.id, res: prog?.res[c.id] }))} />
    }
  })()

  const last = idx === n - 1
  const label = (c: Card) => cardTitle(c, lang).text || KICKER[c.type]
  // the recap's button: its own wording (cta / link_label) and where it points (`learn` = the exercises, `full` = the full text)
  const recap = card.type === 'recap' ? card : undefined
  const ctaText = recap ? pickText(lang, recap.cta_tr ?? recap.link_label_tr, recap.cta ?? recap.link_label).text || t('cards.toPractice') : t('cards.toPractice')
  const ctaTarget = recap?.target ?? recap?.link
  const ctaHref = ctaTarget === 'full' ? fullHref(day) : learnHref(day)

  return (
    <section className="cards" aria-label={t('cards.aria', { day, title })} data-card={idx} data-card-id={card.id} data-card-type={card.type} data-gated={gated || undefined}>
      <div className="cards-top">
        <ol
          className="strip cards-strip"
          aria-label={t('cards.stripAria')}
          data-own-arrows
          onKeyDown={(e) => {
            if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return
            const cells = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button.strip-cell:not(:disabled)'))
            const at = cells.indexOf(document.activeElement as HTMLButtonElement)
            if (at < 0) return
            e.preventDefault()
            const to = e.key === 'Home' ? 0 : e.key === 'End' ? cells.length - 1 : at + (e.key === 'ArrowRight' ? 1 : -1)
            cells[clamp(to, 0, cells.length - 1)].focus()
          }}
        >
          {cards.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={`strip-cell${i < max && i !== idx ? ' is-done' : ''}${i === idx ? ' is-current' : ''}`}
                disabled={i >= max && i !== idx}
                tabIndex={i === idx ? 0 : -1}
                aria-label={t('cards.cardN', { n: i + 1, label: label(c) })}
                aria-current={i === idx ? 'step' : undefined}
                onClick={() => go(i)}
              />
            </li>
          ))}
        </ol>
        <p className="num cards-count">
          <span className="sr-only">{t('cards.word')} </span>
          {idx + 1} / {n}
        </p>
      </div>

      <div
        ref={stage}
        className="cards-stage"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={(e) => end(e, false)}
        onPointerCancel={(e) => end(e, true)}
      >
        <div className="card-slide" key={card.id} ref={slide}>
          <article ref={face} className={`card-face fx-card t-${card.type}`}>
            <p className="card-kicker">{KICKER[card.type]}</p>
            {body}
            {card.type !== 'recap' && <Original day={day} sections={card.type === 'explain' ? [card.section, ...(card.also_sections ?? [])] : [card.section]} />}
          </article>
        </div>
      </div>

      <div className="cards-bar">
        <button type="button" className="btn btn-quiet cards-prev" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label={t('cards.prevAria')}>
          <span className="tb-chev is-back" aria-hidden="true" />
          {t('cards.back')}
        </button>
        <p className="cards-msg" role="status" key={nudge}>
          {nudge > 0 && gated ? t('cards.nudge') : ''}
        </p>
        {gated && (
          <button type="button" className="btn btn-quiet" onClick={skip}>
            {t('cards.skip')}
          </button>
        )}
        {last ? (
          // the last card is the recap: its way forward is the exercises (or wherever its link points)
          <a className="btn btn-chev cards-next" href={ctaHref}>
            {ctaText}
          </a>
        ) : (
          <button
            key={`n${nudge}`}
            type="button"
            className={`btn btn-chev cards-next${gated ? ' is-gated' : ''}${nudge > 0 && gated ? ' is-nudged' : ''}`}
            onClick={() => go(idx + 1)}
            aria-disabled={gated || undefined}
            aria-label={gated ? t('cards.nextGated') : t('cards.nextAria')}
          >
            {t('cards.next')}
          </button>
        )}
      </div>
      <p className="cards-keys" aria-hidden="true">
        {t('cards.keys')}
      </p>
      <span className="sr-only" role="status" aria-live="polite">
        {t('cards.live', { i: idx + 1, n, label: label(card) })}
      </span>
    </section>
  )
}
