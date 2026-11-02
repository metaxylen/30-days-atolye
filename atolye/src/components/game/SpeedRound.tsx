import { useCallback, useEffect, useRef, useState } from 'react'
import { explanationOf } from '../../lib/exercises'
import { t, useLang } from '../../lib/i18n'
import { awardXp, checkBadges, questEvent } from '../../lib/game'
import { answerBad, answerOk } from '../../lib/juice'
import { speedPool, type SpeedQ } from '../../lib/play'
import { play } from '../../lib/sound'
import { actions, getState, today, useStore } from '../../lib/store'
import { CodeView } from '../PyView'
import { GameShell } from './Shell'

export const ROUND_MS = 60_000
/** Rounds per day that pay XP: the round is practice, so farming it must not replace the lessons. */
export const PAID_ROUNDS = 3
const CHEVS = 20

type Phase = 'intro' | 'play' | 'done'
interface Miss {
  q: SpeedQ
  pick: number
}
interface Result {
  score: number
  best: number
  newBest: boolean
  xp: number
  capped: boolean
}

/**
 * "Hızlı tur": 60 seconds of predict questions from the days the learner has started. Pick an answer (tap or keys 1-4),
 * get instant feedback and a sound, the next one arrives. The score is the count of right answers; the end card shows every
 * miss with its explanation, because that is where the learning is.
 */
export function SpeedRound() {
  const lang = useLang()
  const s = useStore()
  const [pool, setPool] = useState<SpeedQ[] | null>(null)
  const [phase, setPhase] = useState<Phase>('intro')
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [left, setLeft] = useState(ROUND_MS)
  const [result, setResult] = useState<Result | null>(null)
  const [misses, setMisses] = useState<Miss[]>([])
  const [live, setLive] = useState('')
  const r = useRef({ phase: 'intro' as Phase, qi: 0, picked: null as number | null, score: 0, misses: [] as Miss[], t0: 0 })
  const timers = useRef<number[]>([])
  const startBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let alive = true
    speedPool(getState()).then((p) => alive && setPool(p))
    return () => {
      alive = false
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current.forEach((t) => window.clearInterval(t))
    }
  }, [])

  const finish = useCallback(() => {
    if (r.current.phase !== 'play') return
    r.current.phase = 'done'
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current.forEach((t) => window.clearInterval(t))
    timers.current = []
    const sc = r.current.score
    const st = getState()
    const day = today()
    const paidSoFar = st.speed.paid[day] ?? 0
    const capped = paidSoFar >= PAID_ROUNDS
    const newBest = sc > st.speed.best && sc > 0
    const xp = capped ? 0 : sc * (newBest ? 2 : 1)
    actions.setSpeed({ best: Math.max(st.speed.best, sc), plays: st.speed.plays + 1, paid: { ...st.speed.paid, [day]: paidSoFar + (capped ? 0 : 1) } })
    if (xp > 0) awardXp(xp, newBest ? t('speed.xpBest') : t('hero.speed'))
    if (sc >= 8) questEvent('fast8')
    checkBadges()
    play(newBest ? 'level' : 'badge')
    setMisses(r.current.misses)
    setScore(sc)
    setResult({ score: sc, best: Math.max(st.speed.best, sc), newBest, xp, capped })
    setLive(`${t('speed.liveDone', { n: sc })}${newBest ? t('speed.liveBest') : ''}`)
    setPhase('done')
  }, [])

  const start = () => {
    if (!pool || pool.length === 0) return
    r.current = { phase: 'play', qi: 0, picked: null, score: 0, misses: [], t0: performance.now() }
    setQi(0)
    setPicked(null)
    setScore(0)
    setMisses([])
    setResult(null)
    setLeft(ROUND_MS)
    setPhase('play')
    timers.current.push(window.setTimeout(finish, ROUND_MS))
    timers.current.push(
      window.setInterval(() => {
        setLeft(Math.max(0, ROUND_MS - (performance.now() - r.current.t0)))
      }, 250),
    )
  }

  const answer = useCallback(
    (i: number, el?: Element | null) => {
      const c = r.current
      if (c.phase !== 'play' || c.picked !== null || !pool || pool.length === 0) return
      const q = pool[c.qi % pool.length]
      if (i < 0 || i >= (q.ex.choices?.length ?? 0)) return
      c.picked = i
      setPicked(i)
      const good = i === q.right
      if (good) {
        c.score++
        setScore(c.score)
        answerOk(el, { card: document.querySelector('.speed-card') })
        setLive(t('speed.liveRight'))
      } else {
        c.misses = [...c.misses, { q, pick: i }]
        answerBad(el, { card: document.querySelector('.speed-card') })
        setLive(t('speed.liveWrong', { n: q.right + 1 }))
      }
      // right: straight on; wrong: a beat longer to see which one was right
      timers.current.push(
        window.setTimeout(
          () => {
            if (r.current.phase !== 'play') return
            r.current.qi++
            r.current.picked = null
            setQi(r.current.qi)
            setPicked(null)
          },
          good ? 420 : 1100,
        ),
      )
    },
    [pool],
  )

  useEffect(() => {
    if (phase !== 'play') return
    const f = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || !/^[1-4]$/.test(e.key)) return
      e.preventDefault()
      const btn = document.querySelectorAll('.speed-choice')[Number(e.key) - 1]
      answer(Number(e.key) - 1, btn)
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [phase, answer])

  useEffect(() => {
    if (phase === 'intro' && pool) startBtn.current?.focus({ preventScroll: true })
  }, [phase, pool])

  const q = pool && pool.length ? pool[qi % pool.length] : null
  const secs = Math.ceil(left / 1000)
  const chevsLeft = Math.ceil((left / ROUND_MS) * CHEVS)

  return (
    <GameShell title={t('hero.speed')}>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {live}
      </div>
      {phase === 'intro' && (
        <section className="step-card fx-card speed-card" aria-labelledby="sp-h">
          <h2 id="sp-h">{t('speed.introH')}</h2>
          <p>{t('speed.introP')}</p>
          <p className="speed-best num">{t('speed.bestA')} <strong>{s.speed.best}</strong> {t('speed.bestB', { plays: s.speed.plays })}</p>
          <p className="step-note">{t('speed.note', { n: PAID_ROUNDS })}</p>
          <div className="step-actions">
            <button ref={startBtn} type="button" className="btn btn-chev btn-lg" disabled={!pool || pool.length === 0} onClick={start}>
              {pool === null ? t('speed.preparing') : t('cta.start')}
            </button>
            <a className="btn btn-quiet" href="#/">{t('speed.giveUp')}</a>
          </div>
          {pool && pool.length === 0 && <p className="check-fail" role="alert">{t('speed.none')}</p>}
        </section>
      )}
      {phase === 'play' && q && (
        <section className="step-card fx-card speed-card is-play" aria-label={t('hero.speed')}>
          <div className="speed-top">
            <p className="speed-score num"><strong>{score}</strong> {t('play.bestB')}</p>
            <p className="speed-secs num" aria-hidden="true">{t('speed.secs', { n: secs })}</p>
          </div>
          <ol className="speed-clock" aria-hidden="true">
            {Array.from({ length: CHEVS }, (_, i) => (
              <li key={i} className={i < chevsLeft ? 'is-full' : ''} />
            ))}
          </ol>
          <p className="step-type">{t('speed.qType', { day: q.day })}</p>
          <CodeView value={q.ex.code ?? ''} label={t('pred.codeLabel')} lines />
          <div className="speed-choices" role="group" aria-label={t('speed.choicesAria')}>
            {(q.ex.choices ?? []).map((c, i) => {
              const state = picked === null ? '' : i === q.right ? ' is-right' : i === picked ? ' is-wrong' : ' is-dim'
              return (
                <button key={`${qi}-${i}`} type="button" className={`speed-choice${state}`} aria-keyshortcuts={String(i + 1)} disabled={picked !== null} onClick={(e) => answer(i, e.currentTarget)}>
                  <kbd aria-hidden="true">{i + 1}</kbd>
                  <pre translate="no">{c}</pre>
                </button>
              )
            })}
          </div>
        </section>
      )}
      {phase === 'done' && result && (
        <section className="step-card fx-card speed-card" aria-labelledby="sp-done">
          <h2 id="sp-done">{t('speed.doneH', { n: score })}{result.newBest ? t('speed.doneBest') : ''}</h2>
          <p className="num">
            {t('speed.record', { best: result.best })} {result.xp > 0 ? `${t('speed.xpGot', { xp: result.xp })}${result.newBest ? t('speed.x2') : ''}.` : result.capped ? t('speed.capped', { n: PAID_ROUNDS }) : t('speed.noXp')}
          </p>
          {misses.length > 0 ? (
            <>
              <h3 className="speed-miss-h">{t('speed.missH', { n: misses.length })}</h3>
              <ul className="speed-misses">
                {misses.map((m, i) => (
                  <li key={i}>
                    <CodeView value={m.q.ex.code ?? ''} label={t('speed.missQ', { n: i + 1 })} />
                    <p>
                      {t('speed.you')} <code translate="no">{(m.q.ex.choices ?? [])[m.pick].replace(/\n/g, ' ⏎ ')}</code>
                    </p>
                    <p>
                      {t('speed.right')} <code translate="no">{(m.q.ex.choices ?? [])[m.q.right].replace(/\n/g, ' ⏎ ')}</code>
                    </p>
                    {explanationOf(m.q.ex, lang) && <p className="speed-why">{explanationOf(m.q.ex, lang)}</p>}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>{t('speed.perfect')}</p>
          )}
          <div className="step-actions">
            <button type="button" className="btn btn-chev btn-lg" autoFocus onClick={start}>
              {t('speed.again')}
            </button>
            <a className="btn btn-quiet" href="#/">{t('common.homeLink')}</a>
          </div>
        </section>
      )}
    </GameShell>
  )
}
