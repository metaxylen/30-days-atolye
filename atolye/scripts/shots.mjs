// Screenshots for the visual review: home and learn screens, dark and light, with a returning learner's progress seeded.
//   node scripts/shots.mjs http://127.0.0.1:4322/ [outDir]
import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright-core'

const base = process.argv[2] || 'http://127.0.0.1:4322/'
const out = resolve(process.argv[3] || '.taste-skill/shots-r3')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })

const day = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const seed = {
  v: 1,
  done: { 1: day(2), 2: day(1) },
  runs: { '1:a': 2 },
  xp: 140,
  learnDays: [day(2), day(1), day(0)],
  review: {
    'd01-b1': { day: 1, concept: 'x', box: 0, due: day(0), ok: 0, retired: false, pool: ['d01-b1-e1'], asked: 0, last: day(2) },
    'd01-b2': { day: 1, concept: 'y', box: 0, due: day(0), ok: 0, retired: false, pool: ['d01-b2-e1'], asked: 0, last: day(2) },
    'd01-b3': { day: 1, concept: 'z', box: 0, due: day(0), ok: 0, retired: false, pool: ['d01-b3-e1'], asked: 0, last: day(2) },
  },
  blocks: { 'd01-b1': { day: 1, date: day(0) } },
}

for (const scheme of ['dark', 'light']) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: w < 600 ? 'no-preference' : 'no-preference' })
    await ctx.addInitScript(([s]) => {
      localStorage.setItem('atolye:v1', JSON.stringify(s))
    }, [seed])
    const page = await ctx.newPage()
    await page.goto(base + '#/')
    await page.waitForTimeout(2500)
    await page.screenshot({ path: join(out, `home-${scheme}-${w}.png`) })
    if (w === 1440) {
      await page.evaluate(() => window.scrollTo(0, 1100))
      await page.waitForTimeout(1200)
      await page.screenshot({ path: join(out, `home-${scheme}-${w}-map.png`) })
    }
    await page.goto(base + '#/day/2')
    await page.waitForTimeout(3500)
    await page.screenshot({ path: join(out, `learn-${scheme}-${w}.png`) })
    await ctx.close()
  }
}
await browser.close()
console.log('saved to ' + out)
