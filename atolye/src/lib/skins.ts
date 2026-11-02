import { t, type Key } from './i18n'
import { LEVELS, levelOf } from './game'

/**
 * Snake skins: flat colour pairs that alternate along the finished segments. Each one opens at a level (named after Python,
 * so "loop" and "class" are what the learner has just learned). Colours are CSS variables so light and dark both work.
 */
export interface Skin {
  id: string
  name: string
  /** index into LEVELS */
  level: number
  /** the pair of colour variables, or null for the default (each part's own colour) */
  pair: [string, string] | null
}

const skin = (id: string, level: number, pair: [string, string] | null): Skin => ({
  id,
  level,
  pair,
  get name() {
    return t(`skin.${id}` as Key)
  },
})

export const SKINS: Skin[] = [
  skin('varsayilan', 0, null),
  skin('loop', 4, ['--field-1', '--field-2']),
  skin('class', 7, ['--field-3', '--field-4']),
  skin('generator', 9, ['--accent', '--ink']),
]

export const skinUnlocked = (k: Skin, xp: number): boolean => levelOf(xp).index >= k.level
export const skinLevelName = (k: Skin): string => LEVELS[k.level].name

/** The chosen skin, or the default when it is unknown or not unlocked yet. */
export function activeSkin(id: string, xp: number): Skin {
  const k = SKINS.find((x) => x.id === id)
  return k && skinUnlocked(k, xp) ? k : SKINS[0]
}
