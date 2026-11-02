import { useEffect, useState } from 'react'
import { buildReviewSession, type ReviewItem } from '../../lib/review'
import { checkBadges, claimStreakBonuses, questEvent } from '../../lib/game'
import { t, useLang } from '../../lib/i18n'
import { runner } from '../../lib/runner'
import { actions, dueReviews, getState, masteredCount, today, useStore, doneCount, daysBetween } from '../../lib/store'
import { AppBar } from '../AppBar'
import { Session } from './Session'

/** Spaced review: up to five due concepts, mixed across days, closed-book. A passing session keeps the streak. */
export function ReviewPage() {
  const s = useStore()
  const [items, setItems] = useState<ReviewItem[] | null | undefined>(undefined)
  const [result, setResult] = useState<{ good: number; total: number } | null>(null)
  const lang = useLang()

  useEffect(() => {
    document.title = t('title.review')
  }, [lang])

  useEffect(() => {
    window.scrollTo(0, 0)
    let live = true
    buildReviewSession(5).then((i) => live && setItems(i))
    runner.warm()
    return () => {
      live = false
    }
    // The queue is built once on entry; answering changes due dates under it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const upcoming = Object.values(s.review)
    .filter((r) => !r.retired && r.due > today())
    .sort((a, b) => (a.due < b.due ? -1 : 1))[0]

  const finish = (good: number, total: number) => {
    setResult({ good, total })
    if (total > 0 && good / total >= 0.6) {
      actions.passReviewSession()
      claimStreakBonuses()
      // a passing session that leaves nothing due empties the queue for today (weekly quest)
      if (dueReviews(getState()).length === 0) questEvent('emptyDay')
    }
    checkBadges()
  }

  return (
    <div className="review-page">
      <AppBar />
      <main className="review-main" id="main" tabIndex={-1}>
        <h1>{t('rev.h1')}</h1>
        <dl className="stats">
          <div><dt>{t('rev.queue')}</dt><dd className="num">{dueReviews(s).length}</dd></div>
          <div><dt>{t('rev.mastered')}</dt><dd className="num">{masteredCount(s)}</dd></div>
          <div><dt>{t('rev.days')}</dt><dd className="num">{doneCount(s)} / 30</dd></div>
        </dl>
        {items === undefined && <p className="boot" role="status">{t('rev.prep')}</p>}
        {items && items.length === 0 && !result && (
          <section className="step-card" aria-labelledby="none-h">
            <h2 id="none-h">{t('rev.noneH')}</h2>
            <p>
              {upcoming
                ? daysBetween(today(), upcoming.due) === 1
                  ? t('rev.next1')
                  : t('rev.nextN', { n: daysBetween(today(), upcoming.due) })
                : t('rev.noneAny')}
            </p>
            <a className="btn btn-chev" href="#/day/1">{t('rev.back')}</a>
          </section>
        )}
        {items && items.length > 0 && !result && <section className="step-card"><Session items={items} title={t('rev.session')} onFinish={finish} /></section>}
        {result && (
          <section className="step-card" aria-labelledby="done-h">
            <h2 id="done-h">{t('rev.doneH')}</h2>
            <p>
              {t('rev.result', { good: result.good, total: result.total })}{' '}
              {result.good / Math.max(1, result.total) >= 0.6 ? t('rev.counted') : t('rev.notCounted')}
            </p>
            <a className="btn btn-chev" href="#/">{t('common.homeLink')}</a>
          </section>
        )}
      </main>
    </div>
  )
}
