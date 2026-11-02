import { DAYS, PARTS, daysOfPart } from '../data/days'
import { loadDay, sameOutput, type Exercise } from './exercises'
import { getLang, t, type Key } from './i18n'
import { dayState, type State } from './store'

/** Data helpers for the three games. Loaded only with the game pages, never by the reader. */

const shuffle = <T,>(a: T[]): T[] => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

export const hashOf = (s: string): number => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0
  return h
}

// ---- speed round -------------------------------------------------------------------------------------------------------
export interface SpeedQ {
  ex: Exercise
  day: number
  /** index of the right choice */
  right: number
}

/** Predict exercises with 2-4 choices (so keys 1-4 work) from days the learner has started; Day 1-3 when there are none. */
export async function speedPool(s: State): Promise<SpeedQ[]> {
  const started = DAYS.filter((d) => dayState(s, d.n) !== 'new').map((d) => d.n)
  const take = async (days: number[]): Promise<SpeedQ[]> => {
    const loaded = await Promise.all(days.map((n) => loadDay(n).then((d) => [n, d] as const)))
    const out: SpeedQ[] = []
    for (const [day, d] of loaded) {
      for (const b of d?.blocks ?? []) {
        for (const ex of b.exercises) {
          const c = ex.choices ?? []
          if (ex.type !== 'predict' || !ex.code || c.length < 2 || c.length > 4 || ex.expected_output === undefined) continue
          const right = c.findIndex((x) => sameOutput(x, ex.expected_output ?? ''))
          if (right >= 0) out.push({ ex, day, right })
        }
      }
    }
    return out
  }
  let pool = await take(started.length ? started : [1, 2, 3])
  // a learner who has only just started may not have enough questions for a round: top up from the first days
  if (pool.length < 10) {
    const have = new Set(pool.map((q) => q.ex.id))
    pool = pool.concat((await take([1, 2, 3, 4])).filter((q) => !have.has(q.ex.id)))
  }
  return shuffle(pool)
}

// ---- bug hunt ----------------------------------------------------------------------------------------------------------
/**
 * Which lines of the buggy starter code the fix touches: the lines that are not part of the longest common run of lines with
 * the solution. When the fix only adds a line, the lines either side of the gap count.
 */
export function buggyLines(starter: string, solution: string): number[] {
  const a = starter.split('\n').map((l) => l.trimEnd())
  const b = solution.split('\n').map((l) => l.trimEnd())
  const n = a.length
  const m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const keptA = new Set<number>()
  const gapsB: number[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      keptA.add(i)
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else {
      gapsB.push(i)
      j++
    }
  }
  while (j < m) gapsB.push(i), j++
  const wrong = a.map((_, k) => k).filter((k) => !keptA.has(k) && a[k].trim() !== '')
  if (wrong.length) return wrong
  // only additions: the missing line belongs between two kept lines
  const near = new Set<number>()
  for (const g of gapsB) {
    if (g - 1 >= 0) near.add(g - 1)
    if (g < n) near.add(g)
  }
  return [...near].filter((k) => a[k].trim() !== '')
}

export interface HuntPick {
  ex: Exercise
  day: number
  buggy: number[]
}

const debugOf = (d: Awaited<ReturnType<typeof loadDay>>): Exercise[] =>
  (d?.blocks.flatMap((b) => b.exercises) ?? []).filter((e) => e.type === 'debug' && !!e.starter_code && !!e.solution?.code)

const withBuggy = (ex: Exercise, day: number): HuntPick => ({ ex, day, buggy: buggyLines(ex.starter_code ?? '', ex.solution?.code ?? '') })

/** The exercise saved for the day (so the pick stays put when more days get finished). */
export async function huntById(id: string): Promise<HuntPick | null> {
  const day = Number(/^d(\d\d)-/.exec(id)?.[1])
  if (!day) return null
  const ex = debugOf(await loadDay(day)).find((e) => e.id === id)
  return ex ? withBuggy(ex, day) : null
}

/** One debug exercise from a finished day, chosen by the date alone: the same date gives the same hunt. */
export async function pickHunt(date: string, doneDays: number[]): Promise<HuntPick | null> {
  const days = [...doneDays].sort((x, y) => x - y)
  if (!days.length) return null
  const start = hashOf(date) % days.length
  for (let k = 0; k < days.length; k++) {
    const day = days[(start + k) % days.length]
    const list = debugOf(await loadDay(day))
    if (list.length) return withBuggy(list[hashOf(date + ':pick') % list.length], day)
  }
  return null
}

// ---- bosses ------------------------------------------------------------------------------------------------------------
export interface BossStage {
  id: string
  title_tr: string
  story_tr?: string
  prompt_tr: string
  prompt: string
  starter_code: string
  tests: { code: string; visible?: boolean; label_tr?: string; label?: string; failure_message?: string; failure_message_tr?: string }[]
  hints?: string[]
  hints_tr?: string[]
  solution?: { code: string; approach_tr?: string; approach?: string }
}

export interface BossFile {
  part: number
  title_tr: string
  story_tr: string
  stages: BossStage[]
  reward_xp?: number
}

const bosses = new Map<number, Promise<BossFile | null>>()

/** content/bosses/partN.json (N = 1-5), copied to public/bosses at build time. null when the file is not there yet. */
export function loadBoss(part: number): Promise<BossFile | null> {
  let p = bosses.get(part)
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}bosses/part${part + 1}.json`)
      .then(async (r) => {
        if (!r.ok || (r.headers.get('content-type') ?? '').includes('text/html')) return null
        const f = (await r.json()) as BossFile
        return Array.isArray(f.stages) && f.stages.length ? f : null
      })
      .catch(() => null)
    bosses.set(part, p)
  }
  return p
}

/** The boss files carry Turkish titles and stories only; the English ones live in the dictionary (boss.pN.*). */
export const bossTitle = (f: BossFile, part: number): string => (getLang() === 'tr' && f.title_tr ? f.title_tr : t(`boss.p${part + 1}.title` as Key))
export const bossStory = (f: BossFile, part: number): string => (getLang() === 'tr' && f.story_tr ? f.story_tr : t(`boss.p${part + 1}.story` as Key))
export const stageTitle = (st: BossStage, part: number, idx: number): string => (getLang() === 'tr' && st.title_tr ? st.title_tr : t(`boss.p${part + 1}.s${idx + 1}` as Key))

export { daysOfPart }
export const partDone = (s: State, part: number): { done: number; total: number } => {
  const days = daysOfPart(part)
  return { done: days.filter((n) => s.done[n]).length, total: days.length }
}
export const partName = (part: number): string => PARTS[part].name
