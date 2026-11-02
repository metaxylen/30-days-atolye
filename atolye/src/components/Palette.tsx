import { useEffect, useMemo, useRef, useState } from 'react'
import { DAYS } from '../data/days'
import { switchLang, t, useLang } from '../lib/i18n'
import { actions, useStore } from '../lib/store'
import { setUi, useCtx, useUi } from '../lib/ui'
import { Modal } from './Modal'

interface Item {
  id: string
  label: string
  hint: string
  run: () => void
}

/** ⌘K / Ctrl+K: jump to any day or section of the current day, toggle theme and focus mode. */
export function PaletteHost() {
  const ui = useUi()
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setUi({ palette: !ui.palette })
      }
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [ui.palette])
  return ui.palette ? <Palette onClose={() => setUi({ palette: false })} /> : null
}

function Palette({ onClose }: { onClose: () => void }) {
  const lang = useLang()
  const s = useStore()
  const ctx = useCtx()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const list = useRef<HTMLUListElement>(null)

  const items = useMemo<Item[]>(() => {
    const go = (hash: string) => () => {
      window.location.hash = hash
    }
    const out: Item[] = []
    ctx.sections.forEach((sec, i) => out.push({ id: `sec-${i}`, label: sec.label, hint: t('pal.section', { day: ctx.day ?? '' }), run: sec.go }))
    for (const d of DAYS) out.push({ id: `day-${d.n}`, label: t('pal.day', { n: d.n, title: d.title }), hint: t('pal.gotoDay'), run: go(`#/day/${d.n}`) })
    out.push(
      { id: 'theme', label: t('pal.theme'), hint: t('pal.themeHint'), run: () => actions.setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark') },
      { id: 'lang', label: t('lang.switchTo'), hint: t('lang.hint'), run: () => switchLang() },
      { id: 'focus', label: s.settings.focus ? t('pal.focusOff') : t('pal.focusOn'), hint: t('pal.focusHint'), run: () => actions.setSettings({ focus: !s.settings.focus }) },
      { id: 'review', label: t('pal.review'), hint: t('pal.reviewHint'), run: go('#/review') },
      { id: 'speed', label: t('pal.speed'), hint: t('pal.speedHint'), run: go('#/speed') },
      { id: 'hunt', label: t('pal.hunt'), hint: t('pal.huntHint'), run: go('#/hunt') },
      { id: 'sound', label: s.settings.sound ? t('hud.soundOff') : t('hud.soundOn'), hint: t('pal.soundHint'), run: () => actions.setSettings({ sound: !s.settings.sound }) },
      { id: 'badges', label: t('pal.badges'), hint: t('pal.badgesHint'), run: () => setUi({ badges: true }) },
      { id: 'settings', label: t('pal.settings'), hint: t('pal.settingsHint'), run: () => setUi({ settings: true }) },
      { id: 'home', label: t('pal.home'), hint: t('pal.homeHint'), run: go('#/') },
    )
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, s.settings.focus, s.settings.sound, lang])

  const shown = useMemo(() => {
    const loc = lang === 'en' ? 'en' : 'tr'
    const words = q.toLocaleLowerCase(loc).split(/\s+/).filter(Boolean)
    if (!words.length) return items.slice(0, 40)
    return items.filter((i) => words.every((w) => `${i.label} ${i.hint}`.toLocaleLowerCase(loc).includes(w))).slice(0, 40)
  }, [items, q, lang])

  useEffect(() => setSel(0), [q])
  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  const choose = (i: Item | undefined) => {
    if (!i) return
    onClose()
    window.setTimeout(i.run, 30)
  }

  return (
    <Modal label={t('pal.label')} onClose={onClose} className="palette">
      <div className="palette-in">
        <input
          className="palette-input"
          name="komut"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder={t('pal.ph')}
          aria-label={t('pal.ph')}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={shown[sel] ? `pal-${shown[sel].id}` : undefined}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setSel((v) => Math.min(shown.length - 1, v + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setSel((v) => Math.max(0, v - 1))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              choose(shown[sel])
            }
          }}
        />
        <ul id="palette-list" ref={list} role="listbox" aria-label={t('pal.results')} className="palette-list">
          {shown.map((i, n) => (
            <li key={i.id} id={`pal-${i.id}`} role="option" aria-selected={n === sel} className={n === sel ? 'is-sel' : ''} onPointerMove={() => setSel(n)} onClick={() => choose(i)}>
              <span>{i.label}</span>
              <small>{i.hint}</small>
            </li>
          ))}
          {shown.length === 0 && <li className="palette-empty">{t('pal.empty')}</li>}
        </ul>
      </div>
    </Modal>
  )
}
