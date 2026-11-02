import { useEffect, useRef, type ReactNode } from 'react'

/** Native <dialog>: focus trap, Esc, and an inert page behind it come from the browser. */
export function Modal({ label, onClose, children, className = '' }: { label: string; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (!d.open) d.showModal()
    const onCancel = () => close.current()
    d.addEventListener('close', onCancel)
    return () => {
      d.removeEventListener('close', onCancel)
      if (d.open) d.close()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-label={label}
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close()
      }}
    >
      {children}
    </dialog>
  )
}
