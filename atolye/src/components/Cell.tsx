import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CellDef } from '../lib/lesson'
import { actions, getState } from '../lib/store'
import { runner, useRunnerPhase, type RunResult } from '../lib/runner'
import { checkBadges, unlockBadge } from '../lib/game'
import { friendlyHint, localize } from '../lib/errors'
import { t, useLang } from '../lib/i18n'
import { checkExpectations } from '../lib/expect'
import { LazyEditor } from './PyView'

interface Props {
  def: CellDef
  day: number
  session: string
  index: number
}

/** Cells register here so "run all" can expand and run them in order. */
export const cellRegistry = new Map<string, { run: () => Promise<void>; expand: () => void; order: number }>()

export function Cell({ def, day, session, index }: Props) {
  useLang()
  const [code, setCode] = useState<string>(() => getState().code[def.id] ?? def.code)
  const [result, setResult] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [slow, setSlow] = useState(false)
  const [stdin, setStdin] = useState('')
  const [pkgStatus, setPkgStatus] = useState('')
  const [open, setOpen] = useState(def.kind === 'scratch')
  const [copied, setCopied] = useState(false)
  const runBtn = useRef<HTMLButtonElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const { phase, status } = useRunnerPhase()
  const codeRef = useRef(code)
  codeRef.current = code
  const stdinRef = useRef(stdin)
  stdinRef.current = stdin
  const busy = useRef(false)

  const edited = code !== def.code
  const usesInput = /\binput\s*\(/.test(code)
  const label = def.kind === 'scratch' ? t('cell.scratchLabel', { title: def.title ?? '' }) : t('cell.codeLabel', { n: index + 1 })
  const editorLabel = t('cell.editorAria', { label })

  const onChange = useCallback(
    (v: string) => {
      setCode(v)
      actions.setCode(def.id, v, def.code)
    },
    [def.id, def.code],
  )

  const run = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setOpen(true)
    setRunning(true)
    setSlow(false)
    setPkgStatus('')
    setResult({ out: [] })
    const timer = window.setTimeout(() => setSlow(true), 4000)
    const lines = stdinRef.current.length ? stdinRef.current.split('\n') : []
    const wasErr = !!getState().errored[def.id]
    const res = await runner.run(session, codeRef.current, lines, (r) => setResult(r), (msg) => setPkgStatus(msg))
    window.clearTimeout(timer)
    busy.current = false
    setRunning(false)
    setPkgStatus('')
    if (!res.stopped) {
      const failed = !!res.error
      actions.runCell(def.id, day, failed)
      // Running lesson code pays no XP: only retrieval does (docs/pedagogy-research.md §6.3).
      if (!failed && wasErr) unlockBadge('hata-ayiklayici')
      const h = new Date().getHours()
      if (h >= 23 || h < 4) unlockBadge('gece-kusu')
      checkBadges()
    }
    setResult(res)
  }, [session, def.id, day])

  // "Run all" needs to open the cell and run it from outside.
  useEffect(() => {
    cellRegistry.set(def.id, { run, expand: () => setOpen(true), order: index + (def.kind === 'scratch' ? 1000 : 0) })
    return () => {
      cellRegistry.delete(def.id)
    }
  }, [def.id, def.kind, index, run])

  const reset = () => {
    setCode(def.code)
    actions.setCode(def.id, def.code, def.code)
    setResult(null)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codeRef.current)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard blocked: nothing to do */
    }
  }

  const stdout = useMemo(() => (result ? result.out.filter((o) => o.stream === 'out').map((o) => o.text).join('') : ''), [result])
  const expect = useMemo(() => (result && !running && !result.error && !result.stopped && def.kind === 'code' ? checkExpectations(code, stdout) : null), [result, running, code, stdout, def.kind])
  const hint = friendlyHint(result?.error)

  const showOutput = result !== null
  const loadingMsg = localize(running && phase !== 'ready' ? status || '@@prepare' : pkgStatus)

  if (!open) {
    return (
      <div className="cell cell-collapsed" data-cell-id={def.id} translate="no" ref={root}>
        <button type="button" className="cell-peek" onClick={() => setOpen(true)} aria-label={t('cell.showAria', { label })}>
          <span className="cell-chev" aria-hidden="true" />
          <span>{label}</span>
          <span className="cell-peek-act">{t('test.showCode')}</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`cell cell-${def.kind}${running ? ' is-running' : ''}`} data-cell-id={def.id} translate="no" ref={root}>
      {def.kind === 'scratch' && (
        <p className="cell-title">
          <span className="cell-chev" aria-hidden="true" />
          {t('cell.scratch')}
          <span className="cell-title-sub">{def.title}</span>
        </p>
      )}
      <div className="cell-editor">
        <LazyEditor
          value={code}
          label={editorLabel}
          onChange={onChange}
          onRun={run}
          onEscape={() => runBtn.current?.focus()}
          lines={def.kind === 'code'}
          placeholderText={def.kind === 'scratch' ? t('cell.ph') : undefined}
        />
      </div>
      {usesInput && (
        <label className="cell-stdin">
          <span>{t('cell.stdin')}</span>
          <textarea name="input-cevaplari" autoComplete="off" rows={2} value={stdin} onChange={(e) => setStdin(e.target.value)} spellCheck={false} />
        </label>
      )}
      <div className="cell-bar">
        <button ref={runBtn} type="button" className="btn btn-chev" onClick={run} disabled={running} aria-label={t('cell.runAria', { label })}>
          {running ? t('common.running') : t('home.run')}
        </button>
        {running && slow && (
          <button type="button" className="btn btn-quiet" onClick={() => runner.stop()}>
            {t('cell.stop')}
          </button>
        )}
        {edited && !running && (
          <button type="button" className="btn btn-quiet" onClick={reset}>
            {t('cell.reset')}
          </button>
        )}
        <button type="button" className="btn btn-quiet cell-copy" onClick={copy} aria-label={t('cell.copyAria', { label })}>
          {copied ? t('cell.copied') : t('cell.copy')}
        </button>
        <span className="cell-hint" aria-hidden="true">
          Shift+Enter
        </span>
        {loadingMsg && <span className="cell-status">{loadingMsg}</span>}
      </div>
      {showOutput && (
        <div className="cell-out" role="log" aria-live="polite" aria-atomic="true" aria-label={t('out.label')}>
          {result.out.map((o, i) => (
            <pre key={i} className={o.stream === 'err' ? 'out-err' : 'out-std'}>
              {o.text.replace(/\n$/, '')}
            </pre>
          ))}
          {result.repr !== undefined && (
            <pre className="out-result">
              <span className="out-tag">{t('cell.tag')}</span> {result.repr}
            </pre>
          )}
          {result.error && <pre className="out-error">{localize(result.error).trimEnd()}</pre>}
          {hint && <p className="out-hint">{hint}</p>}
          {result.stopped && <pre className="out-error">{t('cell.stopped')}</pre>}
          {!running && !result.error && result.out.length === 0 && result.repr === undefined && !result.stopped && <pre className="out-empty">{t('out.empty')}</pre>}
          {expect && expect.ok && <p className="out-match">{t('cell.match', { n: expect.compared })}</p>}
          {expect && !expect.ok && expect.diff && (
            <p className="out-mismatch">
              {t('cell.mmA', { n: expect.diff.source + 1 })} <code>{expect.diff.expected}</code> {t('cell.mmB')} <code>{expect.diff.actual || t('cell.noOut')}</code>.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
