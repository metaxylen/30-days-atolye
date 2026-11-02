/**
 * The original English lesson, cut into pieces for the back of the cards. A card shows the part of the lesson it is about;
 * a day's backs together never show the same piece twice (see planBacks).
 */

import type { Card } from './cards'
import type { ParsedLesson } from './lesson'

export interface Frag {
  /** position in the document, also the identity used to keep a piece from showing twice */
  id: number
  kind: 'heading' | 'text' | 'code'
  level: number
  /** the piece as HTML (empty for a runnable Python cell: `code` holds its source instead) */
  html: string
  text: string
  code?: string
}

export const norm = (s: string): string => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

const HEADING = /^H[1-6]$/
const CONTAINER = /^(DIV|SECTION|DETAILS|CENTER|BLOCKQUOTE)$/

const cache = new WeakMap<ParsedLesson, Frag[]>()

/**
 * The rendered lesson as a flat list of pieces in document order. The lesson keeps Python code as empty cell slots, so each
 * slot is swapped back for its source; pieces nested in raw HTML wrappers (the Day 1 readme has some) are lifted out.
 */
export function fragmentsOf(parsed: ParsedLesson): Frag[] {
  const hit = cache.get(parsed)
  if (hit) return hit
  const doc = new DOMParser().parseFromString(`<div id="r">${parsed.html}</div>`, 'text/html')
  const root = doc.getElementById('r')
  const out: Frag[] = []
  const walk = (el: Element) => {
    for (const k of Array.from(el.children)) {
      const text = (k.textContent ?? '').replace(/\s+/g, ' ').trim()
      if (k.classList.contains('cell-slot')) {
        const cell = parsed.cells.find((c) => c.id === k.getAttribute('data-cell'))
        if (cell && cell.kind === 'code') out.push({ id: out.length, kind: 'code', level: 0, html: '', text: cell.code, code: cell.code })
      } else if (HEADING.test(k.tagName)) {
        k.removeAttribute('id')
        out.push({ id: out.length, kind: 'heading', level: Number(k.tagName[1]), html: k.outerHTML, text })
      } else if (CONTAINER.test(k.tagName) && k.querySelector('h1,h2,h3,h4,h5,h6,.cell-slot')) {
        walk(k)
      } else if (k.tagName === 'HR' || (!text && !k.querySelector('img'))) {
        continue
      } else {
        k.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'))
        out.push({ id: out.length, kind: k.tagName === 'PRE' ? 'code' : 'text', level: 0, html: k.outerHTML, text })
      }
    }
  }
  if (root) walk(root)
  cache.set(parsed, out)
  return out
}

/** The heading a section name points to: an exact match, else a heading that contains it (or is contained by it). */
function headingOf(frags: Frag[], section: string): number {
  const want = norm(section)
  if (!want) return -1
  const heads = frags.filter((f) => f.kind === 'heading')
  const exact = heads.find((f) => norm(f.text) === want)
  if (exact) return exact.id
  const loose = heads.find((f) => norm(f.text).length > 2 && (norm(f.text).includes(want) || want.includes(norm(f.text))))
  return loose ? loose.id : -1
}

/**
 * The pieces of one section: from its heading to the next heading of the same or a higher level. A deeper heading that is
 * itself a section of another card of the day also ends it, so a parent section does not swallow its children.
 */
export function sectionIds(frags: Frag[], section: string, others: Set<string>): number[] {
  const at = headingOf(frags, section)
  if (at < 0) return []
  const level = frags[at].level
  const own = norm(frags[at].text)
  const ids = [at]
  for (let j = at + 1; j < frags.length; j++) {
    const f = frags[j]
    if (f.kind === 'heading' && (f.level <= level || (others.has(norm(f.text)) && norm(f.text) !== own))) break
    ids.push(j)
  }
  return ids
}

export type Back =
  /** original pieces; `owner` is the card that first showed this section (this card itself when `own`) */
  | { kind: 'frags'; ids: number[]; owner: number; own: boolean }
  /** nothing of the original is left for this card: a notes face, pointing at `owner` (null: the section was not found) */
  | { kind: 'notes'; owner: number | null; /** the section exists but has no text of its own: its sub-sections are on the cards that follow */ empty?: boolean }

export const cardSections = (c: Card): string[] => [c.section, ...(c.type === 'explain' ? (c.also_sections ?? []) : [])].filter(Boolean)

const cardCode = (c: Card): string => ('code' in c && typeof c.code === 'string' ? c.code : 'lines' in c ? c.lines.join('\n') : '')

const TRIVIAL = /^(print\(\)|pass|else:|try:|\)|\]|\}|break|continue)$/
const nonTrivialLines = (code: string): string[] => code.split('\n').map((l) => l.trim()).filter((l) => l.length >= 5 && !l.startsWith('#') && !TRIVIAL.test(l))

const STOP = new Set(['python', 'example', 'examples', 'which', 'about', 'these', 'their', 'there', 'where', 'values', 'value', 'using', 'works', 'other', 'again'])

/** What a card is about, in the lesson's own (English) words: inline `code` terms from its text and the long words of its title. */
function keyTerms(c: Card): { code: string[]; words: string[] } {
  const src = [('body' in c ? c.body : '') ?? '', 'statement' in c ? (c.statement ?? '') : '', 'why' in c ? (c.why ?? '') : '', 'prompt' in c ? (c.prompt ?? '') : ''].join('\n')
  const code = [...src.matchAll(/`([^`\n]{2,40})`/g)].map((m) => m[1].trim().toLowerCase()).filter((x) => (/[a-z]/.test(x) ? x.length >= 3 : true))
  const words = (c.title ?? '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !STOP.has(w))
  return { code: [...new Set(code)], words: [...new Set(words)] }
}

/** How strongly a piece of the original belongs to a card: 0 when it does not. Shared code counts most, then the card's own terms. */
function affinity(f: Frag, lines: string[], terms: { code: string[]; words: string[] }): number {
  if (f.kind === 'heading') return 0
  let score = 0
  if (f.kind === 'code') {
    const have = new Set(nonTrivialLines(f.text))
    const shared = lines.filter((l) => have.has(l)).length
    if (shared >= 2 || (lines.length <= 2 && shared >= 1)) score += 3 * shared
  }
  const low = f.text.toLowerCase()
  const hits = terms.code.filter((x) => low.includes(x)).length
  score += hits
  if (terms.words.filter((w) => low.includes(w)).length >= 2) score += 1
  return score
}

/**
 * Decides what every card of a day shows on its back. A section belongs to the first card that names it: that card gets the
 * heading and the pieces nobody else needs. A later card of the same section gets the pieces that match it best (shared
 * code, its own terms); when none do it shows notes that point at the card holding the section. A piece (or an identical
 * text) is handed out once per day, so no paragraph repeats across the backs.
 */
export function planBacks(frags: Frag[], cards: Card[]): Back[] {
  const others = new Set(cards.flatMap(cardSections).map(norm))
  const info = cards.map((c) => ({ lines: nonTrivialLines(cardCode(c)), terms: keyTerms(c) }))
  /** section (normalised) -> the cards that name it, in order */
  const sharing = new Map<string, number[]>()
  cards.forEach((c, i) =>
    cardSections(c).forEach((s) => {
      const k = norm(s)
      if (!sharing.get(k)?.includes(i)) sharing.set(k, [...(sharing.get(k) ?? []), i])
    }),
  )

  const assigned = cards.map(() => new Set<number>())
  const owned = new Map<string, { owner: number; ids: number[] }>()
  for (const [k, list] of sharing) {
    const first = cards.findIndex((c) => cardSections(c).some((s) => norm(s) === k))
    const name = cardSections(cards[first]).find((s) => norm(s) === k) ?? k
    const ids = sectionIds(frags, name, others)
    if (!ids.length) continue
    owned.set(k, { owner: list[0], ids })
    const body = ids.filter((id) => frags[id].kind !== 'heading')
    let kept = 0
    for (const id of ids) {
      let to = list[0]
      if (frags[id].kind !== 'heading') {
        let best = 0
        for (const j of list) {
          if (!hasAffinity(frags[id], info[j])) continue
          const sc = affinity(frags[id], info[j].lines, info[j].terms)
          if (sc > best) {
            best = sc
            to = j
          }
        }
        if (to === list[0]) kept++
      }
      assigned[to].add(id)
    }
    // the owner never ends up with a bare heading: it keeps the first piece of the section's text
    if (body.length && !kept) {
      assigned.forEach((a) => a.delete(body[0]))
      assigned[list[0]].add(body[0])
    }
  }

  const usedText = new Set<string>()
  const used = new Set<number>()
  return cards.map((card, i): Back => {
    const ids = [...assigned[i]].sort((a, b) => a - b).filter((id) => {
      const f = frags[id]
      if (used.has(id)) return false
      if (f.kind !== 'heading' && usedText.has(norm(f.text))) return false
      return true
    })
    ids.forEach((id) => {
      used.add(id)
      if (frags[id].kind !== 'heading') usedText.add(norm(frags[id].text))
    })
    if (ids.some((id) => frags[id].kind !== 'heading')) {
      const own = cardSections(card).some((s) => owned.get(norm(s))?.owner === i)
      return { kind: 'frags', ids, owner: i, own }
    }
    // nothing is left for this card: point at the card that holds its section
    let owner: number | null = null
    for (const s of cardSections(card)) {
      const o = owned.get(norm(s))?.owner
      if (o !== undefined && o !== i) {
        owner = o
        break
      }
    }
    const found = cardSections(card).some((s) => owned.get(norm(s))?.owner === i)
    return { kind: 'notes', owner, empty: owner === null && found }
  })
}

const hasAffinity = (f: Frag, i: { lines: string[]; terms: { code: string[]; words: string[] } }): boolean => affinity(f, i.lines, i.terms) > 0
