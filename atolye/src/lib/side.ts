/**
 * Data for the side columns next to a card: a glossary (public/glossary.json) and outside resources (public/resources.json).
 * Both files are written separately from the app and may be missing; a missing file simply hides its boxes.
 */

import type { Card } from './cards'
import { norm } from './original'

export interface Term {
  id: string
  day: number
  term: string
  term_tr?: string
  def: string
  def_tr?: string
  example?: string
  aliases?: string[]
  see?: string[]
}

export interface Resource {
  section?: string
  kind: 'docs' | 'article' | 'video' | 'interactive' | 'practice'
  title: string
  source: string
  url: string
  lang?: string
  minutes?: number
  why?: string
  why_tr?: string
}

async function fetchJson<T>(name: string): Promise<T | null> {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}${name}`)
    if (!r.ok) return null
    if ((r.headers.get('content-type') ?? '').includes('text/html')) return null // SPA fallbacks answer 200 with the page
    return (await r.json()) as T
  } catch {
    return null
  }
}

let glossary: Promise<Term[] | null> | null = null
let resources: Promise<Record<string, Resource[]> | null> | null = null

/** All glossary terms, or null when the file is missing or unusable. */
export function loadGlossary(): Promise<Term[] | null> {
  glossary ??= fetchJson<{ terms?: Term[] }>('glossary.json').then((d) => {
    const list = (d?.terms ?? []).filter((x) => x && typeof x.id === 'string' && typeof x.term === 'string' && typeof x.def === 'string' && Number.isFinite(x.day))
    return list.length ? list : null
  })
  return glossary
}

const KINDS = new Set(['docs', 'article', 'video', 'interactive', 'practice'])

/** Only plain web links are ever put in an href: a `javascript:` URL from a data file must never become a link. */
const safeUrl = (u: unknown): boolean => {
  if (typeof u !== 'string') return false
  try {
    const p = new URL(u)
    return p.protocol === 'https:' || p.protocol === 'http:'
  } catch {
    return false
  }
}

/** The outside resources of every day ("1".."30"), or null when the file is missing or unusable. */
export function loadResources(): Promise<Record<string, Resource[]> | null> {
  resources ??= fetchJson<{ days?: Record<string, Resource[]> }>('resources.json').then((d) => {
    if (!d?.days || typeof d.days !== 'object') return null
    const out: Record<string, Resource[]> = {}
    for (const [k, v] of Object.entries(d.days)) {
      if (Array.isArray(v)) out[k] = v.filter((r) => r && typeof r.title === 'string' && safeUrl(r.url) && KINDS.has(r.kind))
    }
    return out
  })
  return resources
}

/** Every text of a card in one string: what a term has to appear in to be shown next to it. */
export function cardText(c: Card): string {
  const parts: string[] = []
  const add = (v: unknown) => {
    if (typeof v === 'string') parts.push(v)
    else if (Array.isArray(v)) v.forEach(add)
  }
  for (const [k, v] of Object.entries(c)) if (k !== 'id' && k !== 'type' && k !== 'section' && k !== 'also_sections') add(v)
  return parts.join('\n')
}

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Words of the glossary are matched as whole words (letters, digits and `_` do not count as a boundary). */
const wordRe = (w: string): RegExp => new RegExp(`(?<![\\p{L}\\p{N}_])${esc(w)}(?![\\p{L}\\p{N}_])`, 'iu')

/** The terms a card uses: at most `max`, the ones introduced on this day first. */
export function termsFor(card: Card, terms: Term[], day: number, max = 4): Term[] {
  const text = cardText(card)
  const found = terms.filter((x) => [x.term, x.term_tr, ...(x.aliases ?? [])].filter((a): a is string => !!a && a.length > 0).some((a) => wordRe(a).test(text)))
  found.sort((a, b) => Number(b.day === day) - Number(a.day === day) || a.day - b.day)
  return found.slice(0, max)
}

/** The resources of a day, the ones for the current section first. */
export function resourcesFor(all: Record<string, Resource[]> | null, day: number, sections: string[]): Resource[] {
  const list = all?.[String(day)] ?? []
  const want = sections.map(norm).filter(Boolean)
  const here = (r: Resource): boolean => !!r.section && want.includes(norm(r.section))
  return [...list.filter(here), ...list.filter((r) => !here(r))]
}

/** What the "İpucu" box says for a checkpoint: a nudge by card type, never the answer. */
export const hintKey = (c: Card): 'side.hint.predict' | 'side.hint.fill' | 'side.hint.truefalse' | 'side.hint.order' | null =>
  c.type === 'predict' ? 'side.hint.predict' : c.type === 'fill' ? 'side.hint.fill' : c.type === 'truefalse' ? 'side.hint.truefalse' : c.type === 'order' ? 'side.hint.order' : null
