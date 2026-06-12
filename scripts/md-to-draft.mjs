// Convert a finished Markdown writeup into the TipTap draft the /draft/:slug
// review page renders (drafts/<slug>.json + .meta.json).
//
// Usage:
//   node scripts/md-to-draft.mjs <writeup.md> [--slug s] [--target post|box]
//
// Unlike import-obsidian.mjs (a mechanical first pass over screenshot notes),
// this handles fully written prose: inline marks (`code`, **bold**, *italic*,
// [text](url)), ordered/bullet lists, blockquotes, fenced code, and Markdown
// tables. The blog renderer (src/render-content.jsx) has no table node, so a
// table is emitted as a monospace codeBlock that preserves the comparison grid.
//
// Title/subtitle convention: the first `# H1` becomes meta.title and a leading
// `> Suggested subtitle: ...` blockquote becomes meta.subtitle; both are pulled
// out of the body because draft.jsx renders them in the cover header.

import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'

const argv = process.argv.slice(2)
const positional = []
const opts = {}
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a.startsWith('--')) opts[a.slice(2)] = argv[++i]
  else positional.push(a)
}
const notePath = positional[0]
if (!notePath) {
  console.error('Usage: node scripts/md-to-draft.mjs <writeup.md> [--slug s] [--target post|box]')
  process.exit(1)
}
const target = opts.target || 'post'
const deriveSlug = (p) =>
  path.basename(p).replace(/\.md$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const slug = opts.slug || deriveSlug(notePath)

// ---- inline tokenizer -----------------------------------------------------
// Walk a line and emit TipTap text nodes carrying code/bold/italic/link marks.
function inline(text) {
  const out = []
  let i = 0
  const push = (str, marks) => { if (str) out.push(marks?.length ? { type: 'text', text: str, marks } : { type: 'text', text: str }) }
  while (i < text.length) {
    const rest = text.slice(i)
    let m
    if ((m = rest.match(/^`([^`]+)`/))) { push(m[1], [{ type: 'code' }]); i += m[0].length; continue }
    if ((m = rest.match(/^\*\*([^*]+)\*\*/))) { push(m[1], [{ type: 'bold' }]); i += m[0].length; continue }
    if ((m = rest.match(/^\*([^*]+)\*/))) { push(m[1], [{ type: 'italic' }]); i += m[0].length; continue }
    if ((m = rest.match(/^\[([^\]]+)\]\(([^)]+)\)/))) { push(m[1], [{ type: 'link', attrs: { href: m[2] } }]); i += m[0].length; continue }
    // Plain run: consume until the next possible marker.
    const next = rest.slice(1).search(/[`*[]/)
    const take = next === -1 ? rest.length : next + 1
    push(rest.slice(0, take))
    i += take
  }
  return out
}

// ---- node builders --------------------------------------------------------
const heading = (level, text) => ({ type: 'heading', attrs: { level }, content: inline(text) })
const paragraph = (text) => ({ type: 'paragraph', content: inline(text) })
const codeBlock = (text) => ({ type: 'codeBlock', content: [{ type: 'text', text }] })
const listItem = (text) => ({ type: 'listItem', content: [{ type: 'paragraph', content: inline(text) }] })

// Render a Markdown table as an aligned monospace block (renderer has no table).
function tableToCodeBlock(rows) {
  // Drop inline markup (`code`, **bold**) so the monospace grid stays clean.
  const plain = (c) => c.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').trim()
  const cells = rows.map((r) => r.slice(1, -1).split('|').map(plain))
  const widths = []
  for (const row of cells) row.forEach((c, j) => { widths[j] = Math.max(widths[j] || 0, c.length) })
  const fmt = (row) => row.map((c, j) => c.padEnd(widths[j])).join('  ')
  const [head, , ...body] = cells // drop the |---|---| separator row
  const sep = widths.map((w) => '-'.repeat(w)).join('  ')
  return codeBlock([fmt(head), sep, ...body.map(fmt)].join('\n'))
}

// ---- parse ----------------------------------------------------------------
const raw = await readFile(notePath, 'utf8')
const lines = raw.replace(/\r\n/g, '\n').split('\n')
const nodes = []
let title = ''
let subtitle = ''
let i = 0
while (i < lines.length) {
  const line = lines[i]
  const t = line.trim()

  if (/^```/.test(t)) {
    const body = []
    i++
    while (i < lines.length && !/^```/.test(lines[i].trim())) { body.push(lines[i]); i++ }
    i++
    nodes.push(codeBlock(body.join('\n')))
    continue
  }
  if (!t) { i++; continue }

  const h = t.match(/^(#{1,3})\s+(.*)$/)
  if (h) {
    if (h[1].length === 1 && !title) { title = h[2].trim(); i++; continue }
    nodes.push(heading(h[1].length, h[2].trim()))
    i++
    continue
  }

  if (t.startsWith('>')) {
    const body = t.replace(/^>\s?/, '')
    const sub = body.match(/^Suggested subtitle:\s*(.*)$/i)
    if (sub && !subtitle) { subtitle = sub[1].trim(); i++; continue }
    nodes.push({ type: 'blockquote', content: [paragraph(body)] })
    i++
    continue
  }

  // Markdown table: a run of lines that all start and end with a pipe.
  if (/^\|.*\|$/.test(t)) {
    const rows = []
    while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) { rows.push(lines[i].trim()); i++ }
    nodes.push(tableToCodeBlock(rows))
    continue
  }

  // Ordered list.
  if (/^\d+\.\s+/.test(t)) {
    const items = []
    while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
      items.push(listItem(lines[i].trim().replace(/^\d+\.\s+/, '')))
      i++
    }
    nodes.push({ type: 'orderedList', attrs: { start: 1 }, content: items })
    continue
  }

  // Bullet list.
  if (/^[-*]\s+/.test(t)) {
    const items = []
    while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
      items.push(listItem(lines[i].trim().replace(/^[-*]\s+/, '')))
      i++
    }
    nodes.push({ type: 'bulletList', content: items })
    continue
  }

  nodes.push(paragraph(t))
  i++
}

// ---- write ----------------------------------------------------------------
const draftsDir = path.resolve('drafts')
await mkdir(draftsDir, { recursive: true })
const docPath = path.join(draftsDir, `${slug}.json`)
const metaPath = path.join(draftsDir, `${slug}.meta.json`)

await writeFile(docPath, JSON.stringify({ type: 'doc', content: nodes }, null, 2))

const meta = {
  slug,
  target,
  name: title,
  title,
  subtitle,
  active_until: null,
  secret: '',
  cover: null,
  source: path.resolve(notePath),
}
try {
  await stat(metaPath)
  console.log(`! kept existing ${path.relative('.', metaPath)}`)
} catch {
  await writeFile(metaPath, JSON.stringify(meta, null, 2))
}

console.log(`Converted "${path.basename(notePath)}" -> ${path.relative('.', docPath)}`)
console.log(`  blocks: ${nodes.length}`)
console.log(`  title:  ${title}`)
console.log(`  open:   /draft/${slug}`)
