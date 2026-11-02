import { useCallback, useEffect, useMemo, useState } from 'react'
import { conceptOf, loadDay, stepsOf, type DayExercises, type Exercise, type Lang, type Step } from '../../lib/exercises'
import { t, useLang } from '../../lib/i18n'
import { awardXp, checkBadges, claimStreakBonuses, exerciseXp, qualityOf, questEvent } from '../../lib/game'
import { answerOk } from '../../lib/juice'
import { frontierOf, isBlockComplete, isOptionalStep } from '../../lib/progress'
import { buildQuiz, scheduleBlock, type ReviewItem } from '../../lib/review'
import { actions, getState, useStore } from '../../lib/store'
import { setCtx } from '../../lib/ui'
import { cardsHref, dayHref } from '../../lib/route'
import { loadCards, minutesOf, type CardsDay } from '../../lib/cards'
import { runner } from '../../lib/runner'
import { Chev } from '../bits'
import { PyBoot } from '../PyBoot'
import { Session } from './Session'
import { StepView, TYPE_LABEL } from './StepView'
import { Worked } from './Worked'
import type { StepResult } from './shared'

/** The quiz counts as passed from 60% correct. */
export const QUIZ_PASS = 0.6
export const quizPassed = (q: { good: number; total: number } | undefined | null): boolean => !!q && q.total > 0 && q.good / q.total >= QUIZ_PASS

interface Props {
  day: number
  title: string
  onShowText: () => void
  onFinishDay: () => void
  done: boolean
}

export function Learn({ day, title, onShowText, onFinishDay, done }: Props) {
  const s = useStore()
  const lang: Lang = useLang()
  const human = (b: { concept: string; concept_tr?: string }): string => conceptOf(b, lang)
  const [data, setData] = useState<DayExercises | null | undefined>(undefined)
  const [idx, setIdx] = useState<number | null>(null)
  const [retry, setRetry] = useState<Set<string>>(new Set())
  const [lessonCode, setLessonCode] = useState<string[]>([])
  const [quiz, setQuiz] = useState<ReviewItem[] | null>(null)
  const [quizResult, setQuizResult] = useState<{ good: number; total: number } | null>(null)
  const [cards, setCards] = useState<CardsDay | null>(null)

  useEffect(() => {
    let live = true
    setCards(null)
    loadCards(day).then((c) => live && setCards(c))
    return () => {
      live = false
    }
  }, [day])

  useEffect(() => {
    let live = true
    setData(undefined)
    setIdx(null)
    setQuiz(null)
    setQuizResult(null)
    loadDay(day).then((d) => live && setData(d))
    import('../../lib/lesson').then((m) => m.loadLesson(day)).then((p) => live && setLessonCode(p.cells.filter((c) => c.kind === 'code').map((c) => c.code)))
    return () => {
      live = false
    }
  }, [day])

  const steps = useMemo(() => (data ? stepsOf(data) : []), [data])

  /** A write exercise is optional when its twin earlier in the day was solved clean (no hint, no reveal, first try). */
  const optional = useCallback((k: number): boolean => isOptionalStep(steps, k, s.ex), [steps, s.ex])
  const isDone = useCallback((st: Step) => !!s.ex[st.key]?.done, [s.ex])

  const frontier = useMemo(() => frontierOf(steps, s.ex), [steps, s.ex])

  // Block completion is derived from the stored records, not from the click that recorded a step: skipping an
  // optional twin, plain "Sonraki" and a reload all end up here with the same answer.
  useEffect(() => {
    if (!data || data.day !== day) return
    data.blocks.forEach((b, bi) => {
      if (getState().blocks[b.id] || !isBlockComplete(steps, bi, s.ex)) return
      actions.completeBlock(b.id, day, scheduleBlock(day, data, b))
      claimStreakBonuses(document.querySelector('.step-card'))
      checkBadges()
    })
  }, [data, day, steps, s.ex])

  useEffect(() => {
    if (data && idx === null) setIdx(Math.min(frontier, steps.length))
  }, [data, idx, frontier, steps.length])

  // The palette jumps to concept blocks of this day.
  useEffect(() => {
    if (!data) return
    setCtx({
      day,
      sections: [
        ...data.blocks.map((b) => ({ label: t('learn.sec.concept', { name: human(b) }), go: () => setIdx(Math.max(0, steps.findIndex((st) => st.block === data.blocks.indexOf(b)))) })),
        { label: t('learn.sec.quiz'), go: () => setIdx(steps.length) },
      ],
    })
    return () => setCtx({ day: null, sections: [] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, day, steps, lang])

  useEffect(() => {
    runner.warm()
  }, [])

  const blockSteps = (b: number) => steps.map((st, k) => ({ st, k })).filter((x) => x.st.block === b)

  const complete = (k: number, res: StepResult) => {
    const st = steps[k]
    const before = getState().ex[st.key]
    const first = !before?.done
    if (st.kind === 'worked') {
      actions.recordEx(st.key, { done: true, tries: 0, hints: 0, revealed: false, clean: true })
    } else if (st.ex) {
      const q = qualityOf(res)
      let pending = 0
      if (first) {
        // Pay for retrieval only: a wrong or re-asked prediction, an explanation that names no key idea and a
        // revealed solution pay nothing (a revealed one is held until its twin passes).
        const unearned = res.correct === false || (st.ex.type === 'predict' && res.tries > 0)
        // a first-try, hint-free answer feeds the combo; its multiplier applies to this answer's XP
        const mult = res.correct === false ? 1 : answerOk(undefined, { combo: !unearned && q === 'clean' })
        const xp = unearned ? 0 : exerciseXp(st.ex.type, q) * mult
        if (!unearned && q === 'clean' && ['write', 'modify', 'debug'].includes(st.ex.type)) questEvent('clean')
        const twinDone = st.ex.twin ? !!getState().ex[st.ex.twin]?.done : false
        if (q === 'revealed' && !twinDone) pending = st.ex.twin ? xp : 0
        else awardXp(xp, mult > 1 ? `${TYPE_LABEL[st.ex.type]} ×${mult}` : TYPE_LABEL[st.ex.type], document.querySelector('.step-card'))
        // (the label above is read at award time, in the language the learner is using)
        // passing a twin pays the held-back XP of the revealed exercise
        for (const other of steps) {
          const oe = other.ex
          if (oe && oe.id !== st.ex.id && (oe.twin === st.ex.id || st.ex.twin === oe.id)) {
            const rec = getState().ex[oe.id]
            if (rec?.pending) {
              awardXp(rec.pending, t('xp.twin'), document.querySelector('.step-card'))
              actions.clearPending(oe.id)
            }
          }
        }
      }
      actions.recordEx(st.ex.id, { done: true, tries: res.tries, hints: res.hints, revealed: res.revealed, clean: res.clean, pending })
    }
    // Block completion follows from the stored records (see the effect above).
    checkBadges()
  }

  const skipOptional = (k: number) => {
    const st = steps[k]
    if (!st.ex) return
    actions.recordEx(st.ex.id, { done: true, tries: 0, hints: 0, revealed: false, clean: false })
    go(k + 1)
  }

  const go = (k: number) => {
    setIdx(Math.max(0, Math.min(steps.length, k)))
    // Bring the day title (the header above the tabs) back to the top so it is never clipped; only when it is scrolled away.
    const head = document.querySelector('.lesson-head, article > header')
    const top = (head ?? document.querySelector('.learn'))?.getBoundingClientRect().top ?? 0
    if (top < 0) window.scrollBy({ top: top - 16, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  const allBlocksDone = data ? data.blocks.every((b) => s.blocks[b.id]) : false

  // The quiz is built once the day's concept blocks are finished and the learner reaches the end.
  useEffect(() => {
    if (!data || idx !== steps.length || !allBlocksDone || quiz || s.quiz[day]) return
    let live = true
    buildQuiz(day, data).then((q) => live && setQuiz(q))
    return () => {
      live = false
    }
  }, [data, idx, steps.length, allBlocksDone, quiz, s.quiz, day])

  if (data === undefined) return <p className="boot" role="status">{t('learn.loading')}</p>

  if (data === null) {
    return (
      <section className="learn-missing" aria-labelledby="miss-h">
        <h2 id="miss-h">{t('learn.missingH')}</h2>
        <p>{t('learn.missingP', { day })}</p>
        <button type="button" className="btn btn-chev" onClick={onShowText}>
          {t('learn.toText')}
        </button>
      </section>
    )
  }

  const cur = idx ?? 0
  const step = steps[cur]
  const minutes = Math.max(10, Math.round(steps.length * 1.4))
  const doneSteps = steps.filter((st, k) => isDone(st) || optional(k)).length

  return (
    <div className="learn">
      <div className="learn-plan">
        <p>
          <strong>{t('learn.planH')}</strong> {t('learn.planBody', { blocks: data.blocks.length, steps: steps.length, min: minutes, done: doneSteps })}
          {cards && (
            <>
              {' '}
              <a className="plan-cards" href={cardsHref(day)}>
                {t('learn.planCards', { n: cards.cards.length, min: minutesOf(cards) })}
              </a>
              {(s.cards[day]?.max ?? 0) > 0 && <span className="num"> · {t('learn.planSeen', { seen: Math.min(cards.cards.length, s.cards[day].max), n: cards.cards.length })}{s.cards[day].recap ? t('learn.planRecap') : ''}</span>}
            </>
          )}
        </p>
      </div>
      <PyBoot />


      <ol
        className="strip"
        aria-label={t('learn.stripAria')}
        onKeyDown={(e) => {
          // one tab stop for the whole strip; arrows, Home and End move between the reachable steps
          if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
          const cells = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button.strip-cell:not(:disabled)'))
          const at = cells.indexOf(document.activeElement as HTMLButtonElement)
          if (at < 0) return
          e.preventDefault()
          const to = e.key === 'Home' ? 0 : e.key === 'End' ? cells.length - 1 : at + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1)
          cells[Math.max(0, Math.min(cells.length - 1, to))].focus()
        }}
      >
        {steps.map((st, k) => {
          const dn = isDone(st)
          const opt = optional(k) && !dn
          const reachable = dn || k <= frontier || opt
          const first = k === 0 || steps[k - 1].block !== st.block
          const label = `${human(data.blocks[st.block])}, ${st.kind === 'worked' ? t('learn.stripWorked') : TYPE_LABEL[st.kind]}${dn ? t('learn.stripDone') : opt ? t('learn.stripOpt') : ''}`
          return (
            <li key={st.key} className={`${first && k > 0 ? 'strip-gap' : ''}`}>
              <button type="button" className={`strip-cell${dn ? ' is-done' : ''}${k === cur ? ' is-current' : ''}${opt ? ' is-opt' : ''}`} disabled={!reachable} tabIndex={k === cur ? 0 : -1} aria-label={label} aria-current={k === cur ? 'step' : undefined} onClick={() => go(k)} />
            </li>
          )
        })}
        <li className={`strip-gap`}>
          <button type="button" className={`strip-cell strip-quiz${cur === steps.length ? ' is-current' : ''}${s.quiz[day] ? ' is-done' : ''}`} disabled={!allBlocksDone} tabIndex={cur === steps.length ? 0 : -1} aria-label={t('learn.sec.quiz')} aria-current={cur === steps.length ? 'step' : undefined} onClick={() => go(steps.length)} />
        </li>
      </ol>

      {step ? (
        <StepCard
          key={step.key}
          step={step}
          k={cur}
          total={steps.length}
          concept={human(data.blocks[step.block])}
          done={isDone(step)}
          optional={optional(cur) && !isDone(step)}
          retrying={retry.has(step.key)}
          known={[...lessonCode, ...data.blocks.map((b) => b.worked_example?.code ?? '')].filter(Boolean)}
          blockDone={!!s.blocks[data.blocks[step.block].id]}
          lastInBlock={blockSteps(step.block).every(({ st }) => st.key === step.key || isDone(st) || optional(steps.indexOf(st)))}
          onComplete={(r) => complete(cur, r)}
          onNext={() => go(cur + 1)}
          onPrev={() => go(cur - 1)}
          onSkip={() => skipOptional(cur)}
          onRetry={() => setRetry((r) => new Set(r).add(step.key))}
        />
      ) : (
        <section className="step-card quiz-card" aria-labelledby="quiz-h">
          {s.quiz[day] || quizResult ? (
            <>
              <h2 id="quiz-h">{t('learn.quizDoneH')}</h2>
              <p>
                {t('learn.quizResult', { good: (quizResult ?? s.quiz[day]).good, total: (quizResult ?? s.quiz[day]).total })}
                {!quizPassed(quizResult ?? s.quiz[day]) && ` ${t('learn.quizNeed')}`}
              </p>
              <div className="step-actions">
                {done ? (
                  <a className="btn btn-chev" href={dayHref(Math.min(30, day + 1))}>
                    {t('learn.quizNextDay')}
                  </a>
                ) : quizPassed(quizResult ?? s.quiz[day]) ? (
                  <button type="button" className="btn btn-chev btn-lg" onClick={onFinishDay}>
                    {t('learn.quizFinish')}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-chev btn-lg"
                      onClick={() => {
                        setQuiz(null)
                        setQuizResult(null)
                        actions.resetQuiz(day)
                      }}
                    >
                      {t('learn.quizRetake')}
                    </button>
                    <button type="button" className="btn btn-quiet" onClick={onFinishDay}>
                      {t('learn.quizNoXp')}
                    </button>
                  </>
                )}
                <button type="button" className="btn btn-quiet" onClick={() => go(0)}>
                  {t('learn.quizBack')}
                </button>
              </div>
            </>
          ) : !allBlocksDone ? (
            <>
              <h2 id="quiz-h">{t('learn.quizFirstH')}</h2>
              <p>{t('learn.quizFirstP')}</p>
              <button type="button" className="btn btn-chev" onClick={() => go(frontier)}>
                {t('learn.quizResume')}
              </button>
            </>
          ) : quiz ? (
            <Session
              items={quiz}
              title={t('learn.quizTitle', { day, title })}
              onFinish={(good, total) => {
                actions.saveQuiz(day, good, total)
                setQuizResult({ good, total })
                checkBadges()
              }}
            />
          ) : (
            <p className="boot" role="status">{t('learn.quizPrep')}</p>
          )}
        </section>
      )}
    </div>
  )
}

interface CardProps {
  step: Step
  k: number
  total: number
  concept: string
  done: boolean
  optional: boolean
  retrying: boolean
  known: string[]
  blockDone: boolean
  lastInBlock: boolean
  onComplete: (r: StepResult) => void
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onRetry: () => void
}

function StepCard({ step, k, total, concept, done, optional, retrying, known, blockDone, lastInBlock, onComplete, onNext, onPrev, onSkip, onRetry }: CardProps) {
  const [justDone, setJustDone] = useState(false)
  const showBody = !done || retrying || justDone
  const finished = done || justDone
  const ex: Exercise | undefined = step.ex

  const handle = (r: StepResult) => {
    onComplete(r)
    setJustDone(true)
  }

  return (
    <section className="step-card" aria-labelledby="step-h" data-kind={step.kind}>
      <header className="step-head">
        <div className="step-title">
          <h2 id="step-h" className="step-concept">
            {concept}
          </h2>
          <p className="step-type">{step.kind === 'worked' ? t('worked.title') : TYPE_LABEL[step.kind]}</p>
        </div>
        <p className="num step-count">{k + 1} / {total}</p>
      </header>
      {optional && <p className="step-note">{t('learn.optionalTwin')}</p>}
      {step.kind === 'worked' && step.worked && <Worked worked={step.worked} onDone={() => handle({ tries: 0, hints: 0, revealed: false, clean: true })} />}
      {ex && showBody && <StepView ex={ex} mode="learn" known={known} onDone={handle} />}
      {ex && done && !retrying && !justDone && (
        <div className="done-panel">
          <p><Chev state="done" /> {t('learn.stepDone')}</p>
          <button type="button" className="btn btn-quiet" onClick={onRetry}>{t('common.retry')}</button>
        </div>
      )}
      {step.kind === 'worked' && done && !justDone && <p className="step-note">{t('learn.workedSeen')}</p>}
      {justDone && step.kind !== 'worked' && (
        <p className="solved" role="status">
          <Chev state="done" /> {t('learn.solved')}
        </p>
      )}
      {finished && lastInBlock && blockDone && (
        <p className="block-done" role="status">
          <Chev state="done" /> {t('learn.blockDoneA')} <strong>{concept}</strong>. {t('learn.blockDoneB')}
        </p>
      )}
      <footer className="step-nav">
        <button type="button" className="btn btn-quiet" onClick={onPrev} disabled={k === 0}>
          {t('common.prev')}
        </button>
        {optional && !finished && (
          <button type="button" className="btn btn-quiet" onClick={onSkip}>
            {t('common.skip')}
          </button>
        )}
        <button type="button" className="btn btn-chev" onClick={onNext} disabled={!finished && !optional}>
          {k + 1 >= total ? t('learn.sec.quiz') : t('common.next')}
        </button>
      </footer>
    </section>
  )
}
