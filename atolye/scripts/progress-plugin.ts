import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

/**
 * Local progress file. `npm run dev` and `npm run preview` answer `/__progress`:
 *   GET -> the saved progress JSON (`{}` when there is none yet)
 *   PUT -> validates the body and writes it atomically to .ilerleme/progress.json
 * Static hosting has no such route, so the app (src/lib/store.ts) falls back to localStorage alone there.
 * ATOLYE_PROGRESS_FILE overrides the file path (the test uses it).
 */
const MAX_BYTES = 5 * 1024 * 1024
const ROUTE = '/__progress'

type Next = () => void

export function progressFile(): Plugin {
  let file = ''
  let queue: Promise<unknown> = Promise.resolve()

  const send = (res: ServerResponse, status: number, body = '') => {
    res.statusCode = status
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('cache-control', 'no-store')
    res.end(body)
  }

  const handler = (req: IncomingMessage, res: ServerResponse, next: Next) => {
    if (new URL(req.url ?? '/', 'http://x').pathname !== ROUTE) return next()
    if (req.method === 'GET') {
      try {
        send(res, 200, readFileSync(file, 'utf8'))
      } catch {
        send(res, 200, '{}')
      }
      return
    }
    if (req.method !== 'PUT') return send(res, 405, '{"error":"method"}')
    // application/json cannot be sent by a cross-site form or a no-cors request, so another website cannot write here
    if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) {
      req.resume()
      return send(res, 415, '{"error":"content-type"}')
    }
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size <= MAX_BYTES) chunks.push(c) // past the cap the rest is read and dropped, so the client gets its 413
    })
    req.on('end', () => {
      if (size > MAX_BYTES) return send(res, 413, '{"error":"too large"}')
      let data: unknown
      try {
        data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      } catch {
        return send(res, 400, '{"error":"json"}')
      }
      const o = data as { v?: unknown; done?: unknown }
      if (!data || typeof data !== 'object' || Array.isArray(data) || o.v !== 1 || !o.done || typeof o.done !== 'object') {
        return send(res, 400, '{"error":"shape"}')
      }
      // one write at a time; temp file + rename so a crash never leaves half a file
      queue = queue.then(() => {
        const tmp = `${file}.${process.pid}.tmp`
        try {
          mkdirSync(dirname(file), { recursive: true })
          writeFileSync(tmp, JSON.stringify(data))
          renameSync(tmp, file)
          send(res, 204)
        } catch {
          rmSync(tmp, { force: true })
          send(res, 500, '{"error":"write"}')
        }
      })
    })
    req.on('error', () => send(res, 400, '{"error":"read"}'))
  }

  return {
    name: 'atolye-progress-file',
    configResolved(config) {
      file = process.env.ATOLYE_PROGRESS_FILE ? resolve(process.env.ATOLYE_PROGRESS_FILE) : resolve(config.root, '.ilerleme/progress.json')
    },
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}
