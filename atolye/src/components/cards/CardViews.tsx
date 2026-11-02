import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { answerIndex, cardPrompt, cardTitle, cardWhy, pickList, pickText, sameAnswer, truthOf, type ExplainCard, type FillCard, type OrderCard, type PredictCard, type RecapCard, type TrueFalseCard } from '../../lib/cards'
import { cardHtml, esc, inlineHtml } from '../../lib/cardmd'
import { localize } from '../../lib/errors'
import { t, useLang } from '../../lib/i18n'
import { reducedMotion } from '../../lib/ui'
import type { Exercise } from '../../lib/exercises'
import { answerBad } from '../../lib/juice'
import { runner, useRunnerPhase, type CheckResult } from '../../lib/runner'
import type { CardRes } from '../../lib/store'
import { Chev } from '../bits'
import { Parsons } from '../learn/Parsons'
import { OutBox, useChoiceKeys } from '../learn/shared'
import { CodeView, LazyEditor, tokens } from '../PyView'
import { fullHref } from '../../lib/route'

/** A line of card text with `code` and **bold** rendered; `note` is the small "only in the other language" marker. */
function Inline({ text, note }: { text: string; note?: string }) {
  return (
    <>
      <span dangerouslySetInnerHTML={{ __html: inlineHtml(text) }} />
      {note ? <small className="lang-miss"> {note}</small> : null}
    </>
  )
}

const Tracer = lazy(() => import('./Tracer').then((m) => ({ default: m.Tracer })))

/** A checkpoint reports once it is finished: right (`clean` when on the first try) or answered wrong and then shown. */
export interface Outcome {
  ok: boolean
  clean: boolean
}

interface CheckProps<T> {
  card: T
  onDone: (o: Outcome) => void
  /** the card was answered before: no XP again, the answer can still be tried */
  prior?: CardRes
  face: React.RefObject<HTMLElement | null>
}

/** Lenient comparison for guesses: only the words and numbers matter, not the line breaks between them. */
const words = (s: string): string => s.trim().split(/\s+/).join(' ')

// ---- explain ------------------------------------------------------------------------------------------------------------

function ExplainCode({ card, day }: { card: ExplainCard; day: number }) {
  useLang()
  const code = card.code ?? ''
  const [src, setSrc] = useState(code)
  const [guess, setGuess] = useState('')
  const [locked, setLocked] = useState(false)
  const [nudge, setNudge] = useState(false)
  const [res, setRes] = useState<CheckResult | null>(null)
  const [first, setFirst] = useState<boolean | null>(null)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState<'run' | 'trace'>(card.trace && !card.hide_output ? 'trace' : 'run')
  const [traceSrc, setTraceSrc] = useState(src)
  const runBtn = useRef<HTMLButtonElement>(null)
  const guessBox = useRef<HTMLTextAreaElement>(null)
  const { phase, status } = useRunnerPhase()
  const edited = src !== code
  const hidden = !!card.hide_output && !locked
  const busy = useRef(false)
  const srcRef = useRef(src)
  srcRef.current = src
  const guessRef = useRef(guess)
  guessRef.current = guess
  const lockedRef = useRef(locked)
  lockedRef.current = locked

  /** One action: with a hidden output this is "Check" (it locks the guess, runs the code and compares); otherwise a plain run. */
  const run = async () => {
    if (busy.current) return
    if (card.hide_output && !lockedRef.current && !guessRef.current.trim()) {
      setNudge(true)
      guessBox.current?.focus()
      return
    }
    busy.current = true
    setRunning(true)
    const r = await runner.check(srcRef.current, [])
    busy.current = false
    setRunning(false)
    if (r.timeout) return
    setRes(r)
    if (card.hide_output && !lockedRef.current) {
      setLocked(true)
      setNudge(false)
      setFirst(!r.error && words(r.stdout) === words(guessRef.current))
    }
  }

  const wait = running && phase !== 'ready' ? localize(status || '@@prepare') : ''

  return (
    <div className="ccode" data-day={day}>
      {mode === 'trace' ? (
        <>
          <Suspense fallback={<div className="trace is-wait" role="status"><p>{t('trace.wait')}</p></div>}>
            <Tracer code={traceSrc} />
          </Suspense>
          <div className="ccode-bar">
            <button type="button" className="btn btn-quiet" onClick={() => setMode('run')}>
              {t('cv.editRun')}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="cell cell-code ccode-cell" translate="no">
            <div className="cell-editor">
              <LazyEditor value={src} label={t('cv.codeAria')} onChange={setSrc} onRun={run} onEscape={() => runBtn.current?.focus()} lines />
            </div>
            <div className="cell-bar">
              <button ref={runBtn} type="button" className="btn btn-chev" onClick={run} disabled={running}>
                {running ? t('common.running') : hidden ? t('pred.check') : t('home.run')}
              </button>
              <button
                type="button"
                className="btn btn-quiet"
                disabled={hidden}
                title={hidden ? t('cv.guessFirst') : undefined}
                onClick={() => {
                  setTraceSrc(srcRef.current)
                  setMode('trace')
                }}
              >
                {t('cv.stepBtn')}
              </button>
              {edited && !running && (
                <button type="button" className="btn btn-quiet" onClick={() => setSrc(code)}>
                  {t('cell.reset')}
                </button>
              )}
              <span className="cell-hint" aria-hidden="true">
                Shift+Enter
              </span>
              {wait && <span className="cell-status">{wait}</span>}
            </div>
          </div>

          {hidden && (
            <div className="guess">
              <label className="guess-l" htmlFor={`g-${card.id}`}>
                {t('cv.guessL')}
              </label>
              <textarea
                id={`g-${card.id}`}
                ref={guessBox}
                name="tahmin"
                className="guess-in"
                rows={2}
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder={t('cv.guessPh')}
                spellCheck={false}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.shiftKey || e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    void run()
                  }
                }}
              />
              {nudge && (
                <p className="guess-nudge" role="alert">
                  {t('cv.guessNudge')}
                </p>
              )}
            </div>
          )}

          {res && !hidden && (
            <div className={`ccode-out${card.hide_output ? ' is-pair' : ''}`}>
              {card.hide_output && (
                <div className="guess-card">
                  <p className="compare-h">{t('pred.yours')}</p>
                  <pre translate="no" className={first ? 'is-ok' : 'is-bad'}>{guess}</pre>
                  <p className={`match${first ? ' is-ok' : ' is-bad'}`} role="status">
                    <Chev state={first ? 'done' : 'new'} />
                    {first ? t('cv.hit') : t('cv.miss')}
                  </p>
                </div>
              )}
              <div>
                {card.hide_output && <p className="compare-h">{t('pred.actual')}</p>}
                <OutBox stdout={res.stdout} error={res.error} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function ExplainView({ card, day }: { card: ExplainCard; day: number }) {
  const lang = useLang()
  const body = pickText(lang, card.body_tr, card.body)
  const title = cardTitle(card, lang)
  const html = useMemo(() => cardHtml(body.text) + (body.note ? `<p class="lang-miss">${esc(body.note)}</p>` : ''), [body.text, body.note])
  return (
    <div className="cbody">
      {title.text && (
        <h2 className="ctitle">
          <Inline text={title.text} note={title.note} />
        </h2>
      )}
      <div className="md cmd" dangerouslySetInnerHTML={{ __html: html }} />
      {card.code !== undefined && card.code !== '' && <ExplainCode card={card} day={day} />}
    </div>
  )
}

// ---- checkpoints --------------------------------------------------------------------------------------------------------

function Why({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const el = useRef<HTMLDivElement>(null)
  // the explanation may land below the fold of a tall card: bring it into view
  useEffect(() => {
    el.current?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' })
  }, [])
  return (
    <div ref={el} className={`feedback ${ok ? 'is-ok' : 'is-bad'}`} role="status">
      {children}
    </div>
  )
}

/** Pick a choice (click or keys 1-4), then one button: Check. The pick is locked and the answer shown in the same step. */
export function PredictView({ card, onDone, face }: CheckProps<PredictCard>) {
  const lang = useLang()
  const [sel, setSel] = useState<number | null>(null)
  const [pick, setPick] = useState<number | null>(null)
  const right = answerIndex(card)
  const ok = pick !== null && pick === right
  const prompt = cardPrompt(card, lang, t('cv.predictDefault'))
  const why = cardWhy(card, lang)
  const open = pick === null

  const check = () => {
    if (sel === null || pick !== null) return
    setPick(sel)
    if (sel === right) onDone({ ok: true, clean: true })
    else {
      answerBad(undefined, { card: face.current })
      onDone({ ok: false, clean: false })
    }
  }
  useChoiceKeys({ count: card.choices.length, enabled: open, onPick: (i) => setSel(i), onEnter: check })

  return (
    <div className="cbody">
      <h2 className="ctitle">
        <Inline text={prompt.text} note={prompt.note} />
      </h2>
      <CodeView value={card.code} label={t('pred.codeLabel')} lines />
      <div className="cchoices" role="group" aria-label={t('pred.choices')}>
        {card.choices.map((c, i) => (
          <button
            key={i}
            type="button"
            className={`cchoice${pick === null ? (sel === i ? ' is-picked' : '') : pick === i ? (i === right ? ' is-right' : ' is-wrong') : i === right ? ' is-right' : ''}`}
            disabled={!open}
            onClick={() => setSel(i)}
            aria-pressed={(open ? sel : pick) === i}
          >
            <pre translate="no">{c}</pre>
          </button>
        ))}
      </div>
      {open && (
        <div className="step-actions">
          <button type="button" className="btn btn-chev" disabled={sel === null} onClick={check}>
            {t('pred.check')}
          </button>
          <span className="step-note">{t('pred.noteChoices')}</span>
        </div>
      )}
      {pick !== null && (
        <Why ok={ok}>
          <p>
            <strong>{ok ? t('cv.right') : t('cv.wrong')}</strong> <Inline text={why.text} note={why.note} />
          </p>
        </Why>
      )}
    </div>
  )
}

export function FillView({ card, onDone, face }: CheckProps<FillCard>) {
  const lang = useLang()
  const [val, setVal] = useState('')
  const [state, setState] = useState<'open' | 'ok' | 'shown'>('open')
  const [miss, setMiss] = useState(0)
  const parts = card.code.split('___')
  const width = Math.max(4, ...card.answers.map((a) => a.length + 1))
  const shownVal = state === 'shown' ? card.answers[0] ?? '' : val
  const prompt = cardPrompt(card, lang, t('cv.fillDefault'))
  const why = cardWhy(card, lang)

  const check = () => {
    if (state !== 'open' || !val.trim()) return
    if (sameAnswer(val, card.answers)) {
      setState('ok')
      onDone({ ok: true, clean: miss === 0 })
    } else {
      setMiss((m) => m + 1)
      answerBad(undefined, { card: face.current })
    }
  }
  const reveal = () => {
    setState('shown')
    onDone({ ok: false, clean: false })
  }

  // the blank sits inside the code: lines before it, the line with it, lines after it
  const head = parts[0].split('\n')
  const tail = (parts[1] ?? '').split('\n')
  const before = head.slice(0, -1)
  const lineA = head[head.length - 1]
  const lineB = tail[0]
  const after = tail.slice(1)

  return (
    <div className="cbody">
      <h2 className="ctitle">
        <Inline text={prompt.text} note={prompt.note} />
      </h2>
      <pre className="pyview has-lines ccode-fill" translate="no">
        <code>
          {before.map((l, i) => (
            <span key={`b${i}`} className="pv-line">
              {l ? tokens(l) : ' '}
              {'\n'}
            </span>
          ))}
          <span className="pv-line">
            {tokens(lineA)}
            <input
              className={`fill-input${state === 'ok' ? ' is-ok' : ''}`}
              name="bosluk"
              aria-label={t('cv.blank')}
              style={{ width: `${width}ch` }}
              value={shownVal}
              readOnly={state !== 'open'}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  check()
                }
              }}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
            {tokens(lineB)}
            {'\n'}
          </span>
          {after.map((l, i) => (
            <span key={`a${i}`} className="pv-line">
              {l ? tokens(l) : ' '}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
      {state === 'open' && (
        <div className="step-actions">
          <button type="button" className="btn btn-chev" onClick={check} disabled={!val.trim()}>
            {t('pred.check')}
          </button>
          {miss > 0 && (
            <button type="button" className="btn btn-quiet" onClick={reveal}>
              {t('pred.showAnswer')}
            </button>
          )}
        </div>
      )}
      {miss > 0 && state === 'open' && (
        <Why ok={false}>
          <p>
            <strong>{t('cv.notYet')}</strong> <Inline text={why.text} note={why.note} />
          </p>
        </Why>
      )}
      {state !== 'open' && (
        <>
          {card.expected_output !== undefined && (
            <div className="step-out" translate="no" aria-label={t('out.label')}>
              <pre className="out-std">{card.expected_output}</pre>
            </div>
          )}
          <Why ok={state === 'ok'}>
            <p>
              <strong>{state === 'ok' ? t('cv.right') : t('cv.answer')}</strong> {state === 'shown' && <code translate="no">{card.answers[0]}</code>} <Inline text={why.text} note={why.note} />
            </p>
          </Why>
        </>
      )}
    </div>
  )
}

export function TrueFalseView({ card, onDone, face }: CheckProps<TrueFalseCard>) {
  const lang = useLang()
  const [pick, setPick] = useState<boolean | null>(null)
  const truth = truthOf(card)
  const ok = pick === truth
  const statement = pickText(lang, card.statement_tr, card.statement)
  const why = cardWhy(card, lang)
  const choose = (v: boolean) => {
    if (pick !== null) return
    setPick(v)
    if (v === truth) onDone({ ok: true, clean: true })
    else {
      answerBad(undefined, { card: face.current })
      onDone({ ok: false, clean: false })
    }
  }
  return (
    <div className="cbody">
      <blockquote className="cstatement">
        <Inline text={statement.text} note={statement.note} />
      </blockquote>
      <div className="ctf" role="group" aria-label={t('cv.tfAria')}>
        {[true, false].map((v) => (
          <button key={String(v)} type="button" className={`cchoice ctf-btn${pick === v ? (v === truth ? ' is-right' : ' is-wrong') : pick !== null && v === truth ? ' is-right' : ''}`} disabled={pick !== null} onClick={() => choose(v)} aria-pressed={pick === v}>
            {v ? t('cv.true') : t('cv.false')}
          </button>
        ))}
      </div>
      {pick !== null && (
        <Why ok={ok}>
          <p>
            <strong>{ok ? t('cv.right') : t('cv.wrong')}</strong> <Inline text={why.text} note={why.note} />
          </p>
        </Why>
      )}
    </div>
  )
}

export function OrderView({ card, onDone }: CheckProps<OrderCard>) {
  const lang = useLang()
  const [finished, setFinished] = useState(false)
  const picked = cardPrompt(card, lang, t('cv.orderDefault'))
  const prompt = picked.text
  // the existing Parsons board takes an exercise-shaped object; the lines keep their own indentation
  const ex = useMemo<Exercise>(
    () => ({ id: card.id, type: 'parsons', prompt, prompt_tr: prompt, lines: card.lines, correct_order: card.correct_order, distractors: card.distractors, expected_output: card.expected_output }),
    [card, prompt],
  )
  return (
    <div className="cbody">
      <h2 className="ctitle">
        <Inline text={prompt} note={picked.note} />
      </h2>
      {card.expected_output !== undefined && (
        <div className="order-want">
          <p className="compare-h">{t('cv.orderWant')}</p>
          <div className="step-out" translate="no">
            <pre className="out-std">{card.expected_output}</pre>
          </div>
        </div>
      )}
      <Parsons
        ex={ex}
        mode="learn"
        onDone={(r) => {
          setFinished(true)
          onDone({ ok: true, clean: r.clean })
        }}
      />
      {finished && (
        <Why ok>
          <p>
            <strong>{t('cv.orderRight')}</strong>
          </p>
        </Why>
      )}
    </div>
  )
}

// ---- recap --------------------------------------------------------------------------------------------------------------

export function RecapView({ card, day, results }: { card: RecapCard; day: number; results: { id: string; res?: CardRes }[] }) {
  const lang = useLang()
  const total = results.length
  const ok = results.filter((r) => r.res?.r === 'ok').length
  const bad = results.filter((r) => r.res?.r === 'bad').length
  const skip = results.filter((r) => r.res?.r === 'skip').length
  const title = pickText(lang, card.title_tr, card.title, t('recap.title'))
  const points = pickList(lang, card.points_tr, card.points)
  return (
    <div className="cbody">
      <h2 className="ctitle">
        <Inline text={title.text} note={title.note} />
      </h2>
      <ul className="recap-points">
        {points.text.map((p, i) => (
          <li key={i}>
            <Chev state="done" />
            <Inline text={p} note={i === points.text.length - 1 ? points.note : ''} />
          </li>
        ))}
      </ul>
      {total > 0 && (
        <div className="recap-score" aria-label={t('recap.aria')}>
          <ol className="recap-dots" aria-hidden="true">
            {results.map((r) => (
              <li key={r.id} className={r.res ? `is-${r.res.r}` : ''} />
            ))}
          </ol>
          <p>
            <strong className="num">
              {ok} / {total}
            </strong>{' '}
            {t('recap.first')}
            {bad > 0 && t('recap.bad', { n: bad })}
            {skip > 0 && t('recap.skip', { n: skip })}.
          </p>
        </div>
      )}
      <p className="recap-next">
        {t('recap.next')}{' '}
        <a className="recap-full" href={fullHref(day)}>
          {t('recap.full')}
        </a>
      </p>
    </div>
  )
}
