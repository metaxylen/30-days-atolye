import { useEffect, useMemo, useRef, useState } from 'react'
import { localize } from '../../lib/errors'
import { t, useLang } from '../../lib/i18n'
import { runner, useRunnerPhase, type TraceResult, type TraceStep, type TraceVar } from '../../lib/runner'
import { tokens } from '../PyView'

/** A value as flat boxes: a list or tuple is a row of indexed cells, a dict is key/value cells, anything else plain text. */
function Val({ v }: { v: TraceVar }) {
  if (v.k === 'x') return <span className="tv-plain">{v.r}</span>
  const items = v.i ?? []
  const more = (v.n ?? items.length) - items.length
  const isDict = v.k === 'dict'
  return (
    <span className="tv-boxes" data-kind={v.k}>
      <span className="tv-kind">{v.k}</span>
      {items.map((it, k) =>
        isDict ? (
          <span key={k} className="tv-box tv-pair">
            <b>{(it as string[])[0]}</b>
            <span>{(it as string[])[1]}</span>
          </span>
        ) : (
          <span key={k} className="tv-box">
            <i>{v.k === 'set' || v.k === 'frozenset' ? '' : k}</i>
            <span>{it as string}</span>
          </span>
        ),
      )}
      {items.length === 0 && <span className="tv-empty">{t('trace.empty')}</span>}
      {more > 0 && <span className="tv-more">+{more}</span>}
    </span>
  )
}

const same = (a: TraceVar | undefined, b: TraceVar): boolean => !!a && JSON.stringify(a) === JSON.stringify(b)

function VarList({ title, now, before, step }: { title: string; now: [string, TraceVar][]; before: [string, TraceVar][]; step: number }) {
  const prev = new Map(before)
  return (
    <section className="tv-sec" aria-label={title}>
      <h4 className="tv-h">{title}</h4>
      {now.length === 0 ? (
        <p className="tv-none">{t('trace.noVars')}</p>
      ) : (
        <ul className="tv-list">
          {now.map(([name, val]) => {
            const changed = !same(prev.get(name), val)
            // a changed row gets a new key, so its one-shot flash plays again on every step that changes it
            return (
              <li key={changed ? `${name}:${step}` : name} className={changed ? 'is-changed' : ''}>
                <span className="tv-name">{name}</span>
                <Val v={val} />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/**
 * The line-by-line stepper: runs the code once under sys.settrace in the Python worker, then lets the learner walk through the
 * recorded steps. The code view marks the line that runs next, the panel shows the variables at that moment (changed ones flash once)
 * and the output printed so far.
 */
export function Tracer({ code }: { code: string }) {
  useLang()
  const [res, setRes] = useState<TraceResult | null>(null)
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [fast, setFast] = useState(false)
  const { phase, status } = useRunnerPhase()
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let live = true
    setRes(null)
    setI(0)
    setPlaying(false)
    runner.trace(code).then((r) => live && setRes(r))
    return () => {
      live = false
    }
  }, [code])

  const steps: TraceStep[] = res?.steps ?? []
  const last = steps.length - 1

  // The page header (HUD, day title, tabs, card strip) pushes a card down, so the stepper can open with its controls underneath the
  // sticky Geri/İleri bar. Once, when it appears, bring the controls above that bar (scroll-margin/scroll-padding in cards.css keep the gap).
  const ready = !!res && steps.length > 0
  useEffect(() => {
    if (ready) root.current?.querySelector('.trace-bar')?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }, [ready])

  useEffect(() => {
    if (!playing) return
    if (i >= last) {
      setPlaying(false)
      return
    }
    const t = window.setTimeout(() => setI((k) => Math.min(last, k + 1)), fast ? 350 : 800)
    return () => window.clearTimeout(t)
  }, [playing, i, last, fast])

  const lines = useMemo(() => code.split('\n'), [code])
  const cur = steps[i]
  const prev = i > 0 ? steps[i - 1] : undefined
  const seen = useMemo(() => new Set(steps.slice(0, i).map((s) => s.l)), [steps, i])

  if (!res) {
    return (
      <div className="trace is-wait" role="status">
        <p>{phase === 'loading' && status ? localize(status) : t('trace.wait')}</p>
      </div>
    )
  }
  if (res.timeout) {
    return (
      <div className="trace is-wait" role="alert">
        <p>{t('test.timeout')}</p>
      </div>
    )
  }
  if (!cur) {
    return (
      <div className="trace is-wait" role={res.error ? 'alert' : 'status'}>
        <pre className="out-error">{(res.error ? localize(res.error) : t('trace.noCode')).trimEnd()}</pre>
      </div>
    )
  }

  const out = res.chunks.slice(0, cur.o).join('')
  const inFn = cur.f !== '<module>'
  const finished = !!cur.end || !!cur.err
  const where = cur.end ? t('trace.end') : cur.err ? t('trace.err', { l: cur.l }) : `${t('trace.line', { l: cur.l })}${inFn ? t('trace.inFn', { f: cur.f }) : ''}`

  const go = (n: number) => setI(Math.max(0, Math.min(last, n)))

  return (
    <div
      ref={root}
      className="trace"
      data-own-arrows
      data-step={i}
      onKeyDown={(e) => {
        const el = e.target as HTMLElement
        if (el.closest('input')) return
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          go(i + 1)
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          go(i - 1)
        }
      }}
    >
      <div className="trace-main">
        <ol className="trace-code" translate="no" aria-label={t('trace.code')}>
          {lines.map((ln, k) => {
            const n = k + 1
            const cls = cur.l === n ? (cur.err ? ' is-err' : cur.end ? '' : ' is-now') : seen.has(n) ? ' is-seen' : ''
            return (
              <li key={k} className={`tc-row${cls}`} aria-current={cur.l === n && !cur.end ? 'step' : undefined}>
                <span className="tc-n" aria-hidden="true">{n}</span>
                <span className="tc-t">{ln ? tokens(ln) : ' '}</span>
              </li>
            )
          })}
        </ol>
        <div className="trace-bar">
          <button type="button" className="btn btn-quiet" onClick={() => go(0)} disabled={i === 0}>
            {t('trace.first')}
          </button>
          <button type="button" className="btn btn-quiet trace-prev" onClick={() => go(i - 1)} disabled={i === 0}>
            <span className="tb-chev is-back" aria-hidden="true" />
            {t('trace.prev')}
          </button>
          <button type="button" className="btn btn-chev" onClick={() => go(i + 1)} disabled={i >= last}>
            {t('trace.next')}
          </button>
          <button type="button" className="btn btn-quiet" aria-pressed={playing} onClick={() => (i >= last ? (go(0), setPlaying(true)) : setPlaying((p) => !p))}>
            {playing ? t('cell.stop') : t('trace.play')}
          </button>
          <button type="button" className="btn btn-quiet" aria-pressed={fast} onClick={() => setFast((f) => !f)} aria-label={t('trace.speed')}>
            {fast ? '2×' : '1×'}
          </button>
          <input className="trace-scrub" type="range" min={0} max={last} value={i} onChange={(e) => go(Number(e.target.value))} aria-label={t('trace.step')} aria-valuetext={t('trace.stepOf', { i: i + 1, n: steps.length })} />
          <p className="trace-count num" role="status" aria-live="polite">
            <span>{i + 1} / {steps.length}</span> <span className="trace-where">{where}</span>
          </p>
        </div>
        <div className="trace-side">
          {inFn ? (
            <>
              <VarList title={t('trace.fnVars', { f: cur.f })} now={cur.v} before={prev && prev.f === cur.f ? prev.v : []} step={i} />
              <VarList title={t('trace.globals')} now={cur.g} before={prev ? prev.g : []} step={i} />
            </>
          ) : (
            <VarList title={t('trace.vars')} now={cur.v} before={prev && prev.f === cur.f ? prev.v : []} step={i} />
          )}
          <section className="tv-sec" aria-label={t('trace.outAria')}>
            <h4 className="tv-h">{t('trace.outH')}</h4>
            <pre className="tv-out" translate="no">{out ? out.replace(/\n$/, '') : <span className="tv-none">{t('trace.noOut')}</span>}</pre>
          </section>
        </div>
      </div>

      {finished && res.error && <pre className="out-error trace-error">{localize(res.error).trimEnd()}</pre>}
      {res.truncated && <p className="step-note">{t('trace.trunc')}</p>}
    </div>
  )
}
