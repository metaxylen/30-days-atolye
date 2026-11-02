import { comboHit, comboReset, comboMultiplier } from './game'
import { play } from './sound'
import { reducedMotion } from './ui'

/**
 * Game feel for answers: a short chevron burst from the button, a tiny spring settle on the card (right) or a short
 * sideways shake (wrong), and the matching sound. Transform and opacity only; with reduced motion there is no burst and the
 * card only flashes a colour (see .fx-* in learn.css).
 */
interface Particle {
  a: number
  v: number
  s: number
  c: string
  spin: number
  t0: number
  ms: number
}

let layer: HTMLCanvasElement | null = null
let parts: Particle[] = []
let origin = { x: 0, y: 0 }
let raf = 0

function ensureLayer(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  if (!layer) {
    layer = document.createElement('canvas')
    layer.className = 'fx-layer'
    layer.setAttribute('aria-hidden', 'true')
  }
  // a modal <dialog> lives in the top layer, above anything outside it: while one is open the canvas moves inside it
  const host = document.querySelector('dialog[open]') ?? document.body
  if (layer.parentElement !== host) host.appendChild(layer)
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const w = Math.round(innerWidth * dpr)
  const h = Math.round(innerHeight * dpr)
  if (layer.width !== w || layer.height !== h) {
    layer.width = w
    layer.height = h
  }
  const ctx = layer.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

function palette(): string[] {
  const cs = getComputedStyle(document.documentElement)
  return [1, 2, 3, 4].map((n) => cs.getPropertyValue(`--field-${n}`).trim() || '#97aaf6').concat(cs.getPropertyValue('--accent').trim() || '#d0106f')
}

function draw(now: number) {
  const ctx = ensureLayer()
  if (!ctx) return
  ctx.clearRect(0, 0, innerWidth, innerHeight)
  parts = parts.filter((p) => now - p.t0 < p.ms)
  for (const p of parts) {
    const k = (now - p.t0) / p.ms
    const e = 1 - Math.pow(1 - k, 3)
    const r = p.v * e
    ctx.save()
    ctx.globalAlpha = 1 - k * k
    ctx.translate(origin.x + Math.cos(p.a) * r, origin.y + Math.sin(p.a) * r)
    ctx.rotate(p.a + p.spin * k)
    ctx.fillStyle = p.c
    const s = p.s
    // the one shape: a prompt chevron
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
  if (parts.length) raf = requestAnimationFrame(draw)
  else {
    raf = 0
    ctx.clearRect(0, 0, innerWidth, innerHeight)
  }
}

export function burst({ x, y, count = 10, ms = 560, reach = 70, size = 6 }: { x: number; y: number; count?: number; ms?: number; reach?: number; size?: number }) {
  if (reducedMotion() || !ensureLayer()) return
  const colors = palette()
  const t0 = performance.now()
  origin = { x, y }
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.4
    parts.push({ a, v: reach * (0.6 + Math.random() * 0.7), s: size * (0.8 + Math.random() * 0.6), c: colors[i % colors.length], spin: (Math.random() - 0.5) * 1.6, t0, ms })
  }
  if (!raf) raf = requestAnimationFrame(draw)
}

const centerOf = (el?: Element | null): { x: number; y: number } => {
  if (el) {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }
  return { x: innerWidth / 2, y: innerHeight * 0.6 }
}

function restart(el: Element | null | undefined, cls: string) {
  if (!el) return
  el.classList.remove('fx-ok', 'fx-bad')
  void (el as HTMLElement).offsetWidth
  el.classList.add(cls)
  window.setTimeout(() => el.classList.remove(cls), 460)
}

/** The element the answer came from: the focused button if there is one, else the given fallback. */
export function answerAnchor(fallback?: Element | null): Element | null {
  const a = document.activeElement
  if (a instanceof HTMLElement && a.closest('button, label, a')) return a.closest('button, label, a')
  return fallback ?? document.querySelector('.step-card')
}

/**
 * A right answer. `first` tells whether it earns the combo (first try, no hint, not a repeat); then the combo grows and the
 * returned multiplier is the one that applied to this answer.
 */
export function answerOk(anchor?: Element | null, opts: { combo?: boolean; card?: Element | null } = {}): number {
  const from = answerAnchor(anchor)
  const { x, y } = centerOf(from)
  let mult = 1
  if (opts.combo) mult = comboHit()
  burst({ x, y })
  restart(opts.card ?? from?.closest('.step-card, .fx-card') ?? document.querySelector('.step-card'), 'fx-ok')
  play('ok')
  if (opts.combo && comboMultiplier() >= 2) play('combo', comboMultiplier())
  return mult
}

/** A wrong answer: shake, the soft blip, and the combo drops back to ×1 (nothing else is taken away). */
export function answerBad(anchor?: Element | null, opts: { card?: Element | null } = {}) {
  const from = answerAnchor(anchor)
  restart(opts.card ?? from?.closest('.step-card, .fx-card') ?? document.querySelector('.step-card'), 'fx-bad')
  play('bad')
  comboReset()
}
