import { useEffect, useState } from 'react'
import { t } from '../lib/i18n'
import { actions, useStore, type DayState } from '../lib/store'

/** A flat state mark (empty, in progress, done). Sizing and colour come from CSS (.chev). */
export function Chev({ state = 'new', n, label }: { state?: DayState; n?: number; label?: string }) {
  return (
    <span className={`chev chev-${state}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {n !== undefined && <span className="chev-n">{n}</span>}
    </span>
  )
}

export function Wordmark({ href = '#/' }: { href?: string }) {
  return (
    <a className="wordmark" href={href} aria-label={t('wordmark.aria')}>
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <rect width="32" height="32" fill="currentColor" />
        <path d="M9 8.5l9 7.5-9 7.5" fill="none" stroke="var(--accent-ink)" strokeWidth="3.4" />
        <rect x="19" y="22" width="6" height="3.2" fill="var(--accent-ink)" />
      </svg>
      <span translate="no">Atölye</span>
    </a>
  )
}

export function useTheme(): [boolean, () => void] {
  const s = useStore()
  const [sys, setSys] = useState(() => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)').matches : false))
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const f = () => setSys(mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  const dark = s.theme ? s.theme === 'dark' : sys
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#121212' : '#e8e7e3')
  }, [dark])
  return [dark, () => actions.setTheme(dark ? 'light' : 'dark')]
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, toggle] = useTheme()
  return (
    <button type="button" className={`btn btn-quiet theme-toggle ${className}`} onClick={toggle} aria-pressed={dark} aria-label={dark ? t('theme.toLight') : t('theme.toDark')}>
      {dark ? t('theme.light') : t('theme.dark')}
    </button>
  )
}

/** Reveal-on-scroll: marks [data-reveal] elements .in once, staggered by their order inside the parent. */
export function useReveal(dep: unknown) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.in)'))
    if (!els.length) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in')
            io.unobserve(en.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [dep])
}
