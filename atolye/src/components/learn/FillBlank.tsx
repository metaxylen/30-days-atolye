import { useMemo, useState } from 'react'
import { t } from '../../lib/i18n'
import { runner, type CheckResult } from '../../lib/runner'
import { hintsOf } from '../../lib/exercises'
import { OutBox, HintLadder, Prompt, SolutionGate, TestList, useAttempt, useLang, type StepProps } from './shared'

/** Blanks (___) become inline inputs inside the code. Check assembles the program and runs the tests. */
export function FillBlank({ ex, onDone }: StepProps) {
  const parts = useMemo(() => (ex.starter_code ?? '').split('___'), [ex.starter_code])
  const [vals, setVals] = useState<string[]>(() => Array.from({ length: parts.length - 1 }, () => ''))
  const [res, setRes] = useState<CheckResult | null>(null)
  const [busy, setBusy] = useState(false)
  const hints = hintsOf(ex, useLang())
  const a = useAttempt(hints.length)

  const check = async () => {
    if (busy || vals.some((v) => !v.trim())) return
    setBusy(true)
    const code = parts.reduce((acc, p, i) => acc + p + (i < vals.length ? vals[i] : ''), '')
    const r = await runner.check(code, (ex.tests ?? []).map((t) => t.code))
    setBusy(false)
    setRes(r)
    if (r.timeout) return
    const ok = !r.error && r.tests.every((t) => t.ok)
    if (ok) onDone(a.result())
    else a.fail()
  }

  const width = (i: number) => `${Math.max(3, ...((ex.blanks?.[i]?.answer ?? ['xxx']).map((x) => x.length + 1)))}ch`

  return (
    <div className="step-body">
      <Prompt ex={ex} />
      <pre className="fill" translate="no" aria-label={t('fill.aria')}>
        {parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < vals.length && (
              <input
                className="fill-input"
                name={`bosluk-${i + 1}`}
                style={{ width: width(i) }}
                value={vals[i]}
                aria-label={t('fill.blank', { n: i + 1 })}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                onChange={(e) => setVals((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void check()
                  }
                }}
              />
            )}
          </span>
        ))}
      </pre>
      <div className="step-actions">
        <button type="button" className="btn btn-chev" onClick={check} disabled={busy || vals.some((v) => !v.trim())}>
          {busy ? t('edit.checking') : t('edit.check')}
        </button>
        <span className="step-note">{t('fill.note')}</span>
      </div>
      {res && (
        <div className="check" aria-live="polite">
          {res.error ? <OutBox error={res.error} stdout={res.stdout} /> : <TestList ex={ex} res={res} />}
          {!res.error && !res.timeout && res.stdout && <OutBox stdout={res.stdout} />}
        </div>
      )}
      <HintLadder hints={hints} opened={a.hints} onOpen={a.openHint} />
      <SolutionGate ex={ex} tries={a.tries} revealed={a.revealed} onReveal={a.reveal} />
    </div>
  )
}
