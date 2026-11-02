import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/**
 * Two faces of one card that turn around the vertical axis. Both faces sit on top of each other, so the box takes the height
 * of the face that shows (measured, and followed while it changes); while it turns, the height eases to the other face's.
 * With reduced motion there is no 3D at all: the faces cross-fade (see cards.css).
 */
export function Flip({ flipped, front, back }: { flipped: boolean; front: React.ReactNode; back: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const f = useRef<HTMLDivElement>(null)
  const b = useRef<HTMLDivElement>(null)
  const on = useRef(flipped)
  on.current = flipped
  const first = useRef(true)
  const [turning, setTurning] = useState(false)

  const fit = useCallback(() => {
    const face = on.current ? b.current : f.current
    if (face && box.current) box.current.style.height = `${face.offsetHeight}px`
  }, [])

  useLayoutEffect(() => {
    fit()
    const ro = new ResizeObserver(fit)
    if (f.current) ro.observe(f.current)
    if (b.current) ro.observe(b.current)
    return () => ro.disconnect()
  }, [fit])

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setTurning(true)
    fit()
    const id = window.setTimeout(() => setTurning(false), 520)
    return () => window.clearTimeout(id)
  }, [flipped, fit])

  return (
    <div ref={box} className={`card-flip${turning ? ' is-turning' : ''}`} data-flipped={flipped}>
      <div className="card-flip-inner">
        <div ref={f} className="card-front" inert={flipped} aria-hidden={flipped || undefined}>
          {front}
        </div>
        <div ref={b} className="card-back" inert={!flipped} aria-hidden={!flipped || undefined}>
          {back}
        </div>
      </div>
    </div>
  )
}
