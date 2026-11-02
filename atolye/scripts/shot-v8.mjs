// Screenshots of the built site in both themes. node scripts/shot-v8.mjs <base-url> <out-dir> <route:name>[,<route:name>...] [widths=1440,768,390] [full]
// A little progress is seeded (days 1-2 done, some XP) so the XP unit, the map and the streak show real states.
const { chromium } = await import(process.env.PW_CORE || 'playwright-core')
import { mkdirSync } from 'node:fs'
const [base, out, routes, widthsArg = '1440,768,390', full] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const today = new Date()
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const seed = { v: 1, xp: 240, done: { 1: iso(today), 2: iso(today) }, learnDays: [iso(today)] }
for (const theme of ['light', 'dark']) {
  for (const w of widthsArg.split(',').map(Number)) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : w < 900 ? 1024 : 900 }, colorScheme: theme, reducedMotion: 'reduce' })
    await ctx.addInitScript(([s, th]) => { if (!localStorage.getItem('atolye:v1')) localStorage.setItem('atolye:v1', JSON.stringify({ ...s, theme: th })) }, [seed, theme])
    const page = await ctx.newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push(String(e)))
    for (const r of routes.split(',')) {
      const [route, name] = r.split('@')
      await page.goto(base + route)
      await page.waitForTimeout(1800)
      await page.screenshot({ path: `${out}/${name}-${theme}-${w}.png`, fullPage: full === 'full' })
    }
    if (errs.length) console.log(theme, w, 'ERRORS', errs.slice(0, 3))
    await ctx.close()
  }
}
await browser.close()
