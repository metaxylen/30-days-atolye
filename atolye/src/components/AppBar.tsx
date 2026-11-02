import { useEffect, useRef, useState, type ReactNode } from 'react'
import { t } from '../lib/i18n'
import { actions, useStore } from '../lib/store'
import { setUi } from '../lib/ui'
import { Hud, SoundToggle } from './Hud'
import { ThemeToggle, Wordmark } from './bits'

/**
 * One menu for the things that change how the app looks and sounds. It replaces a row of loose text buttons:
 * sound, theme, text size and focus mode live here, the rest of the settings open from its last item.
 */
export function SettingsMenu({ reader = false }: { reader?: boolean }) {
  const s = useStore()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const focus = s.settings.focus

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        root.current?.querySelector<HTMLButtonElement>('.menu-btn')?.focus()
      }
    }
    window.addEventListener('pointerdown', away)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('pointerdown', away)
      window.removeEventListener('keydown', key)
    }
  }, [open])

  return (
    <div className="menu" ref={root}>
      <button type="button" className="btn btn-quiet menu-btn" aria-haspopup="true" aria-expanded={open} aria-controls="settings-menu" onClick={() => setOpen(!open)}>
        {t('hud.settings')}
        <svg viewBox="0 0 12 8" width="12" height="8" aria-hidden="true" className="menu-caret">
          <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      {open && (
        <div className="menu-panel" id="settings-menu" role="group" aria-label={t('menu.aria')}>
          <SoundToggle />
          <ThemeToggle className="menu-item" />
          {reader && (
            <>
              <div className="menu-row">
                <span>{t('menu.size')}</span>
                <div className="seg seg-sm" role="group" aria-label={t('menu.size')}>
                  <button type="button" aria-label={t('reader.smaller')} disabled={s.settings.textStep === 0} onClick={() => actions.setSettings({ textStep: Math.max(0, s.settings.textStep - 1) as 0 | 1 | 2 })}>
                    A−
                  </button>
                  <button type="button" aria-label={t('reader.larger')} disabled={s.settings.textStep === 2} onClick={() => actions.setSettings({ textStep: Math.min(2, s.settings.textStep + 1) as 0 | 1 | 2 })}>
                    A+
                  </button>
                </div>
              </div>
              <button type="button" className="menu-item" aria-pressed={focus} onClick={() => actions.setSettings({ focus: !focus })}>
                {focus ? t('reader.focusOff') : t('reader.focus')}
              </button>
            </>
          )}
          <button type="button" className="menu-item" aria-label={t('hud.palette')} onClick={() => { setOpen(false); setUi({ palette: true }) }}>
            {t('hud.palette').replace(/ \(.*\)$/, '')} <kbd>⌘K</kbd>
          </button>
          <button type="button" className="menu-item" onClick={() => { setOpen(false); setUi({ settings: true }) }}>
            {t('menu.all')}
          </button>
        </div>
      )}
    </div>
  )
}

/** The one header of the app screens (lesson, practice, review, games): wordmark, an optional slot, the XP unit, the menu. */
export function AppBar({ children, reader = false }: { children?: ReactNode; reader?: boolean }) {
  return (
    <header className="appbar">
      <Wordmark />
      {children}
      <div className="appbar-end">
        <Hud />
        <SettingsMenu reader={reader} />
      </div>
    </header>
  )
}
