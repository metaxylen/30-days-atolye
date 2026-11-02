import { Component, type ReactNode } from 'react'
import { t } from '../lib/i18n'

/** Any render or chunk failure in the routed page shows a short message instead of a blank screen. */
export class RouteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error(error)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="boot" role="alert">
        <p>{t('boot.stale')}</p>
        <button type="button" className="btn" onClick={() => location.reload()}>
          {t('common.reload')}
        </button>
      </div>
    )
  }
}
