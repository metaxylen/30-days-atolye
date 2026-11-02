import { useState } from 'react'
import { notesOf, type WorkedExample } from '../../lib/exercises'
import { t } from '../../lib/i18n'
import { runner } from '../../lib/runner'
import { CodeView } from '../PyView'
import { OutBox, useLang } from './shared'

/** The one place complete code is shown. Short, annotated, and no copy button. */
export function Worked({ worked, onDone }: { worked: WorkedExample; onDone: () => void }) {
  const lang = useLang()
  const [out, setOut] = useState<{ stdout: string; error: string | null } | null>(null)
  const [running, setRunning] = useState(false)
  const run = async () => {
    setRunning(true)
    const r = await runner.check(worked.code, [])
    setRunning(false)
    if (!r.timeout) setOut({ stdout: r.stdout, error: r.error })
  }
  return (
    <div className="step-body">
      <p className="step-prompt">{t('worked.lead')}</p>
      <CodeView value={worked.code} label={t('worked.code')} lines />
      <ul className="notes" aria-label={t('worked.notes')}>
        {notesOf(worked, lang).map((n, i) => (
          <li key={i}>
            <span className="chev chev-progress" aria-hidden="true" />
            <span>{n}</span>
          </li>
        ))}
      </ul>
      <div className="step-actions">
        <button type="button" className="btn btn-quiet" onClick={run} disabled={running}>
          {running ? t('common.running') : t('worked.seeOut')}
        </button>
        <button type="button" className="btn btn-chev" onClick={onDone} autoFocus>
          {t('worked.got')}
        </button>
      </div>
      {out && <OutBox stdout={out.stdout} error={out.error} />}
    </div>
  )
}
