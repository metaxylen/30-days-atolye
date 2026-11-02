// Lists hard-coded Turkish UI text outside src/lib/i18n.ts: code lines (comments stripped) that carry a Turkish letter
// or a common Turkish word inside a string literal or JSX text.  node scripts/check-strings.mjs [--verbose]
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const verbose = process.argv.includes('--verbose')
const src = join(process.cwd(), 'src')
const files = []
const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const f = join(d, e.name)
    if (e.isDirectory()) walk(f)
    else if (/\.(ts|tsx)$/.test(e.name) && e.name !== 'i18n.ts') files.push(f)
  })
walk(src)

const TR = /[çğıöşüÇĞİÖŞÜ]/
let hits = 0
for (const f of files) {
  let s = readFileSync(f, 'utf8')
  s = s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')) // block comments (keep line numbers)
  s.split('\n').forEach((line, i) => {
    const code = line.replace(/(^|[^:'"`\\])\/\/.*$/, '$1') // line comments
    if (!TR.test(code)) return
    // only text that a learner can see: inside quotes/backticks or between JSX tags
    const inString = /(['"`])(?:(?!\1)[^\\]|\\.)*[çğıöşüÇĞİÖŞÜ](?:(?!\1)[^\\]|\\.)*\1/.test(code) || />[^<>{}]*[çğıöşüÇĞİÖŞÜ][^<>{}]*</.test(code)
    if (!inString) return
    hits++
    if (verbose) console.log(`${relative(process.cwd(), f)}:${i + 1}: ${code.trim().slice(0, 140)}`)
  })
}
console.log(`hard-coded Turkish strings outside i18n.ts: ${hits}`)
