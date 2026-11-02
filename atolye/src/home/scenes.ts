import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

/**
 * The home page's scroll story. Everything here is progressive: the page is complete without it (plain map, stacked parts,
 * a finished demo cell), and it only starts when motion is allowed and the screen is wide.
 *  1. the journey map: the day squares rise in, row by row, as the map enters
 *  2. how it works (the signature move): pinned; a Day 13 cell types itself, presses Run, shows its output
 */

const KW = /\b(for|in|print|range)\b/g
function paint(code: string): string {
  const esc = code.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  return esc.replace(/\b(\d+)\b/g, '<i class="t-n">$1</i>').replace(KW, '<i class="t-k">$1</i>')
}

export function initScenes(root: HTMLElement): () => void {
  gsap.registerPlugin(ScrollTrigger)
  const cleanups: (() => void)[] = []
  root.classList.add('has-scenes')

  const lenis = new Lenis({ lerp: 0.12 })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (t: number) => lenis.raf(t * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  cleanups.push(() => {
    gsap.ticker.remove(tick)
    lenis.destroy()
  })

  // ---- 1: the map ----
  root.querySelectorAll<HTMLElement>('[data-map-part]').forEach((row) => {
    const tiles = row.querySelectorAll('.slot')
    gsap.from(tiles, {
      y: 22,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.out',
      stagger: 0.04,
      scrollTrigger: { trigger: row, start: 'top 88%', once: true },
    })
  })

  // ---- 2: the cell that runs itself ----
  const codeEl = root.querySelector<HTMLElement>('[data-demo-code]')
  const outEl = root.querySelector<HTMLElement>('[data-demo-out]')
  const runEl = root.querySelector<HTMLElement>('[data-demo-run]')
  if (codeEl && outEl && runEl) {
    const full = codeEl.dataset.full ?? ''
    const state = { n: 0 }
    const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-how-step]'))
    const mark = (p: number) => {
      const at = p < 0.28 ? 0 : p < 0.6 ? 1 : p < 0.9 ? 2 : 3
      steps.forEach((el, i) => el.classList.toggle('is-on', i === at))
    }
    const type = () => {
      const n = Math.round(state.n)
      codeEl.innerHTML = paint(full.slice(0, n)) + '<span class="caret"></span>'
    }
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.how', start: 'top top', end: '+=100%', pin: true, scrub: true, anticipatePin: 1, onUpdate: (self) => mark(self.progress) },
    })
    tl.fromTo(state, { n: 0 }, { n: full.length, duration: 0.5, onUpdate: type }, 0)
      .to(runEl, { scale: 0.94, duration: 0.03 }, 0.54)
      .to(runEl, { scale: 1, duration: 0.03 }, 0.57)
      .fromTo(outEl, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.08, ease: 'power3.out' }, 0.6)
      .to({}, { duration: 0.32 }, 0.68)
    type()
  }

  ScrollTrigger.refresh()
  return () => {
    ScrollTrigger.getAll().forEach((t) => t.kill(true))
    cleanups.forEach((f) => f())
    root.classList.remove('has-scenes')
    // gsap leaves inline transforms on elements it animated; the next mount starts clean
    root.querySelectorAll<HTMLElement>('.slot, [data-demo-run], [data-demo-out]').forEach((el) => gsap.set(el, { clearProps: 'all' }))
    const code = root.querySelector<HTMLElement>('[data-demo-code]')
    if (code?.dataset.full) code.textContent = code.dataset.full
  }
}
