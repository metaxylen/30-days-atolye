import { useState } from 'react'
import { t, useLang } from '../../lib/i18n'
import type { ParsedLesson } from '../../lib/lesson'

const norm = (s: string): string => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const isHeading = (el: Element): boolean => /^H[1-6]$/.test(el.tagName)

/**
 * The part of the English lesson under one heading: from that heading to the next one of the same or a higher level.
 * The rendered lesson keeps code as empty cell slots, so each slot is swapped back for its source code.
 */
export function extractSection(parsed: ParsedLesson, section: string): string | null {
  const want = norm(section)
  if (!want) return null
  const doc = new DOMParser().parseFromString(`<div id="r">${parsed.html}</div>`, 'text/html')
  const kids = Array.from(doc.getElementById('r')?.children ?? [])
  const text = (el: Element) => norm(el.textContent ?? '')
  let at = kids.findIndex((el) => isHeading(el) && text(el) === want)
  if (at < 0) at = kids.findIndex((el) => isHeading(el) && text(el).length > 2 && (text(el).includes(want) || want.includes(text(el))))
  if (at < 0) return null
  const level = Number(kids[at].tagName[1])
  const wrap = doc.createElement('div')
  wrap.appendChild(kids[at].cloneNode(true))
  for (let j = at + 1; j < kids.length; j++) {
    if (isHeading(kids[j]) && Number(kids[j].tagName[1]) <= level) break
    wrap.appendChild(kids[j].cloneNode(true))
  }
  wrap.querySelectorAll('.cell-slot').forEach((slot) => {
    const cell = parsed.cells.find((c) => c.id === slot.getAttribute('data-cell'))
    if (cell && cell.kind === 'code') {
      const pre = doc.createElement('pre')
      pre.setAttribute('translate', 'no')
      const code = doc.createElement('code')
      code.textContent = cell.code
      pre.appendChild(code)
      slot.replaceWith(pre)
    } else slot.remove()
  })
  return wrap.innerHTML
}

/** "Orijinal metin": collapsed on every card; opening it loads the lesson and shows the English section the card is about. */
export function Original({ day, sections }: { day: number; sections: string[] }) {
  useLang()
  const [html, setHtml] = useState<string | null | undefined>(undefined)

  const onToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.open || html !== undefined) return
    import('../../lib/lesson')
      .then((m) => m.loadLesson(day))
      .then((p) => {
        const parts = sections.map((s) => extractSection(p, s)).filter((h): h is string => !!h)
        setHtml(parts.length ? parts.join('') : null)
      })
      .catch(() => setHtml(null))
  }

  return (
    <details className="orig" onToggle={onToggle}>
      <summary>{t('orig.summary')}</summary>
      {html === undefined ? (
        <p className="orig-wait" role="status">{t('orig.wait')}</p>
      ) : html === null ? (
        <p className="orig-wait">{t('orig.none')}</p>
      ) : (
        // The lesson HTML is trusted: it is rendered from the course repository's own Markdown (see Reader).
        <div className="md orig-body" lang="en" dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </details>
  )
}
