import { useSyncExternalStore } from 'react'
import { DAYS, PARTS } from '../data/days'
import { actions, doneCount, getState, streak, today, type ExRec } from './store'
import { currentQuest, questProgress, questsFor } from './quests'
import type { ExType } from './exercises'
import { t, type Key } from './i18n'

/** Levels are named after Python, in the order the course teaches it. */
export const LEVELS = [
  { name: 'print', at: 0 },
  { name: 'variable', at: 100 },
  { name: 'list', at: 250 },
  { name: 'dict', at: 450 },
  { name: 'loop', at: 700 },
  { name: 'def', at: 1000 },
  { name: 'lambda', at: 1400 },
  { name: 'class', at: 1900 },
  { name: 'decorator', at: 2500 },
  { name: 'generator', at: 3200 },
]

export function levelOf(xp: number): { index: number; name: string; from: number; to: number | null; progress: number } {
  let index = 0
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].at) index = i
  const from = LEVELS[index].at
  const to = LEVELS[index + 1]?.at ?? null
  return { index, name: LEVELS[index].name, from, to, progress: to === null ? 1 : (xp - from) / (to - from) }
}

export interface BadgeDef {
  id: string
  name: string
  desc: string
  /** 1-3 stacked chevrons in the badge mark */
  marks: 1 | 2 | 3
  field: 1 | 2 | 3 | 4
}

/** Names and descriptions are getters: they read the dictionary at render time, so a language switch shows at once. */
const badge = (id: string, marks: 1 | 2 | 3, field: 1 | 2 | 3 | 4): BadgeDef => ({
  id,
  marks,
  field,
  get name() {
    return t(`badge.${id}.n` as Key)
  },
  get desc() {
    return t(`badge.${id}.d` as Key)
  },
})

export const BADGES: BadgeDef[] = [
  badge('ilk-calistirma', 1, 4),
  badge('hata-ayiklayici', 2, 3),
  badge('ilk-alistirma', 1, 2),
  badge('ilk-blok', 2, 1),
  badge('temiz-cozum', 3, 2),
  badge('ilk-tekrar', 2, 4),
  badge('bolum', 3, 1),
  badge('seri-3', 1, 3),
  badge('seri-7', 2, 3),
  badge('seri-14', 3, 3),
  badge('otuz-gun', 3, 1),
  badge('gece-kusu', 1, 1),
  ...PARTS.map((p, i): BadgeDef => ({
    id: `boss-${i}`,
    marks: 3,
    field: p.field,
    get name() {
      return t('badge.boss.n', { part: p.name })
    },
    get desc() {
      return t('badge.boss.d', { part: p.name })
    },
  })),
]

export type GameEvent =
  | { type: 'xp'; amount: number; label: string; x: number; y: number }
  | { type: 'badge'; id: string }
  | { type: 'level'; index: number }
  | { type: 'note'; text: string }

type Listener = (e: GameEvent) => void
const listeners = new Set<Listener>()
export const onGame = (l: Listener): (() => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const emit = (e: GameEvent) => listeners.forEach((l) => l(e))

const pointOf = (anchor?: Element | null): { x: number; y: number } => {
  if (anchor) {
    const r = anchor.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 40) }
  }
  return { x: window.innerWidth / 2, y: window.innerHeight - 140 }
}

export function awardXp(amount: number, label: string, anchor?: Element | null) {
  if (amount <= 0) return
  const before = levelOf(getState().xp).index
  actions.addXp(amount)
  const { x, y } = pointOf(anchor)
  emit({ type: 'xp', amount, label, x, y })
  const after = levelOf(getState().xp).index
  if (after > before) emit({ type: 'level', index: after })
}

export function unlockBadge(id: string) {
  if (getState().badges[id]) return
  actions.unlockBadge(id)
  emit({ type: 'badge', id })
}

/** Badges that follow from the stored state alone. Cheap enough to call after every progress change. */
export function checkBadges() {
  const s = getState()
  if (Object.keys(s.runs).length > 0) unlockBadge('ilk-calistirma')
  const exs = Object.values(s.ex)
  if (exs.some((e) => e.done)) unlockBadge('ilk-alistirma')
  if (Object.keys(s.blocks).length > 0) unlockBadge('ilk-blok')
  const clean = Object.entries(s.ex).filter(([id, e]) => e.done && e.clean && /^d\d\d-b\d+-e/.test(id)).length
  if (clean >= 5) unlockBadge('temiz-cozum')
  if (Object.values(s.review).some((r) => r.ok > 0)) unlockBadge('ilk-tekrar')
  if (PARTS.some((p) => DAYS.filter((d) => d.n >= p.from && d.n <= p.to).every((d) => s.done[d.n]))) unlockBadge('bolum')
  const st = streak(s)
  if (st >= 3) unlockBadge('seri-3')
  if (st >= 7) unlockBadge('seri-7')
  if (st >= 14) unlockBadge('seri-14')
  if (doneCount(s) >= 30) unlockBadge('otuz-gun')
  checkQuests()
}

/** Streak bonus: +100 the first time the streak reaches 3, 7, 14 and 30. */
export function claimStreakBonuses(anchor?: Element | null) {
  const st = streak(getState())
  for (const m of [3, 7, 14, 30]) {
    if (st >= m && !getState().streakBonus.includes(m)) {
      actions.claimStreakBonus(m)
      awardXp(100, t('xp.streak', { n: m }), anchor)
    }
  }
  checkBadges()
}

const BASE: Record<ExType, number> = { predict: 4, fill_blank: 5, parsons: 5, modify: 10, write: 12, debug: 8, explain: 3, type_it: 3 }

export type Quality = 'clean' | 'helped' | 'revealed'

export const qualityOf = (r: Pick<ExRec, 'tries' | 'hints' | 'revealed' | 'clean'>): Quality => (r.revealed ? 'revealed' : r.clean ? 'clean' : 'helped')

/** Pay for independent production: clean first try > with hints/tries > after a reveal (small, held until the twin passes). */
export function exerciseXp(type: ExType, q: Quality): number {
  const b = BASE[type]
  if (q === 'clean') return b
  if (q === 'helped') return Math.max(1, Math.round(b * 0.55))
  return Math.max(1, Math.round(b * 0.25))
}

export const REVIEW_XP = { gap: 5, sameDay: 1 }

// ---- combo ("seri vuruş"): this session only, never saved -------------------------------------------------------------
let streakN = 0
const comboSubs = new Set<() => void>()
const notifyCombo = () => comboSubs.forEach((f) => f())

/** The XP multiplier for the next clean answer: ×1 with no streak, then ×2, ×3, ×4 (cap). */
export const comboMultiplier = (n = streakN): number => Math.min(4, n + 1)
export const getStreak = (): number => streakN
export const useCombo = (): number =>
  useSyncExternalStore(
    (f) => {
      comboSubs.add(f)
      return () => comboSubs.delete(f)
    },
    getStreak,
    getStreak,
  )

/** A first-try, hint-free, first-time right answer. Returns the multiplier that applied to it, then grows the streak. */
export function comboHit(): number {
  const m = comboMultiplier()
  streakN++
  notifyCombo()
  return m
}

/** A wrong answer or an opened hint: back to ×1, calmly. No XP is taken away. */
export function comboReset() {
  if (streakN === 0) return
  streakN = 0
  notifyCombo()
}

// ---- weekly quests ------------------------------------------------------------------------------------------------------
export function checkQuests() {
  const s = getState()
  const date = today()
  const q = currentQuest(s, date)
  const won = questsFor(date).filter((d) => !q.claimed.includes(d.id) && questProgress(s, d.id, date) >= d.target)
  if (!won.length) return
  actions.setQuest({ ...q, claimed: [...q.claimed, ...won.map((d) => d.id)] })
  for (const d of won) {
    awardXp(d.xp, t('xp.weekly'))
    emit({ type: 'note', text: t('xp.weeklyDone', { title: d.title }) })
  }
}

export function questEvent(kind: 'clean' | 'reviewOk' | 'emptyDay' | 'fast8') {
  const date = today()
  const q = { ...currentQuest(getState(), date) }
  if (kind === 'clean') q.clean++
  else if (kind === 'reviewOk') q.reviewOk++
  else if (kind === 'fast8') q.fast8 = true
  else if (!q.emptyDays.includes(date)) q.emptyDays = [...q.emptyDays, date]
  actions.setQuest(q)
  checkQuests()
}

/** A short line for the live region and the note toast ("+1 halka"). */
export const note = (text: string) => emit({ type: 'note', text })
