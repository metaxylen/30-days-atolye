import { useSyncExternalStore } from 'react'

export interface RunResult {
  out: { stream: 'out' | 'err'; text: string }[]
  repr?: string
  error?: string
  stopped?: boolean
}

export interface TestResult {
  ok: boolean
  kind?: 'assert' | 'error'
  msg?: string
}

export interface CheckResult {
  stdout: string
  error: string | null
  tests: TestResult[]
  timeout?: boolean
}

/** A value in the visualizer: a plain repr, or a list/tuple/set/dict with its first items (k = type name, n = size, i = items). */
export interface TraceVar {
  k: string
  r?: string
  n?: number
  i?: (string | string[])[]
}

/** One executed line: the line about to run (l = 0 when none), the frame's name, its variables, the module's variables and how many output chunks exist so far. */
export interface TraceStep {
  l: number
  f: string
  v: [string, TraceVar][]
  g: [string, TraceVar][]
  o: number
  end?: boolean
  err?: boolean
}

export interface TraceResult {
  steps: TraceStep[]
  chunks: string[]
  error: string | null
  truncated: boolean
  timeout?: boolean
}

export type Phase = 'idle' | 'loading' | 'ready' | 'error'
/** Where a loading start is: fetching the files (with a percentage) or building the interpreter. */
export type Stage = '' | 'download' | 'prepare'

interface Job {
  resolve: (r: RunResult) => void
  resolveCheck?: (r: CheckResult) => void
  resolveTrace?: (r: TraceResult) => void
  timer?: number
  acc: RunResult
  onUpdate?: (r: RunResult) => void
  onStatus?: (t: string) => void
}

const CHECK_LIMIT_MS = 8000
/** A start that has not finished by now is treated as stuck (a CDN that hangs instead of failing). */
export const BOOT_LIMIT_MS = 45_000
/** Status and error texts are markers (@@name) turned into the reader's language at render time (lib/errors localize). */
export const BOOT_TIMEOUT_TEXT = '@@boottimeout'

/** One shared Python worker for the whole app; notebooks are separated by session key. */
class Runner {
  private worker: Worker | null = null
  private jobs = new Map<number, Job>()
  private seq = 0
  private bootTimer: number | undefined
  phase: Phase = 'idle'
  status = ''
  stage: Stage = ''
  pct = 0
  private subs = new Set<() => void>()

  subscribe = (f: () => void) => {
    this.subs.add(f)
    return () => this.subs.delete(f)
  }
  snapshot = (): string => `${this.phase}|${this.pct}|${this.stage}|${this.status}`
  private emit() {
    // Tests and styles can read the phase from the page.
    if (typeof document !== 'undefined') document.documentElement.dataset.py = this.phase
    this.subs.forEach((f) => f())
  }

  private ensure(): Worker {
    if (this.worker) return this.worker
    const w = new Worker(new URL('./py.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (ev: MessageEvent) => {
      const m = ev.data as { type: string; id?: number; text?: string; stream?: 'out' | 'err'; repr?: string; error?: string; stage?: Stage; pct?: number }
      if (m.type === 'status') {
        if (m.id === undefined) {
          this.status = m.text ?? ''
          this.stage = m.stage ?? this.stage
          this.pct = m.pct ?? this.pct
          if (this.phase === 'idle') this.phase = 'loading'
        } else {
          this.jobs.get(m.id)?.onStatus?.(m.text ?? '')
        }
        this.emit()
      } else if (m.type === 'ready') {
        window.clearTimeout(this.bootTimer)
        this.bootTimer = undefined
        this.phase = 'ready'
        this.status = ''
        this.stage = ''
        this.pct = 100
        this.emit()
      } else if (m.type === 'boot-error') {
        this.failBoot(`@@bootfail:${m.text ?? ''}`)
      } else if (m.type === 'out' && m.id !== undefined) {
        const j = this.jobs.get(m.id)
        if (j) {
          j.acc = { ...j.acc, out: [...j.acc.out, { stream: m.stream ?? 'out', text: m.text ?? '' }] }
          j.onUpdate?.(j.acc)
        }
      } else if (m.type === 'started' && m.id !== undefined) {
        const j = this.jobs.get(m.id)
        if ((j?.resolveCheck || j?.resolveTrace) && !j.timer) {
          j.timer = window.setTimeout(() => {
            j.resolveCheck?.({ stdout: '', error: null, tests: [], timeout: true })
            j.resolveTrace?.({ steps: [], chunks: [], error: null, truncated: false, timeout: true })
            this.jobs.delete(m.id!)
            this.stop()
          }, CHECK_LIMIT_MS)
        }
      } else if (m.type === 'traced' && m.id !== undefined) {
        const j = this.jobs.get(m.id)
        if (j?.resolveTrace) {
          window.clearTimeout(j.timer)
          this.jobs.delete(m.id)
          j.resolveTrace(JSON.parse((m as unknown as { json: string }).json) as TraceResult)
        }
      } else if (m.type === 'checked' && m.id !== undefined) {
        const j = this.jobs.get(m.id)
        if (j?.resolveCheck) {
          window.clearTimeout(j.timer)
          this.jobs.delete(m.id)
          j.resolveCheck(JSON.parse((m as unknown as { json: string }).json) as CheckResult)
        }
      } else if (m.type === 'result' && m.id !== undefined) {
        const j = this.jobs.get(m.id)
        if (j) {
          this.jobs.delete(m.id)
          j.resolve({ ...j.acc, repr: m.repr, error: m.error })
        }
      }
    }
    w.onerror = () => this.failBoot('@@workerfail')
    this.worker = w
    return w
  }

  /** Marks the start as loading (once) and arms the 45 s timeout. A failed earlier start is retried from scratch. */
  private begin() {
    if (this.phase === 'error') this.reset()
    if (this.phase === 'idle') {
      this.phase = 'loading'
      this.status = '@@dl'
      this.stage = 'download'
      this.pct = 0
      this.emit()
    }
    if (this.phase === 'loading' && this.bootTimer === undefined) {
      this.bootTimer = window.setTimeout(() => this.failBoot(BOOT_TIMEOUT_TEXT), BOOT_LIMIT_MS)
    }
  }

  /** The start failed or hung: stop the worker, tell every waiting job why, show the retry state. */
  private failBoot(message: string) {
    window.clearTimeout(this.bootTimer)
    this.bootTimer = undefined
    this.worker?.terminate()
    this.worker = null
    this.phase = 'error'
    this.status = message
    this.stage = ''
    this.jobs.forEach((j) => {
      window.clearTimeout(j.timer)
      j.resolve({ ...j.acc, error: message })
      j.resolveCheck?.({ stdout: '', error: message, tests: [] })
      j.resolveTrace?.({ steps: [], chunks: [], error: message, truncated: false })
    })
    this.jobs.clear()
    this.emit()
  }

  private reset() {
    window.clearTimeout(this.bootTimer)
    this.bootTimer = undefined
    this.worker?.terminate()
    this.worker = null
    this.phase = 'idle'
    this.status = ''
    this.stage = ''
    this.pct = 0
  }

  /** Start downloading Python before the first Run so the first result is quicker. */
  warm() {
    this.begin()
    this.ensure().postMessage({ type: 'boot' })
  }

  /** The "Yeniden dene" button after a failed or stuck start. */
  retry() {
    this.reset()
    this.emit()
    this.warm()
  }

  run(session: string, code: string, stdin: string[], onUpdate?: (r: RunResult) => void, onStatus?: (t: string) => void): Promise<RunResult> {
    this.begin()
    const w = this.ensure()
    const id = ++this.seq
    return new Promise<RunResult>((resolve) => {
      this.jobs.set(id, { resolve, acc: { out: [] }, onUpdate, onStatus })
      w.postMessage({ type: 'run', id, session, code, stdin })
    })
  }

  /**
   * Runs the learner's code in a fresh namespace, then each test snippet (which sees __stdout__ and __source__).
   * An endless loop is cut off after CHECK_LIMIT_MS by restarting the worker.
   */
  check(code: string, tests: string[], onStatus?: (t: string) => void): Promise<CheckResult> {
    this.begin()
    const w = this.ensure()
    const id = ++this.seq
    return new Promise<CheckResult>((resolve) => {
      this.jobs.set(id, { resolve: () => undefined, resolveCheck: resolve, acc: { out: [] }, onStatus })
      w.postMessage({ type: 'check', id, code, tests })
    })
  }

  /** Line-by-line trace (at most 300 steps) of the code in a fresh namespace; an endless loop is cut off like in check(). */
  trace(code: string, onStatus?: (t: string) => void): Promise<TraceResult> {
    this.begin()
    const w = this.ensure()
    const id = ++this.seq
    return new Promise<TraceResult>((resolve) => {
      this.jobs.set(id, { resolve: () => undefined, resolveTrace: resolve, acc: { out: [] }, onStatus })
      w.postMessage({ type: 'trace', id, code })
    })
  }

  drop(session: string) {
    this.worker?.postMessage({ type: 'drop', session })
  }

  /** Last resort for endless loops: kill the worker. All notebooks start fresh on the next run. */
  stop() {
    window.clearTimeout(this.bootTimer)
    this.bootTimer = undefined
    this.worker?.terminate()
    this.worker = null
    this.phase = 'idle'
    this.status = ''
    this.stage = ''
    this.pct = 0
    this.jobs.forEach((j) => {
      window.clearTimeout(j.timer)
      j.resolve({ ...j.acc, stopped: true })
      j.resolveCheck?.({ stdout: '', error: null, tests: [], timeout: true })
      j.resolveTrace?.({ steps: [], chunks: [], error: null, truncated: false, timeout: true })
    })
    this.jobs.clear()
    this.emit()
  }
}

export const runner = new Runner()
export const useRunnerPhase = (): { phase: Phase; status: string; pct: number; stage: Stage } => {
  const snap = useSyncExternalStore(runner.subscribe, runner.snapshot, runner.snapshot)
  const [phase, pct, stage, ...rest] = snap.split('|')
  return { phase: phase as Phase, pct: Number(pct) || 0, stage: stage as Stage, status: rest.join('|') }
}
