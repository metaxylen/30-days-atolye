import { getState } from './store'

/**
 * Tiny synthesized feedback sounds (Web Audio, no files, no library). Quiet on purpose.
 * Nothing is created or played before the first user gesture (browsers refuse it anyway, and an AudioContext made earlier
 * would start suspended): the context is built lazily inside the first play() that follows a gesture.
 */
let ctx: AudioContext | null = null
let gesture = false
let armed = false

const EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const

/** Listens once for the first user gesture. Called at app start; costs nothing until a sound is requested. */
export function armSound() {
  if (armed || typeof window === 'undefined') return
  armed = true
  const mark = () => {
    gesture = true
    EVENTS.forEach((e) => window.removeEventListener(e, mark, true))
  }
  EVENTS.forEach((e) => window.addEventListener(e, mark, { capture: true, passive: true }))
}

function audio(): AudioContext | null {
  if (!gesture) return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    try {
      ctx = new Ctor()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined)
  return ctx
}

const PEAK = 0.05

function tone(c: AudioContext, freq: number, at: number, dur: number, type: OscillatorType = 'sine', vol = 1) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, at)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.linearRampToValueAtTime(PEAK * vol, at + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  o.connect(g).connect(c.destination)
  o.start(at)
  o.stop(at + dur + 0.02)
}

const semis = (base: number, n: number): number => base * Math.pow(2, n / 12)

export type Sfx = 'ok' | 'bad' | 'combo' | 'level' | 'badge' | 'tick'

/** `n` is the combo multiplier for 'combo' (the pitch climbs with it). */
export function play(kind: Sfx, n = 1) {
  if (!getState().settings.sound) return
  const c = audio()
  if (!c) return
  const t = c.currentTime + 0.01
  switch (kind) {
    case 'ok':
      tone(c, 659.25, t, 0.11, 'triangle')
      tone(c, 880, t + 0.08, 0.16, 'triangle')
      break
    case 'bad':
      tone(c, 196, t, 0.16, 'sine', 0.8)
      tone(c, 174.6, t + 0.09, 0.2, 'sine', 0.6)
      break
    case 'combo':
      tone(c, semis(783.99, Math.max(0, n - 2) * 3), t + 0.16, 0.14, 'triangle', 0.7)
      break
    case 'level':
      ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, t + i * 0.09, 0.22, 'triangle'))
      break
    case 'badge':
      tone(c, 1318.5, t, 0.5, 'sine', 0.8)
      tone(c, 1760, t + 0.06, 0.55, 'sine', 0.5)
      break
    case 'tick':
      tone(c, 1200, t, 0.04, 'square', 0.25)
      break
  }
}
