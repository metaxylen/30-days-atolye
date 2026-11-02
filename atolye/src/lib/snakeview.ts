import { PARTS, dayOf } from '../data/days'
import { activeSkin } from './skins'
import { grownCount, type State } from './store'

/** The home snake starts at 6 chevrons and gains one per concept the learner has mastered (Leitner box 2 or higher), up to 30. */
export const SNAKE_MIN = 6
export const snakeLength = (s: State): number => Math.min(30, SNAKE_MIN + grownCount(s))

/** The CSS variable that colours day `n` on the snake: skin pair or part colour when finished, accent when next, quiet otherwise. */
export function segmentVar(s: State, n: number, next: number): string {
  if (s.done[n]) {
    const k = activeSkin(s.settings.skin, s.xp)
    return k.pair ? k.pair[(n - 1) % 2] : `--field-${PARTS[dayOf(n)!.part].field}`
  }
  return n === next ? '--accent' : '--chev-new'
}
