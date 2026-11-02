import { useEffect, useState } from 'react'
import { BADGES, LEVELS, onGame, type BadgeDef } from '../lib/game'
import { t, useLang } from '../lib/i18n'
import { burst } from '../lib/juice'
import { play } from '../lib/sound'
import { setUi, useUi } from '../lib/ui'
import { Modal } from './Modal'

/** A flat chevron badge: one to three stacked chevrons in the field colour. Locked badges are drawn in the surface tone. */
export function BadgeMark({ def, locked = false, size = 56 }: { def: BadgeDef; locked?: boolean; size?: number }) {
  const w = 28 + (def.marks - 1) * 10
  return (
    <svg className={`badge-mark${locked ? ' is-locked' : ''}`} viewBox={`0 0 ${w} 24`} width={size * (w / 28)} height={(size * 24) / 28} role="img" aria-label={locked ? t('badge.locked', { name: def.name }) : def.name}>
      {Array.from({ length: def.marks }, (_, i) => (
        <polygon
          key={i}
          points={`${i * 10},0 ${i * 10 + 9},0 ${i * 10 + 21},12 ${i * 10 + 9},24 ${i * 10},24 ${i * 10 + 12},12`}
          fill={locked ? 'var(--chev-new)' : `var(--field-${def.field})`}
          opacity={locked ? 0.55 : 1 - (def.marks - 1 - i) * 0.22}
        />
      ))}
    </svg>
  )
}

interface Rise {
  id: number
  amount: number
  label: string
  x: number
  y: number
}

let seq = 0

/** XP numbers that rise briefly near the action, a polite live region, badge notices, and the level-up moment. */
export function GameFeedback() {
  const [rises, setRises] = useState<Rise[]>([])
  const [live, setLive] = useState('')
  const [badge, setBadge] = useState<BadgeDef | null>(null)
  const [note, setNote] = useState('')
  const ui = useUi()
  useLang()

  useEffect(
    () =>
      onGame((e) => {
        if (e.type === 'xp') {
          const id = ++seq
          setRises((r) => [...r.slice(-3), { id, amount: e.amount, label: e.label, x: e.x, y: e.y }])
          setLive(`+${e.amount} XP, ${e.label}`)
          window.setTimeout(() => setRises((r) => r.filter((x) => x.id !== id)), 1400)
        } else if (e.type === 'badge') {
          const def = BADGES.find((b) => b.id === e.id)
          if (def) {
            setBadge(def)
            setLive(t('toast.badgeLive', { name: def.name }))
            play('badge')
            window.setTimeout(() => setBadge((b) => (b === def ? null : b)), 4200)
          }
        } else if (e.type === 'level') {
          setUi({ levelUp: e.index })
          play('level')
        } else if (e.type === 'note') {
          setNote(e.text)
          setLive(e.text)
          window.setTimeout(() => setNote((n) => (n === e.text ? '' : n)), 3200)
        }
      }),
    [],
  )

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {live}
      </div>
      <div className="xp-layer" aria-hidden="true">
        {rises.map((r) => (
          <span key={r.id} className="xp-rise" style={{ left: r.x, top: r.y }}>
            +{r.amount} <small>XP</small>
          </span>
        ))}
      </div>
      {note && <p className="note-toast" aria-hidden="true">{note}</p>}
      {badge && (
        <button type="button" className="badge-toast" onClick={() => setUi({ badges: true })} aria-label={t('toast.badgeAria', { name: badge.name })}>
          <BadgeMark def={badge} size={36} />
          <span>
            <strong>{badge.name}</strong>
            <small>{badge.desc}</small>
          </span>
        </button>
      )}
      {ui.levelUp !== null && <LevelUp index={ui.levelUp} />}
    </>
  )
}

function LevelUp({ index }: { index: number }) {
  // The moment: three chevrons slide in, the name lands, two bursts go off. Esc, the button or a click on the backdrop skips it.
  useEffect(() => {
    const id = window.setTimeout(() => setUi({ levelUp: null }), 3600)
    const b1 = window.setTimeout(() => burst({ x: innerWidth / 2, y: innerHeight * 0.45, count: 36, ms: 900, reach: Math.min(innerWidth, 900) * 0.4, size: 13 }), 260)
    const b2 = window.setTimeout(() => burst({ x: innerWidth * 0.3, y: innerHeight * 0.6, count: 20, ms: 800, reach: 260, size: 10 }), 520)
    return () => {
      window.clearTimeout(id)
      window.clearTimeout(b1)
      window.clearTimeout(b2)
    }
  }, [])
  const next = LEVELS[index + 1]
  return (
    <Modal label={t('lvl.label', { name: LEVELS[index].name })} onClose={() => setUi({ levelUp: null })} className="levelup">
      <div className={`levelup-in f${(index % 4) + 1}`}>
        <span className="levelup-chevs" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <p className="levelup-name" translate="no">
          <code>{LEVELS[index].name}</code>
        </p>
        <p className="levelup-line">{t('lvl.line')}</p>
        <p className="levelup-next">{next ? t('lvl.next', { name: next.name, at: next.at }) : t('lvl.top')}</p>
        <button type="button" className="btn btn-chev" autoFocus onClick={() => setUi({ levelUp: null })}>
          {t('lvl.go')}
        </button>
      </div>
    </Modal>
  )
}
