import { D, t, type Key } from './i18n'

/** One plain sentence under a traceback (in the reader's language): what the error usually means and what to check. */
const HINTS: [RegExp, Key, (m: RegExpMatchArray) => Record<string, string>][] = [
  [/NameError: name '([^']+)' is not defined/, 'err.nameDef', (m) => ({ a: m[1] })],
  [/NameError/, 'err.name', () => ({})],
  [/IndentationError/, 'err.indent', () => ({})],
  [/TabError/, 'err.tab', () => ({})],
  [/SyntaxError: invalid syntax\. Perhaps you forgot a comma/, 'err.syntaxComma', () => ({})],
  [/SyntaxError: invalid syntax/, 'err.syntaxInvalid', () => ({})],
  [/SyntaxError/, 'err.syntax', () => ({})],
  [/EOFError/, 'err.eof', () => ({})],
  [/IndexError/, 'err.index', () => ({})],
  [/KeyError: (.+)/, 'err.key', (m) => ({ a: m[1] })],
  [/ValueError: invalid literal for int/, 'err.valueInt', () => ({})],
  [/ValueError/, 'err.value', () => ({})],
  [/AttributeError: '(\w+)' object has no attribute '([^']+)'/, 'err.attrDef', (m) => ({ a: m[1], b: m[2] })],
  [/AttributeError/, 'err.attr', () => ({})],
  [/ZeroDivisionError/, 'err.zero', () => ({})],
  [/ModuleNotFoundError|ImportError/, 'err.module', () => ({})],
  [/TypeError: can only concatenate str/, 'err.concat', () => ({})],
  [/TypeError: unsupported operand/, 'err.operand', () => ({})],
  [/TypeError: .* takes .* positional argument/, 'err.args', () => ({})],
  [/TypeError: .* object is not (subscriptable|iterable|callable)/, 'err.notSub', () => ({})],
  [/TypeError/, 'err.type', () => ({})],
]

/**
 * The Python worker and the runner leave markers (`@@eof-run`, `@@start:detail`) instead of sentences, so the same
 * stored output reads in whichever language the learner has chosen. This turns the markers into text.
 */
export function localize(text: string): string {
  if (!text.includes('@@')) return text
  return text.replace(/@@([a-z-]+)(?::([^\n]*))?/g, (m, k: string, a?: string) => {
    const key = `py.${k}` as Key
    return key in D ? t(key, { a: a ?? '' }) : m
  })
}

export function friendlyHint(error: string | null | undefined): string | null {
  if (!error) return null
  const last = error.trimEnd().split('\n').slice(-1)[0] ?? ''
  const hay = last.includes(':') || last.includes('Error') ? last : error
  for (const [re, key, vars] of HINTS) {
    const m = re.exec(hay) ?? re.exec(error)
    if (m) return t(key, vars(m))
  }
  return null
}

/** The last line of a traceback, for compact display. */
export const lastLine = (error: string): string => error.trimEnd().split('\n').slice(-1)[0] ?? error
