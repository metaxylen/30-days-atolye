import { useEffect } from 'react'
import { switchLang, t, useLang, type Key, type Lang } from '../lib/i18n'

const OPTIONS: { lang: Lang; short: string; name: Key }[] = [
  { lang: 'tr', short: 'TR', name: 'lang.nameTr' },
  { lang: 'en', short: 'EN', name: 'lang.nameEn' },
]

/**
 * The one language switch: fixed bottom-right (bottom-centre on phones), on every route. Two flat chevron segments, the
 * active one filled. A click picks that language; Alt+L flips it from anywhere. The names are bilingual on purpose, so
 * a reader who landed in the wrong language can still find it.
 */
export function LangSwitch() {
  const lang = useLang()

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      // Option+L types a character on a Mac, so the physical key is checked, not the character
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyL') {
        e.preventDefault()
        switchLang()
      }
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])

  return (
    <div className="lang-switch" role="group" aria-label={t('lang.aria')} data-lang={lang}>
      {OPTIONS.map((o) => (
        <button key={o.lang} type="button" lang={o.lang} className={`lang-seg-btn is-${o.lang}${lang === o.lang ? ' is-on' : ''}`} aria-pressed={lang === o.lang} aria-label={t(o.name)} aria-keyshortcuts="Alt+L" onClick={() => switchLang(o.lang)}>
          {o.short}
        </button>
      ))}
    </div>
  )
}
