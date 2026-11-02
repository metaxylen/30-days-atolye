import { useEffect, useRef, useState } from 'react'
import { BADGES, LEVELS, comboMultiplier, levelOf, useCombo } from '../lib/game'
import { t, useLang } from '../lib/i18n'
import { play } from '../lib/sound'
import { SKINS, skinLevelName, skinUnlocked } from '../lib/skins'
import { actions, dailyGoal, dueReviews, freezeUsedThisWeek, masteredCount, streak, useStore } from '../lib/store'
import { reducedMotion, setUi } from '../lib/ui'
import { BadgeMark } from './Toasts'
import { Modal } from './Modal'

/** The streak flame: one flat silhouette, lit in the accent when today counts, quiet otherwise. */
export function Flame({ lit, size = 20 }: { lit: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 28" width={size} height={(size * 28) / 24} aria-hidden="true" className="flame">
      <path d="M12 0c1 7 11 9 11 18a11 10 0 0 1-22 0c0-5 3-7 5-10 1 2 2 3 3 3 0-4 1-7 3-11z" fill={lit ? 'var(--gold)' : 'var(--chev-new)'} stroke={lit ? 'var(--ink)' : 'none'} strokeWidth="2" />
    </svg>
  )
}

export function GoalRing({ value, target, met }: { value: number; target: number; met: boolean }) {
  const r = 9
  const c = 2 * Math.PI * r
  const f = Math.min(1, value / Math.max(1, target))
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" className="ring">
      <circle cx="12" cy="12" r={r} fill="none" stroke="var(--active)" strokeWidth="4" />
      <circle cx="12" cy="12" r={r} fill="none" stroke={met ? 'var(--field-2)' : 'var(--accent)'} strokeWidth="4" strokeDasharray={`${c * f} ${c}`} transform="rotate(-90 12 12)" />
    </svg>
  )
}

/** The XP number counts up to its new value (≤700 ms); with reduced motion it just changes. */
function useCountUp(value: number): { shown: number; bump: boolean } {
  const [shown, setShown] = useState(value)
  const [bump, setBump] = useState(false)
  const at = useRef(value)
  useEffect(() => {
    const from = at.current
    if (value <= from || reducedMotion()) {
      at.current = value
      setShown(value)
      return
    }
    const t0 = performance.now()
    const dur = Math.min(700, 280 + (value - from) * 14)
    let raf = 0
    setBump(true)
    const off = window.setTimeout(() => setBump(false), 460)
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      const v = Math.round(from + (value - from) * (1 - Math.pow(1 - k, 3)))
      at.current = v
      setShown(v)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(off)
    }
  }, [value])
  return { shown, bump }
}

/** The combo multiplier as a small chip. Always in the DOM (so a screen reader hears changes); shown from ×2. */
export function ComboStack() {
  const n = useCombo()
  const mult = comboMultiplier(n)
  return (
    <span className={`hud-item hud-combo${n > 0 ? ' is-on' : ''}`} data-combo={mult} title={n > 0 ? t('hud.comboOn', { m: mult }) : t('hud.comboOff')}>
      {n > 0 && (
        <span className="num hud-n" aria-hidden="true">
          ×{mult}
        </span>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {n > 0 ? t('hud.comboSr', { m: mult }) : ''}
      </span>
    </span>
  )
}

export function SoundToggle() {
  const on = useStore().settings.sound
  return (
    <button
      type="button"
      className="menu-item hud-sound"
      aria-pressed={on}
      aria-label={on ? t('hud.soundOff') : t('hud.soundOn')}
      onClick={() => {
        actions.setSettings({ sound: !on })
        // a short preview when turning it on; this click is the user gesture the browser requires
        if (!on) window.setTimeout(() => play('ok'), 0)
      }}
    >
      {on ? t('hud.soundOff') : t('hud.soundOn')}
    </button>
  )
}

export function Hud({ compact = false }: { compact?: boolean }) {
  useLang()
  const s = useStore()
  const lv = levelOf(s.xp)
  const xp = useCountUp(s.xp)
  const st = streak(s)
  const goal = dailyGoal(s)
  const due = dueReviews(s).length
  const tip = t('hud.unitTip', { goal: goal.met ? t('hud.goalDone') : t('hud.goalTitle', { v: goal.value, t: goal.target }), streak: st ? t('hud.streakTitle', { n: st }) : t('hud.streakNone') })
  return (
    <div className={`hud${compact ? ' hud-compact' : ''}`}>
      <div className="hud-item hud-unit" title={tip}>
        <button type="button" className="hud-level" onClick={() => setUi({ badges: true })} aria-label={t('hud.levelAria', { name: lv.name, xp: s.xp })}>
          <span className="hud-lv">
            <small>{t('hud.level')}</small> <code translate="no">{lv.name}</code>
          </span>
          <span className={`hud-xp num${xp.bump ? ' is-bump' : ''}`}>{xp.shown} XP</span>
          <span className="hud-bar" aria-hidden="true">
            <i style={{ transform: `scaleX(${lv.progress})` }} />
          </span>
        </button>
        <span className="hud-streak">
          <Flame lit={st > 0} />
          <span className="num hud-n">{st}</span>
          <span className="hud-streak-l">{t('sum.unitDay')}</span>
          <span className="sr-only">{t('hud.streakSr')}. {`${t('hud.goalSr', { v: goal.value, t: goal.target })}${goal.met ? t('hud.goalSrDone') : ''}`}</span>
        </span>
      </div>
      <ComboStack />
      <a className={`hud-item hud-due${due ? ' has-due' : ''}`} href="#/review" aria-label={due ? t('hud.dueAria', { n: due }) : t('hud.dueNone')}>
        <span>{t('hud.due')}</span>
        <span className="num hud-n">{due}</span>
      </a>
    </div>
  )
}

export function BadgesPanel({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const lv = levelOf(s.xp)
  return (
    <Modal label={t('badges.label')} onClose={onClose} className="panel-modal">
      <div className="panel-in">
        <header className="panel-head">
          <h2>{t('badges.h')}</h2>
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            {t('common.close')}
          </button>
        </header>
        <p className="panel-sum num">
          {s.xp} XP · {t('badges.level')} <code translate="no">{lv.name}</code> · {t('badges.sum', { m: masteredCount(s), d: Object.keys(s.done).length })}
        </p>
        <ol className="levels" aria-label={t('badges.levels')}>
          {LEVELS.map((l, i) => (
            <li key={l.name} className={i <= lv.index ? 'is-on' : ''}>
              <code translate="no">{l.name}</code>
              <span className="num">{l.at}</span>
            </li>
          ))}
        </ol>
        <ul className="badge-grid">
          {BADGES.map((b) => {
            const on = s.badges[b.id]
            return (
              <li key={b.id} className={on ? 'is-on' : ''}>
                <BadgeMark def={b} locked={!on} />
                <div>
                  <p className="badge-name">{b.name}</p>
                  <p className="badge-desc">{b.desc}</p>
                  <p className="badge-date num">{on ? on : t('common.locked')}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </Modal>
  )
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const frozen = freezeUsedThisWeek(s)

  const exportIt = () => {
    const blob = new Blob([actions.exportJson()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `atolye-ilerleme-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    setMsg(t('set.exported'))
  }
  const importIt = async (f: File | undefined) => {
    if (!f) return
    const err = actions.importJson(await f.text())
    setMsg(err ?? t('set.imported'))
  }
  return (
    <Modal label={t('set.h')} onClose={onClose} className="panel-modal">
      <div className="panel-in">
        <header className="panel-head">
          <h2>{t('set.h')}</h2>
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            {t('common.close')}
          </button>
        </header>
        <fieldset className="set-group">
          <legend>{t('set.size')}</legend>
          <div className="seg" role="radiogroup" aria-label={t('set.size')}>
            {([t('set.sizeS'), t('set.sizeM'), t('set.sizeL')] as const).map((l, i) => (
              <button key={i} type="button" role="radio" aria-checked={s.settings.textStep === i} className={s.settings.textStep === i ? 'is-on' : ''} onClick={() => actions.setSettings({ textStep: i as 0 | 1 | 2 })}>
                {l}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="set-group">
          <legend>{t('set.sound')}</legend>
          <div className="seg" role="radiogroup" aria-label={t('set.soundAria')}>
            {([true, false] as const).map((v) => (
              <button
                key={String(v)}
                type="button"
                role="radio"
                aria-checked={s.settings.sound === v}
                className={s.settings.sound === v ? 'is-on' : ''}
                onClick={() => {
                  actions.setSettings({ sound: v })
                  if (v) window.setTimeout(() => play('ok'), 0)
                }}
              >
                {v ? t('set.soundOn') : t('set.soundOff')}
              </button>
            ))}
          </div>
          <p className="set-note">{t('set.soundNote')}</p>
        </fieldset>
        <fieldset className="set-group">
          <legend>{t('set.skin')}</legend>
          <div className="skins" role="radiogroup" aria-label={t('set.skin')}>
            {SKINS.map((k) => {
              const open = skinUnlocked(k, s.xp)
              const on = (open ? s.settings.skin : 'varsayilan') === k.id
              return (
                <button key={k.id} type="button" role="radio" aria-checked={on} disabled={!open} className={`skin${on ? ' is-on' : ''}`} onClick={() => actions.setSettings({ skin: k.id })}>
                  <span className="skin-chevs" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <i key={i} style={{ background: k.pair ? `var(${k.pair[i % 2]})` : `var(--field-${i + 1})` }} />
                    ))}
                  </span>
                  <span>
                    {k.name}
                    {!open && <small> · {t('set.skinLocked', { level: skinLevelName(k) })}</small>}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>
        <fieldset className="set-group">
          <legend>{t('set.goal')}</legend>
          <p className="set-note">{t('set.goalNote')}</p>
        </fieldset>
        <fieldset className="set-group">
          <legend>{t('set.streak')}</legend>
          <p className="set-note">{t('set.streakNote')} {frozen ? t('set.freezeUsed') : t('set.freezeKept')}</p>
        </fieldset>
        <fieldset className="set-group">
          <legend>{t('set.file')}</legend>
          <div className="set-row">
            <button type="button" className="btn btn-chev btn-sm" onClick={exportIt}>
              {t('set.export')}
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => file.current?.click()}>
              {t('set.import')}
            </button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => importIt(e.target.files?.[0])} />
          </div>
          <p className="set-note" role="status">{msg || t('set.fileNote')}</p>
        </fieldset>
      </div>
    </Modal>
  )
}
