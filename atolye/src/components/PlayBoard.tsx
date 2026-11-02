import { PARTS, daysOfPart } from '../data/days'
import { t, useLang } from '../lib/i18n'
import { questProgress, questsFor, currentQuest } from '../lib/quests'
import { doneCount, today, useStore } from '../lib/store'
import { Chev } from './bits'

/** Fethedildi / conquered: the part's boss is beaten. */
export const conquered = (s: ReturnType<typeof useStore>, part: number): boolean => !!s.boss[part]?.done

/**
 * The play room on the home page: the speed round, today's bug hunt, this week's three quests, and the five part bosses.
 * Everything here rewards recalling or writing, none of it rewards clicking.
 */
export function PlayBoard() {
  useLang()
  const s = useStore()
  const date = today()
  const quests = questsFor(date)
  const claimed = currentQuest(s, date).claimed
  const hunt = s.hunt[date]
  const hasDone = doneCount(s) > 0
  return (
    <section className="play" id="play" aria-labelledby="play-h">
      <h2 id="play-h" data-reveal>{t('play.h')}</h2>
      <p className="play-lead" data-reveal>{t('play.lead')}</p>
      <div className="play-grid">
        <article className="play-card f1" data-reveal>
          <h3>{t('hero.speed')}</h3>
          <p>{t('play.speedP')}</p>
          <p className="num play-meta">{t('play.bestA')} <strong>{s.speed.best}</strong> {t('play.bestB')}</p>
          <a className="btn btn-chev" href="#/speed">{t('play.start')}</a>
        </article>
        <article className="play-card f3" data-reveal>
          <h3>{t('hero.hunt')}</h3>
          {hunt?.done ? (
            <>
              <p><Chev state="done" /> {t('play.huntDone')}{hunt.right ? t('play.huntRight') : ''}.</p>
              <p className="num play-meta">+{hunt.xp} XP · {t('play.huntNew')}</p>
              <a className="btn btn-quiet" href="#/hunt">{t('play.huntSee')}</a>
            </>
          ) : (
            <>
              <p>{hasDone ? t('play.huntReady') : t('play.huntLocked')}</p>
              <p className="num play-meta">{hasDone ? (hunt?.line != null ? t('play.huntWait') : t('play.huntBonus')) : t('common.locked')}</p>
              <a className="btn btn-chev" href="#/hunt">{hasDone ? t('play.go') : t('play.detail')}</a>
            </>
          )}
        </article>
        <article className="play-card play-quests" data-reveal aria-labelledby="quest-h">
          <h3 id="quest-h">{t('play.quests')}</h3>
          <ul>
            {quests.map((q) => {
              const p = Math.min(q.target, questProgress(s, q.id, date))
              const done = claimed.includes(q.id) || p >= q.target
              return (
                <li key={q.id} className={done ? 'is-done' : ''}>
                  <p className="quest-title">{done && <Chev state="done" />} {q.title}</p>
                  <span className="quest-bar" role="img" aria-label={`${p} / ${q.target}`}>
                    <i style={{ transform: `scaleX(${p / q.target})` }} />
                  </span>
                  <span className="num quest-xp">{done ? t('common.done') : `${p} / ${q.target}`} · {q.xp} XP</span>
                </li>
              )
            })}
          </ul>
        </article>
      </div>
      <h3 className="play-sub" data-reveal>{t('play.sub')}</h3>
      <ul className="boss-row">
        {PARTS.map((p, i) => {
          const days = daysOfPart(i)
          const done = days.filter((n) => s.done[n]).length
          const won = conquered(s, i)
          const open = done === days.length
          const state = won ? t('boss.sWon') : open ? t('boss.sOpen') : t('boss.sLocked', { done, total: days.length })
          return (
            <li key={p.id} data-reveal>
              <a className={`boss-tile f${p.field}${won ? ' is-won' : open ? ' is-open' : ''}`} href={`#/boss/${i + 1}`} aria-label={t('boss.tileAria', { name: p.name, state })}>
                <span className="boss-name">{p.name}</span>
                <span className="boss-state num">{won ? t('parts.flag') : open ? t('boss.start') : t('boss.dots', { done, total: days.length })}</span>
                <span className="boss-dots" aria-hidden="true">
                  {days.map((n) => (
                    <i key={n} className={s.done[n] ? 'is-done' : ''} />
                  ))}
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
