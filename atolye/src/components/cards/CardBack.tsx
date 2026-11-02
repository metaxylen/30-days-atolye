import { useMemo } from 'react'
import { t, useLang } from '../../lib/i18n'
import { fullHref } from '../../lib/route'
import type { Back, Frag } from '../../lib/original'
import type { Resource, Term } from '../../lib/side'
import { CodeView } from '../PyView'
import { ResourceList, TermList } from './Rails'

/** The back's content: the plan for this card, read against the day's pieces of the original lesson. */
export interface BackState {
  /** undefined: still loading; null: the lesson could not be read */
  frags: Frag[] | null | undefined
  back: Back | undefined
}

/** Original pieces in order: Python cells as the app's own code view, everything else as the lesson's HTML. */
function Original({ frags, ids }: { frags: Frag[]; ids: number[] }) {
  const chunks = useMemo(() => {
    const out: ({ html: string } | { code: string })[] = []
    for (const id of ids) {
      const f = frags[id]
      if (f.kind === 'code' && f.code !== undefined) out.push({ code: f.code })
      else {
        const last = out[out.length - 1]
        if (last && 'html' in last) last.html += f.html
        else out.push({ html: f.html })
      }
    }
    return out
  }, [frags, ids])
  return (
    <div className="md orig-body" lang="en">
      {chunks.map((c, i) =>
        'code' in c ? (
          <CodeView key={i} value={c.code} label="Python" />
        ) : (
          // The lesson HTML is trusted: it is rendered from the course repository's own Markdown (see Reader).
          <div key={i} className="orig-chunk" dangerouslySetInnerHTML={{ __html: c.html }} />
        ),
      )}
    </div>
  )
}

interface Props {
  day: number
  state: BackState
  /** the glossary entries and resources that belong to this card (shown when no original text is left for it) */
  terms: Term[]
  resources: Resource[]
  canTry: boolean
  onTry: (code: string) => void
  onJump: (card: number) => void
}

/** What sits on the back of a card (inside the face; the face itself and its header are drawn by Cards). */
export function CardBackBody({ day, state, terms, resources, canTry, onTry, onJump }: Props) {
  const lang = useLang()
  const { frags, back } = state
  if (frags === undefined) {
    return (
      <p className="orig-wait" role="status">
        {t('orig.wait')}
      </p>
    )
  }
  return (
    <>
      {frags && back?.kind === 'frags' ? (
        <Original frags={frags} ids={back.ids} />
      ) : (
        <div className="back-notes">
          <p className="back-owner">
            {back?.kind === 'notes' && back.owner !== null ? (
              <>
                {t('flip.owner', { n: back.owner + 1 })}{' '}
                <button type="button" className="btn btn-quiet" onClick={() => onJump(back.owner as number)}>
                  {t('flip.goto', { n: back.owner + 1 })}
                </button>
              </>
            ) : back?.kind === 'notes' && back.empty ? (
              t('flip.empty')
            ) : (
              t('flip.none')
            )}
          </p>
          {terms.length ? <TermList list={terms} canTry={canTry} onTry={onTry} lang={lang} /> : null}
          {resources.length ? <ResourceList list={resources} lang={lang} /> : null}
        </div>
      )}
      <p className="back-full">
        <a href={fullHref(day)}>{t('flip.full')}</a>
      </p>
    </>
  )
}
