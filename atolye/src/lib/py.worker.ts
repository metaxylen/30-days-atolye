/* Pyodide runs here so a slow or endless cell never freezes the page.
 * Module worker: Pyodide's ES build is imported straight from the CDN (the classic importScripts build fails to evaluate in a cross-origin worker). */

export {}

const PYODIDE_VERSION = '314.0.7'
const BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Py = any

const post = (m: unknown) => (self as unknown as { postMessage: (m: unknown) => void }).postMessage(m)

const HELPER = `
import ast, sys, json, traceback, io, contextlib, builtins

# A check must not leak into the next one: put back any builtin the learner's code replaced.
__atolye_builtins = dict(builtins.__dict__)

def __atolye_restore_builtins():
    b = builtins.__dict__
    for k, v in __atolye_builtins.items():
        if b.get(k) is not v:
            b[k] = v
    for k in [k for k in b if k not in __atolye_builtins and not k.startswith('_')]:
        del b[k]

def __atolye_run(src, ns):
    try:
        tree = ast.parse(src, '<cell>', 'exec')
        last = None
        if tree.body and isinstance(tree.body[-1], ast.Expr):
            last = ast.Expression(tree.body.pop().value)
        exec(compile(tree, '<cell>', 'exec'), ns)
        if last is not None:
            v = eval(compile(last, '<cell>', 'eval'), ns)
            if v is not None:
                ns['_'] = v
                return json.dumps({'repr': repr(v)})
        return json.dumps({})
    except BaseException as e:
        et, ev, tb = sys.exc_info()
        if isinstance(ev, SyntaxError):
            text = ''.join(traceback.format_exception_only(et, ev))
        else:
            tb = tb.tb_next if tb is not None else None
            text = ''.join(traceback.format_exception(et, ev, tb))
        return json.dumps({'error': text})

def __atolye_check(src, tests_json):
    tests = json.loads(tests_json)
    ns = {'__name__': '__main__'}
    buf = io.StringIO()
    res = {'stdout': '', 'error': None, 'tests': []}
    try:
        with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
            exec(compile(src, '<kod>', 'exec'), ns)
    except BaseException as e:
        et, ev, tb = sys.exc_info()
        if isinstance(ev, SyntaxError):
            text = ''.join(traceback.format_exception_only(et, ev))
        else:
            tb = tb.tb_next if tb is not None else None
            text = ''.join(traceback.format_exception(et, ev, tb))
        if 'EOFError' in text:
            text += '\\n@@eof-check'
        res['error'] = text
    res['stdout'] = buf.getvalue()
    if res['error'] is None:
        # Tests see what the program printed and the learner's own source, so they can require the method and not
        # only the answer (a hard-coded constant fails a test that looks at __source__).
        ns['__stdout__'] = res['stdout']
        ns['__source__'] = src
        for t in tests:
            try:
                exec(compile(t, '<test>', 'exec'), ns)
                res['tests'].append({'ok': True})
            except AssertionError as e:
                res['tests'].append({'ok': False, 'kind': 'assert', 'msg': str(e)})
            except BaseException as e:
                res['tests'].append({'ok': False, 'kind': 'error', 'msg': type(e).__name__ + ': ' + str(e)})
    __atolye_restore_builtins()
    return json.dumps(res)

class _AtolyeStop(BaseException):
    pass

# Line-by-line trace for the Anlatım visualizer: one step per executed line of the learner's code (cap 300), each with
# the line number about to run, a snapshot of the frame's user variables and how much output exists so far.
def __atolye_trace(src):
    import types
    chunks = []
    class W:
        def write(self, s):
            chunks.append(s)
            return len(s)
        def flush(self):
            pass
    ns = {'__name__': '__main__'}
    steps = []
    skip = ('<listcomp>', '<genexpr>', '<dictcomp>', '<setcomp>')
    res = {'steps': steps, 'chunks': chunks, 'error': None, 'truncated': False}
    def rep(v):
        try:
            s = repr(v)
        except BaseException:
            s = '<?>'
        return s if len(s) <= 40 else s[:37] + '...'
    def desc(v):
        t = type(v)
        if t in (list, tuple, set, frozenset):
            return {'k': t.__name__, 'n': len(v), 'i': [rep(x) for x in list(v)[:12]]}
        if t is dict:
            return {'k': 'dict', 'n': len(v), 'i': [[rep(a), rep(b)] for a, b in list(v.items())[:10]]}
        return {'k': 'x', 'r': rep(v)}
    def show(d):
        out = []
        for k, v in list(d.items()):
            if k.startswith('_'):
                continue
            if isinstance(v, (types.ModuleType, types.FunctionType, types.BuiltinFunctionType, type)):
                continue
            out.append([k, desc(v)])
        return out
    def record(frame):
        if len(steps) >= 300:
            res['truncated'] = True
            raise _AtolyeStop()
        name = frame.f_code.co_name
        steps.append({'l': frame.f_lineno, 'f': name, 'v': show(frame.f_locals), 'g': show(frame.f_globals) if name != '<module>' else [], 'o': len(chunks)})
    def local(frame, event, arg):
        if event == 'line':
            record(frame)
        return local
    def glob(frame, event, arg):
        co = frame.f_code
        if co.co_filename != '<trace>' or co.co_name in skip:
            return None
        return local
    old = sys.stdout
    sys.stdout = W()
    err_line = 0
    try:
        code = compile(src, '<trace>', 'exec')
        sys.settrace(glob)
        try:
            exec(code, ns)
        finally:
            sys.settrace(None)
    except _AtolyeStop:
        pass
    except BaseException:
        et, ev, tb = sys.exc_info()
        if isinstance(ev, SyntaxError):
            text = ''.join(traceback.format_exception_only(et, ev))
            err_line = ev.lineno or 0
        else:
            t = tb
            while t is not None:
                if t.tb_frame.f_code.co_filename == '<trace>':
                    err_line = t.tb_lineno
                t = t.tb_next
            tb = tb.tb_next if tb is not None else None
            text = ''.join(traceback.format_exception(et, ev, tb))
        if 'EOFError' in text:
            text += '\\n@@eof-trace'
        res['error'] = text
    finally:
        sys.stdout = old
    if not res['truncated']:
        end = {'l': err_line, 'f': '<module>', 'v': show(ns), 'g': [], 'o': len(chunks)}
        if res['error'] is None:
            end['end'] = True
        else:
            end['err'] = True
        steps.append(end)
    return json.dumps(res)
`

let pyodide: Py = null
let booting: Promise<Py> | null = null
const sessions = new Map<string, Py>()
let queue: Promise<void> = Promise.resolve()

/**
 * Download size (decoded bytes) of the three files every start needs, measured with scripts/measure-pyodide.mjs.
 * The percentage is real progress over these, not a timer.
 */
const BOOT_FILES: Record<string, number> = { 'pyodide.asm.wasm': 9_598_218, 'python_stdlib.zip': 2_545_637, 'pyodide-lock.json': 119_077 }
const BOOT_TOTAL = Object.values(BOOT_FILES).reduce((a, b) => a + b, 0)
const CACHE_NAME = `atolye-pyodide-${PYODIDE_VERSION}`

const bootLoaded: Record<string, number> = {}
const bootDone = new Set<string>()
let lastPct = -1

function reportDownload() {
  const got = Object.values(bootLoaded).reduce((a, b) => a + b, 0)
  const pct = Math.min(99, Math.floor((got / BOOT_TOTAL) * 100))
  if (bootDone.size >= Object.keys(BOOT_FILES).length) {
    post({ type: 'status', stage: 'prepare', text: '@@prepare', pct: 100 })
  } else if (pct !== lastPct) {
    lastPct = pct
    post({ type: 'status', stage: 'download', text: '@@dl', pct })
  }
}

/**
 * Pyodide's own downloads go through this fetch: answered from the Cache API when the file is there (second visit,
 * and offline), otherwise fetched, counted for the progress bar and stored for next time.
 */
let fetchInstalled = false
function installCachingFetch() {
  if (fetchInstalled) return
  fetchInstalled = true
  const realFetch = self.fetch.bind(self)
  self.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (!url.startsWith(BASE) || (init?.method && init.method !== 'GET')) return realFetch(input, init)
    const name = url.slice(BASE.length)
    const tracked = name in BOOT_FILES
    const cache = await caches.open(CACHE_NAME).catch(() => null)
    const hit = await cache?.match(url).catch(() => undefined)
    if (hit) {
      if (tracked) {
        bootLoaded[name] = BOOT_FILES[name]
        bootDone.add(name)
        reportDownload()
      }
      return hit
    }
    const res = await realFetch(url, init)
    if (!res.ok || !res.body) return res
    if (cache) void cache.put(url, res.clone()).catch(() => undefined)
    if (!tracked) return res
    const counted = res.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, ctl) {
          bootLoaded[name] = (bootLoaded[name] ?? 0) + chunk.byteLength
          reportDownload()
          ctl.enqueue(chunk)
        },
        flush() {
          bootLoaded[name] = BOOT_FILES[name]
          bootDone.add(name)
          reportDownload()
        },
      }),
    )
    return new Response(counted, { status: res.status, statusText: res.statusText, headers: res.headers })
  }) as typeof fetch
}

function boot(): Promise<Py> {
  if (pyodide) return Promise.resolve(pyodide)
  if (!booting) {
    booting = (async () => {
      post({ type: 'status', stage: 'download', text: '@@dl', pct: 0 })
      installCachingFetch()
      const mod = (await import(/* @vite-ignore */ BASE + 'pyodide.mjs')) as { loadPyodide: (o: { indexURL: string }) => Promise<Py> }
      const py = await mod.loadPyodide({ indexURL: BASE })
      post({ type: 'status', stage: 'prepare', text: '@@prepare', pct: 100 })
      py.runPython(HELPER)
      pyodide = py
      post({ type: 'ready' })
      return py
    })().catch((e) => {
      booting = null
      throw e
    })
  }
  return booting
}

function sessionNs(py: Py, key: string): Py {
  let ns = sessions.get(key)
  if (!ns) {
    ns = py.globals.get('dict')()
    ns.set('__name__', '__main__')
    sessions.set(key, ns)
  }
  return ns
}

const hint = (text: string): string => {
  let out = text
  // The worker only appends markers (@@name); the page turns them into text in the reader's language (lib/errors localize).
  if (/EOFError/.test(out)) out += '\n@@eof-run'
  if (/FileNotFoundError|No such file or directory/.test(out)) out += '\n@@nofile'
  return out
}

async function run(msg: { id: number; session: string; code: string; stdin: string[] }) {
  try {
    const py = await boot()
    const lines = [...msg.stdin]
    py.setStdin({ stdin: () => (lines.length ? lines.shift() : undefined) })
    py.setStdout({ batched: (s: string) => post({ type: 'out', id: msg.id, stream: 'out', text: s + '\n' }) })
    py.setStderr({ batched: (s: string) => post({ type: 'out', id: msg.id, stream: 'err', text: s + '\n' }) })

    if (/^\s*(import|from)\s/m.test(msg.code)) {
      post({ type: 'status', id: msg.id, text: '@@pkgcheck' })
      try {
        await py.loadPackagesFromImports(msg.code, {
          messageCallback: (m: string) => post({ type: 'status', id: msg.id, text: m }),
          errorCallback: () => undefined,
        })
      } catch {
        /* a missing package surfaces as ModuleNotFoundError when the cell runs */
      }
    }

    const ns = sessionNs(py, msg.session)
    const res = JSON.parse(py.globals.get('__atolye_run')(msg.code, ns)) as { repr?: string; error?: string }
    if (res.error && /ModuleNotFoundError|No module named/.test(res.error)) {
      res.error += '\n@@nomodule'
    }
    post({ type: 'result', id: msg.id, repr: res.repr, error: res.error ? hint(res.error) : undefined })
  } catch (e) {
    post({ type: 'result', id: msg.id, error: `@@start:${String(e)}` })
  }
}

/** Fresh namespace, learner code first, then the tests (which see __stdout__). The runner enforces the time limit. */
async function check(msg: { id: number; code: string; tests: string[] }) {
  try {
    const py = await boot()
    py.setStdin({ stdin: () => undefined })
    const all = msg.code + '\n' + msg.tests.join('\n')
    if (/^\s*(import|from)\s/m.test(all)) {
      post({ type: 'status', id: msg.id, text: '@@pkgload' })
      try {
        await py.loadPackagesFromImports(all, { messageCallback: (m: string) => post({ type: 'status', id: msg.id, text: m }), errorCallback: () => undefined })
      } catch {
        /* surfaces as ModuleNotFoundError */
      }
    }
    post({ type: 'started', id: msg.id })
    const out = py.globals.get('__atolye_check')(msg.code, JSON.stringify(msg.tests))
    post({ type: 'checked', id: msg.id, json: String(out) })
  } catch (e) {
    post({ type: 'checked', id: msg.id, json: JSON.stringify({ stdout: '', error: '@@start:' + String(e), tests: [] }) })
  }
}

/** Runs the code once under sys.settrace in a fresh namespace and hands back every executed line with its variables. */
async function trace(msg: { id: number; code: string }) {
  try {
    const py = await boot()
    py.setStdin({ stdin: () => undefined })
    if (/^\s*(import|from)\s/m.test(msg.code)) {
      post({ type: 'status', id: msg.id, text: '@@pkgload' })
      try {
        await py.loadPackagesFromImports(msg.code, { messageCallback: (m: string) => post({ type: 'status', id: msg.id, text: m }), errorCallback: () => undefined })
      } catch {
        /* surfaces as ModuleNotFoundError */
      }
    }
    post({ type: 'started', id: msg.id })
    const out = py.globals.get('__atolye_trace')(msg.code)
    post({ type: 'traced', id: msg.id, json: String(out) })
  } catch (e) {
    post({ type: 'traced', id: msg.id, json: JSON.stringify({ steps: [], chunks: [], error: '@@start:' + String(e), truncated: false }) })
  }
}

self.onmessage = (ev: MessageEvent) => {
  const m = ev.data as { type: string; id: number; session: string; code: string; stdin: string[]; tests: string[] }
  if (m.type === 'boot') {
    boot().catch((e) => post({ type: 'boot-error', text: String(e) }))
  } else if (m.type === 'trace') {
    queue = queue.then(() => trace(m))
  } else if (m.type === 'run') {
    queue = queue.then(() => run(m))
  } else if (m.type === 'check') {
    queue = queue.then(() => check(m))
  } else if (m.type === 'drop') {
    const ns = sessions.get(m.session)
    if (ns) {
      ns.destroy?.()
      sessions.delete(m.session)
    }
  }
}
