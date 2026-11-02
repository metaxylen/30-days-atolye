import { useCallback, useEffect, useRef, useState } from 'react'
import { approachOf, diffLines, hintsOf, labelOf, failureOf, promptOf, solutionOf, type Exercise } from '../../lib/exercises'
import { friendlyHint, lastLine, localize } from '../../lib/errors'
import { comboReset } from '../../lib/game'
import { answerBad } from '../../lib/juice'
import { t, useLang } from '../../lib/i18n'
import type { CheckResult } from '../../lib/runner'
import { CodeView } from '../PyView'

/** Language of the interface and the content, chosen with the global TR/EN switch. */
export { useLang, hintsOf }

/** How an exercise went. `clean` means first try, no hints, no reveal. */
export interface StepResult {
  tries: number
  hints: number
  revealed: boolean
  clean: boolean
  /** predict: the pick matched the real output. explain: the answer named at least one key idea. */
  correct?: boolean
  /** editor exercises: the code that passed (the boss carries it into the next stage) */
  code?: string
}

export interface StepProps {
  ex: Exercise
  mode: 'learn' | 'review'
  /** lesson and worked-example code of this day, to recognise pasted answers */
  known?: string[]
  onDone: (r: StepResult) => void
}

/**
 * Counters every checked exercise shares: failed checks, opened hints, a revealed solution.
 * `hintTotal` is the length of the exercise's hint ladder: opening its last rung counts as a reveal (the last rung is
 * the hint that nearly gives the answer away), with the same consequences as showing the solution.
 * `revealed` is only "the solution is on screen"; `result().revealed` also includes the last rung.
 */
export function useAttempt(hintTotal = 0) {
  const [tries, setTries] = useState(0)
  const [hints, setHints] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [lastRung, setLastRung] = useState(false)
  const ref = useRef({ tries: 0, hints: 0, revealed: false, lastRung: false })
  ref.current = { tries, hints, revealed, lastRung }
  const fail = useCallback(() => {
    setTries((n) => n + 1)
    answerBad()
  }, [])
  const openHint = useCallback(() => {
    comboReset()
    const n = ref.current.hints + 1
    ref.current.hints = n
    setHints(n)
    if (hintTotal > 1 && n >= hintTotal) {
      ref.current.lastRung = true
      setLastRung(true)
    }
  }, [hintTotal])
  const reveal = useCallback(() => setRevealed(true), [])
  const result = useCallback((extra: Partial<StepResult> = {}, fresh = 0): StepResult => {
    const c = ref.current
    const tries = c.tries + fresh
    const revealedAny = c.revealed || c.lastRung
    return { tries, hints: c.hints, revealed: revealedAny, clean: tries === 0 && c.hints === 0 && !revealedAny, ...extra }
  }, [])
  return { tries, hints, revealed, lastRung, fail, openHint, reveal, result }
}

/**
 * 1-4 pick a choice and Enter checks, for every place a guess is committed. Skipped while typing in a field or an
 * editor, and on buttons and links (they handle Enter themselves). The handler always sees the latest options.
 */
export function useChoiceKeys(opts: { count: number; enabled: boolean; onPick: (i: number) => void; onEnter?: () => void }) {
  const ref = useRef(opts)
  ref.current = opts
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const o = ref.current
      if (!o.enabled || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement
      if (el.closest?.('textarea, select, [contenteditable], .cm-editor, dialog, [role="dialog"], input:not([type="radio"])')) return
      if (/^[1-4]$/.test(e.key) && Number(e.key) <= o.count) {
        e.preventDefault()
        o.onPick(Number(e.key) - 1)
      } else if (e.key === 'Enter' && o.onEnter && !el.closest?.('button, a, summary')) {
        e.preventDefault()
        o.onEnter()
      }
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])
}

export function Prompt({ ex }: { ex: Exercise }) {
  const lang = useLang()
  return <p className="step-prompt" lang={lang === 'tr' && ex.prompt_tr ? 'tr' : 'en'}>{promptOf(ex, lang)}</p>
}

export function OutBox({ stdout, error, label }: { stdout?: string; error?: string | null; label?: string }) {
  useLang()
  const hint = friendlyHint(error)
  return (
    <div className="step-out" role="log" aria-live="polite" aria-atomic="true" aria-label={label ?? t('out.label')} translate="no">
      {stdout ? <pre className="out-std">{stdout.replace(/\n$/, '')}</pre> : null}
      {error ? <pre className="out-error">{localize(error).trimEnd()}</pre> : null}
      {!stdout && !error && <pre className="out-empty">{t('out.empty')}</pre>}
      {hint && <p className="out-hint" translate="yes">{hint}</p>}
    </div>
  )
}

/** Hints open one at a time, free, but counted. Never shamed. */
export function HintLadder({ hints, opened, onOpen }: { hints: string[]; opened: number; onOpen: () => void }) {
  useLang()
  if (hints.length === 0) return null
  const labels = [t('hint.l0'), t('hint.l1'), t('hint.l2'), t('hint.l3')]
  return (
    <div className="hints">
      {opened > 0 && (
        <ol className="hint-list" aria-label={t('hint.listAria')}>
          {hints.slice(0, opened).map((h, i) => (
            <li key={i}>
              <strong>{i === hints.length - 1 && hints.length > 1 ? labels[3] : labels[Math.min(i, 2)]}</strong>
              <pre className="hint-text">{h}</pre>
            </li>
          ))}
        </ol>
      )}
      {opened < hints.length && (
        <button type="button" className="btn btn-quiet" onClick={onOpen}>
          {t('hint.open', { n: opened, total: hints.length })}
        </button>
      )}
      {hints.length > 1 && opened === hints.length - 1 && <p className="step-note">{t('hint.lastWarn')}</p>}
      {hints.length > 1 && opened >= hints.length && <p className="step-note">{t('hint.lastDone')}</p>}
    </div>
  )
}

/** Locked until two failed checks (hints alone never open it); staged: approach first, then the code. */
export function SolutionGate({ ex, tries, revealed, onReveal }: { ex: Exercise; tries: number; revealed: boolean; onReveal: () => void }) {
  const [stage, setStage] = useState(0)
  const lang = useLang()
  const sol = solutionOf(ex)
  if (!sol) return null
  const unlocked = tries >= 2
  if (!unlocked && !revealed) {
    return <p className="sol-locked">{t('sol.locked')}</p>
  }
  const approach = approachOf(sol, lang)
  return (
    <div className="solution">
      {stage === 0 && !revealed && (
        <button type="button" className="btn btn-quiet" onClick={() => setStage(1)}>
          {t('sol.show')}
        </button>
      )}
      {(stage >= 1 || revealed) && (
        <>
          {approach && <p className="sol-approach"><strong>{t('sol.approach')}</strong> {approach}</p>}
          {stage < 2 && !revealed && (
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => {
                setStage(2)
                onReveal()
              }}
            >
              {t('sol.showCode')}
            </button>
          )}
          {(stage >= 2 || revealed) && (
            <>
              <CodeView value={sol.code} label={t('sol.codeLabel')} />
              {ex.twin && <p className="sol-twin">{t('sol.twin')}</p>}
            </>
          )}
        </>
      )}
    </div>
  )
}

/** Each check by its plain-words label; the assert itself sits behind "Show code" for the curious. */
export function TestList({ ex, res }: { ex: Exercise; res: CheckResult }) {
  const lang = useLang()
  const tests = ex.tests ?? []
  if (res.timeout) return <p className="check-fail" role="alert">{t('test.timeout')}</p>
  if (res.error) return null
  if (tests.length === 0) return null
  return (
    <ul className="tests" aria-label={t('test.aria')}>
      {tests.map((td, i) => {
        const r = res.tests[i]
        const ok = r?.ok
        const visible = td.visible !== false
        const own = failureOf(td, lang)
        const msg = !ok ? own || (r?.kind === 'error' ? friendlyHint(r.msg) || r.msg : r?.msg) : ''
        return (
          <li key={i} className={ok ? 'is-ok' : 'is-bad'}>
            <span className="test-mark" aria-hidden="true" />
            <div>
              <p className="test-name">
                {visible ? <span>{labelOf(td, i, lang)}</span> : <span>{t('test.hidden')}</span>}
                <span className="sr-only">{ok ? t('test.passed') : t('test.failed')}</span>
              </p>
              {msg && <p className="test-msg">{msg}</p>}
              {visible && (
                <details className="test-code">
                  <summary>{t('test.showCode')}</summary>
                  <code translate="no">{td.code.replace(/^assert\s+/, '')}</code>
                </details>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function OutputDiff({ expected, actual }: { expected: string; actual: string }) {
  useLang()
  const rows = diffLines(expected, actual)
  return (
    <table className="diff" aria-label={t('diff.aria')}>
      <thead>
        <tr>
          <th scope="col">{t('diff.expected')}</th>
          <th scope="col">{t('diff.yours')}</th>
        </tr>
      </thead>
      <tbody translate="no">
        {rows.map((r, i) => (
          <tr key={i} className={r.same ? '' : 'is-diff'}>
            <td>{r.expected || ' '}</td>
            <td>{r.actual || ' '}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export { lastLine }
