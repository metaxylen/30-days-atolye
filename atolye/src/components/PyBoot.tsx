import { useEffect, useRef, useState } from 'react'
import { localize } from '../lib/errors'
import { t, useLang } from '../lib/i18n'
import { runner, useRunnerPhase } from '../lib/runner'

/**
 * What Python is doing while it starts: downloading (with a percentage), preparing, ready; or, when the start hangs
 * or fails, a plain explanation and a retry button. Renders nothing once Python is ready (after a short "hazır").
 */
export function PyBoot() {
  useLang()
  const { phase, status, pct, stage } = useRunnerPhase()
  const [showReady, setShowReady] = useState(false)
  const was = useRef(phase)

  useEffect(() => {
    let t: number | undefined
    if (was.current === 'loading' && phase === 'ready') {
      setShowReady(true)
      t = window.setTimeout(() => setShowReady(false), 2200)
    }
    was.current = phase
    return () => window.clearTimeout(t)
  }, [phase])

  if (phase === 'error') {
    return (
      <div className="py-boot is-error" role="alert">
        <p>{localize(status)}</p>
        <button type="button" className="btn btn-chev btn-sm" onClick={() => runner.retry()}>
          {t('common.retry')}
        </button>
      </div>
    )
  }
  if (phase === 'loading') {
    const label = stage === 'prepare' ? t('py.prepare') : t('boot.dl', { pct })
    return (
      <div className="py-boot" role="status">
        <p>
          <span>{label}</span> <span className="py-boot-note">{stage === 'prepare' ? t('boot.almost') : t('boot.first')}</span>
        </p>
        <span className="py-bar" role="progressbar" aria-label={t('boot.bar')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stage === 'prepare' ? 100 : pct}>
          <i style={{ transform: `scaleX(${(stage === 'prepare' ? 100 : pct) / 100})` }} />
        </span>
      </div>
    )
  }
  if (showReady) {
    return (
      <div className="py-boot is-ready" role="status">
        <p>{t('boot.ready')}</p>
      </div>
    )
  }
  return null
}
