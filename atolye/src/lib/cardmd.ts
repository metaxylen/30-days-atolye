import MarkdownIt from 'markdown-it'

// Card text is authored by us, but raw HTML stays off anyway: a card is Markdown and nothing else.
const md = new MarkdownIt({ html: false, linkify: false, typographer: false })

/** Card Markdown to HTML. Code tokens are marked translate="no" so page translators leave them alone. */
export function cardHtml(src: string): string {
  return md.render(src).replace(/<(code|pre)(\s|>)/g, '<$1 translate="no"$2')
}

/** One line of card Markdown (`code`, **bold**) without a wrapping paragraph. */
export function inlineHtml(src: string): string {
  return md.renderInline(src).replace(/<code>/g, '<code translate="no">')
}

/** Escapes text for use inside HTML. */
export const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
