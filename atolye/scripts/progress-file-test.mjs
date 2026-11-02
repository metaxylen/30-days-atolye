// Checks that progress survives cleared browser data / another browser, via atolye/.ilerleme/progress.json.
//   PW_CORE=/path/to/playwright-core/index.mjs node scripts/progress-file-test.mjs [--dist dist]
// Runs `vite preview` on a free port against a TEMP progress file (ATOLYE_PROGRESS_FILE), so the real file is untouched.
import { createServer } from 'node:http'
import { createReadStream, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { extname, join, resolve, sep } from 'node:path'
import { createServer as netServer } from 'node:net'

const args = process.argv.slice(2)
const di = args.indexOf('--dist')
const dist = resolve(di < 0 ? 'dist' : args[di + 1])
const { chromium } = await import(process.env.PW_CORE || 'playwright-core')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const tmp = mkdtempSync(join(tmpdir(), 'atolye-progress-'))
const FILE = join(tmp, 'sub', 'progress.json') // the folder does not exist: the plugin must create it
const KEY = 'atolye:v1'

const freePort = () =>
  new Promise((res) => {
    const s = netServer()
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port
      s.close(() => res(p))
    })
  })

async function until(fn, what, ms = 10000) {
  const t0 = Date.now()
  for (;;) {
    let v
    try {
      v = await fn()
    } catch {
      v = null
    }
    if (v) return v
    if (Date.now() - t0 > ms) throw new Error('timed out waiting for: ' + what)
    await sleep(100)
  }
}
const readFile = () => (existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : null)
const ls = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY)

// ---- servers
const port = await freePort()
const viteBin = resolve('node_modules/vite/bin/vite.js')
const preview = spawn(process.execPath, [viteBin, 'preview', '--outDir', dist, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  env: { ...process.env, ATOLYE_PROGRESS_FILE: FILE },
  stdio: 'ignore',
})
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.md': 'text/markdown', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4' }
const plain = createServer((req, res) => {
  try {
    let f = resolve(join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (f !== dist && !f.startsWith(dist + sep)) throw new Error('out')
    if (statSync(f).isDirectory()) f = join(f, 'index.html')
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream', 'content-length': statSync(f).size })
    createReadStream(f).pipe(res)
  } catch {
    res.writeHead(404)
    res.end('nf')
  }
})
await new Promise((r) => plain.listen(0, '127.0.0.1', r))
const PREVIEW = `http://127.0.0.1:${port}/`
const STATIC = `http://127.0.0.1:${plain.address().port}/`
await until(() => fetch(PREVIEW).then((r) => r.ok), 'vite preview to answer', 20000)

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const results = []
async function T(name, fn) {
  try {
    await fn()
    results.push([name, true])
    console.log('PASS', name)
  } catch (e) {
    results.push([name, false])
    console.log('FAIL', name, '-', e.message)
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m)
}
async function open(ctx, url) {
  const page = await ctx.newPage()
  page.errors = []
  page.on('pageerror', (e) => page.errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && page.errors.push('console: ' + m.text()))
  await page.goto(url)
  await page.locator('.menu-btn').first().waitFor({ timeout: 20000 })
  return page
}

// the theme switch sits in the settings menu: open it if it is closed, then flip the theme (any store action would do)
async function toggleTheme(page) {
  const t = page.locator('.theme-toggle').first()
  if (!(await t.isVisible())) await page.locator('.menu-btn').first().click()
  await t.click()
}

// Leaves the app (its pagehide flush writes the state), lets that settle, runs `setup`, then opens the app fresh.
// Setting storage or the file while the app is open would be overwritten by that flush.
async function restart(page, setup) {
  await page.goto(PREVIEW + 'version.json')
  await sleep(600)
  await setup()
  await page.goto(PREVIEW)
  await page.locator('.menu-btn').first().waitFor({ timeout: 20000 })
}
const seed = (page, o) => page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(o)])

const legacy = { v: 1, done: { 1: '2026-01-01' }, xp: 120, runs: { '1:a': 3 } } // no updatedAt: what a learner has today
let ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
let page

await T('existing localStorage progress is written to the file on first load', async () => {
  page = await ctx.newPage()
  await restart(page, () => seed(page, legacy))
  const f = await until(() => readFile()?.xp === 120 && readFile(), 'file to hold xp 120')
  assert(f.done['1'] === '2026-01-01', 'done day missing in file')
  assert((await ls(page)).xp === 120, 'localStorage lost its progress')
})

await T('a new action is stamped and saved to the file', async () => {
  await toggleTheme(page)
  const f = await until(() => readFile()?.theme && readFile(), 'file to hold the theme')
  assert(typeof f.updatedAt === 'number', 'file has no updatedAt')
  assert(f.xp === 120, 'xp lost on save')
})

await T('cleared browser data: progress comes back from the file', async () => {
  await restart(page, () => page.evaluate(() => localStorage.clear()))
  const s = await until(async () => (await ls(page))?.xp === 120 && (await ls(page)), 'localStorage restored')
  assert(s.done['1'] === '2026-01-01', 'done day not restored')
})

await T('a second browser context sees the same progress', async () => {
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const p2 = await open(ctx2, PREVIEW)
  const s = await until(async () => (await ls(p2))?.xp === 120 && (await ls(p2)), 'second context to get xp 120')
  assert(s.done['1'] === '2026-01-01', 'done day missing')
  await ctx2.close()
})

await T('file deleted, localStorage kept: progress stays and the file is re-written', async () => {
  await restart(page, () => rmSync(FILE))
  const f = await until(() => readFile()?.xp === 120 && readFile(), 'file re-written')
  assert(f.done['1'] === '2026-01-01', 'done day missing in re-written file')
  assert((await ls(page)).xp === 120, 'localStorage lost progress')
})

await T('newer file wins over older localStorage', async () => {
  await restart(page, () => writeFileSync(FILE, JSON.stringify({ ...readFile(), xp: 999, updatedAt: Date.now() + 60000 })))
  await until(async () => (await ls(page))?.xp === 999, 'localStorage to take the newer file')
})

await T('older file does not overwrite newer localStorage', async () => {
  await restart(page, () => writeFileSync(FILE, JSON.stringify({ ...readFile(), xp: 5, updatedAt: 1 })))
  await until(() => readFile()?.xp === 999, 'file to be refreshed from localStorage')
  assert((await ls(page)).xp === 999, 'localStorage was overwritten by an older file')
})

await T('without timestamps the side with more XP wins', async () => {
  await restart(page, async () => {
    writeFileSync(FILE, JSON.stringify({ v: 1, done: {}, xp: 5 }))
    await seed(page, legacy)
  })
  await until(() => readFile()?.xp === 120, 'file to take the legacy localStorage')
})

await T('the endpoint rejects bad bodies', async () => {
  const put = (body, type = 'application/json') => fetch(PREVIEW + '__progress', { method: 'PUT', headers: { 'content-type': type }, body }).then((r) => r.status)
  assert((await put('not json')) === 400, 'non-JSON accepted')
  assert((await put('[1,2]')) === 400, 'array accepted')
  assert((await put('{"v":2}')) === 400, 'wrong shape accepted')
  assert((await put('{"v":1,"done":{}}', 'text/plain')) === 415, 'non-JSON content type accepted')
  assert((await put('{"v":1,"done":{},"pad":"' + 'x'.repeat(5.5 * 1024 * 1024) + '"}')) === 413, 'oversized body accepted')
  assert(readFile()?.xp === 120, 'file damaged by rejected requests')
})

await page.close()
await ctx.close()

await T('endpoint absent (plain static server): works on localStorage alone, no errors', async () => {
  const c = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const p = await c.newPage()
  p.errors = []
  p.on('pageerror', (e) => p.errors.push(String(e)))
  // the browser itself logs a 404 for the probe; that line is expected on static hosting and is not an app error
  p.on('console', (m) => m.type() === 'error' && !/404/.test(m.text()) && p.errors.push('console: ' + m.text()))
  const puts = []
  p.on('request', (r) => r.method() === 'PUT' && puts.push(r.url()))
  await p.goto(STATIC)
  await p.locator('.menu-btn').first().waitFor({ timeout: 20000 })
  await toggleTheme(p)
  await until(async () => (await ls(p))?.theme, 'theme saved to localStorage')
  await toggleTheme(p)
  await sleep(2500)
  assert(puts.length === 0, 'tried to PUT to a host without the endpoint: ' + puts)
  assert(p.errors.length === 0, 'errors: ' + p.errors.join(' | '))
  await c.close()
})

await browser.close()
plain.close()
preview.kill()
rmSync(tmp, { recursive: true, force: true })
const bad = results.filter((r) => !r[1])
console.log(`\n${results.length - bad.length}/${results.length} passed`)
process.exit(bad.length ? 1 : 0)
