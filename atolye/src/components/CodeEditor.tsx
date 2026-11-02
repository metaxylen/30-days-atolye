import { useEffect, useRef } from 'react'
import { EditorState, Prec } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine, placeholder } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { HighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword], color: 'var(--code-keyword)' },
  { tag: [t.string, t.special(t.string)], color: 'var(--code-string)' },
  { tag: [t.number, t.bool, t.null], color: 'var(--code-def)' },
  { tag: [t.comment, t.lineComment], color: 'var(--code-comment)' },
  { tag: [t.function(t.variableName), t.definition(t.variableName), t.className], color: 'var(--code-def)' },
  { tag: [t.self, t.standard(t.variableName)], color: 'var(--code-def)' },
  { tag: t.operator, color: 'var(--code-operator)' },
])

const theme = EditorView.theme({
  '&': { color: 'var(--ink)', backgroundColor: 'transparent', fontSize: 'var(--t-code)' },
  '.cm-content': { fontFamily: 'var(--font-code)', padding: '10px 0', caretColor: 'var(--ink)', lineHeight: '1.6' },
  '.cm-line': { padding: '0 14px' },
  '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--faint)', border: 'none', fontFamily: 'var(--font-code)' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '&.cm-focused .cm-activeLine': { backgroundColor: 'var(--code-line)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--ink)' },
  '&.cm-focused': { outline: 'none' },
  '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--ink)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--code-select) !important' },
  '.cm-scroller': { overflow: 'auto', fontFamily: 'var(--font-code)' },
  '.cm-matchingBracket': { backgroundColor: 'var(--code-select)', outline: 'none' },
  '.cm-placeholder': { color: 'var(--faint)' },
})

interface Props {
  value: string
  label: string
  onChange: (v: string) => void
  onRun: () => void
  /** Called on Escape so keyboard users can leave the editor (Tab indents inside it). */
  onEscape: () => void
  lines?: boolean
  placeholderText?: string
  readOnly?: boolean
  /** Called with pasted text (the editor keeps working normally). */
  onPasteText?: (text: string) => void
  autoFocus?: boolean
  /** Ctrl/Cmd+Enter. Without it, Ctrl/Cmd+Enter runs like Shift+Enter. */
  onCheck?: () => void
}

export function CodeEditor({ value, label, onChange, onRun, onEscape, lines = true, placeholderText, readOnly = false, onPasteText, autoFocus = false, onCheck }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const cb = useRef({ onChange, onRun, onEscape, onPasteText, onCheck })
  cb.current = { onChange, onRun, onEscape, onPasteText, onCheck }

  useEffect(() => {
    if (!host.current) return
    const run = () => {
      cb.current.onRun()
      return true
    }
    const state = EditorState.create({
      doc: value,
      extensions: [
        lines ? lineNumbers() : [],
        history(),
        drawSelection(),
        highlightActiveLine(),
        indentOnInput(),
        bracketMatching(),
        python(),
        syntaxHighlighting(highlight),
        theme,
        matchMedia('(max-width: 640px)').matches ? EditorView.lineWrapping : [],
        readOnly ? [EditorState.readOnly.of(true), EditorView.editable.of(false)] : [],
        EditorView.domEventHandlers({
          paste: (ev) => {
            const text = ev.clipboardData?.getData('text/plain')
            if (text) cb.current.onPasteText?.(text)
            return false
          },
        }),
        placeholderText ? placeholder(placeholderText) : [],
        EditorView.contentAttributes.of({ 'aria-label': label, 'aria-multiline': 'true' }),
        Prec.highest(
          keymap.of([
            { key: 'Shift-Enter', run },
            {
              key: 'Mod-Enter',
              run: () => {
                if (cb.current.onCheck) cb.current.onCheck()
                else cb.current.onRun()
                return true
              },
            },
            {
              key: 'Escape',
              run: () => {
                cb.current.onEscape()
                return true
              },
            },
          ]),
        ),
        keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) cb.current.onChange(u.state.doc.toString())
        }),
      ],
    })
    const v = new EditorView({ state, parent: host.current })
    view.current = v
    if (autoFocus) v.focus()
    return () => {
      v.destroy()
      view.current = null
    }
    // The editor is created once per cell; value changes from outside go through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const v = view.current
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } })
    }
  }, [value])

  return <div ref={host} className="cm-host" />
}

