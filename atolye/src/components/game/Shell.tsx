import { useEffect, type ReactNode } from 'react'
import { AppBar } from '../AppBar'

/** The page frame the three games share with the review page: wordmark, compact HUD, a way home, one h1. */
export function GameShell({ title, children, wide = false }: { title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    document.title = `${title} · Atölye` // the title text is already in the reader's language
    window.scrollTo(0, 0)
  }, [title])
  return (
    <div className="review-page game-page">
      <AppBar />
      <main className={`review-main${wide ? ' is-wide' : ''}`} id="main" tabIndex={-1}>
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  )
}

/** A row of chevrons that drains from the right as `left` drops (the boss health bar and the speed-round clock use it). */
export function ChevBar({ total, left, label }: { total: number; left: number; label: string }) {
  return (
    <ol className="chev-bar" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <li key={i} className={i < left ? 'is-full' : 'is-empty'} />
      ))}
    </ol>
  )
}
