/** Exercise files (content/exercises/dayNN.json, copied to public/exercises/ at build time) and what the learn flow derives from them. */

import { getLang, tl, type Lang } from './i18n'

export type ExType = 'predict' | 'fill_blank' | 'parsons' | 'modify' | 'write' | 'debug' | 'explain' | 'type_it'

export interface TestDef {
  code: string
  visible?: boolean
  failure_message?: string
  failure_message_tr?: string
  /** plain-words name of the check, shown instead of the assert code */
  label?: string
  label_tr?: string
}

export interface Exercise {
  id: string
  type: ExType
  prompt: string
  prompt_tr?: string
  concept?: string
  tags?: string[]
  // predict
  code?: string
  choices?: string[]
  expected_output?: string
  explanation?: string
  explanation_tr?: string
  misconceptions?: Record<string, string>
  misconceptions_tr?: Record<string, string>
  // fill_blank / modify / write / debug
  starter_code?: string
  signature?: string
  blanks?: { answer: string[] }[]
  tests?: TestDef[]
  hints?: string[]
  hints_tr?: string[]
  solution?: { approach?: string; approach_tr?: string; code: string }
  twin?: string
  // parsons
  lines?: string[]
  correct_order?: number[]
  distractors?: string[]
  // explain
  model_answer?: string
  model_answer_tr?: string
  keywords?: string[]
  keywords_tr?: string[]
  /** explain: fewest words an answer needs (default 6) */
  min_words?: number
}

export interface WorkedExample {
  code: string
  notes: string[]
  notes_tr?: string[]
}

export interface Block {
  id: string
  concept: string
  concept_tr?: string
  tags?: string[]
  worked_example?: WorkedExample
  exercises: Exercise[]
}

export interface DayExercises {
  day: number
  title: string
  title_tr?: string
  test_conventions?: string
  blocks: Block[]
  review_pool: string[]
}

const cache = new Map<number, Promise<DayExercises | null>>()

/** Loads one day's exercise file. Resolves to null when the file does not exist (shown as "hazırlanıyor"). */
export function loadDay(day: number): Promise<DayExercises | null> {
  let p = cache.get(day)
  if (!p) {
    const name = `day${String(day).padStart(2, '0')}.json`
    p = fetch(`${import.meta.env.BASE_URL}exercises/${name}`)
      .then(async (r) => {
        if (!r.ok) return null
        const type = r.headers.get('content-type') ?? ''
        if (type.includes('text/html')) return null // SPA fallbacks answer 200 with the page
        return (await r.json()) as DayExercises
      })
      .catch(() => null)
    cache.set(day, p)
  }
  return p
}

export interface Step {
  key: string
  kind: 'worked' | ExType
  block: number
  ex?: Exercise
  worked?: WorkedExample
}

/** Predict first, then the worked example, then the rest of the block in file order. */
export function stepsOf(d: DayExercises): Step[] {
  const out: Step[] = []
  d.blocks.forEach((b, bi) => {
    const list = [...b.exercises]
    const firstPredict = list.findIndex((e) => e.type === 'predict')
    const pushWorked = () => {
      if (b.worked_example) out.push({ key: `${b.id}:worked`, kind: 'worked', block: bi, worked: b.worked_example })
    }
    if (firstPredict < 0) pushWorked()
    list.forEach((e, i) => {
      out.push({ key: e.id, kind: e.type, block: bi, ex: e })
      if (i === firstPredict) pushWorked()
    })
  })
  return out
}

export function indexExercises(d: DayExercises): Map<string, { ex: Exercise; block: Block }> {
  const m = new Map<string, { ex: Exercise; block: Block }>()
  for (const b of d.blocks) for (const e of b.exercises) m.set(e.id, { ex: e, block: b })
  return m
}

export type { Lang }

/** The Turkish text when the reader reads Turkish and the content has it, else the English original. */
export const pickLang = <T,>(lang: Lang, tr: T | undefined | null, en: T): T => (lang === 'tr' && tr ? tr : en)

export const promptOf = (e: Exercise, lang: Lang = getLang()): string => pickLang(lang, e.prompt_tr, e.prompt)
export const conceptOf = (b: Pick<Block, 'concept' | 'concept_tr'>, lang: Lang = getLang()): string => pickLang(lang, b.concept_tr, b.concept.replace(/-/g, ' '))
export const dayTitleOf = (d: Pick<DayExercises, 'title' | 'title_tr'>, lang: Lang = getLang()): string => pickLang(lang, d.title_tr, d.title)
/** Hints in the chosen language; a Turkish list of a different length is ignored so the rungs keep their meaning. */
export const hintsOf = (e: Exercise, lang: Lang = getLang()): string[] => {
  const en = e.hints ?? []
  return lang === 'tr' && e.hints_tr && e.hints_tr.length === en.length ? e.hints_tr : en
}
export const explanationOf = (e: Exercise, lang: Lang = getLang()): string | undefined => pickLang(lang, e.explanation_tr, e.explanation)
export const misconceptionOf = (e: Exercise, pick: string, lang: Lang = getLang()): string | undefined =>
  (lang === 'tr' ? e.misconceptions_tr?.[pick] : undefined) ?? e.misconceptions?.[pick]
export const notesOf = (w: WorkedExample, lang: Lang = getLang()): string[] => (lang === 'tr' && w.notes_tr && w.notes_tr.length === w.notes.length ? w.notes_tr : w.notes)
/** The plain-words name of a check; English falls back to "Check N" when the file has no English label. */
export const labelOf = (td: TestDef, i: number, lang: Lang = getLang()): string => pickLang(lang, td.label_tr, td.label) || tl(lang, 'test.check', { n: i + 1 })
export const failureOf = (td: TestDef, lang: Lang = getLang()): string | undefined => pickLang(lang, td.failure_message_tr, td.failure_message)
export const approachOf = (sol: { approach?: string; approach_tr?: string }, lang: Lang = getLang()): string | undefined => pickLang(lang, sol.approach_tr, sol.approach)
export const modelAnswerOf = (e: Exercise, lang: Lang = getLang()): string | undefined => pickLang(lang, e.model_answer_tr, e.model_answer)
/** Keywords of the chosen language plus the other list: an English term in a Turkish answer (or the reverse) still counts. */
export const keywordsOf = (e: Exercise, lang: Lang = getLang()): string[] => {
  const own = lang === 'tr' ? e.keywords_tr ?? [] : e.keywords ?? []
  const other = lang === 'tr' ? e.keywords ?? [] : e.keywords_tr ?? []
  return [...own, ...other]
}

export function solutionOf(e: Exercise): { approach?: string; approach_tr?: string; code: string } | null {
  if (e.solution) return e.solution
  if (e.type === 'fill_blank' && e.starter_code && e.blanks) {
    let i = 0
    return { code: e.starter_code.replace(/___/g, () => e.blanks![i++]?.answer[0] ?? '___') }
  }
  if (e.type === 'parsons' && e.lines && e.correct_order) {
    return { code: e.correct_order.map((i) => e.lines![i]).join('\n') }
  }
  const last = e.hints?.[e.hints.length - 1]
  return last ? { code: last } : null
}

/** What the editor starts with. A write exercise with only a signature gets that line to begin from. */
export function editorStart(e: Exercise): string {
  if (e.starter_code) return e.starter_code
  if (e.signature) return `${e.signature}\n    `
  return ''
}

const norm = (s: string): string =>
  s
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '')

export const sameOutput = (a: string, b: string): boolean => norm(a) === norm(b)

export interface LineDiff {
  expected: string
  actual: string
  same: boolean
}

export function diffLines(expected: string, actual: string): LineDiff[] {
  const e = norm(expected).split('\n')
  const a = norm(actual).split('\n')
  const n = Math.max(e.length, a.length)
  return Array.from({ length: n }, (_, i) => ({ expected: e[i] ?? '', actual: a[i] ?? '', same: e[i] === a[i] }))
}

/** Learner code that looks like lesson/worked-example code (used for the gentle paste note). */
export function looksCopied(pasted: string, known: string[]): boolean {
  const p = pasted.replace(/\s+/g, ' ').trim()
  if (p.length < 12) return false
  return known.some((k) => {
    const kk = k.replace(/\s+/g, ' ').trim()
    return kk.length >= 12 && (kk.includes(p) || p.includes(kk))
  })
}
