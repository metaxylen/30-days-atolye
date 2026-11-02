// One-off: decoded byte sizes of the Pyodide files the worker downloads (used for the progress percentage).
import { chromium } from 'playwright-core'

const BASE = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage()
await page.goto('about:blank')
for (const f of ['pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json', 'pyodide.asm.js', 'pyodide.mjs']) {
  const n = await page.evaluate(async (u) => {
    try {
      const r = await fetch(u, { cache: 'no-store' })
      const b = await r.arrayBuffer()
      return b.byteLength
    } catch (e) {
      return String(e)
    }
  }, BASE + f)
  console.log(f, n)
}
await browser.close()
