import { useRef, useState } from 'react'
import { modelAnswerOf, sameOutput } from '../../lib/exercises'
import { t } from '../../lib/i18n'
import { runner } from '../../lib/runner'
import { CodeView, LazyEditor } from '../PyView'
import { OutBox, OutputDiff, Prompt, useAttempt, useLang, type StepProps } from './shared'

/** Study the snippet, hide it, retype it from memory. Checked by what it prints. */
export function TypeIt({ ex, onDone }: StepProps) {
  useLang()
  const [phase, setPhase] = useState<'study' | 'type'>('study')
  const [code, setCode] = useState('')
  const [out, setOut] = useState<{ stdout: string; error: string | null } | null>(null)
  const [busy, setBusy] = useState(false)
  const a = useAttempt()
  const codeRef = useRef(code)
  codeRef.current = code

  const check = async () => {
    if (busy) return
    setBusy(true)
    const r = await runner.check(codeRef.current, [])
    setBusy(false)
    if (r.timeout) return
    setOut({ stdout: r.stdout, error: r.error })
    if (!r.error && sameOutput(r.stdout, ex.expected_output ?? '')) onDone(a.result())
    else a.fail()
  }

  return (
    <div className="step-body">
      <Prompt ex={ex} />
      {phase === 'study' ? (
        <>
          <CodeView value={ex.code ?? ''} label={t('typeit.study')} lines />
          <div className="step-actions">
            <button type="button" className="btn btn-chev" autoFocus onClick={() => setPhase('type')}>
              {t('typeit.ready')}
            </button>
            <span className="step-note">{t('typeit.note')}</span>
          </div>
        </>
      ) : (
        <>
          <div className="cell-editor edit-cell">
            <LazyEditor value={code} label={t('typeit.edAria')} onChange={setCode} onRun={check} onEscape={() => undefined} placeholderText={t('typeit.ph')} autoFocus />
          </div>
          <div className="step-actions">
            <button type="button" className="btn btn-chev" onClick={check} disabled={busy || !code.trim()}>
              {busy ? t('edit.checking') : t('typeit.runCheck')}
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => {
                a.openHint()
                setPhase('study')
              }}
            >
              {t('typeit.again')}
            </button>
          </div>
          {out && (
            <div className="check" aria-live="polite">
              <OutBox stdout={out.stdout} error={out.error} />
              {!out.error && ex.expected_output !== undefined && !sameOutput(out.stdout, ex.expected_output) && <OutputDiff expected={ex.expected_output} actual={out.stdout} />}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** Lower-case and strip Turkish letters to ASCII, so "okunaklı" matches "okunakli" and stems match inside longer words. */
const fold = (s: string): string =>
  s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Turkish letters or a few very common Turkish function words. */
const looksTurkish = (s: string): boolean => /[çğıöşüÇĞİÖŞÜ]|(^|\s)(ve|bir|bu|için|ile|değil|gibi|olarak|çünkü|ama|ne|nedir)(\s|$)/i.test(s)

export const wordCount = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length

/**
 * Write it in your own words, then compare with the model answer. The answer must be at least `min_words` long and
 * name at least one key idea (a keyword stem, matched in the language the learner wrote in) to count; the matches are
 * computed, not self-ticked.
 */
export function Explain({ ex, onDone }: StepProps) {
  const lang = useLang()
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [rounds, setRounds] = useState(0)
  const minWords = ex.min_words ?? 6
  const words = wordCount(text)
  const turkish = looksTurkish(text)
  const keywords = (turkish && ex.keywords_tr?.length ? ex.keywords_tr : ex.keywords) ?? []
  const folded = fold(text)
  const matched = keywords.filter((k) => folded.includes(fold(k)))
  const model = modelAnswerOf(ex, lang)

  const submit = () => {
    if (words < minWords) return
    setSent(true)
  }
  const retry = () => {
    setText('')
    setSent(false)
    setRounds((r) => r + 1)
  }
  const finish = (ok: boolean) =>
    onDone({ tries: rounds, hints: 0, revealed: false, correct: ok, clean: ok && keywords.length > 0 && matched.length >= Math.ceil(keywords.length / 2) && rounds === 0 })

  return (
    <div className="step-body">
      <Prompt ex={ex} />
      <label className="explain">
        <span className="sr-only">{t('exp.yours')}</span>
        <textarea name="aciklama" rows={5} value={text} disabled={sent} onChange={(e) => setText(e.target.value)} placeholder={t('exp.ph')} onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
        }} />
      </label>
      {!sent ? (
        <div className="step-actions">
          <button type="button" className="btn btn-chev" disabled={words < minWords} onClick={submit}>
            {t('exp.send')}
          </button>
          <span className="step-note">{words < minWords ? t('exp.min', { min: minWords, n: words }) : t('exp.ready')}</span>
        </div>
      ) : (
        <div className={`feedback ${matched.length > 0 ? 'is-ok' : 'is-bad'}`} role="status">
          <p className="model-h"><strong>{t('exp.model')}</strong></p>
          <p translate="no" lang={lang === 'tr' && ex.model_answer_tr ? 'tr' : 'en'}>{model}</p>
          {keywords.length > 0 && (
            <>
              <p className="model-h"><strong>{t('exp.found')}</strong> <span className="step-note">{t('exp.auto')}</span></p>
              <div className="kw">
                {keywords.map((k) => (
                  <span key={k} className={`kw-chip${matched.includes(k) ? ' is-on' : ''}`} translate="no">
                    {k}
                  </span>
                ))}
              </div>
            </>
          )}
          {matched.length === 0 && <p>{t('exp.none')}</p>}
          <div className="step-actions">
            {matched.length > 0 ? (
              <button type="button" className="btn btn-chev" autoFocus onClick={() => finish(true)}>
                {t('exp.ok')}
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-chev" autoFocus onClick={retry}>
                  {t('exp.rewrite')}
                </button>
                {rounds >= 1 && (
                  <button type="button" className="btn btn-quiet" onClick={() => finish(false)}>
                    {t('exp.skip')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
