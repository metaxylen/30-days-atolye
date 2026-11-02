import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// One id per build: baked into the bundle (`__BUILD_ID__`) and written to dist/version.json. A tab compares the two (src/lib/version.ts).
const buildId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

const versionFile = (): Plugin => ({
  name: 'atolye-version-json',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: buildId }) + '\n' })
  },
})

// base './' keeps the build servable from any sub-path of a static host.
export default defineConfig(({ command }) => ({
  base: './',
  plugins: [react(), versionFile()],
  define: { __BUILD_ID__: JSON.stringify(command === 'build' ? buildId : 'dev') },
  server: { fs: { allow: ['..'] } },
  worker: { format: 'es' },
  // The reader chunk carries the 30 lessons' Markdown and CodeMirror; it loads only when a lesson opens.
  build: { target: 'es2022', chunkSizeWarningLimit: 1000 },
}))
