// End-to-end checks for the learn flow, driven in a real Chrome through playwright-core.
//   PW_CORE=/path/to/node_modules/playwright-core/index.mjs node scripts/e2e.mjs [--only name,name] [--shard i/n] [--dist dist] [--out DIR]
// Serves dist/ on a throwaway port. Exercises are read from the served site, so the tests follow the content.
import { createServer } from 'node:http'
import { createReadStream, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve, sep } from 'node:path'

const args = process.argv.slice(2)
const flag = (n, d) => {
  const i = args.indexOf('--' + n)
  return i < 0 ? d : args[i + 1]
}
const only = flag('only', '')
  .split(',')
  .filter(Boolean)
const dist = resolve(flag('dist', 'dist'))
// what the server serves: the build under test, or (version tests) a second build swapped in while a tab is open
let root = dist
const out = resolve(flag('out', '.taste-skill/e2e'))
mkdirSync(out, { recursive: true })
const { chromium } = await import(process.env.PW_CORE || 'playwright-core')

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.md': 'text/markdown', '.woff2': 'font/woff2', '.mp4': 'video/mp4' }
const server = createServer((req, res) => {
  try {
    let f = resolve(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (f !== root && !f.startsWith(root + sep)) throw new Error('out')
    if (statSync(f).isDirectory()) f = join(f, 'index.html')
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream', 'content-length': statSync(f).size })
    createReadStream(f).pipe(res)
  } catch {
    res.writeHead(404)
    res.end('nf')
  }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/`

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function newPage(opts = {}) {
  const ctx = opts.ctx ?? (await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts }))
  const page = await ctx.newPage()
  page.errors = []
  page.on('pageerror', (e) => page.errors.push(String(e)))
  lastPage = page
  return page
}
let lastPage = null
// web fonts load with display=swap; layout measurements wait for them so a slow font download cannot shift the boxes
const fontsReady = (page) => page.evaluate(() => document.fonts.ready.then(() => true))
// page.evaluate has no timeout of its own: a frozen page would hang the run, so reading the store is raced against 20 s
const store = (page) =>
  Promise.race([
    page.evaluate(() => JSON.parse(localStorage.getItem('atolye:v1') || 'null')),
    new Promise((_, rej) => setTimeout(() => rej(new Error('page did not answer within 20 s (frozen?)')), 20000)),
  ])
const flush = () => sleep(400) // the store persists on a 250 ms timer

async function loadDayJson(page, n) {
  const name = `day${String(n).padStart(2, '0')}.json`
  return page.evaluate((u) => fetch(u).then((r) => r.json()), BASE + 'exercises/' + name)
}

/** Same order as stepsOf() in src/lib/exercises.ts. */
function stepsOf(d) {
  const o = []
  d.blocks.forEach((b, bi) => {
    const firstPredict = b.exercises.findIndex((e) => e.type === 'predict')
    if (firstPredict < 0 && b.worked_example) o.push({ kind: 'worked', block: bi, b })
    b.exercises.forEach((e, i) => {
      o.push({ kind: e.type, block: bi, ex: e })
      if (i === firstPredict && b.worked_example) o.push({ kind: 'worked', block: bi, b })
    })
  })
  return o
}

const promptOf = (e) => e.prompt_tr || e.prompt
const nextBtn = (page) => page.locator('.step-nav .btn-chev')

async function setEditor(page, code) {
  const ed = page.locator('.step-card .cm-content').first()
  await ed.waitFor({ timeout: 20000 })
  await ed.click()
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await page.keyboard.press('Delete')
  if (code) await page.keyboard.insertText(code)
}

async function waitPyReady(page) {
  await page.waitForFunction(() => document.documentElement.dataset.py === 'ready', null, { timeout: 90000 })
}

/** Solves the exercise on screen with its reference solution. */
async function solve(page, ex) {
  const card = page.locator('.step-card')
  switch (ex.type) {
    case 'predict': {
      const choices = ex.choices ?? []
      if (choices.length) {
        const i = choices.findIndex((c) => c === ex.expected_output)
        await card.locator('label.choice').nth(i).click()
      } else await card.locator('textarea.predict-typed').fill(ex.expected_output)
      await card.getByRole('button', { name: 'Kontrol et' }).click() // one action: lock, run, compare
      break
    }
    case 'fill_blank': {
      const inputs = card.locator('input.fill-input')
      const n = await inputs.count()
      for (let i = 0; i < n; i++) await inputs.nth(i).fill(ex.blanks[i].answer[0])
      await card.getByRole('button', { name: 'Kontrol et' }).click()
      break
    }
    case 'parsons': {
      for (const idx of ex.correct_order) {
        const text = ex.lines[idx].trim()
        await card.locator('button.p-line').filter({ hasText: text }).first().click()
      }
      await card.locator('.step-actions .btn-chev').first().click()
      break
    }
    case 'modify':
    case 'write':
    case 'debug': {
      const code = ex.solution?.code ?? ''
      await setEditor(page, code)
      await card.getByRole('button', { name: 'Kontrol et' }).click()
      break
    }
    case 'type_it': {
      await card.getByRole('button', { name: 'Hazırım, gizle' }).click()
      await setEditor(page, ex.code)
      await card.getByRole('button', { name: 'Çalıştır ve kontrol et' }).click()
      break
    }
    case 'explain': {
      const text = (ex.model_answer_tr || ex.model_answer || 'x').replace(/\s+/g, ' ')
      await card.locator('textarea[name=aciklama]').fill(text)
      await card.getByRole('button', { name: 'Cevabımı gönder' }).click()
      await card.getByRole('button', { name: /^Tamam/ }).click()
      return
    }
  }
}

async function waitSolved(page) {
  // the first check of a session also waits for Python to download (about 12 MB)
  await page.locator('.step-card p.solved, .step-card .done-panel').first().waitFor({ timeout: 80000 })
}

/** Plays one day through the UI. skipTwin: use "Atla" on optional twins instead of solving them. */
async function playDay(page, n, { skipTwin = false, stopAtQuiz = true } = {}) {
  await page.goto(BASE + `#/day/${n}/learn`)
  await page.locator('.learn').waitFor()
  const d = await loadDayJson(page, n)
  const steps = stepsOf(d)
  const log = { skipped: [], solved: [] }
  for (let guard = 0; guard < steps.length + 5; guard++) {
    const onQuiz = await page.locator('.quiz-card').count()
    if (onQuiz) break
    const kind = await page.locator('.step-card').getAttribute('data-kind')
    if (kind === 'worked') {
      await page.getByRole('button', { name: 'Anladım' }).click()
    } else {
      // The app walks the day in stepsOf() order and every step (solved, skipped or read) advances by one, so the exercise on
      // screen is steps[guard]. Prompts are not unique ("Bu program ne yazdırır?" opens many predicts), so never look one up by text.
      const ex = steps[guard]?.ex
      if (!ex || ex.type !== kind) throw new Error(`step ${guard} is ${steps[guard]?.kind}, the page shows ${kind}`)
      const isOpt = (await page.locator('.step-card .step-note', { hasText: 'isteğe bağlı' }).count()) > 0
      if (isOpt && skipTwin) {
        await page.getByRole('button', { name: 'Atla' }).click()
        log.skipped.push(ex.id)
        continue
      }
      await solve(page, ex)
      await waitSolved(page)
      log.solved.push(ex.id)
    }
    await nextBtn(page).click()
  }
  await page.locator('.quiz-card').waitFor()
  return { d, steps, log }
}

/** Closed-book quiz: solve each item by its prompt, or skip them all with "Bilmiyorum, geç". */
async function runQuiz(page, d, { skipAll = false } = {}) {
  const all = d.blocks.flatMap((b) => b.exercises)
  const total = await page.locator('.session .strip li').count()
  for (let i = 0; i < total; i++) {
    if (skipAll) {
      await page.getByRole('button', { name: 'Bilmiyorum, geç' }).click()
    } else {
      const prompt = (await page.locator('.session .step-prompt').first().innerText()).trim()
      let ex = all.find((e) => promptOf(e).trim() === prompt)
      if (!ex) {
        // an earlier day's item: load that day
        for (let k = 1; k <= 30 && !ex; k++) {
          if (k === d.day) continue
          const o = await loadDayJson(page, k).catch(() => null)
          ex = o?.blocks?.flatMap((b) => b.exercises).find((e) => promptOf(e).trim() === prompt)
        }
      }
      await solve(page, ex)
    }
    await page.locator('.session .feedback').waitFor({ timeout: 30000 })
    await page.locator('.session .feedback .btn-chev').click()
  }
  await page.locator('.quiz-card h2', { hasText: 'Gün sonu sınavı bitti' }).waitFor()
}

// ---------------------------------------------------------------------------------------------------------------------

const tests = {}
const T = (name, fn) => (tests[name] = fn)

/** C1: the last rung of the hint ladder counts as a reveal; the twin is then required. */
T('c1-last-hint-is-a-reveal', async () => {
  const page = await newPage()
  await page.goto(BASE + '#/day/1/learn')
  await page.locator('.learn').waitFor()
  const d = await loadDayJson(page, 1)
  const steps = stepsOf(d)
  // walk to d01-b2-e3 (first write of the pair) solving what comes before
  const target = steps.findIndex((s) => s.ex?.id === 'd01-b2-e3')
  for (let k = 0; k < target; k++) {
    const st = steps[k]
    if (st.kind === 'worked') await page.getByRole('button', { name: 'Anladım' }).click()
    else {
      await solve(page, st.ex)
      await waitSolved(page)
    }
    await nextBtn(page).click()
  }
  const ex = steps[target].ex
  await flush()
  const xp0 = (await store(page))?.xp ?? 0
  // open every hint
  const hintBtn = page.getByRole('button', { name: /İpucu aç/ })
  const total = (ex.hints ?? []).length
  for (let i = 0; i < total; i++) await hintBtn.click()
  // the solution must stay locked by hints alone
  const solBtnVisible = await page.getByRole('button', { name: 'Çözümü göster' }).count()
  assert(solBtnVisible === 0, 'solution gate must not unlock from hints alone')
  await solve(page, ex)
  await waitSolved(page)
  await flush()
  const s = await store(page)
  assert(s.ex['d01-b2-e3'].revealed === true, 'final hint must be recorded as a reveal (got ' + JSON.stringify(s.ex['d01-b2-e3']) + ')')
  assert(s.xp === xp0, `a revealed solve pays nothing until the twin passes (xp ${xp0} -> ${s.xp})`)
  await nextBtn(page).click()
  const optional = await page.locator('.step-card .step-note', { hasText: 'isteğe bağlı' }).count()
  assert(optional === 0, 'twin must be required after a final-hint solve')
  assert((await page.getByRole('button', { name: 'Atla' }).count()) === 0, 'no Atla on a required twin')
  // solving the twin pays the held XP
  await solve(page, steps[target + 1].ex)
  await waitSolved(page)
  await flush()
  const s2 = await store(page)
  assert(s2.xp > xp0, 'passing the twin pays')
  assert(!s2.ex['d01-b2-e3'].pending, 'held XP released')
  await page.context().close()
})

/** C2 + day flow: skipping the optional twin must still complete the block and unlock the quiz. */
for (const n of [1, 9]) {
  T(`c2-twin-skipped-day${n}`, async () => {
    const page = await newPage()
    const { d, log } = await playDay(page, n, { skipTwin: true })
    await flush()
    const s = await store(page)
    for (const b of d.blocks) assert(s.blocks[b.id], `block ${b.id} must be complete (skipped: ${log.skipped})`)
    assert(log.skipped.length > 0, 'the run must actually skip at least one optional twin')
    assert((await page.locator('.quiz-card .session').count()) + (await page.locator('.quiz-card .boot').count()) > 0, 'quiz must be unlocked, not the locked card')
    await page.locator('.quiz-card .session').waitFor({ timeout: 20000 })
    await page.screenshot({ path: join(out, `day${n}-quiz.png`) })
    await page.context().close()
  })
}

/** C2 variants: the same result with plain "Sonraki" past the twin and after a reload. */
T('c2-next-past-twin-and-reload-day1', async () => {
  const page = await newPage()
  await page.goto(BASE + '#/day/1/learn')
  await page.locator('.learn').waitFor()
  const d = await loadDayJson(page, 1)
  const steps = stepsOf(d)
  for (let k = 0; k < steps.length; k++) {
    const st = steps[k]
    const isOpt = (await page.locator('.step-card .step-note', { hasText: 'isteğe bağlı' }).count()) > 0
    if (isOpt) {
      await nextBtn(page).click() // plain Sonraki, no Atla
      continue
    }
    if (st.kind === 'worked') await page.getByRole('button', { name: 'Anladım' }).click()
    else {
      await solve(page, st.ex)
      await waitSolved(page)
    }
    await nextBtn(page).click()
  }
  await flush()
  await page.reload()
  await page.locator('.learn').waitFor()
  await flush()
  const s = await store(page)
  for (const b of d.blocks) assert(s.blocks[b.id], `block ${b.id} complete after Sonraki + reload`)
  await page.locator('.quiz-card .session').waitFor({ timeout: 20000 })
  await page.context().close()
})

/** Day 1 end to end: quiz, pass mark, day-done XP paid once, no farming by un-marking. */
T('day1-full-flow-quiz-and-day-xp', async () => {
  const page = await newPage()
  const { d } = await playDay(page, 1, { skipTwin: true })
  await page.locator('.quiz-card .session').waitFor()
  // first: fail the quiz on purpose
  await runQuiz(page, d, { skipAll: true })
  await flush()
  let s = await store(page)
  const xpFail = s.xp
  assert(!s.done[1], 'day not marked yet')
  assert((await page.getByRole('button', { name: /Sınavı yeniden çöz/ }).count()) === 1, 'retake offered after a failed quiz')
  // marking done without passing pays no XP
  await page.getByRole('button', { name: /XP olmadan bitir/ }).click()
  await page.getByRole('button', { name: 'Burada kal' }).click()
  await flush()
  s = await store(page)
  assert(s.done[1], 'day marked done')
  assert(s.xp === xpFail && !s.dayXpPaid[1], `no day-done XP without a passed quiz (xp ${xpFail} -> ${s.xp})`)
  // un-mark through the text tab, retake the quiz and pass it for real
  await page.goto(BASE + '#/day/1/full')
  await page.getByRole('button', { name: 'İşareti geri al' }).click()
  await page.goto(BASE + '#/day/1/learn')
  await page.getByRole('button', { name: /Sınavı yeniden çöz/ }).click()
  await page.locator('.quiz-card .session').waitFor({ timeout: 20000 })
  await runQuiz(page, d)
  await flush()
  s = await store(page)
  const q = s.quiz[1]
  assert(q.good / q.total >= 0.6, `quiz passed (${q.good}/${q.total})`)
  const xpBefore = s.xp
  await page.getByRole('button', { name: 'Günü bitir' }).click()
  await flush()
  s = await store(page)
  assert(s.xp === xpBefore + 20 && s.dayXpPaid[1], `day-done pays 20 once (xp ${xpBefore} -> ${s.xp})`)
  await page.screenshot({ path: join(out, 'day1-done.png') })
  // un-mark and finish again: no second payment
  await page.getByRole('button', { name: 'Burada kal' }).click()
  await page.goto(BASE + '#/day/1/full')
  await page.getByRole('button', { name: 'İşareti geri al' }).click()
  await page.goto(BASE + '#/day/1/learn')
  await page.locator('.quiz-card').getByRole('button', { name: 'Günü bitir' }).click()
  await page.getByRole('button', { name: 'Burada kal' }).click()
  await flush()
  const s3 = await store(page)
  assert(s3.xp === s.xp, `re-finishing pays nothing (xp ${s.xp} -> ${s3.xp})`)
  await page.context().close()
})

/** I1 + I2: debug pass shows no failure text, explain needs words and a keyword, predict retry hides the answer, cells pay 0. */
T('i1-i2-small-rules', async () => {
  const page = await newPage()
  await page.goto(BASE + '#/day/1/learn')
  await page.locator('.learn').waitFor()
  const d = await loadDayJson(page, 1)
  const steps = stepsOf(d)

  // predict: wrong first, answer must stay hidden until the second commit
  const p = steps[0].ex
  const wrongIdx = p.choices.findIndex((c) => c !== p.expected_output)
  await page.locator('label.choice').nth(wrongIdx).click()
  await page.getByRole('button', { name: 'Kontrol et' }).click()
  await page.locator('.feedback.is-bad').waitFor()
  assert((await page.locator('.compare').count()) === 0, 'real output must stay hidden after the first wrong guess')
  assert((await page.locator('label.choice.is-right').count()) === 0, 'right choice must not be marked after the first wrong guess')
  const xp0 = (await store(page))?.xp ?? 0
  await page.getByRole('button', { name: /Yeniden tahmin et/ }).click()
  await solve(page, p)
  await waitSolved(page)
  await flush()
  assert(((await store(page)).xp ?? 0) === xp0, 'a predict retry pays no XP')
  await nextBtn(page).click()

  // walk to the debug step of block 1, solve it, check the failure text is absent
  const di = steps.findIndex((s) => s.kind === 'debug')
  for (let k = 1; k < di; k++) {
    const st = steps[k]
    if (st.kind === 'worked') await page.getByRole('button', { name: 'Anladım' }).click()
    else {
      await solve(page, st.ex)
      await waitSolved(page)
    }
    await nextBtn(page).click()
  }
  await solve(page, steps[di].ex)
  await waitSolved(page)
  assert((await page.getByText('Çıktı beklenenle aynı değil').count()) === 0, 'no failure message on a pass')
  await page.context().close()
})

T('i2-explain-rules', async () => {
  const page = await newPage()
  await page.goto(BASE + '#/day/1/learn')
  await page.locator('.learn').waitFor()
  const d = await loadDayJson(page, 1)
  const steps = stepsOf(d)
  const target = steps.findIndex((s) => s.kind === 'explain')
  for (let k = 0; k < target; k++) {
    const st = steps[k]
    if (st.kind === 'worked') await page.getByRole('button', { name: 'Anladım' }).click()
    else {
      const isOpt = (await page.locator('.step-card .step-note', { hasText: 'isteğe bağlı' }).count()) > 0
      if (isOpt) {
        await page.getByRole('button', { name: 'Atla' }).click()
        continue
      }
      await solve(page, st.ex)
      await waitSolved(page)
    }
    await nextBtn(page).click()
  }
  const card = page.locator('.step-card')
  await card.locator('textarea[name=aciklama]').fill('aaaaaaaaaaaaaa')
  assert(await card.getByRole('button', { name: 'Cevabımı gönder' }).isDisabled(), 'one long word is not an answer')
  // the exercise says how many words an answer needs (min_words, 6 by default): enough gibberish words to reach it
  const need = steps[target].ex.min_words ?? 6
  await card.locator('textarea[name=aciklama]').fill(Array.from({ length: need }, (_, i) => 'qq' + 'wertyuiopasdfghjkl'.slice(i % 18, (i % 18) + 3)).join(' '))
  await card.getByRole('button', { name: 'Cevabımı gönder' }).click()
  const xp0 = (await store(page))?.xp ?? 0
  assert((await card.getByRole('button', { name: /^Tamam$/ }).count()) === 0, 'no instant Tamam for a gibberish answer')
  await card.getByRole('button', { name: /Yeniden yaz/ }).click()
  await solve(page, steps[target].ex)
  await waitSolved(page)
  await flush()
  assert((await store(page)).xp > xp0, 'a real answer pays')
  await page.context().close()
})

T('i2-cells-pay-nothing', async () => {
  const page = await newPage()
  await page.goto(BASE + '#/day/1/full')
  await page.locator('.cell').first().waitFor({ timeout: 20000 })
  await page.getByRole('button', { name: 'Tüm hücreleri çalıştır' }).click()
  await page.waitForFunction(() => document.documentElement.dataset.py === 'ready', null, { timeout: 90000 })
  await sleep(4000)
  await flush()
  const s = await store(page)
  assert(Object.keys(s.runs).length > 0, 'cells ran')
  assert((s.xp ?? 0) === 0, 'running lesson cells pays 0 XP (xp=' + s.xp + ')')
  const goalMet = await page.evaluate(() => document.querySelector('.hud-item[title^="Günlük"]')?.getAttribute('title'))
  assert(!/tamam/.test(goalMet || ''), 'daily goal not met by running cells: ' + goalMet)
  await page.context().close()
})

/** C3: tests see the learner's source as __source__, so a hard-coded answer fails. Uses an in-memory exercise. */
T('c3-source-visible-to-tests', async () => {
  const page = await newPage()
  const doc = {
    day: 1,
    title: 'T',
    test_conventions: 'x',
    blocks: [
      {
        id: 'd01-b1',
        concept: 'distance',
        exercises: [
          {
            id: 'd01-b1-e1',
            type: 'write',
            prompt: 'Distance between (2, 3) and (10, 8).',
            starter_code: '',
            tests: [
              { code: "assert '**' in __source__ or 'sqrt' in __source__, 'use the formula'", label: 'uses the formula', failure_message: 'Use the formula.' },
              { code: 'assert abs(distance - 9.433981132056603) < 1e-9' },
              { code: "assert __source__.count('distance') >= 1 and isinstance(__source__, str)", visible: false },
            ],
          },
        ],
      },
    ],
    review_pool: [],
  }
  await page.route('**/exercises/day01.json', (r) => r.fulfill({ json: doc }))
  await page.goto(BASE + '#/day/1/learn')
  await page.locator('.learn').waitFor()
  const card = page.locator('.step-card')
  await setEditor(page, 'distance = 9.433981132056603\nprint(distance)')
  await card.getByRole('button', { name: 'Kontrol et' }).click()
  await card.locator('.tests').waitFor({ timeout: 60000 })
  assert((await card.locator('.tests li.is-bad').count()) >= 1, 'hard-coded answer must fail')
  assert((await page.locator('.step-card p.solved').count()) === 0, 'hard-coded answer must not complete the step')
  await setEditor(page, 'x1, y1, x2, y2 = 2, 3, 10, 8\ndistance = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5\nprint(distance)')
  await card.getByRole('button', { name: 'Kontrol et' }).click()
  await waitSolved(page)
  await page.context().close()
})

/** C3 on the real Day 1 content: hard-coding the answer passes the visible checks but fails the hidden re-run test. */
T('c3-real-content-hardcoded-answer-fails', async () => {
  const page = await newPage()
  await page.goto(BASE + '#/day/1/learn')
  await page.locator('.learn').waitFor()
  const d = await loadDayJson(page, 1)
  assert(/__source__/.test(d.test_conventions || ''), 'day01 test_conventions must mention __source__ (content has not landed)')
  const steps = stepsOf(d)
  // The first write exercise that carries an anti-hardcode test and an exact-output test: typing its expected line must not pass.
  const outputOf = (e) => (e.tests || []).map((t) => /__stdout__\.rstrip\(\)\s*==\s*'((?:[^'\\]|\\.)*)'/.exec(t.code || '')?.[1]).find((x) => x !== undefined)
  const target = steps.findIndex((s) => s.ex?.type === 'write' && (s.ex.tests || []).some((t) => t.anti_hardcode) && outputOf(s.ex) !== undefined)
  assert(target >= 0, 'day 1 has a write exercise with an anti-hardcode test')
  const ex = steps[target].ex
  for (let k = 0; k < target; k++) {
    const st = steps[k]
    const isOpt = (await page.locator('.step-card .step-note', { hasText: 'isteğe bağlı' }).count()) > 0
    if (isOpt) {
      await page.getByRole('button', { name: 'Atla' }).click()
      continue
    }
    if (st.kind === 'worked') await page.getByRole('button', { name: 'Anladım' }).click()
    else {
      await solve(page, st.ex)
      await waitSolved(page)
    }
    await nextBtn(page).click()
  }
  const card = page.locator('.step-card')
  const typed = outputOf(ex).replace(/\\n/g, '\n')
  await setEditor(page, `print(${JSON.stringify(typed)})`)
  await card.getByRole('button', { name: 'Kontrol et' }).click()
  await card.locator('.tests').waitFor({ timeout: 60000 })
  const bad = await card.locator('.tests li.is-bad').count()
  const ok = await card.locator('.tests li.is-ok').count()
  console.log(`    hard-coded answer (${ex.id}): ${ok} checks passed, ${bad} failed`)
  assert(bad >= 1, 'the hidden re-run test must fail a hard-coded answer')
  assert((await page.locator('.step-card p.solved').count()) === 0, 'must not complete the step')
  // visible tests show words, not assert code
  const names = await card.locator('.test-name').allInnerTexts()
  assert(!names.some((n) => /assert|abs\(/.test(n)), 'visible tests must show labels, not assert code: ' + JSON.stringify(names))
  await card.locator('.test-code summary').first().click()
  assert((await card.locator('.test-code code').first().innerText()).includes('__stdout__'), '"Kodu göster" reveals the assert')
  await setEditor(page, ex.solution.code)
  await card.getByRole('button', { name: 'Kontrol et' }).click()
  await waitSolved(page)
  await page.context().close()
})

T('i3-language-toggle', async () => {
  const page = await newPage()
  await page.goto(BASE + '#/day/1/learn')
  await page.locator('.learn').waitFor()
  const d = await loadDayJson(page, 1)
  const ex = d.blocks[0].exercises[0]
  const trPrompt = (await page.locator('.step-card .step-prompt').first().innerText()).trim()
  assert(trPrompt === (ex.prompt_tr || ex.prompt).trim(), 'default is Turkish when available')
  assert((await page.locator('.step-card .step-radio, .step-card [role="radio"]').count()) === 0, 'the per-exercise EN/TR radio is gone')
  // the global switch (LangSwitch) replaces it: one pair of buttons on every route
  await page.locator('.lang-switch .lang-seg-btn.is-en').click()
  // the swap runs inside a view transition (async), so wait for the text instead of reading it at once
  await page.waitForFunction((p) => document.querySelector('.step-card .step-prompt')?.textContent?.trim() === p, ex.prompt.trim(), { timeout: 5000 }).catch(() => {})
  const enPrompt = (await page.locator('.step-card .step-prompt').first().innerText()).trim()
  assert(enPrompt === ex.prompt.trim(), 'EN shows the English original')
  await flush()
  await page.reload()
  await page.locator('.learn').waitFor()
  assert((await page.locator('.lang-switch .lang-seg-btn.is-en').getAttribute('aria-pressed')) === 'true', 'EN persisted')
  assert((await page.evaluate(() => document.documentElement.lang)) === 'en', 'html[lang] follows')
  assert((await page.locator('.step-card .step-prompt').first().innerText()).trim() === ex.prompt.trim(), 'EN persisted in the text')
  await page.context().close()
})

/** I4: Pyodide staged progress, cache on second load. */
T('i4-pyodide-boot-and-cache', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await newPage({ ctx })
  const seen = new Set()
  const t0 = Date.now()
  await page.goto(BASE + '#/day/1/learn')
  await page.locator('.learn').waitFor()
  const poll = setInterval(async () => {
    try {
      const t = await page.locator('.py-boot').first().innerText({ timeout: 200 })
      if (t) seen.add(t.replace(/\s+/g, ' ').trim())
    } catch {
      /* not shown */
    }
  }, 150)
  await waitPyReady(page)
  clearInterval(poll)
  const first = Date.now() - t0
  console.log('    first load to ready: ' + first + ' ms; stages seen: ' + JSON.stringify([...seen]))
  assert(seen.size > 0, 'boot progress must be visible while loading')
  const p2 = await newPage({ ctx })
  const t1 = Date.now()
  await p2.goto(BASE + '#/day/1/learn')
  await p2.locator('.learn').waitFor()
  await waitPyReady(p2)
  const second = Date.now() - t1
  console.log('    second load to ready: ' + second + ' ms')
  assert(second < first, `second load (${second} ms) must be faster than the first (${first} ms)`)
  await ctx.close()
})

/** I4: a boot that never answers ends in a plain message with a retry button after 45 s. */
T('i4-boot-timeout-and-retry', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await newPage({ ctx })
  await ctx.route('**/cdn.jsdelivr.net/**', () => {}) // never answers
  await page.goto(BASE + '#/day/1/learn')
  await page.locator('.learn').waitFor()
  await page.locator('.py-boot').first().waitFor({ timeout: 20000 })
  const btn = page.getByRole('button', { name: 'Yeniden dene' }).first()
  await btn.waitFor({ timeout: 60000 })
  const msg = await page.locator('.py-boot').first().innerText()
  console.log('    timeout message: ' + msg.replace(/\s+/g, ' '))
  await ctx.unroute('**/cdn.jsdelivr.net/**')
  await btn.click()
  await waitPyReady(page)
  await ctx.close()
})

/** Layout: no horizontal scroll at 390, reduced motion, themes. */
T('layout-390-reduced-motion-themes', async () => {
  for (const scheme of ['dark', 'light']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', colorScheme: scheme })
    const page = await newPage({ ctx })
    for (const h of ['#/', '#/day/1', '#/day/9', '#/day/1/full', '#/review']) {
      await page.goto(BASE + h)
      await sleep(1200)
      const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
      assert(w.sw <= w.cw + 1, `${scheme} ${h}: horizontal scroll at 390 (${w.sw} > ${w.cw})`)
    }
    await ctx.close()
  }
  // snake canvas frozen under reduced motion
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await newPage({ ctx })
  await page.goto(BASE + '#/')
  await sleep(1500)
  const a = await page.evaluate(() => document.querySelector('canvas')?.toDataURL() ?? '')
  await sleep(1500)
  const b = await page.evaluate(() => document.querySelector('canvas')?.toDataURL() ?? '')
  assert(a === b, 'canvas is still under reduced motion')
  await ctx.close()
})

// ---------------------------------------------------------------------------------------------------------------------
// Round 4: game feel, combo, sound, speed round, bug hunt, bosses, the growing snake, weekly quests.

const BASE_XP = { predict: 4, fill_blank: 5, parsons: 5, modify: 10, write: 12, debug: 8, explain: 3, type_it: 3 }
const DONE = (days) => Object.fromEntries(days.map((n) => [n, '2026-01-01']))
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

/** A browser context whose localStorage starts as `state` (seeded once per tab, so a reload keeps what the app saved). */
async function seeded(state, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts })
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('atolye:v1', JSON.stringify({ v: 1, ...s }))
      sessionStorage.setItem('seeded', '1')
    }
  }, state)
  return ctx
}

/** The compact HUD on the home page has no Ayarlar button; ⌘K reaches the panel from anywhere. */
async function openSettings(page) {
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K')
  await page.getByPlaceholder('Gün, bölüm ya da komut ara').fill('ayarları')
  await page.getByRole('option', { name: /Ayarları aç/ }).click()
  await page.getByRole('dialog', { name: 'Ayarlar' }).waitFor()
}

/** The sound switch lives in the settings menu: open it (when closed) and hand back the switch. */
async function soundBtn(page) {
  const b = page.locator('.hud-sound').first()
  if (!(await b.isVisible())) await page.locator('.menu-btn').first().click()
  await b.waitFor()
  return b
}

const comboOf =(page) => page.locator('.hud-combo').first().getAttribute('data-combo').then(Number)

/** Combo: consecutive clean first-try answers multiply the next answer's XP (x2, x3, x4), an opened hint drops it to x1. */
T('r4-combo-multiplies-then-resets-on-hint', async () => {
  const page = await newPage()
  await page.goto(BASE + '#/day/1/learn')
  await page.locator('.learn').waitFor()
  const d = await loadDayJson(page, 1)
  const steps = stepsOf(d)
  assert((await comboOf(page)) === 1, 'combo starts at x1')
  let k = 0
  const seen = []
  for (; k < steps.length && seen.length < 4; k++) {
    const st = steps[k]
    if (st.kind === 'worked') {
      await page.getByRole('button', { name: 'Anladım' }).click()
    } else {
      await flush()
      const before = (await store(page))?.xp ?? 0
      const expectMult = Math.min(4, seen.length + 1)
      await solve(page, st.ex)
      await waitSolved(page)
      await flush()
      const gained = ((await store(page))?.xp ?? 0) - before
      seen.push({ type: st.kind, gained, expectMult })
      assert(gained === BASE_XP[st.kind] * expectMult, `answer ${seen.length} (${st.kind}) should pay ${BASE_XP[st.kind]} x${expectMult}, got ${gained}`)
      assert((await comboOf(page)) === Math.min(4, seen.length + 1), 'HUD combo after answer ' + seen.length)
    }
    await nextBtn(page).click()
  }
  assert(seen.length === 4, 'four clean answers were played')
  assert((await comboOf(page)) === 4, 'combo caps at x4')
  // the next exercise with a hint ladder: opening a hint drops the combo to x1 (no XP is taken away)
  let hinted = false
  for (; k < steps.length && !hinted; k++) {
    const st = steps[k]
    if (st.kind === 'worked') {
      await page.getByRole('button', { name: 'Anladım' }).click()
    } else if ((st.ex.hints ?? []).length >= 2 && ['write', 'modify', 'debug', 'fill_blank'].includes(st.kind)) {
      const xp0 = (await store(page))?.xp ?? 0
      await page.getByRole('button', { name: /İpucu aç/ }).click()
      assert((await comboOf(page)) === 1, 'opening a hint resets the combo to x1')
      assert((await page.locator('.hud-combo.is-on').count()) === 0, 'the chevron stack is hidden at x1')
      await flush()
      assert(((await store(page))?.xp ?? 0) === xp0, 'a reset takes no XP away')
      hinted = true
      break
    } else {
      await solve(page, st.ex)
      await waitSolved(page)
    }
    await nextBtn(page).click()
  }
  assert(hinted, 'found an exercise with hints to open')
  await page.context().close()
})

/** Game feel: a wrong prediction shakes the card (fx-bad) and drops the combo; a right one settles it (fx-ok). */
T('r4-answer-feedback-classes', async () => {
  const page = await newPage()
  await page.goto(BASE + '#/day/1/learn')
  await page.locator('.learn').waitFor()
  const d = await loadDayJson(page, 1)
  const steps = stepsOf(d)
  const target = steps.findIndex((s) => s.kind === 'predict' && (s.ex.choices ?? []).length > 1)
  // the first multiple-choice prediction is not necessarily the first step: solve what comes before it
  for (let k = 0; k < target; k++) {
    const st = steps[k]
    const isOpt = (await page.locator('.step-card .step-note', { hasText: 'isteğe bağlı' }).count()) > 0
    if (isOpt) {
      await page.getByRole('button', { name: 'Atla' }).click()
      continue
    }
    if (st.kind === 'worked') await page.getByRole('button', { name: 'Anladım' }).click()
    else {
      await solve(page, st.ex)
      await waitSolved(page)
    }
    await nextBtn(page).click()
  }
  const ex = steps[target].ex
  const card = page.locator('.step-card')
  const wrong = ex.choices.findIndex((c) => c !== ex.expected_output)
  await card.locator('label.choice').nth(wrong).click()
  await card.getByRole('button', { name: 'Kontrol et' }).click()
  await page.waitForSelector('.step-card.fx-bad', { timeout: 60000 })
  assert((await comboOf(page)) === 1, 'a wrong answer keeps the combo at x1')
  await page.getByRole('button', { name: 'Yeniden tahmin et' }).click()
  await solve(page, ex)
  await page.waitForSelector('.step-card.fx-ok', { timeout: 20000 })
  await page.context().close()
})

/** Sound: no AudioContext before a user gesture; the toggle is saved and survives a reload. */
T('r4-sound-toggle-persists-no-context-before-gesture', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await ctx.addInitScript(() => {
    window.__ac = 0
    const Orig = window.AudioContext
    window.AudioContext = class extends Orig {
      constructor(...a) {
        super(...a)
        window.__ac++
      }
    }
  })
  const page = await newPage({ ctx })
  await page.goto(BASE + '#/')
  await sleep(1500)
  assert((await page.evaluate(() => window.__ac)) === 0, 'no AudioContext before the first user gesture')
  const btn = await soundBtn(page)
  assert((await btn.getAttribute('aria-pressed')) === 'true', 'sound is on by default')
  await btn.click() // off: nothing may play
  await flush()
  assert((await store(page)).settings.sound === false, 'the off state is saved')
  assert((await page.evaluate(() => window.__ac)) === 0, 'turning sound off creates no AudioContext')
  await page.reload()
  assert((await (await soundBtn(page)).getAttribute('aria-pressed')) === 'false', 'sound stays off after a reload')
  assert((await page.evaluate(() => window.__ac)) === 0, 'still no AudioContext after the reload')
  await (await soundBtn(page)).click() // on: a short preview plays, and the click was the gesture
  await sleep(300)
  assert((await page.evaluate(() => window.__ac)) === 1, 'the first sound after a gesture creates exactly one AudioContext')
  assert((await store(page)).settings.sound === true, 'the on state is saved')
  // settings panel offers the same switch
  await openSettings(page)
  await page.getByRole('radio', { name: 'Sessiz' }).click()
  await flush()
  assert((await store(page)).settings.sound === false, 'the settings switch saves too')
  await ctx.close()
})

/** Speed round on a mocked clock: 60 s, right answers by key, a miss with its explanation, a personal best that is saved. */
T('r4-speed-round-60s-saves-best', async () => {
  const ctx = await seeded({ done: DONE([1]), xp: 0 })
  const page = await newPage({ ctx })
  await page.clock.install({ time: new Date('2026-03-04T10:00:00') })
  await page.goto(BASE + '#/speed')
  const startBtn = page.getByRole('button', { name: 'Başla' })
  await startBtn.waitFor({ timeout: 20000 })
  await page.waitForFunction(() => !document.querySelector('.speed-card button.btn-chev')?.disabled)
  // every day's predict questions, to know the right key for the question on screen
  const all = []
  for (let n = 1; n <= 4; n++) all.push(...(await loadDayJson(page, n)).blocks.flatMap((b) => b.exercises).filter((e) => e.type === 'predict'))
  const squash = (s) => s.replace(/\s+/g, ' ').trim()
  const rightKey = async () => {
    const text = squash(await page.locator('.speed-card .pyview').first().innerText())
    const ex = all.find((e) => squash(e.code ?? '') === text && (e.choices ?? []).length > 1)
    if (!ex) throw new Error('question not found: ' + text.slice(0, 60))
    return ex.choices.findIndex((c) => c === ex.expected_output) + 1
  }
  const play = async (rounds, misses) => {
    await page.getByRole('button', { name: /Başla|Bir tur daha/ }).click()
    await page.locator('.speed-clock').waitFor()
    for (let i = 0; i < rounds; i++) {
      const key = await rightKey()
      const wrongKey = key === 1 ? 2 : 1
      await page.keyboard.press(String(i < misses ? wrongKey : key))
      await page.clock.runFor(1200) // the feedback beat, then the next question
    }
    await page.clock.runFor(60000) // the rest of the minute
    await page.locator('#sp-done').waitFor()
  }
  await flush()
  const xp0 = ((await store(page))?.xp) ?? 0
  // round 1: 1 miss then 9 right
  await play(10, 1)
  await page.clock.runFor(500)
  assert(/9 doğru/.test(await page.locator('#sp-done').innerText()), 'round 1 shows 9 right: ' + (await page.locator('#sp-done').innerText()))
  assert((await page.locator('.speed-misses li').count()) === 1, 'the one miss is listed')
  assert((await page.locator('.speed-misses .speed-why').count()) === 1, 'the miss comes with its explanation')
  await page.clock.runFor(500)
  let s = await store(page)
  assert(s.speed.best === 9 && s.speed.plays === 1, 'the personal best is saved: ' + JSON.stringify(s.speed))
  assert(s.xp - xp0 >= 18, `a new best pays 1 XP per right answer doubled (xp +${s.xp - xp0})`)
  assert(s.quest.fast8 === true, '8+ right counts for the weekly quest')
  // round 2: lower score keeps the best, pays 1 per right
  const xp1 = s.xp
  await play(3, 0)
  await page.clock.runFor(500)
  s = await store(page)
  assert(s.speed.best === 9 && s.speed.plays === 2, 'a lower round keeps the best')
  assert(s.xp - xp1 === 3, `a normal round pays 1 per right answer (xp +${s.xp - xp1})`)
  await ctx.close()
})

/** Speed round layout at phone width: the choices are full-width tap targets of at least 56 px. */
T('r4-speed-round-phone', async () => {
  const ctx = await seeded({ done: DONE([1]) }, { viewport: { width: 390, height: 800 }, hasTouch: true })
  const page = await newPage({ ctx })
  await page.goto(BASE + '#/speed')
  await page.getByRole('button', { name: 'Başla' }).click({ timeout: 20000 })
  await page.locator('.speed-choice').first().waitFor()
  const boxes = await page.locator('.speed-choice').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ w: r.width, h: r.height })))
  assert(boxes.length >= 2 && boxes.every((b) => b.h >= 56 && b.w >= 300), 'thumb-sized choices: ' + JSON.stringify(boxes))
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
  assert(!overflow, 'no horizontal scroll at 390 px')
  await page.screenshot({ path: join(out, 'speed-390.png') })
  await ctx.close()
})

const todayIn = (page) =>
  page.evaluate(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

/** Bug hunt: the clicked line is recorded before the fix; the right line pays a bonus; one hunt per day. */
for (const [label, wantRight] of [['right-line', true], ['wrong-line', false]]) {
  T(`r4-bug-hunt-${label}`, async () => {
    const ctx = await seeded({ done: DONE(range(1, 30)) })
    const page = await newPage({ ctx })
    await page.goto(BASE + '#/hunt')
    await page.locator('.hunt-code').waitFor({ timeout: 20000 })
    const lines = await page.locator('.hunt-line code').allInnerTexts()
    // find the exercise on screen among the debug exercises of all days
    let ex = null
    for (let n = 1; n <= 30 && !ex; n++) {
      const o = await loadDayJson(page, n).catch(() => null)
      ex = o?.blocks?.flatMap((b) => b.exercises).find((e) => e.type === 'debug' && e.starter_code && e.starter_code.split('\n').map((l) => l || ' ').join('\n') === lines.join('\n')) ?? null
    }
    assert(ex, 'the hunt shows a real debug exercise')
    const a = ex.starter_code.split('\n')
    const b = ex.solution.code.split('\n')
    const bug = a.findIndex((l, i) => l !== b[i])
    assert(bug >= 0, 'starter and solution differ')
    const pick = wantRight ? bug : a.findIndex((l, i) => i !== bug && l.trim() !== '' && l === b[i])
    await flush()
    const xp0 = (await store(page)).xp ?? 0
    await page.locator('.hunt-line').nth(pick).click()
    await page.locator('.feedback').waitFor()
    const text = await page.locator('.feedback').innerText()
    assert(wantRight ? /Doğru yakaladın/.test(text) : /Hata bu satırda değildi/.test(text), 'prediction feedback: ' + text)
    await flush()
    const date = await todayIn(page)
    let s = await store(page)
    assert(s.hunt[date].line === pick && s.hunt[date].right === wantRight && !s.hunt[date].done, 'the click is saved before the fix: ' + JSON.stringify(s.hunt[date]))
    assert((await page.locator('.hunt-line:not(:disabled)').count()) === 0, 'the lines lock after the click')
    // reload keeps the same hunt and the recorded click
    await page.reload()
    await page.locator('.hunt-code').waitFor()
    assert((await page.locator('.hunt-line code').allInnerTexts()).join('\n') === lines.join('\n'), 'the same hunt after a reload')
    // fix it
    await setEditor(page, ex.solution.code)
    await page.getByRole('button', { name: 'Kontrol et' }).click()
    await page.locator('.done-panel', { hasText: 'Bugünün avı tamam' }).waitFor({ timeout: 80000 })
    await flush()
    s = await store(page)
    assert(s.hunt[date].done === true, 'the hunt is done')
    assert(s.xp - xp0 === (wantRight ? 14 : 8), `fix pays 8 XP, +6 with the right line (got ${s.xp - xp0})`)
    // one per day: the home card shows the done state and the page offers no new hunt
    await page.goto(BASE + '#/')
    await page.locator('.play-card', { hasText: 'Hata avı' }).getByText('Bugünün avı tamam').waitFor()
    await ctx.close()
  })
}

/** Boss: locked with progress, unlocked by finishing the part, stage 1 passes and the health bar drains. */
T('r4-boss-locked-then-unlocked-stage-advances', async () => {
  const locked = await newPage()
  await locked.goto(BASE + '#/boss/1')
  await locked.getByRole('heading', { name: 'Kilitli' }).waitFor()
  assert(/0 \/ 7/.test(await locked.locator('main').innerText()), 'locked page shows the progress 0 / 7')
  await locked.context().close()

  const ctx = await seeded({ done: DONE(range(1, 7)) })
  const page = await newPage({ ctx })
  await page.goto(BASE + '#/boss/1')
  await page.getByRole('heading', { name: /Aşama 1 \/ 4/ }).waitFor({ timeout: 20000 })
  assert((await page.getByLabel('Patronun canı: 4 / 4').count()) === 1, 'the boss starts at full health')
  const boss = await page.evaluate((u) => fetch(u).then((r) => r.json()), BASE + 'bosses/part1.json')
  await flush()
  const xp0 = (await store(page)).xp ?? 0
  await setEditor(page, boss.stages[0].solution.code)
  await page.getByRole('button', { name: 'Kontrol et' }).click()
  await page.locator('.done-panel', { hasText: 'Aşama 1 geçildi' }).waitFor({ timeout: 80000 })
  await flush()
  const s = await store(page)
  assert(s.boss['0'].stage === 1 && !s.boss['0'].done, 'stage 1 is recorded: ' + JSON.stringify(s.boss['0']).slice(0, 80))
  assert(s.xp - xp0 === 12, `a clean stage pays 12 XP (got ${s.xp - xp0})`)
  assert((await page.getByLabel('Patronun canı: 3 / 4').count()) === 1, 'the health bar drained by one chevron')
  await page.getByRole('button', { name: 'Sonraki aşama' }).click()
  await page.getByRole('heading', { name: /Aşama 2 \/ 4/ }).waitFor()
  await ctx.close()
})

/** Boss win: the last stage pays the reward once, gives the part badge and makes the folder tab solid on the home page. */
T('r4-boss-win-badge-and-conquered-tab', async () => {
  const ctx = await seeded({ done: DONE(range(1, 7)), boss: { 0: { stage: 3, code: ['', '', ''], done: false, date: '2026-01-01' } } })
  const page = await newPage({ ctx })
  await page.goto(BASE + '#/boss/1')
  await page.getByRole('heading', { name: /Aşama 4 \/ 4/ }).waitFor({ timeout: 20000 })
  const boss = await page.evaluate((u) => fetch(u).then((r) => r.json()), BASE + 'bosses/part1.json')
  await flush()
  const xp0 = (await store(page)).xp ?? 0
  await setEditor(page, boss.stages[3].solution.code)
  await page.getByRole('button', { name: 'Kontrol et' }).click()
  await page.locator('.done-panel', { hasText: 'Son aşamayı da geçtin' }).waitFor({ timeout: 80000 })
  await flush()
  const s = await store(page)
  assert(s.boss['0'].done === true, 'the boss is beaten')
  assert(s.badges['boss-0'], 'the part badge is unlocked')
  assert(s.xp - xp0 >= (boss.reward_xp ?? 300), `the win pays the reward (xp +${s.xp - xp0})`)
  await page.getByRole('button', { name: 'Zaferi gör' }).click()
  await page.getByRole('heading', { name: /fethedildi/ }).waitFor()
  await page.goto(BASE + '#/')
  await page.locator('.part-card.is-conquered .part-flag').waitFor({ state: 'attached' })
  assert((await page.locator('.part-card.is-conquered').count()) === 1, 'exactly one folder tab is conquered')
  assert((await page.locator('.boss-tile.is-won').count()) === 1, 'the play room shows the won boss')
  await ctx.close()
})

/** The snake: 6 chevrons plus one per concept in Leitner box 2+, new ones animate once, skins unlock by level. */
T('r4-snake-grows-and-skins', async () => {
  const rec = (i, box) => [`b${i}`, { day: 1, concept: `c${i}`, box, due: '2026-12-31', ok: box, retired: false, pool: ['x'], asked: 0, last: '2026-01-01' }]
  const review = Object.fromEntries([rec(1, 2), rec(2, 3), rec(3, 2), rec(4, 4), rec(5, 2), rec(6, 1), rec(7, 0)])
  // 5 concepts at box >= 2 => 11 segments; the learner last saw 8 => 3 are new
  const ctx = await seeded({ review, snakeSeen: 8, done: DONE([1, 2]), xp: 800, settings: { skin: 'loop' } }, { reducedMotion: 'reduce' })
  const page = await newPage({ ctx })
  await page.goto(BASE + '#/')
  await page.locator('.snake-svg').waitFor()
  assert((await page.locator('.snake-svg polygon').count()) === 11, 'snake length is 6 + 5 mastered = 11')
  assert((await page.locator('.home').getAttribute('data-snake-len')) === '11', 'home reports the length')
  assert((await page.locator('.home').getAttribute('data-fresh')) === '3', 'three segments are new this visit')
  assert((await page.locator('.snake-svg .seg-new').count()) === 3, 'the new segments carry the grow animation class')
  const fills = await page.locator('.snake-svg polygon').evaluateAll((els) => els.slice(0, 2).map((e) => e.getAttribute('fill')))
  assert(fills[0] === 'var(--field-1)' && fills[1] === 'var(--field-2)', 'the loop skin alternates periwinkle / lime on finished days: ' + fills)
  await sleep(2600)
  await flush()
  assert((await store(page)).snakeSeen === 11, 'the new length is stored as seen')
  await page.reload()
  await page.locator('.snake-svg').waitFor()
  assert((await page.locator('.snake-svg .seg-new').count()) === 0, 'nothing grows twice')
  // skins in settings: class is locked at this level
  await openSettings(page)
  assert(await page.getByRole('radio', { name: /Kehribar/ }).isDisabled(), 'the class skin is locked below level class')
  assert(!(await page.getByRole('radio', { name: /Gök mavisi/ }).isDisabled()), 'the loop skin is open at level loop')
  await ctx.close()
})

/** Weekly quests: three, the same three every time within a week, each with progress. */
T('r4-weekly-quests-card', async () => {
  const ctx = await seeded({ done: DONE([1]) })
  const page = await newPage({ ctx })
  await page.goto(BASE + '#/')
  await page.locator('.play-quests li').first().waitFor({ state: 'attached' })
  const titles = await page.locator('.play-quests .quest-title').allInnerTexts()
  assert(titles.length === 3, 'three quests: ' + titles)
  await page.reload()
  await page.locator('.play-quests li').first().waitFor({ state: 'attached' })
  assert(JSON.stringify(await page.locator('.play-quests .quest-title').allInnerTexts()) === JSON.stringify(titles), 'the same quests after a reload')
  assert((await page.locator('.play-quests .quest-bar').count()) === 3, 'each quest has a progress bar')
  await ctx.close()
})

/** The play room, the hero links and ⌘K reach the games. */
T('r4-games-reachable-from-home-and-palette', async () => {
  const page = await newPage()
  await page.goto(BASE + '#/')
  await page.locator('.hero-games').waitFor({ state: 'attached' })
  assert((await page.locator('.hero-games a[href="#/speed"]').count()) === 1, 'hero links to the speed round')
  assert((await page.locator('.play-card a[href="#/hunt"]').count()) === 1, 'play room links to the hunt')
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K')
  await page.getByPlaceholder('Gün, bölüm ya da komut ara').fill('hızlı')
  await page.getByRole('option', { name: /Hızlı tur/ }).click()
  await page.getByRole('heading', { name: 'Hızlı tur', level: 1 }).waitFor()
  await page.close()
})

/** A tab from before a new build asks for a chunk that is gone (404): reload once, then a message, never a blank page. */
T('stale-chunk-404-never-blank', async () => {
  const page = await newPage()
  let chunkHits = 0
  let docLoads = 0
  page.on('request', (r) => r.isNavigationRequest() && docLoads++)
  await page.goto(BASE + '#/')
  await page.locator('.hero-games').waitFor({ state: 'attached' })
  const stale = /\/assets\/Reader-[^/]*\.js$/
  await page.route(stale, (route) => {
    chunkHits++
    return route.fulfill({ status: 404, body: 'nf' })
  })
  const before = docLoads
  await page.evaluate(() => (location.hash = '#/day/1'))
  // the guarded reload happens at most once; the chunk stays gone, so the message must appear
  await page.getByText('Sitenin yeni sürümü yüklendi. Sayfayı yenile.').waitFor({ timeout: 15000 })
  assert(chunkHits >= 1, 'the lazy chunk was requested and refused')
  assert(docLoads - before <= 1, 'at most one automatic reload, got ' + (docLoads - before))
  assert((await page.getByRole('button', { name: 'Yenile' }).count()) === 1, 'the message has a reload button')
  assert((await page.locator('#root').innerText()).trim().length > 0, 'the page is not blank')
  // once the chunk is served again, the button recovers the page
  await page.unroute(stale)
  await page.getByRole('button', { name: 'Yenile' }).click()
  await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 15000 })
  await page.close()
})

// ---------------------------------------------------------------------------------------------------------------------
// Round 5: Anlatım, the lesson as a card player. The tests serve their own day-4 card file (a fixture covering every card type),
// so they hold whatever the content workers have written to content/cards so far.

const CARDS_FIXTURE = {
  day: 4,
  title_tr: 'Metinler',
  est_minutes: 4,
  cards: [
    { id: 'e1', type: 'explain', section: 'Creating a String', title_tr: 'Metin nedir', body_tr: 'Tırnak içindeki her şey bir **metindir**.', code: 'print("merhaba")' },
    { id: 'e2', type: 'explain', section: 'String Concatenation', title_tr: 'Önce tahmin et', body_tr: 'Çarpma işlemi sayıyla çalışır.', code: 'x = 3\nprint(x * 2)', expected_output: '6', hide_output: true },
    { id: 'e3', type: 'explain', section: 'String Concatenation', title_tr: 'Adım adım', body_tr: 'Döngü toplamı büyütür.', code: 'total = 0\nfor i in range(3):\n    total = total + i\nprint(total)', expected_output: '3', trace: true },
    { id: 'p1', type: 'predict', section: 'Creating a String', code: 'print(2 + 3)', choices: ['5', '23', 'Hata'], answer: 0, why_tr: 'İki sayı toplanır, metin birleştirilmez.' },
    { id: 'f1', type: 'fill', section: 'Creating a String', code: 'name = "Ada"\nprint(name.___())', answers: ['upper'], expected_output: 'ADA', why_tr: 'upper() harfleri büyütür.' },
    { id: 't1', type: 'truefalse', section: 'Creating a String', statement_tr: 'Metinler tırnak içinde yazılır.', answer: true, why_tr: 'Tek ya da çift tırnak olur.' },
    { id: 'o1', type: 'order', section: 'Creating a String', lines: ['x = 2', 'print(x)'], correct_order: [0, 1], expected_output: '2' },
    { id: 'r1', type: 'recap', section: 'Creating a String', points_tr: ['Metin tırnak içindedir.', 'upper() büyütür.'] },
  ],
}

async function withFixture(page) {
  await page.route('**/cards/day04.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CARDS_FIXTURE) }))
}
const cardAt = (page) => page.locator('.cards').getAttribute('data-card')
const waitCard = (page, n) => page.waitForFunction((k) => document.querySelector('.cards')?.getAttribute('data-card') === String(k), n, { timeout: 8000 })
async function openCards(page, hash = '#/day/4/text') {
  await withFixture(page)
  await page.goto(BASE + hash)
  await page.locator('.cards').waitFor({ timeout: 20000 })
}
/** localStorage for day 4's card progress, written before the app starts. */
const cardState = (cards) => ({ cards: { 4: cards } })
async function drag(page, dx, { steps = 6, pause = 0, hold = 0 } = {}) {
  const box = await page.locator('.cards-stage').boundingBox()
  const x = box.x + box.width * 0.7
  const y = box.y + 12
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x + (dx * i) / steps, y)
    if (pause) await sleep(pause)
  }
  if (hold) await sleep(hold)
  return { up: () => page.mouse.up() }
}

T('r5-cards-swipe-keys-and-resume', async () => {
  const page = await newPage()
  await openCards(page)
  assert((await cardAt(page)) === '0', 'starts on the first card')
  assert((await page.locator('.cards-strip li').count()) === 8, 'one chevron per card')
  // keys
  await page.keyboard.press('ArrowRight')
  await waitCard(page, 1)
  await page.keyboard.press('ArrowLeft')
  await waitCard(page, 0)
  // a quick flick moves on even when it is short
  let d = await drag(page, -70, { steps: 2 })
  await d.up()
  await waitCard(page, 1)
  // a slow short drag springs back: still the same card, and no stray transform is left on it
  d = await drag(page, -40, { steps: 4, pause: 120, hold: 300 })
  await d.up()
  await sleep(1100)
  assert((await cardAt(page)) === '1', 'a slow short drag does not turn the card')
  const tf = await page.locator('.card-slide').last().evaluate((e) => getComputedStyle(e).transform)
  assert(tf === 'none' || tf === 'matrix(1, 0, 0, 1, 0, 0)', 'the card settled back: ' + tf)
  // a long slow drag past a third of the width turns the card back
  d = await drag(page, 360, { steps: 8, pause: 40, hold: 200 })
  await d.up()
  await waitCard(page, 0)
  // at the first card a drag to the right is damped (rubber band), then returns
  d = await drag(page, 300, { steps: 6, pause: 30 })
  const mid = await page.locator('.card-slide').last().evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m41)
  assert(mid > 20 && mid < 200, `damped at the first card (moved ${mid}px for a 300px drag)`)
  await d.up()
  await sleep(1000)
  assert((await cardAt(page)) === '0', 'the first card stays')
  // vertical scrolling is not stolen: a mostly vertical drag does not turn the card
  const box = await page.locator('.cards-stage').boundingBox()
  await page.mouse.move(box.x + box.width * 0.7, box.y + 12)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.7 + 30, box.y + 160, { steps: 5 })
  await page.mouse.up()
  await sleep(300)
  assert((await cardAt(page)) === '0', 'a vertical drag leaves the card')
  // position is saved and survives a reload
  await page.keyboard.press('ArrowRight')
  await waitCard(page, 1)
  await page.keyboard.press('ArrowRight')
  await waitCard(page, 2)
  await flush()
  assert((await store(page)).cards[4].pos === 2, 'position saved')
  await page.reload()
  await page.locator('.cards').waitFor()
  assert((await cardAt(page)) === '2', 'resumes at the last card after a reload')
  assert(page.errors.length === 0, 'no page errors: ' + page.errors)
  await page.context().close()
})

T('r5-cards-touch-swipe', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const page = await newPage({ ctx })
  await openCards(page)
  const cdp = await ctx.newCDPSession(page)
  const box = await page.locator('.cards-stage').boundingBox()
  // start on the card's text: the header row now holds the Notlar / Orijinali gör buttons, and a press on a button never starts a swipe
  const y = box.y + 150
  const touch = (type, x) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
  await touch('touchStart', 330)
  for (const x of [300, 260, 220, 200]) {
    await touch('touchMove', x)
    await sleep(16)
  }
  await touch('touchEnd', 200)
  await waitCard(page, 1)
  await ctx.close()
})

T('r5-cards-hide-output-needs-a-guess', async () => {
  const page = await newPage()
  await openCards(page)
  await page.keyboard.press('ArrowRight')
  await waitCard(page, 1)
  const card = page.locator('.card-face')
  assert((await card.locator('.guess-in').count()) === 1, 'the guess box is there')
  assert((await card.locator('.cm-content, .pyview').count()) > 0, 'the code is visible')
  // while the output is hidden the one button is "Kontrol et" (lock the guess, run, compare)
  assert((await card.getByRole('button', { name: 'Çalıştır', exact: true }).count()) === 0, 'no separate Run while the output is hidden')
  await card.getByRole('button', { name: 'Kontrol et', exact: true }).click()
  await page.getByText('Önce tahmin et: bir şey yaz').waitFor()
  assert((await card.locator('.ccode-out').count()) === 0, 'no output without a guess')
  assert((await card.locator('.guess-in').evaluate((e) => e === document.activeElement)) === true, 'the guess box takes focus')
  assert((await card.getByRole('button', { name: 'Adım adım' }).isDisabled()) === true, 'the stepper waits for the guess too')
  // a wrong guess still reveals the output, with a miss mark
  await card.locator('.guess-in').fill('7')
  await card.getByRole('button', { name: 'Kontrol et', exact: true }).click()
  await card.locator('.ccode-out .step-out').waitFor({ timeout: 90000 })
  assert(/6/.test(await card.locator('.ccode-out .step-out').innerText()), 'the real output appears beside the guess')
  assert((await card.locator('.match.is-bad').count()) === 1, 'a miss is marked')
  assert((await card.locator('.guess-in').count()) === 0, 'the guess box is gone once the output is shown')
  await page.context().close()
  // a right guess gets the tick
  const p2 = await newPage()
  await openCards(p2)
  await p2.keyboard.press('ArrowRight')
  await waitCard(p2, 1)
  await p2.locator('.guess-in').fill('6')
  await p2.locator('.card-face').getByRole('button', { name: 'Kontrol et', exact: true }).click()
  await p2.locator('.match.is-ok').waitFor({ timeout: 90000 })
  await p2.context().close()
})

T('r5-cards-trace-stepper-shows-variable-changes', async () => {
  const page = await newPage()
  await openCards(page)
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await waitCard(page, 2)
  const trace = page.locator('.trace')
  await trace.locator('.trace-code').waitFor({ timeout: 90000 })
  const total = async () => {
    const row = trace.locator('.tv-list li').filter({ has: page.locator('.tv-name', { hasText: /^total$/ }) })
    return (await row.count()) ? (await row.locator('.tv-plain').innerText()).trim() : null
  }
  assert((await trace.locator('.tc-row.is-now').innerText()).includes('total = 0'), 'step 1 marks the first line')
  const seen = []
  let flashed = 0
  const count = Number((await trace.locator('.trace-scrub').getAttribute('max'))) + 1
  assert(count === 10, `the loop records 10 steps (got ${count})`)
  for (let k = 1; k < count; k++) {
    await trace.getByRole('button', { name: 'Sonraki adım' }).click()
    await page.waitForFunction((n) => document.querySelector('.trace')?.getAttribute('data-step') === String(n), k, { timeout: 5000 })
    const v = await total()
    if (seen[seen.length - 1] !== v) seen.push(v)
    if (await trace.locator('.tv-list li.is-changed').count()) flashed++
  }
  assert(JSON.stringify(seen) === JSON.stringify([null, '0', '1', '3']) || JSON.stringify(seen) === JSON.stringify(['0', '1', '3']), 'total goes 0, 1, 3: ' + JSON.stringify(seen))
  assert(flashed >= 3, 'changed variables are marked (' + flashed + ' steps)')
  assert(/3/.test(await trace.locator('.tv-out').innerText()), 'the output so far ends with 3')
  assert((await trace.locator('.trace-where').innerText()).includes('Program bitti'), 'the last step says the program is done')
  // the loop variable shows up, the scrubber jumps back, play walks forward again
  await trace.locator('.trace-scrub').fill('4')
  assert((await trace.locator('.tv-name', { hasText: /^i$/ }).count()) === 1, 'the loop variable i is listed mid-loop')
  assert((await trace.locator('.tv-out').innerText()).includes('Henüz çıktı yok'), 'no output yet mid-loop')
  await trace.getByRole('button', { name: 'Başa dön' }).click()
  await trace.getByRole('button', { name: 'Oynatma hızı' }).click() // 2x
  await trace.getByRole('button', { name: 'Otomatik oynat' }).click()
  await page.waitForFunction(() => /10 \/ 10/.test(document.querySelector('.trace-count')?.textContent ?? ''), null, { timeout: 15000 })
  // keys inside the stepper step, they do not turn the card
  await trace.getByRole('button', { name: 'Başa dön' }).click()
  await trace.getByRole('button', { name: 'Sonraki adım' }).focus()
  await page.keyboard.press('ArrowRight')
  assert((await cardAt(page)) === '2', 'arrow keys in the stepper do not leave the card')
  assert(page.errors.length === 0, 'no page errors: ' + page.errors)
  await page.context().close()
})

T('r5-cards-checkpoint-gating-and-xp', async () => {
  const page = await newPage()
  await openCards(page)
  for (let k = 1; k <= 3; k++) {
    await page.keyboard.press('ArrowRight')
    await waitCard(page, k)
  }
  assert(await page.locator('.cards-next.is-gated').count(), 'the arrow is marked while the checkpoint is open')
  // forward is held back until the checkpoint is answered; Geç is the way around
  await page.keyboard.press('ArrowRight')
  await page.getByText('Önce cevapla ya da Geç de.').waitFor()
  assert((await cardAt(page)) === '3', 'held on an unanswered checkpoint')
  let d = await drag(page, -300, { steps: 6, pause: 20 })
  await d.up()
  await sleep(900)
  assert((await cardAt(page)) === '3', 'a swipe forward is held back too')
  await flush()
  assert(((await store(page))?.xp ?? 0) === 0, 'no XP yet')
  // right on the first try: +2
  // one action: pick (click or key 1-4), then Check; the pick alone commits nothing
  await page.getByRole('button', { name: '5', exact: true }).click()
  assert((await page.locator('.feedback').count()) === 0, 'picking alone does not check')
  assert((await page.getByRole('button', { name: 'Kontrol et' }).isEnabled()) === true, 'Check is enabled once a choice is picked')
  await page.getByRole('button', { name: 'Kontrol et' }).click()
  await page.locator('.feedback.is-ok').waitFor()
  await flush()
  let s = await store(page)
  assert(s.xp === 2, 'predict pays 2 XP (got ' + s.xp + ')')
  assert(s.cards[4].res.p1.r === 'ok' && s.cards[4].res.p1.done, 'recorded as right')
  assert((await page.locator('.cards-next.is-gated').count()) === 0, 'the arrow is free after the answer')
  await page.keyboard.press('ArrowRight')
  await waitCard(page, 4)
  // fill: wrong, then right: no XP, the why shows on a miss
  const fill = page.locator('input.fill-input')
  await fill.fill('lower')
  await page.getByRole('button', { name: 'Kontrol et' }).click()
  await page.locator('.feedback.is-bad').waitFor()
  assert(/harfleri büyütür/.test(await page.locator('.feedback.is-bad').innerText()), 'the why is shown on a miss')
  await fill.fill('upper')
  await page.getByRole('button', { name: 'Kontrol et' }).click()
  await page.locator('.feedback.is-ok').waitFor()
  await flush()
  s = await store(page)
  assert(s.xp === 2, 'a fix after a miss pays nothing (xp ' + s.xp + ')')
  assert(s.cards[4].res.f1.r === 'bad' && s.cards[4].res.f1.done, 'first outcome stays: a miss')
  await page.keyboard.press('ArrowRight')
  await waitCard(page, 5)
  // true/false: skipped, and the skip is logged
  await page.getByRole('button', { name: 'Geç', exact: true }).click()
  await waitCard(page, 6)
  await flush()
  s = await store(page)
  assert(s.cards[4].res.t1.r === 'skip', 'the skip is logged')
  // order (the existing Parsons board): Python runs the lines, right on the first check: +2
  await waitPyReady(page).catch(() => undefined)
  const face = page.locator('.card-face')
  await face.locator('button.p-line').filter({ hasText: 'x = 2' }).first().click()
  await face.locator('button.p-line').filter({ hasText: 'print(x)' }).first().click()
  await face.getByRole('button', { name: 'Kontrol et' }).click()
  await page.locator('.feedback.is-ok', { hasText: 'Doğru sıra' }).waitFor({ timeout: 90000 })
  await flush()
  s = await store(page)
  assert(s.xp === 4, 'order pays 2 XP (xp ' + s.xp + ')')
  // recap: the points, the mini score, and the way to Öğren
  await page.keyboard.press('ArrowRight')
  await waitCard(page, 7)
  const score = await page.locator('.recap-score').innerText()
  assert(/2 \/ 4/.test(score) && /1 tanesinde yanıldın/.test(score) && /1 tanesini geçtin/.test(score), 'mini score: ' + score.replace(/\s+/g, ' '))
  assert((await page.locator('a.recap-full').getAttribute('href')) === '#/day/4/full', 'the full text is a small link at the end')
  await flush()
  assert((await store(page)).cards[4].recap, 'reaching the recap is recorded')
  await page.getByRole('link', { name: 'Alıştırmalara geç' }).click()
  await page.waitForFunction(() => location.hash === '#/day/4/learn')
  await page.locator('.learn, .learn-missing').first().waitFor()
  // from now on the bare day link opens Öğren
  await page.goto(BASE + '#/day/4')
  await page.waitForFunction(() => location.hash === '#/day/4/learn', null, { timeout: 8000 })
  assert(page.errors.length === 0, 'no page errors: ' + page.errors)
  await page.context().close()
})

T('r5-cards-first-visit-opens-anlatim-and-original-text', async () => {
  const page = await newPage()
  await withFixture(page)
  // day 2 plays the part of a day whose card file has not been written yet, whatever content/cards holds
  await page.route('**/cards/day02.json', (route) => route.fulfill({ status: 404, body: 'nf' }))
  await page.goto(BASE + '#/day/4')
  await page.waitForFunction(() => location.hash === '#/day/4/text', null, { timeout: 15000 })
  await page.locator('.cards').waitFor()
  assert((await page.getByRole('tab', { name: 'Anlatım' }).getAttribute('aria-selected')) === 'true', 'the Anlatım tab is selected')
  assert((await page.getByRole('tab', { name: 'Ders metni' }).count()) === 0, 'the old tab name is gone')
  assert(/8 kart/.test(await page.locator('.lesson-sub').innerText()), 'the header shows the card count')
  // a day without a card file opens Öğren, and its Anlatım tab says it is being prepared
  await page.goto(BASE + '#/day/2')
  await page.waitForFunction(() => location.hash === '#/day/2/learn', null, { timeout: 15000 })
  await page.getByRole('tab', { name: 'Anlatım' }).click()
  await page.getByRole('heading', { name: /hazırlanıyor/ }).waitFor()
  // the original English section sits on the back of the card: it is not shown until the card is turned
  await page.goto(BASE + '#/day/4/text')
  await page.locator('.cards').waitFor()
  assert((await page.locator('.card-flip[data-flipped="true"]').count()) === 0, 'the card starts on its front')
  assert((await page.locator('details.orig').count()) === 0, 'no click-to-open box under the card any more')
  await page.getByRole('button', { name: 'Orijinali gör' }).first().click()
  await page.locator('.card-back .orig-body').waitFor({ timeout: 15000 })
  const txt = await page.locator('.card-back .orig-body').innerText()
  assert(/String/i.test(txt) && txt.length > 80, 'the English section is shown (' + txt.length + ' chars)')
  assert((await page.locator('.card-back .orig-body pre').count()) > 0, 'its code comes back as code blocks')
  // the full lesson page is still there
  await page.goto(BASE + '#/day/4/full')
  await page.locator('.md').first().waitFor({ timeout: 20000 })
  await page.context().close()
})

T('r5-cards-390-no-horizontal-scroll-all-cards', async () => {
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme })
    await ctx.addInitScript((s) => {
      if (!localStorage.getItem('atolye:v1')) localStorage.setItem('atolye:v1', JSON.stringify(s))
    }, { v: 1, ...cardState({ pos: 0, max: 8, recap: '', res: { p1: { r: 'ok', done: true }, f1: { r: 'ok', done: true }, t1: { r: 'ok', done: true }, o1: { r: 'ok', done: true } } }) })
    const page = await newPage({ ctx })
    await openCards(page)
    for (let k = 0; k < 8; k++) {
      await waitCard(page, k)
      await sleep(500)
      if (k === 2) await page.locator('.trace-code').waitFor({ timeout: 90000 })
      const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
      assert(w.sw <= w.cw + 1, `${scheme} card ${k}: horizontal scroll at 390 (${w.sw} > ${w.cw})`)
      if (k === 2) await page.screenshot({ path: join(out, `cards-390-${scheme}-trace.png`) })
      if (k < 7) await page.getByRole('button', { name: 'Sonraki kart' }).click()
    }
    await page.screenshot({ path: join(out, `cards-390-${scheme}-recap.png`) })
    await ctx.close()
  }
})

T('r5-home-preview-and-learn-plan-show-the-cards', async () => {
  // the Öğren plan line: card count, minutes, and how far the learner got (with the fixture file)
  const page = await newPage()
  await withFixture(page)
  await page.goto(BASE + '#/day/4/learn')
  await page.locator('.learn-plan .plan-cards').waitFor({ timeout: 20000 })
  assert(/Anlatım: 8 kart · ~4 dk/.test(await page.locator('.plan-cards').innerText()), 'plan line: ' + (await page.locator('.plan-cards').innerText()))
  assert((await page.locator('.plan-cards').getAttribute('href')) === '#/day/4/text', 'the plan line links to Anlatım')
  await page.context().close()
  // the home page preview comes from the card files at build time
  const ctx = await seeded({ cards: { 1: { pos: 2, max: 3, res: {}, recap: '' } } })
  const home = await newPage({ ctx })
  await home.goto(BASE + '#/')
  await home.locator('.preview-cards').first().waitFor({ state: 'attached', timeout: 20000 })
  const t = await home.locator('.preview-cards').first().innerText()
  assert(/Anlatım: \d+ kart · ~\d+ dk/.test(t), 'home preview: ' + t)
  await ctx.close()
})

T('r5-cards-reduced-motion-crossfades', async () => {
  const probe = (page) =>
    page.evaluate(
      () =>
        new Promise((resolve) => {
          document.querySelector('.cards-next').click()
          setTimeout(() => {
            const kf = document
              .getAnimations()
              .filter((a) => a.effect?.target?.closest?.('.cards-stage'))
              .flatMap((a) => (a.effect?.getKeyframes ? a.effect.getKeyframes() : []))
            resolve({ n: kf.length, transform: kf.some((k) => k.transform && k.transform !== 'none' && k.transform !== 'translateX(0px)' && k.transform !== 'translateX(0)'), opacity: kf.some((k) => 'opacity' in k) })
          }, 40)
        }),
    )
  const normal = await newPage()
  await openCards(normal)
  const a = await probe(normal)
  assert(a.transform && a.opacity, 'normal motion slides and fades: ' + JSON.stringify(a))
  await normal.context().close()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const reduced = await newPage({ ctx })
  await openCards(reduced)
  const b = await probe(reduced)
  assert(!b.transform && b.opacity, 'reduced motion only crossfades: ' + JSON.stringify(b))
  await waitCard(reduced, 1)
  // the gated arrow does not animate either way; it stays visibly marked
  await ctx.close()
})

// ---------------------------------------------------------------------------------------------------------------------
// Round 6: one global TR/EN switch that travels with the learner, and Predict as one action.

const langSwitch = (page) => page.locator('.lang-switch')
const htmlLang = (page) => page.evaluate(() => document.documentElement.lang)
const squashText = (s) => s.replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim()
const waitLang = (page, l) => page.waitForFunction((x) => document.documentElement.lang === x, l, { timeout: 5000 })

T('r6-lang-switch-same-place-on-every-route', async () => {
  const ctx = await seeded({ done: DONE(range(1, 7)) })
  const page = await newPage({ ctx })
  const routes = ['#/', '#/day/1/learn', '#/review', '#/speed', '#/hunt', '#/boss/1']
  let first = null
  for (const r of routes) {
    await page.goto(BASE + r)
    await langSwitch(page).waitFor({ timeout: 20000 })
    await fontsReady(page)
    const box = await langSwitch(page).boundingBox()
    assert(box && box.width > 80 && box.height >= 44, `${r}: the switch is visible and thumb-sized: ${JSON.stringify(box)}`)
    const vp = page.viewportSize()
    assert(box.x + box.width <= vp.width && box.y + box.height <= vp.height, `${r}: inside the viewport`)
    assert(vp.width - (box.x + box.width) <= 24 && vp.height - (box.y + box.height) <= 24, `${r}: bottom-right corner: ${JSON.stringify(box)}`)
    if (!first) first = box
    else assert(Math.abs(box.x - first.x) < 1.5 && Math.abs(box.y - first.y) < 1.5, `${r}: same place as on the first route (${JSON.stringify(first)} vs ${JSON.stringify(box)})`)
    assert((await page.locator('.lang-switch').count()) === 1, `${r}: exactly one switch`)
  }
  // the lesson cards have a sticky Back / Next bar: the switch rides above it and never covers the Next button
  await page.goto(BASE + '#/day/1/text')
  await page.locator('.cards-next').waitFor({ timeout: 20000 })
  await sleep(400) // the switch glides up (180 ms) once the bar is on screen
  const sw = await langSwitch(page).boundingBox()
  const nx = await page.locator('.cards-next').boundingBox()
  const overlaps = !(sw.x + sw.width <= nx.x || nx.x + nx.width <= sw.x || sw.y + sw.height <= nx.y || nx.y + nx.height <= sw.y)
  assert(!overlaps, `the switch does not cover Next: ${JSON.stringify({ sw, nx })}`)
  await ctx.close()
})

T('r6-lang-switch-phone-bottom-centre', async () => {
  // v10: on a phone the switch no longer floats over the card at the bottom; it sits at the top, right under the header bar
  const ctx = await seeded({ done: DONE(range(1, 7)) }, { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const page = await newPage({ ctx })
  let first = null
  for (const r of ['#/', '#/day/1/learn', '#/review', '#/speed', '#/boss/1']) {
    await page.goto(BASE + r)
    await langSwitch(page).waitFor({ timeout: 20000 })
    const box = await langSwitch(page).boundingBox()
    assert(box.y >= 0 && box.y + box.height <= 130, `${r}: in the header area: ${JSON.stringify(box)}`)
    assert(box.x >= 16 && box.x + box.width <= 390 - 12, `${r}: inside the gutters`)
    if (!first) first = box
    else assert(Math.abs(box.x - first.x) < 1.5 && Math.abs(box.y - first.y) < 1.5, `${r}: same place`)
  }
  // no horizontal scroll introduced by the switch
  assert((await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)) === true, 'no horizontal scroll at 390px')
  await page.goto(BASE + '#/day/1/text')
  await page.locator('.cards-next').waitFor({ timeout: 20000 })
  const sw = await langSwitch(page).boundingBox()
  const nx = await page.locator('.cards-next').boundingBox()
  assert(sw.y + sw.height <= nx.y || nx.y + nx.height <= sw.y, 'the switch does not cover Next on a phone')
  await ctx.close()
})

T('r6-lang-switch-changes-chrome-exercise-card-and-boss', async () => {
  const ctx = await seeded({ done: DONE(range(1, 7)) }, { reducedMotion: 'reduce' })
  const page = await newPage({ ctx })
  // a HUD label and an exercise prompt
  await page.goto(BASE + '#/day/1/learn')
  await page.locator('.learn').waitFor()
  assert((await htmlLang(page)) === 'tr', 'default language is Turkish')
  const d = await loadDayJson(page, 1)
  const ex = stepsOf(d)[0].ex
  const hudDue = page.locator('.hud-due span').first()
  assert((await hudDue.innerText()) === 'Tekrar', 'HUD in Turkish')
  assert((await page.locator('.step-prompt').first().innerText()).trim() === (ex.prompt_tr || ex.prompt).trim(), 'exercise prompt in Turkish')
  await langSwitch(page).getByRole('button', { name: /English/ }).click()
  await waitLang(page, 'en')
  assert((await hudDue.innerText()) === 'Review', 'HUD label switches')
  assert((await page.locator('.step-prompt').first().innerText()).trim() === ex.prompt.trim(), 'exercise prompt switches to the English original')
  assert((await page.getByRole('tab', { name: 'Practice' }).getAttribute('aria-selected')) === 'true', 'the Öğren tab is called Practice')
  assert((await page.getByRole('tab', { name: 'Lesson' }).count()) === 1, 'the Anlatım tab is called Lesson')
  assert((await page.title()).startsWith('Day 1:'), 'page title switches: ' + (await page.title()))
  // a lesson card: the real day-1 file has English and Turkish twins
  await page.goto(BASE + '#/day/1/text')
  await page.locator('.cards').waitFor({ timeout: 20000 })
  const cards = await page.evaluate((u) => fetch(u).then((r) => r.json()), BASE + 'cards/day01.json')
  const c0 = cards.cards[0]
  const cmd = page.locator('.cmd').first()
  assert(squashText(await cmd.innerText()).startsWith(squashText(c0.body).slice(0, 30)), 'card body in English: ' + (await cmd.innerText()).slice(0, 60))
  await langSwitch(page).getByRole('button', { name: /Türkçe/ }).click()
  await waitLang(page, 'tr')
  assert(squashText(await cmd.innerText()).startsWith(squashText(c0.body_tr).slice(0, 30)), 'card body switches to Turkish: ' + (await cmd.innerText()).slice(0, 60))
  assert((await page.locator('.card-front .flip-btn').first().innerText()) === 'Orijinali gör', 'flip button label in Turkish')
  await langSwitch(page).getByRole('button', { name: /English/ }).click()
  await waitLang(page, 'en')
  assert((await page.locator('.card-front .flip-btn').first().innerText()) === 'See the original', 'flip button label in English')
  // a boss story: the file has Turkish only, the English one lives in the dictionary
  const boss = await page.evaluate((u) => fetch(u).then((r) => r.json()), BASE + 'bosses/part1.json')
  await page.goto(BASE + '#/boss/1')
  await page.locator('.boss-story').first().waitFor({ timeout: 20000 })
  const story = (await page.locator('.boss-story').first().innerText()).replace(/\s+/g, ' ')
  assert(/^Cafe Lale's till program crashed/.test(story), 'boss story in English: ' + story.slice(0, 60))
  await langSwitch(page).getByRole('button', { name: /Türkçe/ }).click()
  await waitLang(page, 'tr')
  const storyTr = (await page.locator('.boss-story').first().innerText()).replace(/\s+/g, ' ')
  assert(storyTr.startsWith(boss.story_tr.replace(/\s+/g, ' ').slice(0, 40)), 'boss story in Turkish: ' + storyTr.slice(0, 60))
  await ctx.close()
})

T('r6-lang-survives-reload-and-migrates-the-old-setting', async () => {
  const ctx = await seeded({}, { reducedMotion: 'reduce' })
  const page = await newPage({ ctx })
  await page.goto(BASE + '#/')
  await langSwitch(page).getByRole('button', { name: /English/ }).click()
  await waitLang(page, 'en')
  assert((await page.evaluate(() => localStorage.getItem('atolye:lang'))) === 'en', 'the choice is saved')
  await page.reload()
  await langSwitch(page).waitFor()
  assert((await htmlLang(page)) === 'en', 'html lang is English after a reload')
  assert((await langSwitch(page).getByRole('button', { name: /English/ }).getAttribute('aria-pressed')) === 'true', 'EN side is pressed after a reload')
  assert(/Start|Continue/.test(await page.locator('.topnav .btn-chev').innerText()), 'the page itself is English after a reload')
  await ctx.close()
  // the old per-exercise switch stored settings.lang in the progress file: that choice moves into the global one
  const old = await seeded({ settings: { textStep: 1, focus: false, lang: 'en', sound: true, skin: 'varsayilan' } }, { reducedMotion: 'reduce' })
  const p2 = await newPage({ ctx: old })
  await p2.goto(BASE + '#/')
  await langSwitch(p2).waitFor()
  assert((await htmlLang(p2)) === 'en', 'the old English setting carries over')
  assert((await p2.evaluate(() => localStorage.getItem('atolye:lang'))) === 'en', 'and is written to the new key')
  await old.close()
})

T('r6-lang-alt-l-and-palette-entry', async () => {
  const ctx = await seeded({}, { reducedMotion: 'reduce' })
  const page = await newPage({ ctx })
  await page.goto(BASE + '#/')
  await langSwitch(page).waitFor()
  await page.keyboard.press('Alt+KeyL')
  await waitLang(page, 'en')
  await page.keyboard.press('Alt+KeyL')
  await waitLang(page, 'tr')
  // the palette lists it in both languages and runs it
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K')
  await page.getByPlaceholder('Gün, bölüm ya da komut ara').fill('switch')
  const opt = page.getByRole('option', { name: /Dili değiştir \/ Switch language/ })
  assert((await opt.count()) === 1, 'the palette has "Dili değiştir / Switch language"')
  await opt.click()
  await waitLang(page, 'en')
  // keyboard: Tab to the switch, Enter / Space press the focused side
  await page.locator('.lang-seg-btn.is-tr').focus()
  await page.keyboard.press('Enter')
  await waitLang(page, 'tr')
  await page.locator('.lang-seg-btn.is-en').focus()
  await page.keyboard.press('Space')
  await waitLang(page, 'en')
  // names and states for assistive tech, in both languages at once
  const names = await page.locator('.lang-seg-btn').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') + '|' + e.getAttribute('aria-pressed')))
  assert(names[0] === 'Türkçe (Turkish)|false' && names[1] === 'English (İngilizce)|true', 'accessible names and pressed state: ' + names.join(' ; '))
  assert((await langSwitch(page).getAttribute('aria-label')) === 'Dil / Language', 'the group is named in both languages')
  await ctx.close()
})

T('r6-lang-swap-is-a-quick-crossfade-and-instant-with-reduced-motion', async () => {
  const normal = await newPage()
  await normal.goto(BASE + '#/')
  await langSwitch(normal).waitFor()
  await normal.keyboard.press('Alt+KeyL')
  await waitLang(normal, 'en')
  assert((await normal.evaluate(() => document.documentElement.dataset.langFade)) === 'fade', 'normal motion crossfades')
  const dur = await normal.evaluate(() => {
    const el = document.documentElement
    return getComputedStyle(el, '::view-transition-old(root)').animationDuration
  })
  const ms = /ms$/.test(dur) ? parseFloat(dur) : parseFloat(dur) * 1000
  assert(!dur || dur === 'none' || ms <= 180, 'the crossfade lasts at most 180 ms: ' + dur)
  await normal.context().close()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const reduced = await newPage({ ctx })
  await reduced.goto(BASE + '#/')
  await langSwitch(reduced).waitFor()
  await reduced.keyboard.press('Alt+KeyL')
  // instant: the language is already switched on the same turn, no transition was started
  assert((await reduced.evaluate(() => document.documentElement.lang)) === 'en', 'reduced motion swaps at once')
  assert((await reduced.evaluate(() => document.documentElement.dataset.langFade)) === 'instant', 'no view transition with reduced motion')
  const td = await reduced.locator('.lang-seg-btn').first().evaluate((e) => getComputedStyle(e).transitionDuration)
  assert(/^0(\.0+1)?m?s/.test(td) || td === '1e-05s', 'the switch itself does not transition: ' + td)
  await ctx.close()
})

T('r6-predict-is-one-action-keys-1-4-and-enter', async () => {
  const ctx = await seeded({}, { reducedMotion: 'reduce' })
  const page = await newPage({ ctx })
  await page.goto(BASE + '#/day/1/learn')
  await page.locator('.learn').waitFor()
  const d = await loadDayJson(page, 1)
  const p = stepsOf(d)[0].ex
  assert(p.type === 'predict' && p.choices.length >= 2, 'the first step is a choice predict')
  assert((await page.getByRole('button', { name: 'Tahminimi kilitle' }).count()) === 0, 'no separate lock button')
  assert((await page.getByRole('button', { name: 'Çalıştır ve karşılaştır' }).count()) === 0, 'no separate run-and-compare button')
  const check = page.getByRole('button', { name: 'Kontrol et' })
  assert((await check.isDisabled()) === true, 'Check waits for a choice')
  // key 1-4 selects, Enter checks. Pick a wrong one first: the answer must stay hidden and a retry pays nothing.
  const wrongIdx = p.choices.findIndex((c) => c !== p.expected_output)
  await page.keyboard.press(String(wrongIdx + 1))
  assert((await page.locator('label.choice').nth(wrongIdx).locator('input').isChecked()) === true, 'the key selected the choice')
  assert((await check.isEnabled()) === true, 'Check is enabled once a choice is selected')
  assert((await page.locator('.feedback').count()) === 0, 'selecting does not check')
  await page.keyboard.press('Enter')
  await page.locator('.feedback.is-bad').waitFor({ timeout: 90000 })
  assert((await page.locator('.compare').count()) === 0, 'the real output stays hidden after the first wrong check')
  assert((await page.locator('label.choice.is-right').count()) === 0, 'the right choice is not marked before the second check')
  const xp0 = (await store(page))?.xp ?? 0
  await page.getByRole('button', { name: 'Yeniden tahmin et' }).click()
  const rightIdx = p.choices.findIndex((c) => c === p.expected_output)
  await page.keyboard.press(String(rightIdx + 1))
  await page.keyboard.press('Enter')
  await page.locator('.compare').waitFor({ timeout: 90000 })
  await flush()
  assert(((await store(page))?.xp ?? 0) === xp0, 'a retry after a wrong check pays 0')
  await ctx.close()
  // a first-try right answer through the keys pays
  const ctx2 = await seeded({}, { reducedMotion: 'reduce' })
  const p2 = await newPage({ ctx: ctx2 })
  await p2.goto(BASE + '#/day/1/learn')
  await p2.locator('.learn').waitFor()
  await p2.keyboard.press(String(p.choices.findIndex((c) => c === p.expected_output) + 1))
  await p2.keyboard.press('Enter')
  await p2.locator('.compare').waitFor({ timeout: 90000 })
  await waitSolved(p2)
  await flush()
  assert(((await store(p2))?.xp ?? 0) > 0, 'a first-try right answer pays XP')
  await ctx2.close()
})

T('r6-cards-predict-pick-then-check', async () => {
  // the fixture's predict card is the fourth one (index 3); start the learner there
  const ctx = await seeded({ cards: { 4: { pos: 3, max: 4, res: {}, recap: '' } } }, { reducedMotion: 'reduce' })
  const p = await newPage({ ctx })
  await openCards(p)
  await waitCard(p, 3)
  assert((await p.locator('.cchoice.is-picked').count()) === 0, 'nothing picked yet')
  assert((await p.getByRole('button', { name: 'Kontrol et' }).isDisabled()) === true, 'Check waits for a choice')
  await p.keyboard.press('2')
  assert((await p.locator('.cchoice.is-picked').count()) === 1 && (await p.locator('.feedback').count()) === 0, 'key 2 only selects')
  await p.keyboard.press('1')
  await p.keyboard.press('Enter')
  await p.locator('.feedback.is-ok').waitFor()
  assert((await p.locator('.cchoice.is-right').count()) === 1, 'the right choice is marked after Check')
  await ctx.close()
})

// ---------------------------------------------------------------------------------------------------------------------
// Round 7, bug 2: the trace stepper's controls were hidden under the sticky Geri/İleri bar. For every trace card of Days 1, 5 and
// 10 at three window sizes, "Sonraki adım" must be fully inside the window and its centre point must hit the button itself.

const SIZES = [
  [1440, 827],
  [1280, 720],
  [390, 844],
]

T('b2-trace-controls-are-never-under-the-cards-bar', async () => {
  const problems = []
  let checked = 0
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500 })
    await ctx.addInitScript(() => {
      const s = sessionStorage.getItem('seed')
      if (s) localStorage.setItem('atolye:v1', s)
    })
    const page = await newPage({ ctx })
    await page.goto(BASE)
    for (const day of [1, 5, 10]) {
      const cards = (await page.evaluate((u) => fetch(u).then((r) => r.json()), BASE + `cards/day${String(day).padStart(2, '0')}.json`)).cards
      // Day 1 has no `trace` card; its first code card's "Adım adım" button opens the same stepper
      let idxs = cards.map((c, i) => (c.trace ? i : -1)).filter((i) => i >= 0)
      if (!idxs.length) idxs = [cards.findIndex((c) => c.type === 'explain' && c.code)]
      for (const i of idxs) {
        const tag = `day ${day} card ${i + 1} @${w}x${h}`
        // the page saves its own state when it is hidden (pagehide), so the seed travels in sessionStorage and is applied by the init script
        await page.evaluate(([d, k]) => sessionStorage.setItem('seed', JSON.stringify({ v: 1, cards: { [d]: { pos: k, max: k, res: {}, recap: '' } } })), [day, i])
        await page.goto(BASE + `#/day/${day}/text`)
        await page.reload()
        await page.locator(`.cards[data-card="${i}"]`).waitFor({ timeout: 20000 })
        await page.evaluate(() => window.scrollTo(0, 0))
        if ((await page.locator('.trace').count()) === 0) {
          const guess = page.locator('.guess-in')
          if (await guess.count()) {
            await guess.fill('0')
            await page.locator('.ccode-cell').getByRole('button', { name: 'Kontrol et' }).click()
          }
          await page.locator('.ccode').getByRole('button', { name: 'Adım adım' }).click()
        }
        await page.locator('.trace-bar').waitFor({ timeout: 90000 })
        await sleep(500) // the card's slide-in finishes
        const next = page.getByRole('button', { name: 'Sonraki adım', exact: true })
        const r = await next.evaluate((el) => {
          const b = el.getBoundingClientRect()
          const top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)
          const bar = document.querySelector('.cards-bar')?.getBoundingClientRect()
          return { y: b.y, bottom: b.bottom, hit: top === el || el.contains(top), by: top?.className?.toString() ?? String(top), vh: innerHeight, barTop: bar ? bar.top : null, sy: scrollY }
        })
        checked++
        if (r.bottom > r.vh || r.y < 0) problems.push(`${tag}: button not inside the window (y ${Math.round(r.y)}..${Math.round(r.bottom)} of ${r.vh})`)
        else if (!r.hit) problems.push(`${tag}: centre hits .${r.by}`)
        else if (r.barTop !== null && r.bottom > r.barTop) problems.push(`${tag}: button overlaps the sticky bar (${Math.round(r.bottom)} > ${Math.round(r.barTop)})`)
        else {
          const before = await page.locator('.trace-count span').first().innerText()
          const box = await next.boundingBox()
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
          await sleep(150)
          const after = await page.locator('.trace-count span').first().innerText()
          if (before === after) problems.push(`${tag}: a real click did not advance the step (${before})`)
        }
      }
    }
    await ctx.close()
  }
  console.log('    trace cards checked: ' + checked)
  assert(checked >= 18, 'expected at least 18 trace checks, ran ' + checked)
  assert(problems.length === 0, problems.length + ' layout problem(s):\n     ' + problems.slice(0, 12).join('\n     '))
})

// ---------------------------------------------------------------------------------------------------------------------
// Round 7, bug 1: an open tab must never keep running an old build. dist/version.json carries the build id (also injected into
// the bundle and shown as html[data-build]); the app checks it on load, every 60 s while visible, on visibilitychange and before a
// route change. The tests serve build A, swap the served files to build B (same files, new id) and watch the tab move by itself.

const readId = (dir) => JSON.parse(readFileSync(join(dir, 'version.json'), 'utf8')).id
/** Build B = a copy of the build under test with every occurrence of its id replaced by a new one (hashed file names stay). */
function makeBuildB() {
  const idA = readId(dist)
  const idB = idA + 'b'
  const dir = join(out, 'build-b')
  rmSync(dir, { recursive: true, force: true })
  cpSync(dist, dir, { recursive: true })
  const walk = (d) =>
    readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const f = join(d, e.name)
      if (e.isDirectory()) return walk(f)
      if (!/\.(js|mjs|html|json)$/.test(e.name) || e.name.startsWith('day') || f.includes(`${sep}exercises${sep}`) || f.includes(`${sep}lessons${sep}`) || f.includes(`${sep}cards${sep}`)) return
      const s = readFileSync(f, 'utf8')
      if (s.includes(idA)) writeFileSync(f, s.split(idA).join(idB))
    })
  walk(dir)
  return { idA, idB, dir }
}
const buildOf = (page) => page.evaluate(() => document.documentElement.dataset.build || '')
const waitBuild = (page, id, ms = 20000) => page.waitForFunction((x) => document.documentElement.dataset.build === x, id, { timeout: ms })
const pokeVisible = (page) => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))

T('b1-build-has-version-json-and-the-same-id-in-the-bundle', async () => {
  const id = readId(dist)
  assert(/^[a-z0-9]{8,}$/.test(id), 'version.json carries a build id: ' + id)
  const page = await newPage()
  await page.goto(BASE)
  await waitBuild(page, id, 15000)
  const res = await page.evaluate(() => fetch('version.json', { cache: 'no-store' }).then((r) => r.json()))
  assert(res.id === id, 'served version.json matches the injected id')
  await page.context().close()
})

T('b1-open-tab-moves-to-the-new-build-on-visibility-and-keeps-the-route', async () => {
  const { idA, idB, dir } = makeBuildB()
  const page = await newPage()
  try {
    await page.goto(BASE + '#/day/3/text')
    await waitBuild(page, idA, 15000)
    await page.locator('.cards').waitFor({ timeout: 20000 })
    root = dir
    await pokeVisible(page)
    await waitBuild(page, idB)
    assert((await page.evaluate(() => location.hash)) === '#/day/3/text', 'the hash route survives the reload')
    await page.locator('.cards').waitFor({ timeout: 20000 })
  } finally {
    root = dist
  }
  await page.context().close()
})

T('b1-new-build-is-picked-up-before-a-route-change', async () => {
  const { idA, idB, dir } = makeBuildB()
  const page = await newPage()
  try {
    await page.goto(BASE + '#/review')
    await waitBuild(page, idA, 15000)
    root = dir
    await page.evaluate(() => {
      location.hash = '#/day/2/text'
    })
    await waitBuild(page, idB)
    assert((await page.evaluate(() => location.hash)) === '#/day/2/text', 'lands on the route the learner chose, on the new build')
  } finally {
    root = dist
  }
  await page.context().close()
})

T('b1-sixty-second-poll-finds-the-new-build', async () => {
  const { idA, idB, dir } = makeBuildB()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await newPage({ ctx })
  try {
    await page.clock.install({ time: Date.now() })
    await page.goto(BASE + '#/day/2/text')
    await waitBuild(page, idA, 15000)
    root = dir
    await page.clock.runFor(30_000)
    await sleep(600)
    assert((await buildOf(page)) === idA, 'nothing happens before the poll interval')
    await page.clock.runFor(35_000)
    await waitBuild(page, idB)
  } finally {
    root = dist
  }
  await ctx.close()
})

T('b1-mid-typing-shows-a-bar-flushes-the-draft-and-reloads-on-the-next-route-change', async () => {
  const { idA, idB, dir } = makeBuildB()
  const ctx = await seeded({ done: DONE([1]) })
  const page = await newPage({ ctx })
  try {
    await page.goto(BASE + '#/day/1/full')
    await waitBuild(page, idA, 15000)
    const ed = page.locator('.cell-editor .cm-content').first()
    await ed.waitFor({ timeout: 20000 })
    await ed.click()
    await page.keyboard.press('End')
    await page.keyboard.insertText('  # taslak')
    root = dir
    await pokeVisible(page)
    const bar = page.locator('.ver-bar')
    await bar.waitFor({ timeout: 10000 })
    assert(/Yeni sürüm hazır/.test(await bar.innerText()), 'the bar says so in Turkish')
    assert((await bar.getByRole('button', { name: 'Şimdi yenile' }).count()) === 1, 'it offers "Şimdi yenile"')
    await sleep(1200)
    assert((await buildOf(page)) === idA, 'no reload while the learner is typing')
    assert((await page.locator('.cell-editor .cm-content').first().innerText()).includes('# taslak'), 'the typed text is still there')
    await page.evaluate(() => {
      location.hash = '#/day/2/full'
    })
    await waitBuild(page, idB)
    assert((await page.evaluate(() => location.hash)) === '#/day/2/full', 'the route change reloaded onto the chosen route')
    const st = await store(page)
    assert(Object.values(st?.code ?? {}).some((c) => String(c).includes('# taslak')), 'the pending draft was flushed to storage before the reload')
  } finally {
    root = dist
  }
  await ctx.close()
})

T('b1-reload-now-button-reloads', async () => {
  const { idA, idB, dir } = makeBuildB()
  const ctx = await seeded({ done: DONE([1]) })
  await ctx.addInitScript(() => {
    if (!sessionStorage.getItem('lang-seeded')) {
      localStorage.setItem('atolye:lang', 'en')
      sessionStorage.setItem('lang-seeded', '1')
    }
  })
  const page = await newPage({ ctx })
  try {
    await page.goto(BASE + '#/day/1/full')
    await waitBuild(page, idA, 15000)
    const ed = page.locator('.cell-editor .cm-content').first()
    await ed.waitFor({ timeout: 20000 })
    await ed.click()
    await page.keyboard.insertText('x')
    root = dir
    await pokeVisible(page)
    const bar = page.locator('.ver-bar')
    await bar.waitFor({ timeout: 10000 })
    assert(/New version ready/.test(await bar.innerText()), 'English wording')
    await bar.getByRole('button', { name: 'Reload now' }).click()
    await waitBuild(page, idB)
    assert((await page.evaluate(() => location.hash)) === '#/day/1/full', 'route kept')
  } finally {
    root = dist
  }
  await ctx.close()
})

T('b1-no-reload-loop-when-the-new-build-never-arrives', async () => {
  // a broken deploy: version.json already says "B" but the files are still A, so a reload can never help
  const idA = readId(dist)
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await newPage({ ctx })
  await page.route('**/version.json*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: idA + 'zz' }) }))
  let loads = 0
  page.on('load', () => loads++)
  await page.goto(BASE + '#/day/3/text')
  await waitBuild(page, idA, 15000)
  for (let k = 0; k < 4; k++) {
    await pokeVisible(page)
    await page.evaluate(() => {
      location.hash = '#/day/' + (4 + Math.floor(Math.random() * 20)) + '/text'
    })
    await sleep(1200)
  }
  await sleep(2500)
  assert(loads <= 2, 'at most one automatic reload for one version id, got ' + (loads - 1))
  assert((await buildOf(page)) === idA, 'still the same build')
  assert((await page.locator('.ver-bar').count()) === 1, 'the learner is told instead')
  await ctx.close()
})

// ---------------------------------------------------------------------------------------------------------------------
// v10: flip cards for the original text, side columns that teach, skeleton, long cards.

const FIX = (f) => readFileSync(new URL('./fixtures/' + f, import.meta.url), 'utf8')
const isCheck = (c) => ['predict', 'fill', 'truefalse', 'order'].includes(c.type)
const dayFile = (n) => JSON.parse(readFileSync(join(dist, 'cards', `day${String(n).padStart(2, '0')}.json`), 'utf8'))
/** A store that has the whole day unlocked (every checkpoint answered), the learner standing on card `pos`. */
const openDay = (n, pos = 0) => {
  const d = dayFile(n)
  return { cards: { [n]: { pos, max: d.cards.length, recap: '', res: Object.fromEntries(d.cards.filter(isCheck).map((c) => [c.id, { r: 'ok', done: true }])) } } }
}
async function sideFiles(page, mode = 'fixture') {
  const hit = (name) => (route) => (mode === 'missing' ? route.fulfill({ status: 404, body: 'nf' }) : route.fulfill({ status: 200, contentType: 'application/json', body: FIX(name) }))
  await page.route('**/glossary.json', hit('glossary.json'))
  await page.route('**/resources.json', hit('resources.json'))
}
async function dayAt(n, pos, opts = {}) {
  const { side = 'fixture', ...ctxOpts } = opts
  const ctx = await seeded({ v: 1, ...openDay(n, pos) }, { viewport: { width: 1280, height: 900 }, ...ctxOpts })
  const page = await newPage({ ctx })
  if (side) await sideFiles(page, side)
  await page.goto(BASE + `#/day/${n}/text`)
  await page.locator('.card-flip').waitFor({ timeout: 20000 })
  await page.locator('.cards-strip').waitFor()
  return page
}
const flipped = (page) => page.locator('.card-flip').getAttribute('data-flipped')

T('v10-flip-by-double-click-button-and-F', async () => {
  const page = await dayAt(1, 0, { reducedMotion: 'reduce' })
  assert((await flipped(page)) === 'false', 'starts on the front')
  await page.locator('.card-front .ctitle').dblclick()
  await page.waitForFunction(() => document.querySelector('.card-flip')?.getAttribute('data-flipped') === 'true')
  assert((await page.locator('.card-back').getAttribute('inert')) === null, 'the back is live when shown')
  assert((await page.locator('.card-front').getAttribute('inert')) !== null, 'the front is inert while the back shows')
  await page.locator('.card-back .orig-body').first().waitFor({ timeout: 15000 })
  await page.locator('.card-back h2, .card-back .orig-body').first().dblclick({ position: { x: 12, y: 12 } })
  await page.waitForFunction(() => document.querySelector('.card-flip')?.getAttribute('data-flipped') === 'false')
  // the labelled button, same place on front and back
  const b1 = await page.locator('.card-front .flip-btn').boundingBox()
  const frontLabel = (await page.locator('.card-front .flip-btn').textContent()).trim()
  assert(frontLabel === 'Orijinali gör', `front label: ${JSON.stringify(frontLabel)}`)
  await page.locator('.card-front .flip-btn').click()
  await page.waitForFunction(() => document.querySelector('.card-flip')?.getAttribute('data-flipped') === 'true')
  const backLabel = (await page.locator('.card-back .flip-btn').textContent()).trim()
  assert(backLabel === 'Karta dön', `back label: ${JSON.stringify(backLabel)}`)
  const b2 = await page.locator('.card-back .flip-btn').boundingBox()
  assert(Math.abs(b1.x + b1.width - (b2.x + b2.width)) < 2 && Math.abs(b1.y - b2.y) < 2, `the button stays in the same place: ${JSON.stringify(b1)} vs ${JSON.stringify(b2)}`)
  await page.locator('.card-back .flip-btn').click()
  await page.waitForFunction(() => document.querySelector('.card-flip')?.getAttribute('data-flipped') === 'false')
  // keyboard: F, then Esc on the back
  await page.locator('.card-front .ctitle').click()
  await page.keyboard.press('f')
  await page.waitForFunction(() => document.querySelector('.card-flip')?.getAttribute('data-flipped') === 'true')
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.querySelector('.card-flip')?.getAttribute('data-flipped') === 'false')
  await page.keyboard.press('F')
  await page.waitForFunction(() => document.querySelector('.card-flip')?.getAttribute('data-flipped') === 'true')
  await page.keyboard.press('f')
  await page.waitForFunction(() => document.querySelector('.card-flip')?.getAttribute('data-flipped') === 'false')
  await page.context().close()
})

T('v10-double-tap-flips-on-touch-and-a-single-tap-does-not', async () => {
  const page = await dayAt(3, 0, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' })
  const t = await page.locator('.card-front .ctitle').boundingBox()
  const x = t.x + 40
  const y = t.y + t.height / 2
  await page.touchscreen.tap(x, y)
  await sleep(500)
  assert((await flipped(page)) === 'false', 'one tap does nothing')
  await page.touchscreen.tap(x, y)
  await page.touchscreen.tap(x, y)
  await page.waitForFunction(() => document.querySelector('.card-flip')?.getAttribute('data-flipped') === 'true', null, { timeout: 5000 })
  await sleep(700)
  assert((await flipped(page)) === 'true', 'a double-tap turns the card once (the follow-up double-click does not turn it back)')
  await page.context().close()
})

T('v10-double-click-in-the-editor-does-not-flip', async () => {
  const page = await dayAt(1, 0, { reducedMotion: 'reduce' })
  const ed = page.locator('.card-front .cm-content').first()
  await ed.waitFor({ timeout: 20000 })
  await ed.dblclick()
  await sleep(500)
  assert((await flipped(page)) === 'false', 'double-click in the editor must not flip')
  await page.locator('.card-front .cards-keys, .card-front .ccode-cell').first().click({ position: { x: 5, y: 5 } }).catch(() => {})
  // typing an f in the editor must not flip either
  await ed.click()
  await page.keyboard.type('f')
  await sleep(300)
  assert((await flipped(page)) === 'false', 'typing f in the editor must not flip')
  await page.context().close()
})

T('v10-flip-is-a-real-3d-turn-with-an-animated-height', async () => {
  const page = await dayAt(3, 0)
  const css = await page.evaluate(() => {
    const flip = document.querySelector('.card-flip')
    const inner = document.querySelector('.card-flip-inner')
    return { perspective: getComputedStyle(flip).perspective, style: getComputedStyle(inner).transformStyle, bf: getComputedStyle(document.querySelector('.card-back')).backfaceVisibility, bf2: getComputedStyle(document.querySelector('.card-front')).backfaceVisibility }
  })
  assert(css.perspective !== 'none' && css.style === 'preserve-3d' && css.bf === 'hidden' && css.bf2 === 'hidden', 'perspective + preserve-3d + backface hidden: ' + JSON.stringify(css))
  // lazy parts (fonts, glossary, resources) can still change the front's height right after load: wait until it holds still
  let h0 = -1
  for (let i = 0; i < 20; i++) {
    const h = await page.locator('.card-flip').evaluate((e) => e.getBoundingClientRect().height)
    if (h === h0) break
    h0 = h
    await sleep(400)
  }
  await page.keyboard.press('f')
  await sleep(120)
  const mid = await page.locator('.card-flip-inner').evaluate((e) => getComputedStyle(e).transform)
  assert(mid !== 'none' && mid.startsWith('matrix3d'), 'mid-turn the card is rotated in 3D: ' + mid)
  await page.waitForFunction(() => document.querySelector('.card-flip')?.getAttribute('data-flipped') === 'true')
  await sleep(700)
  const m = await page.evaluate(() => ({ box: document.querySelector('.card-flip').getBoundingClientRect().height, back: document.querySelector('.card-back').getBoundingClientRect().height }))
  assert(Math.abs(m.box - m.back) < 3, `the card takes the back's height: box ${m.box} back ${m.back}`)
  // no nested scrollbar anywhere inside the card
  const nested = await page.evaluate(() => [...document.querySelectorAll('.card-flip *')].filter((e) => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 1).map((e) => e.className))
  assert(nested.length === 0, 'no element in the card scrolls on its own: ' + nested.join(','))
  await page.keyboard.press('f')
  await sleep(700)
  const h1 = await page.locator('.card-flip').evaluate((e) => e.getBoundingClientRect().height)
  assert(Math.abs(h1 - h0) < 3, `back on the front: height returns (${h0} vs ${h1})`)
  await page.context().close()
})

T('v10-flip-reduced-motion-uses-no-3d-transform', async () => {
  const page = await dayAt(3, 0, { reducedMotion: 'reduce' })
  await page.keyboard.press('f')
  await sleep(60)
  const css = await page.evaluate(() => ({ t: getComputedStyle(document.querySelector('.card-flip-inner')).transform, p: getComputedStyle(document.querySelector('.card-flip')).perspective, s: getComputedStyle(document.querySelector('.card-flip-inner')).transformStyle }))
  assert(css.t === 'none' && css.p === 'none' && css.s !== 'preserve-3d', 'reduced motion: no 3D transform ' + JSON.stringify(css))
  await page.waitForFunction(() => document.querySelector('.card-flip')?.getAttribute('data-flipped') === 'true')
  await page.context().close()
})

T('v10-back-of-day3-card1-is-its-own-section-only', async () => {
  const page = await dayAt(3, 0, { reducedMotion: 'reduce' })
  await page.keyboard.press('f')
  await page.locator('.card-back .orig-body h2').waitFor({ timeout: 15000 })
  const heads = await page.locator('.card-back .orig-body h1, .card-back .orig-body h2, .card-back .orig-body h3').allInnerTexts()
  assert(heads.length === 1 && /Boolean/i.test(heads[0]), 'only the Boolean heading: ' + JSON.stringify(heads))
  const len = (await page.locator('.card-back .orig-body').innerText()).length
  assert(len > 80 && len < 1500, 'a short section, not the rest of the document: ' + len + ' chars')
  await page.context().close()
})

T('v10-original-text-never-repeats-across-a-days-backs', async () => {
  for (const day of [1, 2, 3, 4, 5]) {
    const page = await dayAt(day, 0, { reducedMotion: 'reduce' })
    const n = dayFile(day).cards.length
    const seen = new Map()
    let notes = 0
    let originals = 0
    for (let i = 0; i < n; i++) {
      await page.locator('.cards-strip li').nth(i).locator('button').click()
      await page.waitForFunction((k) => document.querySelector('.cards')?.getAttribute('data-card') === String(k), i)
      await page.keyboard.press('f')
      await page.waitForFunction(() => document.querySelector('.card-flip')?.getAttribute('data-flipped') === 'true')
      await page.locator('.card-back .orig-body, .card-back .back-notes').first().waitFor({ timeout: 15000 })
      const parts = await page.locator('.card-back .orig-body p, .card-back .orig-body li, .card-back .orig-body pre').allInnerTexts()
      if (parts.length) originals++
      else {
        assert((await page.locator('.card-back .back-notes').count()) === 1, `card ${i + 1}: a back without original text shows the notes face`)
        assert(/\d+\. kartta|bulunamadı|alt başlıklarda/.test(await page.locator('.card-back .back-notes').innerText()), `card ${i + 1}: notes name the card that holds the original`)
        notes++
      }
      for (const p of parts) {
        const k = p.replace(/\s+/g, ' ').trim()
        if (!k) continue
        assert(!seen.has(k) || seen.get(k) === i + 1, `day ${day}: card ${i + 1} repeats a paragraph already on card ${seen.get(k)}: "${k.slice(0, 60)}"`)
        seen.set(k, i + 1)
      }
      await page.keyboard.press('f')
      await page.waitForFunction(() => document.querySelector('.card-flip')?.getAttribute('data-flipped') === 'false')
    }
    assert(originals >= 3 && notes >= 1, `day ${day}: some backs hold original text (${originals}) and some are notes (${notes})`)
    await page.context().close()
  }
})

T('v10-flip-hint-for-the-first-three-cards-only', async () => {
  const ctx = await seeded({ v: 1, ...openDay(1, 0) }, { viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const page = await newPage({ ctx })
  await sideFiles(page)
  await page.goto(BASE + '#/day/1/text')
  await page.locator('.cards').waitFor({ timeout: 20000 })
  const hint = page.locator('.card-slide:not(.is-leaving) .flip-hint')
  for (let i = 0; i < 3; i++) {
    await hint.waitFor({ timeout: 5000 })
    assert(/çift tıkla/.test(await hint.innerText()), 'the tip says double-click')
    await page.locator('.cards-next').click()
    await page.waitForFunction((k) => document.querySelector('.cards')?.getAttribute('data-card') === String(k), i + 1)
  }
  await sleep(300)
  assert((await hint.count()) === 0, 'the tip is gone from card 4 on')
  await page.reload()
  await page.locator('.cards').waitFor({ timeout: 20000 })
  await page.getByRole('button', { name: /Orijinali gör/ }).first().waitFor()
  assert((await page.locator('.card-slide:not(.is-leaving) .flip-hint').count()) === 0, 'and never comes back after a reload')
  await ctx.close()
})

const rail = (page, side) => page.locator(`.rail-${side}`)

T('v10-rails-at-1440-sit-beside-the-card-and-teach', async () => {
  const page = await dayAt(3, 0, { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const L = await rail(page, 'left').boundingBox()
  const R = await rail(page, 'right').boundingBox()
  const C = await page.locator('.card-flip').boundingBox()
  assert(L && R && C, 'both rails and the card are on screen')
  assert(L.x + L.width <= C.x - 8 && R.x >= C.x + C.width + 8, `rails do not overlap the card: ${JSON.stringify({ L, C, R })}`)
  assert(Math.abs(L.y - C.y) <= 2 && Math.abs(R.y - C.y) <= 2, `rails start at the card's top: ${L.y} ${R.y} vs ${C.y}`)
  assert(L.width >= 220 && L.width <= 300 && R.width >= 250 && R.width <= 330, `rail widths ~260 / ~300: ${L.width} ${R.width}`)
  // right rail: the glossary lists the fixture boolean term (card 1 of day 3 mentions True)
  const terms = rail(page, 'right').locator('.rail-box', { has: page.getByRole('heading', { name: 'Terimler' }) })
  await terms.waitFor({ timeout: 10000 })
  assert(/boolean/i.test(await terms.innerText()), 'Terimler lists the boolean term')
  assert((await terms.locator('.term').count()) <= 4, 'at most four terms')
  assert((await rail(page, 'right').getByRole('heading', { name: 'Kısayollar' }).count()) === 1, 'shortcuts box is there')
  assert((await rail(page, 'right').locator('details.rail-box[open]').count()) === 0, 'shortcuts start collapsed')
  // left rail: today's outline and outside resources
  const outline = rail(page, 'left').locator('.rail-box', { has: page.getByRole('heading', { name: 'Bu gün' }) })
  assert((await outline.locator('li').count()) >= 6, 'the outline lists the day sections')
  assert((await outline.locator('li[aria-current="step"], li.is-active').count()) === 1, 'one active section')
  const links = rail(page, 'left').locator('.rail-res a')
  assert((await links.count()) >= 1, 'resources listed')
  for (const a of await links.all()) {
    assert((await a.getAttribute('target')) === '_blank' && /noopener/.test((await a.getAttribute('rel')) || '') && /^https:\/\//.test((await a.getAttribute('href')) || ''), 'valid external link')
  }
  assert(/Makale|Doküman/.test(await rail(page, 'left').locator('.rail-res').first().innerText()), 'the kind is written in words')
  // the current section's resource comes first
  assert(/Truth value/.test(await links.first().innerText()), 'the current section first: ' + (await links.first().innerText()))
  // clicking an outline entry jumps to its first card
  await outline.locator('li', { hasText: 'Arithmetic Operators' }).locator('button').click()
  await page.waitForFunction(() => Number(document.querySelector('.cards')?.getAttribute('data-card')) === 9, null, { timeout: 5000 })
  // "Dene" loads a term example into the card's editor when the card has one
  await page.locator('.cards-strip li').nth(1).locator('button').click()
  await terms.waitFor()
  await terms.locator('summary').first().click()
  await terms.getByRole('button', { name: 'Dene' }).first().click()
  await page.waitForFunction(() => /print\(True\)/.test(document.querySelector('.card-front .cm-content')?.textContent || ''), null, { timeout: 8000 }).catch(() => {
    throw new Error('the example landed in the editor')
  })
  await page.context().close()
})

T('v10-rails-stick-while-the-card-scrolls', async () => {
  const d = dayFile(1)
  let longest = 0
  d.cards.forEach((c, i) => {
    if (JSON.stringify(c).length > JSON.stringify(d.cards[longest]).length) longest = i
  })
  const page = await dayAt(1, longest, { viewport: { width: 1440, height: 700 }, reducedMotion: 'reduce' })
  await page.keyboard.press('f')
  await page.locator('.card-back .orig-body, .card-back .back-notes').first().waitFor({ timeout: 15000 })
  await sleep(300)
  const before = await rail(page, 'right').boundingBox()
  await page.evaluate(() => window.scrollTo(0, 300))
  await sleep(200)
  const sc = await page.evaluate(() => window.scrollY)
  const after = await rail(page, 'right').boundingBox()
  if (sc > 100) assert(after.y > 0 && after.y < 140 && after.y < before.y, `the rail stays in view while the page scrolls: ${before.y} -> ${after.y}`)
  await page.context().close()
})

T('v10-rails-at-1100-only-the-right-one', async () => {
  const page = await dayAt(3, 0, { viewport: { width: 1100, height: 900 }, reducedMotion: 'reduce' })
  assert((await rail(page, 'left').count()) === 0, 'no left rail')
  const R = rail(page, 'right')
  assert(await R.isVisible(), 'right rail visible')
  const C = await page.locator('.card-flip').boundingBox()
  const RB = await R.boundingBox()
  assert(RB.x >= C.x + C.width + 8, 'right rail beside the card')
  assert((await R.locator('details.rail-group').count()) === 1, 'the left rail content became a collapsible group in the right rail')
  assert((await R.locator('details.rail-group[open]').count()) === 0, 'collapsed by default')
  await R.locator('details.rail-group summary').click()
  assert((await R.locator('details.rail-group li').count()) >= 6, 'the outline is inside')
  await page.context().close()
})

T('v10-notes-sheet-on-a-phone', async () => {
  const page = await dayAt(3, 0, { viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' })
  assert((await page.locator('.rail').count()) === 0, 'no rails on a phone')
  const btn = page.locator('.card-front .notes-btn')
  assert((await btn.innerText()) === 'Notlar', 'the Notlar button is in the card header')
  const inHead = await btn.evaluate((b) => !!b.closest('.card-head'))
  assert(inHead, 'inside the header')
  await btn.click()
  const sheet = page.getByRole('dialog', { name: 'Notlar' })
  await sheet.waitFor()
  assert((await sheet.getByRole('heading', { name: 'Terimler' }).count()) === 1, 'terms in the sheet')
  assert((await sheet.getByRole('heading', { name: 'Bu gün' }).count()) === 1, 'outline in the sheet')
  const box = await sheet.boundingBox()
  assert(box.width <= 390 && box.height >= 600, 'a full-height sheet: ' + JSON.stringify(box))
  await page.keyboard.press('Escape')
  await sheet.waitFor({ state: 'detached' })
  await btn.click()
  await sheet.waitFor()
  await sheet.getByRole('button', { name: 'Kapat' }).click()
  await sheet.waitFor({ state: 'detached' })
  assert((await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)) === true, 'no horizontal scroll')
  await page.context().close()
})

T('v10-rails-with-no-glossary-or-resources', async () => {
  const page = await dayAt(3, 0, { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', side: 'missing' })
  await sleep(600)
  assert(page.errors.length === 0, 'no page errors: ' + page.errors.join('; '))
  assert((await page.getByRole('heading', { name: 'Terimler' }).count()) === 0, 'the Terimler box is hidden')
  assert((await page.getByRole('heading', { name: 'Kaynaklar' }).count()) === 0, 'the Kaynaklar box is hidden')
  assert((await page.getByRole('heading', { name: 'Hatırla' }).count()) === 0, 'the Hatırla box is hidden')
  assert((await page.getByRole('heading', { name: 'Bu gün' }).count()) === 1, 'the outline stays (it needs no data)')
  const empty = await page.evaluate(() => [...document.querySelectorAll('.rail > *')].filter((e) => e.getBoundingClientRect().height < 2).length)
  assert(empty === 0, 'no zero-height leftovers that would open a gap')
  const R = await rail(page, 'right').boundingBox()
  const first = await rail(page, 'right').locator('> *').first().boundingBox()
  assert(Math.abs(first.y - R.y) < 2, 'no gap above the first remaining box')
  await page.context().close()
})

T('v10-skeleton-instead-of-a-black-loading-screen', async () => {
  const ctx = await seeded({ v: 1, ...openDay(2, 0) }, { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await newPage({ ctx })
  await sideFiles(page)
  // hold the lesson chunk back so the loading state can be looked at
  await page.route('**/assets/Reader-*.js', async (route) => {
    await sleep(1500)
    await route.continue()
  })
  await page.addInitScript(() => {
    window.__cls = 0
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value
    }).observe({ type: 'layout-shift', buffered: true })
  })
  await page.goto(BASE + '#/day/2/text')
  await page.locator('.lesson-skel').waitFor({ timeout: 5000 })
  const sk = await page.evaluate(() => ({ bar: !!document.querySelector('.lesson-skel .skel-strip'), card: !!document.querySelector('.lesson-skel .skel-card'), rails: document.querySelectorAll('.lesson-skel .skel-rail').length, text: document.querySelector('.lesson-skel')?.innerText.trim() }))
  assert(sk.bar && sk.card && sk.rails === 2, 'skeleton has the bar, the card frame and both rails: ' + JSON.stringify(sk))
  assert(sk.text === '', 'no visible loading words')
  await page.locator('.card-flip').waitFor({ timeout: 20000 })
  await sleep(800)
  assert((await page.locator('.lesson-skel').count()) === 0, 'skeleton gone')
  const cls = await page.evaluate(() => window.__cls)
  assert(cls < 0.1, 'layout shift stays small when the content arrives: ' + cls.toFixed(3))
  await ctx.close()
})

T('v10-long-cards-keep-the-action-in-view-and-the-measure-readable', async () => {
  for (const vp of [{ width: 1440, height: 850 }, { width: 390, height: 844 }]) {
    let place = null
    for (const day of [1, 2, 3, 4, 5]) {
      const d = dayFile(day)
      const order = d.cards.map((c, i) => [JSON.stringify(c).length, i]).sort((a, b) => b[0] - a[0]).slice(0, 5)
      const ctx = await seeded({ v: 1, ...openDay(day, order[0][1]) }, { viewport: vp, hasTouch: vp.width < 700, reducedMotion: 'reduce' })
      const page = await newPage({ ctx })
      await sideFiles(page)
      await page.goto(BASE + `#/day/${day}/text`)
      await page.locator('.card-flip').waitFor({ timeout: 20000 })
      for (const [, idx] of order) {
        await page.locator('.cards-strip li').nth(idx).locator('button').click()
        await page.waitForFunction((k) => document.querySelector('.cards')?.getAttribute('data-card') === String(k), idx)
        await page.evaluate(() => window.scrollTo(0, 0))
        await sleep(250)
        const next = page.locator('.cards-next')
        const b = await next.boundingBox()
        assert(b && b.y >= 0 && b.y + b.height <= vp.height, `${vp.width}px day ${day} card ${idx + 1}: Next is in view without scrolling: ${JSON.stringify(b)}`)
        if (!place) place = b
        assert(Math.abs(b.x + b.width - (place.x + place.width)) < 2 && Math.abs(b.y - place.y) < 2, `${vp.width}px day ${day} card ${idx + 1}: Next stays in one place: ${JSON.stringify(b)} vs ${JSON.stringify(place)}`)
        const prim = page.locator('.card-front .ccode-cell .btn-chev, .card-front .cbody .btn-chev').first()
        if (await prim.count()) {
          const pb = await prim.boundingBox()
          assert(pb.y + pb.height > 0, 'the primary action exists')
        }
        if ((await page.locator('.card-front .cmd').count()) && vp.width > 1000) {
          const m = await page.locator('.card-front .cmd').first().evaluate((e) => ({ fs: parseFloat(getComputedStyle(e).fontSize), w: e.getBoundingClientRect().width }))
          assert(m.fs >= 18 && m.fs <= 20, `body text 18-20px: ${m.fs}`)
          assert(m.w / m.fs <= 40, 'measure is bounded: ' + m.w) // ch ~ 0.5em: 70ch is about 35-40em
        }
        const sw = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
        assert(sw, `${vp.width}px day ${day} card ${idx + 1}: no horizontal scroll`)
      }
      await ctx.close()
    }
  }
})

T('v10-back-button-has-no-stray-square', async () => {
  const page = await dayAt(1, 1, { reducedMotion: 'reduce' })
  assert((await page.locator('.cards-prev .tb-chev').count()) === 0, 'no glyph element in Geri')
  const b = await page.locator('.cards-prev').evaluate((e) => ({ before: getComputedStyle(e, '::before').content, after: getComputedStyle(e, '::after').content }))
  assert(b.before === 'none' && b.after === 'none', 'no pseudo glyph either: ' + JSON.stringify(b))
  await page.context().close()
})

T('v10-lang-switch-on-a-phone-sits-at-the-top-and_covers-nothing', async () => {
  const ctx = await seeded({ v: 1, ...openDay(1, 0) }, { viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' })
  const page = await newPage({ ctx })
  await sideFiles(page)
  await page.goto(BASE + '#/day/1/text')
  await page.locator('.card-flip').waitFor({ timeout: 20000 })
  await sleep(300)
  const hit = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
  const sw = await langSwitch(page).boundingBox()
  assert(sw.y < 130, 'the switch is up in the header area: ' + JSON.stringify(sw))
  for (const sel of ['.card-flip', '.cards-bar', '.appbar', '.cards-strip', '.tabs']) {
    const o = await page.locator(sel).first().boundingBox()
    assert(!hit(sw, o), `the switch does not overlap ${sel}: ${JSON.stringify(sw)} vs ${JSON.stringify(o)}`)
  }
  await page.evaluate(() => window.scrollTo(0, 400))
  await sleep(200)
  const sw2 = await langSwitch(page).boundingBox()
  const bar = await page.locator('.cards-bar').boundingBox()
  assert(!hit(sw2, bar), 'still clear of the action bar after scrolling')
  await ctx.close()
})


function assert(c, m) {
  if (!c) throw new Error(m)
}

let failed = 0
// --shard i/n runs every n-th test starting at i (1-based), so CI can split the suite across machines
const [shardI, shardN] = flag('shard', '1/1').split('/').map(Number)
const names = Object.keys(tests)
  .filter((n) => !only.length || only.some((o) => n.includes(o)))
  .filter((_, k) => k % shardN === shardI - 1)
for (const n of names) {
  const t = Date.now()
  try {
    await tests[n]()
    console.log(`PASS ${n} (${Date.now() - t} ms)`)
  } catch (e) {
    failed++
    console.log(`FAIL ${n} (${Date.now() - t} ms)\n     ${String(e.message || e).split('\n').slice(0, 4).join('\n     ')}`)
    try {
      await lastPage?.screenshot({ path: join(out, `fail-${n}.png`) })
    } catch {
      /* page already closed */
    }
  }
}
await browser.close()
server.close()
console.log(failed ? `${failed} failed of ${names.length}` : `all ${names.length} passed`)
process.exit(failed ? 1 : 0)
