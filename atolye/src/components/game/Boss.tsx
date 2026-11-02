import { useEffect, useState } from 'react'
import { PARTS } from '../../data/days'
import { BADGES, awardXp, checkBadges, exerciseXp, note, qualityOf, unlockBadge } from '../../lib/game'
import { burst, answerOk } from '../../lib/juice'
import type { Exercise } from '../../lib/exercises'
import { t, useLang } from '../../lib/i18n'
import { bossStory, bossTitle, daysOfPart, loadBoss, partDone, stageTitle, type BossFile } from '../../lib/play'
import { play } from '../../lib/sound'
import { actions, getState, today, useStore } from '../../lib/store'
import { BadgeMark } from '../Toasts'
import { Chev } from '../bits'
import { EditStep } from '../learn/EditStep'
import type { StepResult } from '../learn/shared'
import { dayHref } from '../../lib/route'
import { ChevBar, GameShell } from './Shell'

const REWARD = 300

/**
 * "Bölüm sonu görevi": a small project in 3-5 stages that unlocks when every day of the part is done. Each stage has its own
 * tests; the boss's chevron health bar drains as stages pass. Winning pays big XP once, gives the part's badge and turns
 * the part's folder tab on the home page solid.
 */
export function Boss({ part }: { part: number }) {
  const lang = useLang()
  const s = useStore()
  const meta = PARTS[part]
  const prog = partDone(s, part)
  const unlocked = prog.done === prog.total
  const rec = s.boss[part]
  const [file, setFile] = useState<BossFile | null | undefined>(undefined)
  const [view, setView] = useState(Math.min(rec?.stage ?? 0, 99))
  /** the stage on screen was passed in this visit: keep its tests on screen until the learner moves on */
  const [cleared, setCleared] = useState(false)
  const [mine, setMine] = useState(false)

  useEffect(() => {
    let alive = true
    loadBoss(part).then((f) => alive && setFile(f))
    return () => {
      alive = false
    }
  }, [part])

  const badge = BADGES.find((b) => b.id === `boss-${part}`)
  const next = daysOfPart(part).find((n) => !s.done[n])

  let body
  if (!unlocked) {
    body = (
      <section className="step-card" aria-labelledby="bo-lock">
        <h2 id="bo-lock">{t('boss.lockedH')}</h2>
        <p>{t('boss.lockedA', { name: meta.name })} <span className="num">{prog.done} / {prog.total}</span> {t('boss.lockedB')}</p>
        <ChevBar total={prog.total} left={prog.done} label={t('boss.barAria', { done: prog.done, total: prog.total })} />
        {next && <a className="btn btn-chev" href={dayHref(next)}>{t('boss.goDay', { n: next })}</a>}
      </section>
    )
  } else if (file === undefined) {
    body = <p className="boot" role="status">{t('boss.loading')}</p>
  } else if (file === null) {
    body = (
      <section className="step-card" aria-labelledby="bo-wait">
        <h2 id="bo-wait">{t('boss.waitH')}</h2>
        <p>{t('boss.waitP', { name: meta.name })}</p>
        <a className="btn btn-chev" href="#/">{t('common.homeLink')}</a>
      </section>
    )
  } else {
    const n = file.stages.length
    const passed = Math.min(rec?.stage ?? 0, n)
    const reward = file.reward_xp ?? REWARD
    const idx = Math.min(view, n - 1)
    const st = file.stages[idx]
    const prev = idx > 0 ? rec?.code?.[idx - 1] : undefined

    const onDone = (res: StepResult) => {
      const cur = getState().boss[part]
      const alreadyPassed = (cur?.stage ?? 0) > idx
      const code = [...(cur?.code ?? [])]
      code[idx] = res.code ?? ''
      if (!alreadyPassed) {
        awardXp(exerciseXp('write', qualityOf(res)), t('boss.xpStage', { n: idx + 1 }))
        answerOk()
        const win = idx + 1 >= n
        actions.setBoss(part, { stage: idx + 1, code, done: win, date: today() })
        if (win && !cur?.done) {
          awardXp(reward, t('boss.xpBoss'))
          unlockBadge(`boss-${part}`)
          play('level')
          burst({ x: innerWidth / 2, y: innerHeight * 0.4, count: 44, ms: 900, reach: Math.min(innerWidth, 800) * 0.4, size: 12 })
          note(t('boss.noteWon', { name: meta.name }))
        }
        checkBadges()
      }
      setCleared(true)
    }

    if (rec?.done && !cleared) {
      body = (
        <section className="step-card fx-card boss-win" aria-labelledby="bo-win">
          <h2 id="bo-win">{t('boss.winH', { name: meta.name })}</h2>
          <p>{t('boss.winP', { title: bossTitle(file, part) })}</p>
          <div className="boss-win-row">
            {badge && <BadgeMark def={badge} size={64} />}
            <p className="num">+{reward} XP · {badge?.name}</p>
          </div>
          <div className="step-actions">
            <a className="btn btn-chev btn-lg" href="#/">{t('common.homeLink')}</a>
            <a className="btn btn-quiet" href="#/review">{t('boss.reviewGo')}</a>
          </div>
        </section>
      )
    } else {
      const ex: Exercise = {
        id: `boss${part + 1}-${st.id}`,
        type: 'write',
        prompt: st.prompt,
        prompt_tr: st.prompt_tr,
        starter_code: mine && prev ? prev : st.starter_code,
        tests: st.tests,
        hints: st.hints,
        hints_tr: st.hints_tr,
        solution: st.solution,
      }
      const last = idx + 1 >= n
      body = (
        <>
          <section className="boss-head" aria-label={t('boss.hpAria')}>
            <p className="boss-story">{bossStory(file, part)}</p>
            <div className="boss-hp">
              <ChevBar total={n} left={n - passed} label={t('boss.hp', { left: n - passed, n })} />
              <p className="num">{t('boss.passed', { passed, n })}</p>
            </div>
          </section>
          <section className="step-card fx-card boss-card" aria-labelledby="bo-h">
            <header className="step-head">
              <div className="step-title">
                <h2 id="bo-h" className="step-concept">{t('boss.stageH', { i: idx + 1, n, title: stageTitle(st, part, idx) })}</h2>
                <p className="step-type">{bossTitle(file, part)}</p>
              </div>
            </header>
            {st.story_tr && lang === 'tr' && <p className="boss-story">{st.story_tr}</p>}
            {idx > 0 && prev && !cleared && (
              <p className="step-note">
                {t('boss.startShown')}{' '}
                <button type="button" className="btn btn-quiet" onClick={() => setMine((v) => !v)} aria-pressed={mine}>
                  {mine ? t('boss.backStarter') : t('boss.useMine')}
                </button>
              </p>
            )}
            <EditStep key={`${st.id}-${mine}`} ex={ex} mode="learn" known={[]} onDone={onDone} />
            {cleared && (
              <div className="done-panel" role="status">
                <p><Chev state="done" /> {last ? t('boss.lastPassed') : t('boss.stagePassed', { n: idx + 1 })}</p>
                <button
                  type="button"
                  className="btn btn-chev"
                  autoFocus
                  onClick={() => {
                    setCleared(false)
                    setMine(false)
                    if (!last) setView(idx + 1)
                    window.scrollTo({ top: 0 })
                  }}
                >
                  {last ? t('boss.seeWin') : t('boss.nextStage')}
                </button>
              </div>
            )}
          </section>
        </>
      )
    }
  }
  return <GameShell title={t('boss.title', { name: meta.name })}>{body}</GameShell>
}
