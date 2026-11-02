import { useMemo, useRef, useState } from 'react'
import { sameOutput } from '../../lib/exercises'
import { t } from '../../lib/i18n'
import { runner, type CheckResult } from '../../lib/runner'
import { OutBox, OutputDiff, Prompt, SolutionGate, useAttempt, useLang, type StepProps } from './shared'

interface Item {
  id: string
  text: string
  real: boolean
}

/** Deterministic shuffle so the distractors are not always last and a remount keeps the order. */
function seeded<T>(list: T[], seed: string): T[] {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const r = [...list]
  for (let i = r.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    const j = h % (i + 1)
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

/**
 * Two lists: the pool of lines and your program. Keyboard: Enter moves a line between the lists, Space picks a line up in
 * your program and the arrow keys move it, Space drops it. Pointer: drag by the handle. Buttons do the same for touch.
 */
export function Parsons({ ex, onDone }: StepProps) {
  useLang()
  const all = useMemo<Item[]>(() => {
    const real = (ex.lines ?? []).map((line, i) => ({ id: `l${i}`, text: line, real: true }))
    const dis = (ex.distractors ?? []).map((line, i) => ({ id: `d${i}`, text: line, real: false }))
    return seeded([...real, ...dis], ex.id)
  }, [ex])
  const [pool, setPool] = useState<Item[]>(all)
  const [mine, setMine] = useState<Item[]>([])
  const [grab, setGrab] = useState<string | null>(null)
  const [live, setLive] = useState('')
  const [res, setRes] = useState<CheckResult | null>(null)
  const [orderBad, setOrderBad] = useState(false)
  const [busy, setBusy] = useState(false)
  const a = useAttempt()
  const refs = useRef(new Map<string, HTMLElement>())
  const drag = useRef<{ id: string; pointer: number } | null>(null)

  const focusLater = (id: string) => requestAnimationFrame(() => refs.current.get(id)?.focus())

  const toMine = (it: Item) => {
    setPool((p) => p.filter((x) => x.id !== it.id))
    setMine((m) => [...m, it])
    setLive(t('pars.liveAdded', { text: it.text.trim() }))
  }
  const toPool = (it: Item) => {
    setMine((m) => m.filter((x) => x.id !== it.id))
    setPool((p) => [...p, it])
    setGrab(null)
    setLive(t('pars.liveBack', { text: it.text.trim() }))
  }
  const move = (id: string, delta: number) => {
    setMine((m) => {
      const i = m.findIndex((x) => x.id === id)
      const j = i + delta
      if (i < 0 || j < 0 || j >= m.length) return m
      const n = [...m]
      ;[n[i], n[j]] = [n[j], n[i]]
      setLive(t('pars.livePos', { text: n[j].text.trim(), n: j + 1 }))
      return n
    })
    focusLater(id)
  }

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    drag.current = { id, pointer: e.pointerId }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setGrab(id)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const rows = [...refs.current.entries()].filter(([k]) => mine.some((m) => m.id === k))
    const cur = mine.findIndex((m) => m.id === d.id)
    for (const [k, el] of rows) {
      const i = mine.findIndex((m) => m.id === k)
      const r = el.getBoundingClientRect()
      if (k !== d.id && e.clientY > r.top && e.clientY < r.bottom && i !== cur) {
        const n = [...mine]
        const [it] = n.splice(cur, 1)
        n.splice(i, 0, it)
        setMine(n)
        break
      }
    }
  }
  const onPointerUp = () => {
    drag.current = null
    setGrab(null)
  }

  const check = async () => {
    if (busy || mine.length === 0) return
    setBusy(true)
    setOrderBad(false)
    const code = mine.map((m) => m.text).join('\n')
    const r = await runner.check(code, [])
    setBusy(false)
    setRes(r)
    if (r.timeout) return
    let ok: boolean
    if (ex.expected_output !== undefined) ok = !r.error && sameOutput(r.stdout, ex.expected_output) && mine.every((m) => m.real)
    else ok = mine.length === (ex.correct_order ?? []).length && (ex.correct_order ?? []).every((idx, k) => mine[k]?.text === (ex.lines ?? [])[idx])
    if (ok) onDone(a.result())
    else {
      a.fail()
      setOrderBad(true)
    }
  }

  const rowKeys = (it: Item, where: 'pool' | 'mine') => (e: React.KeyboardEvent) => {
    if (where === 'pool') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const next = pool[pool.findIndex((p) => p.id === it.id) + 1] ?? pool[pool.findIndex((p) => p.id === it.id) - 1]
        toMine(it)
        if (next) focusLater(next.id)
      }
      return
    }
    if (e.key === ' ') {
      e.preventDefault()
      setGrab((g) => (g === it.id ? null : it.id))
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const d = e.key === 'ArrowUp' ? -1 : 1
      if (grab === it.id) move(it.id, d)
      else {
        const i = mine.findIndex((m) => m.id === it.id)
        const neighbour = mine[i + d]
        if (neighbour) refs.current.get(neighbour.id)?.focus()
      }
    } else if (e.key === 'Enter' || e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      toPool(it)
    }
  }

  const setRef = (id: string) => (el: HTMLElement | null) => {
    if (el) refs.current.set(id, el)
    else refs.current.delete(id)
  }

  return (
    <div className="step-body">
      <Prompt ex={ex} />
      <p className="step-note" id="parsons-help">
        {t('pars.help')}
      </p>
      <div className="parsons" aria-describedby="parsons-help">
        <div className="parsons-col">
          <p className="parsons-h" id="p-pool">{t('pars.lines')}</p>
          <ul aria-labelledby="p-pool" className="p-list" translate="no">
            {pool.map((it) => (
              <li key={it.id}>
                <button type="button" ref={setRef(it.id)} className="p-line" onClick={() => toMine(it)} onKeyDown={rowKeys(it, 'pool')} aria-label={t('pars.add', { text: it.text.trim() })}>
                  <code>{it.text}</code>
                </button>
              </li>
            ))}
            {pool.length === 0 && <li className="p-empty">{t('pars.allIn')}</li>}
          </ul>
        </div>
        <div className="parsons-col">
          <p className="parsons-h" id="p-mine">{t('pars.mine')}</p>
          <ol aria-labelledby="p-mine" className="p-list p-mine" translate="no">
            {mine.map((it, i) => (
              <li key={it.id} className={grab === it.id ? 'is-grab' : ''}>
                <div
                  ref={setRef(it.id)}
                  className="p-line p-mine-line"
                  tabIndex={0}
                  role="button"
                  aria-pressed={grab === it.id}
                  aria-label={t('pars.rowAria', { n: i + 1, text: it.text.trim() })}
                  onKeyDown={rowKeys(it, 'mine')}
                >
                  <span className="p-handle" onPointerDown={(e) => onPointerDown(e, it.id)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <code>{it.text}</code>
                  <span className="p-tools">
                    <button type="button" tabIndex={-1} className="p-tool" onClick={() => move(it.id, -1)} disabled={i === 0} aria-label={t('pars.upAria')}>
                      {t('pars.up')}
                    </button>
                    <button type="button" tabIndex={-1} className="p-tool" onClick={() => move(it.id, 1)} disabled={i === mine.length - 1} aria-label={t('pars.downAria')}>
                      {t('pars.down')}
                    </button>
                    <button type="button" tabIndex={-1} className="p-tool" onClick={() => toPool(it)} aria-label={t('pars.removeAria')}>
                      {t('pars.remove')}
                    </button>
                  </span>
                </div>
              </li>
            ))}
            {mine.length === 0 && <li className="p-empty">{t('pars.none')}</li>}
          </ol>
        </div>
      </div>
      <span className="sr-only" role="status" aria-live="polite">{live}</span>
      <div className="step-actions">
        <button type="button" className="btn btn-chev" onClick={check} disabled={busy || mine.length === 0}>
          {busy ? t('common.running') : t('pred.check')}
        </button>
      </div>
      {res && !res.timeout && (
        <div className="check" aria-live="polite">
          {res.error ? <OutBox error={res.error} stdout={res.stdout} /> : <OutBox stdout={res.stdout} label={t('pars.outLabel')} />}
          {orderBad && ex.expected_output !== undefined && !res.error && <OutputDiff expected={ex.expected_output} actual={res.stdout} />}
          {orderBad && <p className="check-fail" role="alert">{mine.some((m) => !m.real) ? t('pars.extra') : t('pars.bad')}</p>}
        </div>
      )}
      <SolutionGate ex={ex} tries={a.tries} revealed={a.revealed} onReveal={a.reveal} />
    </div>
  )
}
