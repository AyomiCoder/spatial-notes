import { nanoid } from 'nanoid'
import type { TodoItem } from '../types'

/**
 * Tight allowlist of tags we accept in a note's body. We strip every
 * attribute so pasted styles, classes, and inline scripts can't survive.
 */
const INLINE_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'BR'])
const BLOCK_TAGS = new Set(['DIV', 'P', 'UL', 'OL', 'LI'])
const ALLOWED = new Set<string>([...INLINE_TAGS, ...BLOCK_TAGS])

export function sanitizeHtml(input: string): string {
  if (typeof document === 'undefined') return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = input
  walk(tmp)
  return tmp.innerHTML
}

function walk(node: Node) {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.COMMENT_NODE) {
      child.remove()
      continue
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    const el = child as Element
    if (!ALLOWED.has(el.tagName)) {
      // Unwrap unsupported elements so their text survives
      const parent = el.parentNode
      while (el.firstChild) parent?.insertBefore(el.firstChild, el)
      el.remove()
      continue
    }
    for (const attr of Array.from(el.attributes)) el.removeAttribute(attr.name)
    walk(el)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Convert legacy plain-text body into the HTML we now store. */
export function plainTextToHtml(text: string): string {
  if (!text) return ''
  return text
    .split('\n')
    .map((line) => `<div>${escapeHtml(line) || '<br>'}</div>`)
    .join('')
}

/** Flatten an HTML body into trimmed non-empty lines. */
export function htmlToLines(html: string): string[] {
  if (typeof document === 'undefined') return []
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  const lines: string[] = []
  let current = ''
  const flush = () => {
    const t = current.trim()
    if (t.length) lines.push(t)
    current = ''
  }
  const visit = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) {
      current += n.textContent || ''
      return
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return
    const el = n as Element
    const tag = el.tagName
    if (tag === 'BR') {
      flush()
      return
    }
    const isBlock = BLOCK_TAGS.has(tag)
    if (isBlock) flush()
    for (const c of Array.from(el.childNodes)) visit(c)
    if (isBlock) flush()
  }
  for (const c of Array.from(tmp.childNodes)) visit(c)
  flush()
  return lines
}

export function linesToItems(lines: string[]): TodoItem[] {
  return lines.map((text) => ({ id: nanoid(6), text, done: false }))
}

/** Used when converting a todo back into a note. */
export function itemsToHtml(items: TodoItem[]): string {
  if (!items.length) return ''
  return items
    .map((it) => `<div>${escapeHtml(it.text) || '<br>'}</div>`)
    .join('')
}

/** True when the rendered HTML has no visible content. */
export function isHtmlEmpty(html: string): boolean {
  if (!html) return true
  if (typeof document === 'undefined') return html.trim().length === 0
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || '').trim().length === 0
}
