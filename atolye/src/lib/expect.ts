/**
 * Auto-check for lesson examples: `print(len(fruits)) # 4` carries the expected output in a trailing comment.
 * When the printed lines match those comments in order a tick is shown; otherwise the differing line. A heuristic only:
 * it never blocks anything and skips any code it cannot map line to line (loops, functions, input, multi-line prints).
 */
const SIMPLE_LITERAL = /^(-?\d[\d_.]*(e[+-]?\d+)?|True|False|None|'[^']*'|"[^"]*"|[[({].*[\])}])$/

export interface Expectation {
  /** index of the printed line (0-based) */
  line: number
  expected: string
  source: number
}

const BLOCKERS = /^\s*(for|while|def|class|with|try|if|elif|else|lambda|input)\b|\binput\s*\(/

export function extractExpectations(code: string): Expectation[] | null {
  const lines = code.split('\n')
  if (lines.some((l) => BLOCKERS.test(l))) return null
  const out: Expectation[] = []
  let printed = 0
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (!/^\s*print\s*\(/.test(l)) continue
    // multi-line print or print that can span lines: give up on the whole cell
    const open = (l.match(/\(/g) ?? []).length
    const close = (l.match(/\)/g) ?? []).length
    if (open !== close || /\\n/.test(l.replace(/#.*$/, ''))) return null
    const c = /\s#\s*([^#]+)$/.exec(l)
    if (c && !/print\s*\(.*#.*\)\s*$/.test(l.slice(0, c.index))) {
      const lit = c[1].trim()
      if (SIMPLE_LITERAL.test(lit)) out.push({ line: printed, expected: lit, source: i })
    }
    printed++
  }
  return out.length ? out : null
}

const canon = (s: string): string => s.trim().replace(/^['"]|['"]$/g, '').replace(/"/g, "'").replace(/\s+/g, '')

export interface ExpectResult {
  ok: boolean
  /** first mismatch */
  diff?: { source: number; expected: string; actual: string }
  compared: number
}

export function checkExpectations(code: string, stdout: string): ExpectResult | null {
  const ex = extractExpectations(code)
  if (!ex) return null
  const printed = stdout.replace(/\n$/, '').split('\n')
  for (const e of ex) {
    const actual = printed[e.line]
    if (actual === undefined || canon(actual) !== canon(e.expected)) {
      return { ok: false, compared: ex.length, diff: { source: e.source, expected: e.expected, actual: actual ?? '' } }
    }
  }
  return { ok: true, compared: ex.length }
}
