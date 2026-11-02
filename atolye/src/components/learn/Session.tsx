import { useRef, useState } from 'react'
import { conceptOf } from '../../lib/exercises'
import { t } from '../../lib/i18n'
import { answerOk } from '../../lib/juice'
import type { ReviewItem } from '../../lib/review'
import { gradeReview } from '../../lib/review'
import { StepView, TYPE_LABEL } from './StepView'
import { useLang, type StepResult } from './shared'

export const isGood = (r: StepResult): boolean => r.correct !== false && !r.revealed && r.hints === 0 && r.tries <= 1

/**
 * A closed-book run through exercises: the end-of-day quiz or the spaced-review queue. No lesson text is on screen.
 * Every answer moves the concept's Leitner box (see lib/review).
 */
export function Session({ items, title, onFinish }: { items: ReviewItem[]; title: string; onFinish: (good: number, total: number) => void }) {
  const lang = useLang()
  const [i, setI] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [shown, setShown] = useState<boolean | null>(null)
  const nextBtn = useRef<HTMLButtonElement>(null)
  const item = items[i]

  const settle = (good: boolean, anchor?: Element | null) => {
    gradeReview(item.key, good, anchor)
    // wrong answers already shook and blipped inside the exercise (useAttempt / Predict); only a right one celebrates here
    if (good) answerOk(anchor, { card: anchor })
    setResults((r) => [...r, good])
    setShown(good)
    requestAnimationFrame(() => nextBtn.current?.focus())
  }

  const next = () => {
    if (i + 1 >= items.length) onFinish(results.filter(Boolean).length, items.length)
    else {
      setI(i + 1)
      setShown(null)
    }
  }

  return (
    <section className="session" aria-label={title}>
      <header className="session-head">
        <h2>{title}</h2>
        <p className="num" aria-live="polite">{i + 1} / {items.length}</p>
      </header>
      <ol className="strip strip-small" aria-label={t('sess.questions')}>
        {items.map((_, k) => (
          <li key={k} className={k < results.length ? (results[k] ? 'is-done' : 'is-bad') : k === i ? 'is-current' : ''}>
            <span className="sr-only">{k < results.length ? (results[k] ? t('sess.right') : t('sess.again')) : k === i ? t('sess.current') : t('sess.pending')}</span>
          </li>
        ))}
      </ol>
      <p className="step-type">{t('sess.meta', { type: TYPE_LABEL[item.ex.type], concept: conceptOf(item.block, lang), day: item.rec.day })}</p>
      <div key={`${item.key}-${i}`}>
        {shown === null ? (
          <>
            <StepView ex={item.ex} mode="review" onDone={(r) => settle(isGood(r), document.querySelector('.session'))} />
            <div className="step-actions skip-row">
              <button type="button" className="btn btn-quiet" onClick={() => settle(false)}>
                {t('sess.dontKnow')}
              </button>
            </div>
          </>
        ) : (
          <div className={`feedback ${shown ? 'is-ok' : 'is-bad'}`} role="status">
            <p><strong>{shown ? t('sess.recalled') : t('sess.missed')}</strong> {shown ? t('sess.up') : t('sess.down')}</p>
            <div className="step-actions">
              <button ref={nextBtn} type="button" className="btn btn-chev" onClick={next}>
                {i + 1 >= items.length ? t('sess.finish') : t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
