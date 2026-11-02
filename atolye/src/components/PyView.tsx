import { lazy, Suspense, useMemo } from 'react'

const TOKEN =
  /(#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(\d[\d_]*\.?\d*)\b|\b(def|class|return|if|elif|else|for|while|in|not|and|or|is|import|from|as|with|try|except|finally|raise|lambda|None|True|False|pass|break|continue|yield|global|del|assert)\b|\b(print|len|range|int|str|float|list|dict|set|tuple|input|type|sum|min|max|sorted|enumerate|zip|map|filter|open|abs|round|bool|isinstance)\b/g

const CLASS = ['', 'tk-c', 'tk-s', 'tk-n', 'tk-k', 'tk-b']

export function tokens(line: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let last = 0
  let k = 0
  for (const m of line.matchAll(TOKEN)) {
    const i = m.index ?? 0
    if (i > last) out.push(line.slice(last, i))
    const g = m.findIndex((v, idx) => idx > 0 && v !== undefined)
    out.push(
      <span key={k++} className={CLASS[g]}>
        {m[0]}
      </span>,
    )
    last = i + m[0].length
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}

/**
 * Read-only highlighted code without loading CodeMirror: the lesson flow shows a lot of static code, and the editor
 * (about 130 KB gzipped) should only download when something can actually be typed.
 */
export function CodeView({ value, label, lines = false }: { value: string; label: string; lines?: boolean }) {
  const rows = useMemo(() => value.split('\n').map((l) => tokens(l)), [value])
  return (
    <pre className={`pyview${lines ? ' has-lines' : ''}`} tabIndex={0} aria-label={label} translate="no">
      <code>
        {rows.map((r, i) => (
          <span key={i} className="pv-line">
            {r.length ? r : ' '}
            {'\n'}
          </span>
        ))}
      </code>
    </pre>
  )
}

const Editor = lazy(() => import('./CodeEditor').then((m) => ({ default: m.CodeEditor })))

type EditorProps = React.ComponentProps<typeof Editor>

/** The real editor, loaded on first use. Until then the code shows as plain highlighted text, so nothing jumps. */
export function LazyEditor(props: EditorProps) {
  return (
    <Suspense fallback={<CodeView value={props.value} label={props.label} lines={props.lines} />}>
      <Editor {...props} />
    </Suspense>
  )
}
