import { useSyncExternalStore } from 'react'
import { DAYS } from '../data/days'
import { t } from './i18n'

/**
 * Everything the app remembers lives in one localStorage entry. Every access is wrapped in
 * try/catch (private windows, blocked storage); without storage the app works for the session only.
 * New fields are merged over defaults on load, so progress saved by round one keeps working.
 */
export interface ExRec {
  done: boolean
  /** failed checks / wrong answers */
  tries: number
  /** hints opened */
  hints: number
  revealed: boolean
  /** solved first try, no hints, no reveal */
  clean: boolean
  date: string
  /** XP held back until the twin exercise passes (after a solution reveal) */
  pending?: number
}

export interface ReviewRec {
  day: number
  concept: string
  /** Leitner box index into BOX_DAYS */
  box: number
  /** YYYY-MM-DD */
  due: string
  /** successful recalls on a later day */
  ok: number
  retired: boolean
  /** review_pool ids belonging to this block */
  pool: string[]
  /** times the item was asked, picks the next pool id */
  asked: number
  last: string
}

export interface Settings {
  textStep: 0 | 1 | 2
  focus: boolean
  /** synthesized feedback sounds (Web Audio); on by default */
  sound: boolean
  /** snake colour skin id (see lib/skins) */
  skin: string
}

/** "Hızlı tur" (60 s predict round): personal best, and how many paying rounds were played per date. */
export interface SpeedRec {
  best: number
  plays: number
  paid: Record<string, number>
}

/** One daily "Hata avı": which exercise, the line the learner clicked first, and whether the fix passed. */
export interface HuntRec {
  id: string
  line: number | null
  right: boolean
  done: boolean
  xp: number
}

/** A part-end boss: stages passed so far, the learner's passing code per stage, and the win. */
export interface BossRec {
  stage: number
  code: string[]
  done: boolean
  date: string
}

/** Weekly quest counters; reset when the ISO week changes. Progress that can be derived from other records is not stored. */
export interface QuestRec {
  week: string
  clean: number
  reviewOk: number
  emptyDays: string[]
  fast8: boolean
  claimed: string[]
}

/** One card of the Anlatım player: how the checkpoint went. `done` means answered (or skipped); `r` is the first outcome. */
export interface CardRes {
  r: 'ok' | 'bad' | 'skip'
  done: boolean
}

/** Per-day progress of the card player: where the learner stopped, how far they got, checkpoint results, recap date. */
export interface CardProg {
  pos: number
  /** how many cards were reached (furthest index + 1) */
  max: number
  res: Record<string, CardRes>
  /** date the recap card was first shown ('' until then): after it, the day opens on Öğren by default */
  recap: string
}

export interface State {
  v: 1
  /** day -> date it was marked done (YYYY-MM-DD) */
  done: Record<string, string>
  /** cell id -> times it was run */
  runs: Record<string, number>
  /** cell id -> edited code (only when different from the original) */
  code: Record<string, string>
  /** day -> scroll offset */
  scroll: Record<string, number>
  /** dates with any activity (a cell run, an exercise) */
  active: string[]
  last: number | null
  theme: 'light' | 'dark' | null
  sidebar: boolean

  xp: number
  /** day -> date the day-done XP was paid; paid once per day ever, so un-marking cannot farm it */
  dayXpPaid: Record<string, string>
  /** dates with a passing review session (counts for the daily goal) */
  reviewDays: string[]
  /** cell ids that raised an error and have not run clean since */
  errored: Record<string, true>
  badges: Record<string, string>
  /** exercise id -> best record */
  ex: Record<string, ExRec>
  /** block id -> completion */
  blocks: Record<string, { day: number; date: string }>
  review: Record<string, ReviewRec>
  /** dates with a passing review session or a completed concept block (the streak) */
  learnDays: string[]
  /** day -> end-of-day quiz result */
  quiz: Record<string, { date: string; good: number; total: number }>
  streakBonus: number[]
  runsByDate: Record<string, number>
  xpByDate: Record<string, number>
  settings: Settings
  speed: SpeedRec
  hunt: Record<string, HuntRec>
  boss: Record<string, BossRec>
  quest: QuestRec
  /** how many snake segments the learner has already seen grow */
  snakeSeen: number
  /** day -> card player progress */
  cards: Record<string, CardProg>
  /** ms timestamp of the last change; decides which copy (browser or .ilerleme file) is newer. Absent in progress saved before the file existed. */
  updatedAt?: number
}

const KEY = 'atolye:v1'

const empty = (): State => ({
  v: 1,
  done: {},
  runs: {},
  code: {},
  scroll: {},
  active: [],
  last: null,
  theme: null,
  sidebar: true,
  xp: 0,
  dayXpPaid: {},
  reviewDays: [],
  errored: {},
  badges: {},
  ex: {},
  blocks: {},
  review: {},
  learnDays: [],
  quiz: {},
  streakBonus: [],
  runsByDate: {},
  xpByDate: {},
  settings: { textStep: 1, focus: false, sound: true, skin: 'varsayilan' },
  speed: { best: 0, plays: 0, paid: {} },
  hunt: {},
  boss: {},
  quest: { week: '', clean: 0, reviewOk: 0, emptyDays: [], fast8: false, claimed: [] },
  snakeSeen: 0,
  cards: {},
})

function merge(input: Partial<State>): State {
  let p = input
  const e = empty()
  // a hand-edited or damaged review entry must not throw later (pickPool reads pool[]); drop entries with the wrong shape
  const review: Record<string, ReviewRec> = {}
  for (const [k, r] of Object.entries(p.review ?? {})) {
    if (r && Array.isArray(r.pool) && typeof r.due === 'string' && typeof r.box === 'number' && typeof r.day === 'number') review[k] = r
  }
  p = { ...p, review }
  const old = (p.settings ?? {}) as Partial<Settings>
  const settings: Settings = { textStep: old.textStep ?? e.settings.textStep, focus: old.focus ?? e.settings.focus, sound: old.sound !== false, skin: typeof old.skin === 'string' ? old.skin : e.settings.skin }
  const speed = { ...e.speed, ...(p.speed ?? {}) }
  const quest = { ...e.quest, ...(p.quest ?? {}) }
  return { ...e, ...p, v: 1, settings, speed, quest }
}

function load(): State {
  try {
    const s = localStorage.getItem(KEY)
    if (s) {
      const p = JSON.parse(s) as Partial<State>
      if (p && p.v === 1) return merge(p)
    }
  } catch {
    /* storage unavailable: start empty */
  }
  return empty()
}

let state: State = load()
const listeners = new Set<() => void>()
let saveTimer: number | undefined
/** when the learner last changed something in this tab (0 = nothing yet) */
let dirtyAt = 0

/** The state as written to storage and to the file, stamped with the time of the last change. */
const snapshot = (): State => ({ ...state, updatedAt: dirtyAt || state.updatedAt })

function writeLocal() {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot()))
  } catch {
    /* ignore */
  }
}

function persist() {
  dirtyAt = Date.now()
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    writeLocal()
    pushFile()
  }, 250)
}

/** Writes the pending save now: before a reload (new build) and whenever the page is being hidden or closed. */
export function flushStore() {
  window.clearTimeout(saveTimer)
  writeLocal()
  pushFile(true)
}
window.addEventListener('pagehide', flushStore)

/**
 * Progress file next to the app: `npm run dev` / `npm run preview` serve /__progress (scripts/progress-plugin.ts), which
 * keeps the state in atolye/.ilerleme/progress.json so clearing browser data or opening another port/browser loses nothing.
 * Static hosting has no such route: the first failed request switches the file off for the session, localStorage stays.
 */
const FILE_URL = './__progress'
let fileOn = true
let pushTimer: number | undefined

/** How much a state has to show for itself; decides between two copies when neither has a timestamp. */
const weight = (s: Partial<State>): number => (s.xp ?? 0) * 1000 + Object.keys(s.done ?? {}).length

/** True when `remote` should replace `local`. Newer updatedAt wins; with a timestamp on one side only, the side with more progress. */
export function remoteWins(local: Partial<State>, remote: Partial<State>): boolean {
  if (local.updatedAt != null && remote.updatedAt != null) return remote.updatedAt > local.updatedAt
  return weight(remote) > weight(local)
}

function pushFile(keepalive = false) {
  if (!fileOn) return
  window.clearTimeout(pushTimer)
  if (keepalive) send(true)
  else pushTimer = window.setTimeout(() => send(false), 1000)
}

function send(keepalive: boolean) {
  if (!fileOn) return
  const body = JSON.stringify(snapshot())
  // a keepalive body is capped at 64 KB by browsers; a bigger one is simply left to the debounced push
  fetch(FILE_URL, { method: 'PUT', headers: { 'content-type': 'application/json' }, body, keepalive: keepalive && body.length < 60_000 }).then(
    (r) => {
      if (!r.ok) fileOn = false
    },
    () => {
      /* a failed unload push is harmless; a failed normal push means no endpoint */
      if (!keepalive) fileOn = false
    },
  )
}

async function hydrateFromFile() {
  const ctl = new AbortController()
  const timer = window.setTimeout(() => ctl.abort(), 1500)
  try {
    const r = await fetch(FILE_URL, { signal: ctl.signal, cache: 'no-store' })
    if (!r.ok) throw new Error('no endpoint')
    const remote = (await r.json()) as Partial<State>
    if (!remote || typeof remote !== 'object') throw new Error('no endpoint')
    const local = snapshot()
    if (remote.v === 1 && remote.done && remoteWins(local, remote)) {
      const next = merge(remote)
      state = next
      dirtyAt = 0
      writeLocal()
      listeners.forEach((l) => l())
    } else {
      // the browser copy is newer (or the file is empty/missing): it becomes the file. A copy without a stamp gets one now.
      // (a brand-new empty browser has nothing worth writing)
      if (!dirtyAt && !state.updatedAt) {
        if (weight(state) === 0) return
        dirtyAt = Date.now()
      }
      writeLocal()
      send(false)
    }
  } catch {
    fileOn = false // static hosting, offline, timeout, or an HTML fallback page instead of JSON: localStorage only
  } finally {
    window.clearTimeout(timer)
  }
}
void hydrateFromFile()

function set(next: State) {
  state = next
  listeners.forEach((l) => l())
  persist()
}

export const getState = (): State => state
export const subscribe = (l: () => void): (() => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const useStore = (): State => useSyncExternalStore(subscribe, getState, getState)

export const today = (d = new Date()): string => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const dayMs = 86_400_000
const toTime = (d: string): number => {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day, 12).getTime()
}
export const addDays = (d: string, n: number): string => today(new Date(toTime(d) + n * dayMs))
export const daysBetween = (a: string, b: string): number => Math.round((toTime(b) - toTime(a)) / dayMs)

function withActivity(s: State): State {
  const t = today()
  return s.active.includes(t) ? s : { ...s, active: [...s.active, t].slice(-400) }
}
function withLearn(s: State): State {
  const t = today()
  return s.learnDays.includes(t) ? s : { ...s, learnDays: [...s.learnDays, t].slice(-400) }
}

export const BOX_DAYS = [1, 3, 7, 14, 30]

export const actions = {
  runCell(id: string, day: number, failed: boolean) {
    const s = withActivity(state)
    const t = today()
    const errored = { ...s.errored }
    if (failed) errored[id] = true
    else delete errored[id]
    set({
      ...s,
      runs: { ...s.runs, [id]: (s.runs[id] ?? 0) + 1 },
      runsByDate: { ...s.runsByDate, [t]: (s.runsByDate[t] ?? 0) + 1 },
      errored,
      last: day,
    })
  },
  setCode(id: string, code: string, original: string) {
    const rest = { ...state.code }
    if (code === original) delete rest[id]
    else rest[id] = code
    // Silent save: typing must not re-render every subscriber on each keystroke.
    state = { ...state, code: rest }
    persist()
  },
  markDone(day: number) {
    const s = withActivity(state)
    set({ ...s, done: { ...s.done, [day]: today() }, last: day })
  },
  unmarkDone(day: number) {
    const done = { ...state.done }
    delete done[day]
    set({ ...state, done })
  },
  setScroll(day: number, y: number) {
    if (Math.abs((state.scroll[day] ?? 0) - y) < 4) return
    // Scroll is saved without notifying subscribers: it must not re-render the whole app on every wheel tick.
    state = { ...state, scroll: { ...state.scroll, [day]: Math.round(y) }, last: day }
    persist()
  },
  visit(day: number) {
    if (state.last !== day) set({ ...state, last: day })
  },
  setTheme(theme: 'light' | 'dark' | null) {
    set({ ...state, theme })
  },
  setSidebar(open: boolean) {
    set({ ...state, sidebar: open })
  },
  setSettings(p: Partial<Settings>) {
    set({ ...state, settings: { ...state.settings, ...p } })
  },
  addXp(n: number) {
    const t = today()
    set({ ...state, xp: state.xp + n, xpByDate: { ...state.xpByDate, [t]: (state.xpByDate[t] ?? 0) + n } })
  },
  markDayXpPaid(day: number) {
    set({ ...state, dayXpPaid: { ...state.dayXpPaid, [day]: today() } })
  },
  unlockBadge(id: string) {
    if (state.badges[id]) return
    set({ ...state, badges: { ...state.badges, [id]: today() } })
  },
  claimStreakBonus(n: number) {
    set({ ...state, streakBonus: [...state.streakBonus, n] })
  },
  /** Record the result of an exercise. A clean record is never overwritten by a worse one. */
  recordEx(id: string, rec: Omit<ExRec, 'date'>) {
    const old = state.ex[id]
    const keep = old && old.done && (old.clean || !rec.clean)
    const next: ExRec = keep ? old : { ...rec, date: today() }
    set({ ...withActivity(state), ex: { ...state.ex, [id]: next } })
  },
  clearPending(id: string) {
    const r = state.ex[id]
    if (r?.pending) set({ ...state, ex: { ...state.ex, [id]: { ...r, pending: 0 } } })
  },
  completeBlock(blockId: string, day: number, rec: ReviewRec) {
    const s = withLearn(withActivity(state))
    set({
      ...s,
      blocks: { ...s.blocks, [blockId]: { day, date: today() } },
      review: s.review[blockId] ? s.review : { ...s.review, [blockId]: rec },
    })
  },
  setReview(blockId: string, rec: ReviewRec) {
    set({ ...state, review: { ...state.review, [blockId]: rec } })
  },
  /** A review session counted for the streak. */
  passReviewSession() {
    const s = withLearn(withActivity(state))
    const t = today()
    set(s.reviewDays.includes(t) ? s : { ...s, reviewDays: [...s.reviewDays, t].slice(-400) })
  },
  /** Lets the learner retake the end-of-day quiz after missing the pass mark. */
  resetQuiz(day: number) {
    const quiz = { ...state.quiz }
    delete quiz[day]
    set({ ...state, quiz })
  },
  saveQuiz(day: number, good: number, total: number) {
    set({ ...withActivity(state), quiz: { ...state.quiz, [day]: { date: today(), good, total } } })
  },
  setSpeed(p: Partial<SpeedRec>) {
    set({ ...state, speed: { ...state.speed, ...p } })
  },
  setHunt(date: string, rec: HuntRec) {
    set({ ...withActivity(state), hunt: { ...state.hunt, [date]: rec } })
  },
  setBoss(part: number, rec: BossRec) {
    set({ ...withActivity(state), boss: { ...state.boss, [part]: rec } })
  },
  setQuest(q: QuestRec) {
    set({ ...state, quest: q })
  },
  setSnakeSeen(n: number) {
    set({ ...state, snakeSeen: n })
  },
  /** The card the learner is on (saved so a reload resumes there). */
  setCardPos(day: number, pos: number) {
    const c = state.cards[day] ?? { pos: 0, max: 0, res: {}, recap: '' }
    if (c.pos === pos && c.max >= pos + 1) return
    set({ ...withActivity(state), cards: { ...state.cards, [day]: { ...c, pos, max: Math.max(c.max, pos + 1) } }, last: day })
  },
  recordCard(day: number, id: string, rec: CardRes) {
    const c = state.cards[day] ?? { pos: 0, max: 0, res: {}, recap: '' }
    const old = c.res[id]
    // the first real outcome stays (a later answer only closes the card); a skip is replaced by whatever comes next
    const next: CardRes = old && old.r !== 'skip' ? { r: old.r, done: old.done || rec.done } : rec
    set({ ...withActivity(state), cards: { ...state.cards, [day]: { ...c, res: { ...c.res, [id]: next } } } })
  },
  reachRecap(day: number) {
    const c = state.cards[day] ?? { pos: 0, max: 0, res: {}, recap: '' }
    if (c.recap) return
    set({ ...state, cards: { ...state.cards, [day]: { ...c, recap: today() } } })
  },
  exportJson(): string {
    return JSON.stringify(state, null, 2)
  },
  importJson(text: string): string | null {
    try {
      const p = JSON.parse(text) as Partial<State>
      if (!p || typeof p !== 'object' || p.v !== 1 || typeof p.done !== 'object') return t('store.badFile')
      set(merge(p))
      return null
    } catch {
      return t('store.badJson')
    }
  },
}

export type DayState = 'new' | 'progress' | 'done'

export function dayState(s: State, n: number): DayState {
  if (s.done[n]) return 'done'
  const prefix = `d${String(n).padStart(2, '0')}-`
  const started =
    Object.keys(s.runs).some((id) => id.startsWith(`${n}:`)) ||
    Object.keys(s.ex).some((id) => id.startsWith(prefix)) ||
    (s.cards[n]?.max ?? 0) > 1 ||
    (s.scroll[n] ?? 0) > 240
  return started ? 'progress' : 'new'
}

export function cellsRunIn(s: State, n: number): number {
  return Object.keys(s.runs).filter((id) => id.startsWith(`${n}:`)).length
}

export function totalRuns(s: State): number {
  return Object.values(s.runs).reduce((a, b) => a + b, 0)
}

/** Monday-based week key, so one freeze per calendar week. */
export function weekKey(d: string): string {
  const t = new Date(toTime(d))
  const dow = (t.getDay() + 6) % 7
  return today(new Date(t.getTime() - dow * dayMs))
}

/**
 * Consecutive days with a passing review or a completed concept block, ending today (or yesterday: today may not
 * have started yet). One missed day per calendar week is forgiven (the weekly freeze).
 */
export function streak(s: State): number {
  const set = new Set(s.learnDays)
  let cursor = today()
  if (!set.has(cursor)) cursor = addDays(cursor, -1)
  const frozen = new Set<string>()
  let n = 0
  for (let guard = 0; guard < 800; guard++) {
    if (set.has(cursor)) {
      n++
    } else {
      const wk = weekKey(cursor)
      if (n > 0 && !frozen.has(wk) && set.has(addDays(cursor, -1))) frozen.add(wk)
      else break
    }
    cursor = addDays(cursor, -1)
  }
  return n
}

/** Whether this week's freeze has been spent by the streak walk (for display). */
export function freezeUsedThisWeek(s: State): boolean {
  const wk = weekKey(today())
  const set = new Set(s.learnDays)
  for (let i = 0; i < 7; i++) {
    const d = addDays(today(), -i)
    if (weekKey(d) === wk && d !== today() && !set.has(d) && set.has(addDays(d, -1)) && set.has(addDays(d, 1))) return true
  }
  return false
}

export const doneCount = (s: State): number => Object.keys(s.done).length

/** First unfinished day after the furthest finished one, falling back to the first unfinished day. */
export function nextDay(s: State): number {
  const finished = DAYS.filter((d) => s.done[d.n])
  if (finished.length === 0) return s.last ?? 1
  const furthest = Math.max(...finished.map((d) => d.n))
  const after = DAYS.find((d) => d.n > furthest && !s.done[d.n])
  return (after ?? DAYS.find((d) => !s.done[d.n]) ?? DAYS[DAYS.length - 1]).n
}

export const hasProgress = (s: State): boolean => doneCount(s) > 0 || totalRuns(s) > 0 || Object.keys(s.ex).length > 0

export const dueReviews = (s: State, on = today()): ReviewRec[] =>
  Object.values(s.review)
    .filter((r) => !r.retired && r.due <= on)
    .sort((a, b) => (a.due < b.due ? -1 : 1))

/** Concepts in Leitner box 2 or higher: each one grows the home snake by one segment. */
export const grownCount = (s: State): number => Object.values(s.review).filter((r) => r.retired || r.box >= 2).length

export const masteredCount = (s: State): number => Object.values(s.review).filter((r) => r.retired || r.ok >= 3).length

/** The daily goal: one concept block or one review session. Running someone else's code never counts. */
export function dailyGoal(s: State): { value: number; target: number; met: boolean } {
  const t = today()
  const blocks = Object.values(s.blocks).filter((b) => b.date === t).length
  const value = Math.min(1, blocks + (s.reviewDays.includes(t) ? 1 : 0))
  return { value, target: 1, met: value >= 1 }
}
