/** Card files (content/cards/dayNN.json, copied to public/cards/ at build time) that drive the Anlatım player. */

import { tl, type Lang } from './i18n'

/**
 * Every text field has an English original and a Turkish twin (`body` / `body_tr`). A missing twin falls back to the other
 * language and the page marks it; see `pickText`.
 */
interface Base {
  id: string
  /** heading of the English lesson section this card explains: the "Original text" disclosure shows that section */
  section: string
  title?: string
  title_tr?: string
}

export interface ExplainCard extends Base {
  type: 'explain'
  body?: string
  body_tr?: string
  code?: string
  expected_output?: string
  /** the output stays hidden until the learner commits a guess */
  hide_output?: boolean
  /** open the line-by-line visualizer first */
  trace?: boolean
  /** more lesson headings this card draws on: "Orijinal metin" shows them after `section` */
  also_sections?: string[]
}

export interface PredictCard extends Base {
  type: 'predict'
  code: string
  choices: string[]
  /** index into choices, or the text of the right choice */
  answer: number | string
  why?: string
  why_tr?: string
  prompt?: string
  prompt_tr?: string
}

export interface FillCard extends Base {
  type: 'fill'
  /** exactly one ___ */
  code: string
  answers: string[]
  expected_output?: string
  why?: string
  why_tr?: string
  prompt?: string
  prompt_tr?: string
}

export interface TrueFalseCard extends Base {
  type: 'truefalse'
  statement?: string
  statement_tr?: string
  answer: boolean | string
  why?: string
  why_tr?: string
}

export interface OrderCard extends Base {
  type: 'order'
  /** each line carries its own indentation */
  lines: string[]
  correct_order: number[]
  expected_output?: string
  distractors?: string[]
  prompt?: string
  prompt_tr?: string
}

export interface RecapCard extends Base {
  type: 'recap'
  points?: string[]
  points_tr?: string[]
  /** the button under the recap, and where it goes (`learn` = the exercises) */
  cta?: string
  cta_tr?: string
  link?: string
  target?: string
  link_label?: string
  link_label_tr?: string
}

/** A card text in the reader's language. `note` is set when only the other language exists (shown small after the text). */
export interface Picked<T = string> {
  text: T
  note: string
}

export function pickText(lang: Lang, tr: string | undefined, en: string | undefined, fallback = ''): Picked {
  const own = lang === 'tr' ? tr : en
  if (own) return { text: own, note: '' }
  const other = lang === 'tr' ? en : tr
  if (other) return { text: other, note: tl(lang, lang === 'tr' ? 'lang.missingEn' : 'lang.missing') }
  return { text: fallback, note: '' }
}

export function pickList(lang: Lang, tr: string[] | undefined, en: string[] | undefined): Picked<string[]> {
  const own = lang === 'tr' ? tr : en
  if (own?.length) return { text: own, note: '' }
  const other = lang === 'tr' ? en : tr
  if (other?.length) return { text: other, note: tl(lang, lang === 'tr' ? 'lang.missingEn' : 'lang.missing') }
  return { text: [], note: '' }
}

export const cardTitle = (c: Base, lang: Lang): Picked => pickText(lang, c.title_tr, c.title)
export const cardWhy = (c: { why?: string; why_tr?: string }, lang: Lang): Picked => pickText(lang, c.why_tr, c.why)
export const cardPrompt = (c: { prompt?: string; prompt_tr?: string }, lang: Lang, fallback = ''): Picked => pickText(lang, c.prompt_tr, c.prompt, fallback)

export type Card = ExplainCard | PredictCard | FillCard | TrueFalseCard | OrderCard | RecapCard

export interface CardsDay {
  day: number
  title_tr?: string
  est_minutes?: number
  cards: Card[]
}

const TYPES = new Set(['explain', 'predict', 'fill', 'truefalse', 'order', 'recap'])

export const isCheckpoint = (c: Card): boolean => c.type === 'predict' || c.type === 'fill' || c.type === 'truefalse' || c.type === 'order'

/** XP for a first-try right answer; wrong or repeated answers pay nothing. */
export const CARD_XP: Record<string, number> = { predict: 2, fill: 2, truefalse: 1, order: 2 }

const cache = new Map<number, Promise<CardsDay | null>>()

/** Loads one day's card file. Resolves to null when the file does not exist or is unusable (shown as "hazırlanıyor"). */
export function loadCards(day: number): Promise<CardsDay | null> {
  let p = cache.get(day)
  if (!p) {
    const name = `day${String(day).padStart(2, '0')}.json`
    p = fetch(`${import.meta.env.BASE_URL}cards/${name}`)
      .then(async (r) => {
        if (!r.ok) return null
        if ((r.headers.get('content-type') ?? '').includes('text/html')) return null // SPA fallbacks answer 200 with the page
        const d = (await r.json()) as CardsDay
        if (!d || !Array.isArray(d.cards)) return null
        const cards = d.cards.filter((c) => c && typeof c.id === 'string' && TYPES.has(c.type))
        return cards.length ? { ...d, cards } : null
      })
      .catch(() => null)
    cache.set(day, p)
  }
  return p
}

/** Reading time shown in the plan: the file's own estimate, else about 40 seconds a card. */
export const minutesOf = (d: Pick<CardsDay, 'est_minutes' | 'cards'>): number => Math.max(1, Math.round(d.est_minutes ?? d.cards.length * 0.7))

/** Index of the right choice; `answer` may be a 0-based index, the choice text, or a letter (A, B, ...). */
export function answerIndex(c: PredictCard): number {
  const a = c.answer
  if (typeof a === 'number') return a
  const s = String(a).trim()
  const exact = c.choices.findIndex((x) => x.trim() === s)
  if (exact >= 0) return exact
  if (/^\d+$/.test(s)) return Number(s)
  if (/^[A-Za-z]$/.test(s)) return s.toUpperCase().charCodeAt(0) - 65
  return -1
}

export function truthOf(c: TrueFalseCard): boolean {
  const a = c.answer
  if (typeof a === 'boolean') return a
  return /^(true|doğru|dogru|evet|d)$/i.test(String(a).trim())
}

/** Whitespace-insensitive answer comparison for the fill-in blank. */
export const sameAnswer = (given: string, answers: string[]): boolean => {
  const g = given.trim().replace(/\s+/g, ' ')
  return g.length > 0 && answers.some((a) => a.trim().replace(/\s+/g, ' ') === g)
}
