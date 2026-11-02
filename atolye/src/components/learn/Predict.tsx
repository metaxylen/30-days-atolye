import { useRef, useState } from 'react'
import { explanationOf, misconceptionOf, sameOutput } from '../../lib/exercises'
import { t } from '../../lib/i18n'
import { answerBad } from '../../lib/juice'
import { runner } from '../../lib/runner'
import { CodeView } from '../PyView'
import { OutBox, Prompt, useChoiceKeys, useLang, type StepProps } from './shared'

type Out = { stdout: string; error: string | null }

/**
 * One action: pick (or type) a guess and press Check. That locks the guess, runs the code and shows the real output beside
 * it with the explanation. In the lesson a first wrong guess does not show the answer: the learner re-reads the code and
 * checks a second time (or asks to see the answer); that second check pays no XP. Closed-book review shows the answer
 * straight away, since the item is already graded.
 */
export function Predict({ ex, mode, onDone }: StepProps) {
  const lang = useLang()
  const [pick, setPick] = useState<string>('')
  const [actual, setActual] = useState<Out | null>(null)
  const [running, setRunning] = useState(false)
  const [wrong, setWrong] = useState(0)
  /** a first miss in the lesson: the real output is held back */
  const [miss, setMiss] = useState(false)
  const held = useRef<Out | null>(null)
  const choices = ex.choices ?? []
  const typed = choices.length === 0
  const open = !running && !miss && actual === null

  const correct = actual !== null && sameOutput(pick, ex.expected_output ?? actual.stdout)
  const wrongNote = misconceptionOf(ex, pick, lang)
  const explanation = explanationOf(ex, lang)

  const check = async () => {
    if (!open || !pick.trim()) return
    setRunning(true)
    const res = await runner.check(ex.code ?? '', [])
    setRunning(false)
    if (res.timeout) return
    const out = { stdout: res.stdout, error: res.error }
    const ok = sameOutput(pick, ex.expected_output ?? res.stdout)
    if (ok) {
      setActual(out)
      onDone({ tries: wrong, hints: 0, revealed: false, clean: wrong === 0, correct: true })
    } else if (mode === 'learn' && wrong === 0) {
      held.current = out
      setWrong(1)
      setMiss(true)
      answerBad()
    } else {
      setActual(out)
      setWrong((w) => w + 1)
      answerBad()
    }
  }

  useChoiceKeys({ count: choices.length, enabled: open && !typed, onPick: (i) => setPick(choices[i]), onEnter: () => void check() })

  const again = () => {
    setMiss(false)
    setActual(null)
    setPick('')
  }

  const showAnswer = () => {
    setMiss(false)
    setActual(held.current)
  }

  return (
    <div className="step-body">
      <Prompt ex={ex} />
      <CodeView value={ex.code ?? ''} label={t('pred.codeLabel')} lines />
      <fieldset className="predict" disabled={!open}>
        <legend className="sr-only">{t('pred.legend')}</legend>
        {typed ? (
          <textarea
            className="predict-typed"
            name="tahmin"
            rows={3}
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                void check()
              }
            }}
            placeholder={t('pred.typedPh')}
            spellCheck={false}
          />
        ) : (
          <div className="choices" role="radiogroup" aria-label={t('pred.choices')}>
            {choices.map((c, i) => (
              <label key={i} className={`choice${pick === c ? ' is-picked' : ''}${actual && sameOutput(c, ex.expected_output ?? '') ? ' is-right' : ''}`}>
                <input type="radio" name="tahmin" checked={pick === c} onChange={() => setPick(c)} />
                <pre translate="no">{c}</pre>
              </label>
            ))}
          </div>
        )}
      </fieldset>
      <div className="step-actions">
        <button type="button" className="btn btn-chev" disabled={!pick.trim() || !open} onClick={() => void check()}>
          {running ? t('common.running') : t('pred.check')}
        </button>
        {open && !running && <span className="step-note">{typed ? t('pred.noteTyped') : t('pred.noteChoices')}</span>}
      </div>
      {actual && (
        <div className="compare" aria-live="polite">
          <div>
            <p className="compare-h">{t('pred.yours')}</p>
            <pre className={correct ? 'is-ok' : 'is-bad'} translate="no">{pick}</pre>
          </div>
          <div>
            <p className="compare-h">{t('pred.actual')}</p>
            <OutBox stdout={actual.stdout} error={actual.error} />
          </div>
        </div>
      )}
      {miss && (
        <div className="feedback is-bad" role="status">
          <p>
            <strong>{t('pred.miss')}</strong> {t('pred.missBody')}
          </p>
          {wrongNote && <p className="misconception">{wrongNote}</p>}
          <div className="step-actions">
            <button type="button" className="btn btn-chev" onClick={again}>
              {t('pred.again')}
            </button>
            <button type="button" className="btn btn-quiet" onClick={showAnswer}>
              {t('pred.showAnswer')}
            </button>
          </div>
        </div>
      )}
      {actual && (
        <div className={`feedback ${correct ? 'is-ok' : 'is-bad'}`} role="status">
          <p>
            <strong>{correct ? (wrong === 0 ? t('pred.right') : t('pred.rightLater')) : t('pred.miss')}</strong> {explanation}
          </p>
          {!correct && wrongNote && <p className="misconception">{wrongNote}</p>}
          {!correct && (
            <div className="step-actions">
              <button type="button" className="btn btn-quiet" onClick={() => onDone({ tries: wrong, hints: 0, revealed: false, clean: false, correct: false })}>
                {t('common.continue')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
