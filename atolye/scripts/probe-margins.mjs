// One-off: which home elements end 59 px from the right edge at 1440 px (the inspector's off-centre WARN)?
import { chromium } from 'playwright-core'

const url = process.argv[2] || 'http://127.0.0.1:4322/'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url)
await page.waitForTimeout(1500)
const rows = await page.evaluate(() => {
  const out = []
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.width < 30 || r.height < 10) continue
    const right = Math.round(innerWidth - r.right)
    const left = Math.round(r.left)
    if (right >= 50 && right <= 68 && left >= 0) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} left=${left} right=${right} top=${Math.round(r.top + scrollY)} w=${Math.round(r.width)}`)
  }
  return out
})
console.log(rows.slice(0, 40).join('\n'))
await browser.close()
