import { useEffect, useRef, useState } from 'react'
import { localize } from '../lib/errors'
import { t, useLang } from '../lib/i18n'
import { runner, useRunnerPhase } from '../lib/runner'
import { PyBoot } from './PyBoot'
import { tokens } from './PyView'

interface Entry {
  out: { stream: 'out' | 'err'; text: string }[]
  repr?: string
  error?: string
}

/** A small program in the shape of the first lessons: a variable, a print, an operator. */
const START = 'days = 30\ndone = 0\nprint("Python", days)\nprint(days - done, "left")'

/**
 * The live thing and the hero: a real Python editor (Pyodide) pre-filled with a program from the first lessons.
 * A plain textarea sits over a highlighted copy of its own text, so the home page never loads CodeMirror.
 */
export function LivePrompt() {
  useLang()
  const [src, setSrc] = useState(START)
  const [res, setRes] = useState<Entry | null>(null)
  const [busy, setBusy] = useState(false)
  const { phase } = useRunnerPhase()
  const area = useRef<HTMLTextAreaElement>(null)

  const run = async () => {
    const code = src.trim()
    if (!code || busy) return
    setBusy(true)
    const r = await runner.run('home', code, [])
    setBusy(false)
    if (r.stopped) return
    setRes({ out: r.out, repr: r.repr, error: r.error })
  }

  // the editor grows with its text: the highlighted copy under it decides the height
  useEffect(() => {
    if (area.current) area.current.scrollTop = 0
  }, [src])

  const lines = src.split('\n')
  const hasOut = !!res && (res.out.length > 0 || res.repr !== undefined || !!res.error)
  return (
    <form
      className="repl"
      data-ui
      onSubmit={(e) => {
        e.preventDefault()
        void run()
      }}
      aria-label={t('home.liveAria')}
    >
      <div className="repl-bar">
        <p className="repl-title">{t('home.consoleTitle')}</p>
        <p className="repl-keys">{t('home.consoleKeys')}</p>
      </div>
      <div className="repl-edit">
        <ol className="repl-nums" aria-hidden="true">
          {lines.map((_, i) => (
            <li key={i} />
          ))}
        </ol>
        <div className="repl-stack">
          <pre className="repl-hl" aria-hidden="true" translate="no">
            {lines.map((l, i) => (
              <span key={i} className="repl-line">
                {l.length ? tokens(l) : ' '}
                {'\n'}
              </span>
            ))}
          </pre>
          <textarea
            ref={area}
            className="repl-input"
            name="python-komutu"
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            onFocus={() => runner.warm()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                void run()
              }
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            rows={lines.length}
            aria-label={t('home.cmdAria')}
          />
        </div>
      </div>
      <div className="repl-actions">
        <button type="submit" className="btn btn-chev btn-lg repl-run" disabled={busy}>
          {busy ? t('common.running') : t('home.run')}
        </button>
        <p className="repl-hint">{t('home.consoleHint')}</p>
      </div>
      <div className="repl-log" role="log" aria-live="polite" aria-label={t('home.logAria')}>
        <p className="repl-log-h">{t('home.consoleOut')}</p>
        <PyBoot />
        {!hasOut && phase !== 'loading' && <p className="repl-note">{t('home.consoleEmpty')}</p>}
        {res?.out.map((o, j) => (
          <p key={j} className={o.stream === 'err' ? 'repl-err' : 'repl-out'}>
            {o.text.replace(/\n$/, '')}
          </p>
        ))}
        {res?.repr !== undefined && <p className="repl-out">{res.repr}</p>}
        {res?.error && <p className="repl-err">{res.error.startsWith('@@') ? localize(res.error).trim() : localize(res.error).trim().split('\n').slice(-1)[0]}</p>}
      </div>
    </form>
  )
}
