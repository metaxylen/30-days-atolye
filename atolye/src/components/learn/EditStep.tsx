import { useRef, useState } from 'react'
import { editorStart, hintsOf, looksCopied, sameOutput } from '../../lib/exercises'
import { t } from '../../lib/i18n'
import { runner, type CheckResult } from '../../lib/runner'
import { LazyEditor } from '../PyView'
import { HintLadder, OutBox, OutputDiff, Prompt, SolutionGate, TestList, useAttempt, useLang, type StepProps } from './shared'

/** modify, write and debug: an editor, Run (stdout and errors) and Check (the tests, in a fresh namespace). */
export function EditStep({ ex, known = [], onDone }: StepProps) {
  const start = editorStart(ex)
  const [code, setCode] = useState(start)
  const [run, setRun] = useState<{ stdout: string; error: string | null } | null>(null)
  const [res, setRes] = useState<CheckResult | null>(null)
  const [busy, setBusy] = useState<'' | 'run' | 'check'>('')
  const [pasteNote, setPasteNote] = useState(false)
  const hints = hintsOf(ex, useLang())
  const a = useAttempt(hints.length)
  const [passed, setPassed] = useState(false)
  const codeRef = useRef(code)
  codeRef.current = code
  const checkBtn = useRef<HTMLButtonElement>(null)

  const doRun = async () => {
    if (busy) return
    setBusy('run')
    const r = await runner.check(codeRef.current, [])
    setBusy('')
    setRes(null)
    setRun(r.timeout ? { stdout: '', error: t('test.timeout') } : { stdout: r.stdout, error: r.error })
  }

  const doCheck = async () => {
    if (busy) return
    setBusy('check')
    const r = await runner.check(codeRef.current, (ex.tests ?? []).map((t) => t.code))
    setBusy('')
    setRun(null)
    setRes(r)
    if (r.timeout) return
    const outOk = ex.expected_output === undefined || sameOutput(r.stdout, ex.expected_output)
    const ok = !r.error && r.tests.every((t) => t.ok) && outOk
    setPassed(ok)
    if (ok) onDone({ ...a.result(), code: codeRef.current })
    else a.fail()
  }

  const onPaste = (text: string) => {
    if (looksCopied(text, [...known, start])) setPasteNote(true)
  }

  const hasTests = (ex.tests ?? []).length > 0
  const showDiff = res && !res.error && !res.timeout && ex.expected_output !== undefined && !sameOutput(res.stdout, ex.expected_output)

  return (
    <div className="step-body">
      <Prompt ex={ex} />
      {ex.type === 'modify' && <p className="step-note">{t('edit.modifyNote')}</p>}
      <div className="cell-editor edit-cell">
        <LazyEditor
          value={code}
          label={`${ex.type === 'debug' ? t('edit.aria.debug') : ex.type === 'modify' ? t('edit.aria.modify') : t('edit.aria.write')}. ${t('edit.aria.keys')}`}
          onChange={setCode}
          onRun={doRun}
          onCheck={doCheck}
          onEscape={() => checkBtn.current?.focus()}
          onPasteText={onPaste}
          placeholderText={start === '' ? t('edit.placeholder') : undefined}
        />
      </div>
      {pasteNote && <p className="paste-note" role="status">{t('edit.paste')}</p>}
      <div className="step-actions">
        <button type="button" className="btn btn-quiet" onClick={doRun} disabled={!!busy}>
          {busy === 'run' ? t('common.running') : t('edit.run')}
        </button>
        <button ref={checkBtn} type="button" className="btn btn-chev" onClick={doCheck} disabled={!!busy}>
          {busy === 'check' ? t('edit.checking') : t('edit.check')}
        </button>
        <span className="step-note">{t('edit.keys')}</span>
      </div>
      {run && <OutBox stdout={run.stdout} error={run.error} />}
      {res && (
        <div className="check" aria-live="polite">
          {res.error && <OutBox stdout={res.stdout} error={res.error} />}
          <TestList ex={ex} res={res} />
          {!passed && !hasTests && !res.error && !showDiff && !res.timeout && <p className="check-fail" role="alert">{t('edit.notSame')}</p>}
          {showDiff && <OutputDiff expected={ex.expected_output!} actual={res.stdout} />}
        </div>
      )}
      <HintLadder hints={hints} opened={a.hints} onOpen={a.openHint} />
      <SolutionGate ex={ex} tries={a.tries} revealed={a.revealed} onReveal={a.reveal} />
    </div>
  )
}
