import { actions, addDays, BOX_DAYS, daysBetween, dueReviews, getState, today, type ReviewRec } from './store'
import { indexExercises, loadDay, type Block, type DayExercises, type Exercise } from './exercises'
import { awardXp, checkBadges, questEvent, REVIEW_XP } from './game'
import { t } from './i18n'

export interface ReviewItem {
  key: string
  rec: ReviewRec
  ex: Exercise
  block: Block
}

/** The first time a block is finished it enters box 0 and is due the next day. */
export function scheduleBlock(day: number, d: DayExercises, block: Block): ReviewRec {
  const inBlock = new Set(block.exercises.map((e) => e.id))
  let pool = d.review_pool.filter((id) => inBlock.has(id))
  if (pool.length === 0) {
    const p = block.exercises.find((e) => e.type === 'predict') ?? block.exercises[0]
    pool = p ? [p.id] : []
  }
  return { day, concept: block.concept, box: 0, due: addDays(today(), BOX_DAYS[0]), ok: 0, retired: false, pool, asked: 0, last: today() }
}

const pickPool = (rec: ReviewRec): string => rec.pool[rec.asked % rec.pool.length]

/** Mixes concepts from different days instead of working through them one day at a time. */
function interleave(list: ReviewRec[][]): ReviewRec[] {
  const out: ReviewRec[] = []
  const groups = list.map((g) => [...g])
  while (groups.some((g) => g.length)) for (const g of groups) if (g.length) out.push(g.shift()!)
  return out
}

async function resolveItem(blockId: string, rec: ReviewRec): Promise<ReviewItem | null> {
  const d = await loadDay(rec.day)
  if (!d || rec.pool.length === 0) return null
  const hit = indexExercises(d).get(pickPool(rec))
  return hit ? { key: blockId, rec, ex: hit.ex, block: hit.block } : null
}

/** Up to `max` due concepts (about five minutes of work), interleaved across days. */
export async function buildReviewSession(max = 5): Promise<ReviewItem[]> {
  const s = getState()
  const due = dueReviews(s).map((r) => [Object.keys(s.review).find((k) => s.review[k] === r)!, r] as const)
  const byDay = new Map<number, ReviewRec[]>()
  const keyOf = new Map<ReviewRec, string>()
  for (const [k, r] of due) {
    keyOf.set(r, k)
    byDay.set(r.day, [...(byDay.get(r.day) ?? []), r])
  }
  const mixed = interleave([...byDay.values()]).slice(0, max)
  const items = await Promise.all(mixed.map((r) => resolveItem(keyOf.get(r)!, r)))
  return items.filter((i): i is ReviewItem => i !== null)
}

const shuffle = <T,>(a: T[]): T[] => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

/** Closed-book end-of-day quiz: 3-5 items from today's pool plus 1-2 due items from earlier days. */
export async function buildQuiz(day: number, d: DayExercises): Promise<ReviewItem[]> {
  const s = getState()
  const idx = indexExercises(d)
  const todays: ReviewItem[] = []
  for (const b of shuffle(d.blocks)) {
    const key = b.id
    const rec = s.review[key]
    const poolIds = (rec?.pool.length ? rec.pool : d.review_pool.filter((id) => b.exercises.some((e) => e.id === id))) ?? []
    const id = poolIds.length ? shuffle(poolIds)[0] : b.exercises.find((e) => e.type === 'predict')?.id
    const hit = id ? idx.get(id) : undefined
    if (hit) todays.push({ key, rec: rec ?? scheduleBlock(day, d, b), ex: hit.ex, block: hit.block })
  }
  let picked = todays.slice(0, 4)
  // top up from the same day's pool if there are fewer than three blocks
  if (picked.length < 3) {
    const used = new Set(picked.map((p) => p.ex.id))
    for (const id of shuffle(d.review_pool)) {
      const hit = idx.get(id)
      if (hit && !used.has(id)) {
        picked.push({ key: hit.block.id, rec: s.review[hit.block.id] ?? scheduleBlock(day, d, hit.block), ex: hit.ex, block: hit.block })
        used.add(id)
      }
      if (picked.length >= 3) break
    }
  }
  picked = picked.slice(0, 5)
  const earlier = dueReviews(s).filter((r) => r.day < day)
  const keyed = earlier.map((r) => [Object.keys(s.review).find((k) => s.review[k] === r)!, r] as const).slice(0, 2)
  const old = (await Promise.all(keyed.map(([k, r]) => resolveItem(k, r)))).filter((i): i is ReviewItem => i !== null)
  return mixItems(picked, old)
}

function mixItems(a: ReviewItem[], b: ReviewItem[]): ReviewItem[] {
  const out: ReviewItem[] = []
  const x = [...a]
  const y = [...b]
  while (x.length || y.length) {
    if (x.length) out.push(x.shift()!)
    if (x.length) out.push(x.shift()!)
    if (y.length) out.push(y.shift()!)
  }
  return out
}

/** Leitner step after an answer. Same-day recall earns a little XP and does not move the box. */
export function gradeReview(key: string, good: boolean, anchor?: Element | null) {
  const rec = getState().review[key]
  if (!rec) return
  const gap = daysBetween(rec.last || today(), today())
  const asked = rec.asked + 1
  if (good) {
    if (gap >= 1) {
      const box = Math.min(BOX_DAYS.length - 1, rec.box + 1)
      const ok = rec.ok + 1
      actions.setReview(key, { ...rec, box, ok, asked, retired: ok >= 5, due: addDays(today(), BOX_DAYS[box]), last: today() })
      awardXp(REVIEW_XP.gap, t('xp.review'), anchor)
      questEvent('reviewOk')
    } else {
      actions.setReview(key, { ...rec, asked })
      awardXp(REVIEW_XP.sameDay, t('xp.review'), anchor)
    }
  } else {
    const box = Math.max(0, rec.box - 1)
    actions.setReview(key, { ...rec, box, asked, due: addDays(today(), BOX_DAYS[box]), last: today() })
  }
  checkBadges()
}
