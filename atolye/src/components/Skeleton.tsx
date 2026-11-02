import { t } from '../lib/i18n'
import { useRailMode } from '../lib/railmode'

/** The frame of the card screen while its parts load: the progress bar, the card and both side columns, at their final sizes. */
export function CardSkeleton() {
  const mode = useRailMode()
  return (
    <div className={`lesson-skel rails-${mode}`} role="status" aria-busy="true" aria-label={t('skel.aria')}>
      <div className="cards-top">
        <div className="skel-strip" />
        <span className="skel-count" />
      </div>
      {mode === 'wide' && (
        <div className="skel-rail skel-rail-left">
          <i className="skel-h" />
          <i className="skel-l" />
          <i className="skel-l" />
          <i className="skel-l" />
          <i className="skel-l is-short" />
        </div>
      )}
      <div className="cards-main">
        <div className="skel-card">
          <i className="skel-k" />
          <i className="skel-t" />
          <i className="skel-p" />
          <i className="skel-p" />
          <i className="skel-p is-short" />
        </div>
        <div className="skel-actions">
          <i className="skel-btn" />
          <i className="skel-btn is-main" />
        </div>
      </div>
      {mode !== 'narrow' && (
        <div className="skel-rail skel-rail-right">
          <i className="skel-h" />
          <i className="skel-l" />
          <i className="skel-l is-short" />
        </div>
      )}
    </div>
  )
}

/** The whole lesson page before any of it is there: the header bar, the title, the tabs and the card frame. */
export function LessonSkeleton({ cards = true }: { cards?: boolean }) {
  return (
    <div className="reader skel-page">
      <header className="appbar skel-appbar" aria-hidden="true">
        <i className="skel-logo" />
        <i className="skel-days" />
      </header>
      <main className="canvas">
        <article className={`lesson lesson-learn${cards ? ' lesson-cards' : ''}`}>
          <div className="lesson-head" aria-hidden="true">
            <div>
              <i className="skel-title" />
              <i className="skel-sub" />
            </div>
          </div>
          <div className="tabs skel-tabs" aria-hidden="true">
            <i />
            <i />
          </div>
          <CardSkeleton />
        </article>
      </main>
    </div>
  )
}
