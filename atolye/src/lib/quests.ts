import { t, type Key } from './i18n'
import { addDays, weekKey, type QuestRec, type State } from './store'

/**
 * Weekly quests: three small goals that rotate by ISO week. Every one asks for learning (writing without hints, recalling,
 * finishing concepts), never for time on the page or clicks.
 */
export interface QuestDef {
  id: string
  title: string
  target: number
  xp: number
}

/** The title is a getter so it follows the language switch. */
const quest = (id: string, target: number, xp: number): QuestDef => ({
  id,
  target,
  xp,
  get title() {
    return t(`quest.${id}` as Key)
  },
})

export const QUESTS: QuestDef[] = [
  quest('clean', 3, 30),
  quest('empty', 2, 40),
  quest('fast8', 1, 25),
  quest('hunt', 2, 30),
  quest('recall', 5, 25),
  quest('blocks', 2, 30),
]

/** ISO-8601 week number and year of a YYYY-MM-DD date. */
export function isoWeek(date: string): { year: number; week: number } {
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  const dow = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - dow)
  const year = t.getUTCFullYear()
  const week = Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 + 1) / 7)
  return { year, week }
}

/** Deterministic: the same ISO week always gives the same three quests (a small seeded shuffle). */
export function questsFor(date: string): QuestDef[] {
  const { year, week } = isoWeek(date)
  let seed = year * 100 + week
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const pool = [...QUESTS]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, 3)
}

export const freshQuest = (week: string): QuestRec => ({ week, clean: 0, reviewOk: 0, emptyDays: [], fast8: false, claimed: [] })

/** The stored counters, or fresh ones when the stored week is not this week. */
export function currentQuest(s: State, date: string): QuestRec {
  const wk = weekKey(date)
  return s.quest.week === wk ? s.quest : freshQuest(wk)
}

export function questProgress(s: State, id: string, date: string): number {
  const q = currentQuest(s, date)
  const start = weekKey(date)
  const end = addDays(start, 6)
  const inWeek = (d: string) => d >= start && d <= end
  switch (id) {
    case 'clean':
      return q.clean
    case 'empty':
      return q.emptyDays.length
    case 'fast8':
      return q.fast8 ? 1 : 0
    case 'hunt':
      return Object.entries(s.hunt).filter(([d, h]) => h.done && inWeek(d)).length
    case 'recall':
      return q.reviewOk
    case 'blocks':
      return Object.values(s.blocks).filter((b) => inWeek(b.date)).length
    default:
      return 0
  }
}
