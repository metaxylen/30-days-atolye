import { useEffect, useRef, useState } from 'react'
import { DAYS } from '../data/days'
import { t, useLang } from '../lib/i18n'
import { dayHref } from '../lib/route'
import { today, useStore } from '../lib/store'
import { reducedMotion } from '../lib/ui'
import { Chev } from './bits'
import { Modal } from './Modal'

/** Flat chevrons in the palette burst out of the button for 900ms on a canvas. Transform-only, no DOM per particle. */
function useBurst(canvas: React.RefObject<HTMLCanvasElement | null>, origin: { x: number; y: number }) {
  useEffect(() => {
    const c = canvas.current
    if (!c || reducedMotion()) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = innerWidth * dpr
    c.height = innerHeight * dpr
    ctx.scale(dpr, dpr)
    const cs = getComputedStyle(document.documentElement)
    const colors = [1, 2, 3, 4].map((n) => cs.getPropertyValue(`--field-${n}`).trim() || '#97aaf6').concat(cs.getPropertyValue('--accent').trim() || '#d0106f')
    const parts = Array.from({ length: 46 }, (_, i) => {
      const a = (i / 46) * Math.PI * 2 + Math.random() * 0.5
      const v = 260 + Math.random() * 520
      return { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 220, rot: a, spin: (Math.random() - 0.5) * 9, s: 9 + Math.random() * 14, c: colors[i % colors.length] }
    })
    const t0 = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / 900)
      const sec = (now - t0) / 1000
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      for (const p of parts) {
        const x = origin.x + p.vx * sec * (1 - t * 0.45)
        const y = origin.y + p.vy * sec + 900 * sec * sec * 0.5
        ctx.save()
        ctx.globalAlpha = 1 - t * t
        ctx.translate(x, y)
        ctx.rotate(p.rot + p.spin * sec)
        ctx.fillStyle = p.c
        const s = p.s
        ctx.beginPath()
        ctx.moveTo(-s * 0.5, -s)
        ctx.lineTo(-s * 0.04, -s)
        ctx.lineTo(s * 0.5, 0)
        ctx.lineTo(-s * 0.04, s)
        ctx.lineTo(-s * 0.5, s)
        ctx.lineTo(0, 0)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      if (t < 1) raf = requestAnimationFrame(frame)
      else ctx.clearRect(0, 0, innerWidth, innerHeight)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function Celebrate({ day, bonusXp, origin, onClose }: { day: number; bonusXp: number; origin: { x: number; y: number }; onClose: () => void }) {
  useLang()
  const s = useStore()
  const canvas = useRef<HTMLCanvasElement>(null)
  useBurst(canvas, origin)
  // The card arrives as the burst ends; with reduced motion there is no burst and the card is immediate.
  const [ready, setReady] = useState(reducedMotion())
  useEffect(() => {
    if (ready) return
    const id = window.setTimeout(() => setReady(true), 850)
    return () => window.clearTimeout(id)
  }, [ready])
  const next = DAYS.find((d) => d.n === day + 1)
  const xpToday = s.xpByDate[today()] ?? 0
  const exDone = Object.keys(s.ex).filter((id) => id.startsWith(`d${String(day).padStart(2, '0')}-`) && s.ex[id].done).length
  return (
    <>
      <canvas ref={canvas} className="burst-canvas" aria-hidden="true" />
      {ready && <Modal label={t('cel.label', { day })} onClose={onClose} className="celebrate">
        <div className="celebrate-in">
          <p className="celebrate-tick"><Chev state="done" label={t('cel.tick')} /></p>
          <h2>{t('cel.h', { day })}</h2>
          <p className="celebrate-sum num">
            {t('cel.sumA')} <strong>{xpToday} XP</strong> {t('cel.sumB')}{bonusXp ? ` ${t('cel.bonus', { n: bonusXp })}` : ''}. {t('cel.sumC', { n: exDone })}
          </p>
          <div className="step-actions">
            {next ? (
              <a className="btn btn-chev btn-lg" href={dayHref(next.n)} onClick={onClose} autoFocus>
                {t('pal.day', { n: next.n, title: next.title })}
              </a>
            ) : (
              <a className="btn btn-chev btn-lg" href="#/" onClick={onClose} autoFocus>
                {t('pager.home')}
              </a>
            )}
            <button type="button" className="btn btn-quiet" onClick={onClose}>
              {t('cel.stay')}
            </button>
          </div>
        </div>
      </Modal>}
    </>
  )
}
