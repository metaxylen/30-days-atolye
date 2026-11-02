// Reads the course (one level up, read-only) and writes what the app needs inside atolye/:
//   public/course-images/   copy of ../images
//   public/lessons/NN.md   the 30 lessons, fetched one at a time (never bundled)
//   src/data/previews.generated.json   topics and a first snippet per day for the home page
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const course = resolve(root, '..')

const lessons = {}
lessons[1] = readFileSync(join(course, 'readme.md'), 'utf8')

// Day 1 is the repository readme; days 2-30 live in their own folders.
const folders = readdirSync(course).filter((f) => /^\d\d_Day_/.test(f) && !f.startsWith('01_')).sort()
for (const folder of folders) {
  const n = Number(folder.slice(0, 2))
  const md = readdirSync(join(course, folder)).find((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
  if (!md) throw new Error(`no lesson markdown in ${folder}`)
  lessons[n] = readFileSync(join(course, folder, md), 'utf8')
}

const missing = Array.from({ length: 30 }, (_, i) => i + 1).filter((n) => !lessons[n])
if (missing.length) throw new Error(`missing days: ${missing.join(', ')}`)

// Home page previews: level-2 headings and the first short python block, from a cheap fence-aware line scan.
const stripEmoji = (s) => s.replace(/[\p{Extended_Pictographic}️]/gu, '').replace(/\s+/g, ' ').trim()
const previews = {}
for (const [n, text] of Object.entries(lessons)) {
  const topics = []
  let snippet = ''
  let inFence = false
  let lang = ''
  let buf = []
  for (const line of text.split('\n')) {
    const f = /^\s*```\s*([\w-]*)/.exec(line)
    if (f) {
      if (!inFence) {
        inFence = true
        lang = f[1]
        buf = []
      } else {
        if (!snippet && /^(py|python)$/i.test(lang)) {
          const useful = buf.filter((l) => l.trim() && !l.trim().startsWith('#'))
          if (useful.length >= 1 && useful.length <= 8) snippet = buf.slice(0, 7).join('\n')
        }
        inFence = false
      }
      continue
    }
    if (inFence) {
      buf.push(line)
      continue
    }
    const h = /^##\s+(.+)$/.exec(line)
    if (h) {
      const t = stripEmoji(h[1])
      if (t && !/^Exercises?\b/i.test(t) && !/^(summary|conclusion)/i.test(t)) topics.push(t)
    }
  }
  previews[n] = { topics: topics.slice(0, 6), snippet }
}

mkdirSync(join(root, 'src/data'), { recursive: true })
mkdirSync(join(root, 'public/lessons'), { recursive: true })
for (const [n, text] of Object.entries(lessons)) writeFileSync(join(root, 'public/lessons', `${String(n).padStart(2, '0')}.md`), text)
writeFileSync(join(root, 'src/data/previews.generated.json'), JSON.stringify(previews))

if (existsSync(join(course, 'images'))) {
  cpSync(join(course, 'images'), join(root, 'public/course-images'), { recursive: true })
}
console.log(`prepare: ${Object.keys(lessons).length} lessons, images copied`)

// Exercise files are authored in content/exercises/ and served from public/exercises/ (fetched per day, never bundled).
const exSrc = join(root, 'content/exercises')
if (existsSync(exSrc)) {
  cpSync(exSrc, join(root, 'public/exercises'), { recursive: true })
  console.log(`prepare: ${readdirSync(exSrc).filter((f) => f.endsWith('.json')).length} exercise files copied`)
}

// Anlatım card files (content/cards/day01.json ... day30.json) are served from public/cards/ and fetched per day. A missing
// day is fine: the Anlatım tab shows "hazırlanıyor" for it. The count and reading time of each day also go to the home page preview.
const cardSrc = join(root, 'content/cards')
if (existsSync(cardSrc)) {
  cpSync(cardSrc, join(root, 'public/cards'), { recursive: true })
  let n = 0
  for (const f of readdirSync(cardSrc).filter((f) => /^day\d\d\.json$/.test(f))) {
    try {
      const d = JSON.parse(readFileSync(join(cardSrc, f), 'utf8'))
      const day = Number(f.slice(3, 5))
      if (Array.isArray(d.cards) && previews[day]) {
        previews[day].cards = d.cards.length
        previews[day].cardMin = Math.max(1, Math.round(d.est_minutes ?? d.cards.length * 0.7))
        n++
      }
    } catch {
      console.warn(`prepare: ${f} is not valid JSON, skipped for the preview`)
    }
  }
  writeFileSync(join(root, 'src/data/previews.generated.json'), JSON.stringify(previews))
  console.log(`prepare: ${n} card files copied`)
}

// Part-end boss projects (content/bosses/part1.json ... part5.json) are served from public/bosses/. A missing file is fine:
// the boss page shows "hazırlanıyor" for it.
const bossSrc = join(root, 'content/bosses')
if (existsSync(bossSrc)) {
  cpSync(bossSrc, join(root, 'public/bosses'), { recursive: true })
  console.log(`prepare: ${readdirSync(bossSrc).filter((f) => f.endsWith('.json')).length} boss files copied`)
}
