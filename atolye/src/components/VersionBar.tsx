import { t, useLang } from '../lib/i18n'
import { reloadNow, useNewVersion } from '../lib/version'

/** Non-blocking notice at the top while a newer build waits (the learner is typing): reloads on the button or at the next route change. */
export function VersionBar() {
  useLang()
  if (!useNewVersion()) return null
  return (
    <div className="ver-bar" role="status">
      <span className="ver-t">
        <b>{t('ver.ready')}</b> <span className="ver-note">{t('ver.note')}</span>
      </span>
      <button type="button" className="btn btn-chev" onClick={reloadNow}>
        {t('ver.reload')}
      </button>
    </div>
  )
}
