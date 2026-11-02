import { useEffect, useState } from 'react'
import { DAYS } from '../../data/days'
import { awardXp, checkBadges, exerciseXp, qualityOf, note } from '../../lib/game'
import { answerBad, answerOk } from '../../lib/juice'
import { t, useLang } from '../../lib/i18n'
import { huntById, pickHunt, type HuntPick } from '../../lib/play'
import { actions, getState, today, useStore } from '../../lib/store'
import { EditStep } from '../learn/EditStep'
import { Chev } from '../bits'
import { GameShell } from './Shell'

/** Extra XP when the first click (before any fixing) was on a line the fix actually changes. */
export const HUNT_BONUS = 6

/**
 * "Hata avı": once a day, a `debug` exercise from a finished day. First commit to a prediction by clicking the line you
 * think is wrong, then fix it in the editor. The click is retrieval practice: you reason about the bug before you touch it.
 */
export function Hunt() {
  useLang()
  const s = useStore()
  const date = today()
  const rec = s.hunt[date]
  const [pick, setPick] = useState<HuntPick | null | undefined>(undefined)
  const [live, setLive] = useState('')
  /** the fix passed in this visit: keep the editor and its test results on screen */
  const [fixed, setFixed] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const saved = getState().hunt[date]
      const p = saved ? await huntById(saved.id) : await pickHunt(date, DAYS.filter((d) => getState().done[d.n]).map((d) => d.n))
      if (!alive) return
      // remember the pick so more finished days later in the day cannot change today's hunt
      if (p && !saved) actions.setHunt(date, { id: p.ex.id, line: null, right: false, done: false, xp: 0 })
      setPick(p)
    })()
    return () => {
      alive = false
    }
  }, [date])

  const choose = (i: number, el: Element) => {
    if (!pick) return
    const cur = getState().hunt[date]
    if (!cur || cur.line !== null) return
    const right = pick.buggy.includes(i)
    actions.setHunt(date, { ...cur, line: i, right })
    if (right) answerOk(el)
    else answerBad(el)
    setLive(right ? t('hunt.liveRight', { n: i + 1 }) : t('hunt.liveWrong', { n: i + 1 }))
  }

  const finishFix = (res: Parameters<typeof qualityOf>[0]) => {
    if (!pick) return
    const cur = getState().hunt[date]
    if (!cur || cur.done) return
    const xp = exerciseXp('debug', qualityOf(res)) + (cur.right ? HUNT_BONUS : 0)
    answerOk()
    awardXp(xp, cur.right ? t('hunt.xpRight') : t('hero.hunt'))
    actions.setHunt(date, { ...cur, done: true, xp })
    setFixed(true)
    note(t('hunt.noteDone'))
    checkBadges()
  }

  let body
  if (pick === undefined) {
    body = <p className="boot" role="status">{t('hunt.prep')}</p>
  } else if (pick === null || !rec) {
    body = (
      <section className="step-card" aria-labelledby="hu-none">
        <h2 id="hu-none">{t('hunt.noneH')}</h2>
        <p>{t('hunt.noneP')}</p>
        <a className="btn btn-chev" href="#/day/1">{t('hunt.back')}</a>
      </section>
    )
  } else {
    const lines = (pick.ex.starter_code ?? '').split('\n')
    const clicked = rec.line
    const locked = clicked !== null
    body = (
      <section className="step-card fx-card hunt-card" aria-labelledby="hu-h">
        <header className="step-head">
          <div className="step-title">
            <h2 id="hu-h" className="step-concept">{t('hunt.h')}</h2>
            <p className="step-type">{t('hunt.meta', { day: pick.day, state: rec.done ? t('hunt.sDone') : locked ? t('hunt.sFix') : t('hunt.sGuess') })}</p>
          </div>
        </header>
        {!locked && <p className="step-prompt">{t('hunt.prompt', { n: HUNT_BONUS })}</p>}
        <ol className="hunt-code" translate="no" aria-label={t('hunt.codeAria')}>
          {lines.map((l, i) => {
            const bug = locked && pick.buggy.includes(i)
            const cls = `${clicked === i ? ' is-picked' : ''}${bug ? ' is-bug' : ''}`
            return (
              <li key={i}>
                <button type="button" className={`hunt-line${cls}`} disabled={locked || l.trim() === ''} onClick={(e) => choose(i, e.currentTarget)} aria-label={`${t('hunt.lineAria', { n: i + 1, text: l.trim() || t('hunt.empty') })}${clicked === i ? t('hunt.picked') : ''}${bug ? t('hunt.bug') : ''}`}>
                  <span className="hunt-n num" aria-hidden="true">{i + 1}</span>
                  <code>{l || ' '}</code>
                </button>
              </li>
            )
          })}
        </ol>
        <div className="sr-only" role="status" aria-live="polite">{live}</div>
        {locked && (
          <p className={`feedback ${rec.right ? 'is-ok' : 'is-bad'}`} role="status">
            <strong>{rec.right ? t('hunt.caught', { n: HUNT_BONUS }) : t('hunt.notThis')}</strong>{' '}
            {rec.right ? t('hunt.nowFix') : t('hunt.actual', { lines: pick.buggy.map((n) => n + 1).join(', ') })}
          </p>
        )}
        {locked && (!rec.done || fixed) && <EditStep ex={pick.ex} mode="learn" known={[]} onDone={finishFix} />}
        {rec.done && (
          <div className="done-panel">
            <p><Chev state="done" /> {rec.right ? t('hunt.doneRight', { xp: rec.xp }) : t('hunt.doneWrong', { xp: rec.xp })}</p>
            <p className="step-note">{t('hunt.tomorrow')}</p>
            <a className="btn btn-chev" href="#/">{t('common.homeLink')}</a>
          </div>
        )}
      </section>
    )
  }
  return <GameShell title={t('hero.hunt')}>{body}</GameShell>
}
