import MarkdownIt, { type Token } from 'markdown-it'
import { DAYS, FOLDER_DAY } from '../data/days'

export interface CellDef {
  id: string
  kind: 'code' | 'scratch'
  code: string
  /** Exercise heading the scratch cell belongs to. */
  title?: string
}

export interface Heading {
  id: string
  text: string
  level: number
}

export interface ParsedLesson {
  html: string
  cells: CellDef[]
  headings: Heading[]
  codeCount: number
  scratchCount: number
}

const GITHUB = 'https://github.com/Asabeneh/30-Days-Of-Python/blob/master/'

const md = new MarkdownIt({ html: true, linkify: true, typographer: false })

/** GitHub-style heading slug, so in-lesson #anchors keep working. */
const slug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-')

const stripEmoji = (s: string): string => s.replace(/[\p{Extended_Pictographic}️]/gu, '').replace(/\s+/g, ' ').trim()

/** Emoji read badly aloud and clutter headings; "Example:1" becomes "Example 1". Code fences stay untouched. The lesson text is the English original in both languages. */
function cleanSource(text: string): string {
  let inFence = false
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence
        return line
      }
      if (inFence) return line
      return line
        .replace(/[\p{Extended_Pictographic}\u{FE0F}]/gu, '')
        .replace(/\bExample\s*:\s*(\d+)/g, 'Example $1')
        .replace(/[ \t]+$/g, '')
    })
    .join('\n')
}

/** Pseudo-code such as [expression for i in iterable if condition] is a pattern to read, not a program to run. */
const isPattern = (code: string): boolean => /\b(expression|iterable|condition|statement|your_code)\b/.test(code) && !/\bprint\s*\(/.test(code)

const NAV_LINE = /^\s*(\[<<[^\]]*\]\([^)]*\))?\s*\|?\s*(\[[^\]]*>>\]\([^)]*\))?\s*$/
const EXERCISE = /^Exercises?\b/i
const LEVEL = /level\s*\d/i
const PY = /^(py|python)$/i

function resolveHref(href: string, fromDay: number): { href: string; external: boolean; anchor: boolean } {
  if (/^(https?:|mailto:)/i.test(href)) return { href, external: true, anchor: false }
  if (href.startsWith('#')) return { href, external: false, anchor: true }
  const [pathPart] = href.split('#')
  const folder = /(\d\d_Day_[^/]+)\//.exec(pathPart)
  if (folder && FOLDER_DAY[folder[1]]) return { href: `#/day/${FOLDER_DAY[folder[1]]}`, external: false, anchor: false }
  if (/(^|\/)readme\.md$/i.test(pathPart) && !/[A-Za-z]{3,}\/readme/i.test(pathPart.replace(/^\.\.?\//, ''))) {
    return { href: '#/day/1', external: false, anchor: false }
  }
  // Anything else points into the repository: send it to GitHub, resolved from the lesson's own folder.
  const dayFolder = Object.entries(FOLDER_DAY).find(([, n]) => n === fromDay)?.[0] ?? ''
  const base = fromDay === 1 ? '' : `${dayFolder}/`
  const parts = (base + pathPart).split('/')
  const out: string[] = []
  for (const p of parts) {
    if (p === '..') out.pop()
    else if (p && p !== '.') out.push(p)
  }
  return { href: GITHUB + out.join('/'), external: true, anchor: false }
}

function postProcess(html: string, day: number): string {
  let out = html.replace(/(src|srcset)="(?:\.\.\/|\.\/)?images\//g, '$1="course-images/')
  out = out.replace(/<a\s([^>]*?)href="([^"]+)"([^>]*)>/g, (_m, pre: string, href: string, post: string) => {
    const r = resolveHref(href.replace(/&amp;/g, '&'), day)
    const ext = r.external ? ' target="_blank" rel="noopener noreferrer"' : ''
    return `<a ${pre}href="${r.href}"${post}${ext}>`
  })
  // Code tokens must not be machine-translated; images below the fold load lazily.
  out = out.replace(/<(code|pre)(\s|>)/g, '<$1 translate="no"$2')
  return out.replace(/<img\s/g, '<img loading="lazy" decoding="async" ')
}

function headingText(tokens: Token[], i: number): string {
  return tokens[i + 1]?.content ?? ''
}

const cache = new Map<number, Promise<ParsedLesson>>()

/** Fetches one lesson's Markdown and renders it. The Markdown engine and the lesson text only load when a lesson text is needed. */
export function loadLesson(day: number): Promise<ParsedLesson> {
  let p = cache.get(day)
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}lessons/${String(day).padStart(2, '0')}.md`)
      .then((r) => (r.ok ? r.text() : ''))
      .catch(() => '')
      .then((text) => parseLessonText(day, text))
    cache.set(day, p)
  }
  return p
}

export function parseLessonText(day: number, raw: string): ParsedLesson {
  const source = cleanSource(raw)
  const env = {}
  const all = md.parse(source, env)

  // Cut the repo header (badges, nav, banner, TOC) and the redundant "Day N" h1.
  let start = 0
  for (let i = 0; i < all.length; i++) {
    if (all[i].type === 'heading_open' && all[i].tag === 'h1' && /^Day\s*\d+/i.test(stripEmoji(headingText(all, i)))) {
      start = i + 3
      break
    }
  }
  const tokens: Token[] = []
  const dayTitle = (DAYS.find((d) => d.n === day)?.title ?? '').toLowerCase()
  let droppedTitle = false
  for (let i = start; i < all.length; i++) {
    const t = all[i]
    if (!droppedTitle && t.type === 'heading_open' && /^h[12]$/.test(t.tag) && stripEmoji(headingText(all, i)).toLowerCase() === dayTitle) {
      droppedTitle = true
      i += 2
      continue
    }
    // Drop the "<< Day n | Day m >>" lines repeated at the foot of each lesson.
    if (t.type === 'paragraph_open' && all[i + 1]?.type === 'inline' && all[i + 1].content.trim() && NAV_LINE.test(all[i + 1].content)) {
      i += 2
      continue
    }
    tokens.push(t)
  }

  const cells: CellDef[] = []
  const headings: Heading[] = []
  const seen = new Map<string, number>()
  let codeCount = 0
  let scratchCount = 0
  let ex: { level: number; title: string; levels: number } | null = null
  let lv: { level: number; title: string } | null = null

  const scratchTokens = (title: string): Token[] => {
    const id = `${day}:x${scratchCount++}`
    cells.push({ id, kind: 'scratch', code: '', title })
    const t = new (tokens[0]?.constructor as typeof Token)('html_block', '', 0)
    t.content = `<div class="cell-slot" data-cell="${id}"></div>\n`
    t.block = true
    return [t]
  }

  const out: Token[] = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]

    if (t.type === 'heading_open') {
      const level = Number(t.tag.slice(1))
      const text = headingText(tokens, i)
      if (lv && level <= lv.level) {
        out.push(...scratchTokens(lv.title))
        lv = null
      }
      if (ex && level <= ex.level) {
        if (ex.levels === 0) out.push(...scratchTokens(ex.title))
        ex = null
      }
      if (EXERCISE.test(stripEmoji(text))) {
        if (LEVEL.test(text)) {
          lv = { level, title: stripEmoji(text) }
          if (ex) ex.levels++
        } else {
          ex = { level, title: stripEmoji(text), levels: 0 }
        }
      }
      const base = slug(text)
      const n = seen.get(base) ?? 0
      seen.set(base, n + 1)
      const id = n === 0 ? base : `${base}-${n}`
      t.attrSet('id', id)
      if (level >= 2 && level <= 3) headings.push({ id, text: stripEmoji(text), level })
      out.push(t)
      continue
    }

    if (t.type === 'fence' && PY.test(t.info.trim().split(/\s+/)[0] ?? '') && !isPattern(t.content)) {
      const id = `${day}:${codeCount++}`
      cells.push({ id, kind: 'code', code: t.content.replace(/\n+$/, '') })
      const ph = new (t.constructor as typeof Token)('html_block', '', 0)
      ph.content = `<div class="cell-slot" data-cell="${id}"></div>\n`
      ph.block = true
      ph.level = t.level
      out.push(ph)
      continue
    }

    out.push(t)
  }
  if (lv) out.push(...scratchTokens((lv as { title: string }).title))
  if (ex && (ex as { levels: number }).levels === 0) out.push(...scratchTokens((ex as { title: string }).title))

  const html = postProcess(md.renderer.render(out, md.options, env), day)
  return { html, cells, headings, codeCount, scratchCount }
}

