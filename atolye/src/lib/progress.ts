/**
 * Pure progress selectors for the learn flow. Everything here reads a snapshot of the exercise records, never the
 * render closure of a component, so block completion cannot go stale (a step that was just recorded, a skipped
 * optional twin and a reload all give the same answer). Types are structural so the file also runs under plain Node
 * for scripts/test-progress.mjs.
 */
export interface StepLike {
  key: string
  block: number
  ex?: { id: string; type: string; twin?: string }
}

export interface RecLike {
  done: boolean
  clean?: boolean
}

export type Recs = Record<string, RecLike | undefined>

/**
 * A write exercise is optional when its twin earlier in the day was solved clean: first try, no hint, no reveal.
 * Opening any hint (the last rung counts as a reveal) or showing the solution makes the twin required.
 */
export function isOptionalStep(steps: StepLike[], k: number, recs: Recs): boolean {
  const st = steps[k]
  if (!st?.ex || st.ex.type !== 'write') return false
  const id = st.ex.id
  return steps.slice(0, k).some((p) => p.ex?.type === 'write' && p.ex.twin === id && !!recs[p.ex.id]?.done && !!recs[p.ex.id]?.clean)
}

export const isStepDone = (st: StepLike, recs: Recs): boolean => !!recs[st.key]?.done

/** Every step of the block is done or is an optional twin. */
export function isBlockComplete(steps: StepLike[], block: number, recs: Recs): boolean {
  let any = false
  for (let k = 0; k < steps.length; k++) {
    if (steps[k].block !== block) continue
    any = true
    if (!isStepDone(steps[k], recs) && !isOptionalStep(steps, k, recs)) return false
  }
  return any
}

/** Index of the first required step that is not done, or steps.length when every required step is done. */
export function frontierOf(steps: StepLike[], recs: Recs): number {
  const f = steps.findIndex((st, k) => !isStepDone(st, recs) && !isOptionalStep(steps, k, recs))
  return f < 0 ? steps.length : f
}
