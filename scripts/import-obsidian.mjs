// Ingest an Obsidian note into a reviewable blog draft.
//
// Usage:
//   node scripts/import-obsidian.mjs <note.md> [--slug devhub] [--vault <dir>]
//                                              [--target box|post]
//
// Parses the note into the ordered block sequence the blog renderer understands
// (see src/render-content.jsx): headings, paragraphs, codeBlocks, and images.
// Obsidian `![[Pasted image ….png]]` embeds are resolved against the vault and
// inlined as base64 data URIs, so screenshots are self-contained — required for
// the encrypted-box flow (they're never served from a public URL while the box
// is active) and fine for regular posts too.
//
// Writes two files the rest of the pipeline shares as the single source of truth:
//   drafts/<slug>.json       the TipTap doc (images + code already in place;
//                            descriptions get woven in afterwards)
//   drafts/<slug>.meta.json  title / subtitle / target / active_until / secret …
//
// This is the mechanical first pass. Descriptions are written separately by
// reading each screenshot; this script never invents prose.

import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

// ---- args -----------------------------------------------------------------

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
  console.error('Usage: node scripts/import-obsidian.mjs <note.md> [--slug s] [--vault dir] [--target box|post]')
  process.exit(1)
}

const noteDir = path.dirname(path.resolve(notePath))
const vaultRoot = opts.vault ? path.resolve(opts.vault) : noteDir
const target = opts.target || 'box'

function deriveSlug(p) {
  return path
    .basename(p)
    .replace(/\.md$/i, '')
    .replace(/\.htb$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
const slug = opts.slug || deriveSlug(notePath)

// ---- image resolution -----------------------------------------------------

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

// Recursively index every file under the vault by basename so `![[name]]`
// embeds resolve no matter which attachment folder they live in.
const fileIndex = new Map()
async function indexDir(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) await indexDir(full)
    else if (!fileIndex.has(e.name)) fileIndex.set(e.name, full)
  }
}

async function resolveImage(name) {
  // Prefer a file sitting next to the note, then fall back to the vault index.
  const sibling = path.join(noteDir, name)
  try {
    await stat(sibling)
    return sibling
  } catch {
    /* fall through */
  }
  return fileIndex.get(name) || null
}

async function imageToDataUri(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const mime = MIME[ext] || 'application/octet-stream'
  const buf = await readFile(filePath)
  return `data:${mime};base64,${buf.toString('base64')}`
}

// ---- TipTap node builders -------------------------------------------------

const heading = (level, text) => ({ type: 'heading', attrs: { level }, content: [{ type: 'text', text }] })
const paragraph = (text) => (text ? { type: 'paragraph', content: [{ type: 'text', text }] } : { type: 'paragraph' })
const codeBlock = (text) => ({ type: 'codeBlock', content: [{ type: 'text', text }] })
const image = (src, alt) => ({ type: 'image', attrs: { src, alt } })

// Strip inline-code backticks so mixed "label: `value`" lines read as plain
// text (the renderer ignores inline marks anyway).
const stripInlineCode = (s) => s.replace(/`([^`]+)`/g, '$1')

// ---- parse ----------------------------------------------------------------

const EMBED_RE = /^!\[\[([^\]]+)\]\]$/
const HEADING_RE = /^(#{1,3})\s+(.*)$/
const FENCE_RE = /^```/
const FULL_INLINE_RE = /^`([^`]+)`$/

async function parse() {
  const raw = await readFile(notePath, 'utf8')
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const nodes = []
  const unresolved = []
  const resolved = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Fenced code block: capture verbatim until the closing fence.
    if (FENCE_RE.test(trimmed)) {
      const body = []
      i++
      while (i < lines.length && !FENCE_RE.test(lines[i].trim())) {
        body.push(lines[i])
        i++
      }
      i++ // skip closing fence
      nodes.push(codeBlock(body.join('\n')))
      continue
    }

    if (!trimmed) {
      i++
      continue
    }

    const headingMatch = trimmed.match(HEADING_RE)
    if (headingMatch) {
      nodes.push(heading(headingMatch[1].length, headingMatch[2].trim()))
      i++
      continue
    }

    const embedMatch = trimmed.match(EMBED_RE)
    if (embedMatch) {
      const name = embedMatch[1].split('|')[0].trim() // drop Obsidian sizing
      const file = await resolveImage(name)
      if (file) {
        nodes.push(image(await imageToDataUri(file), name))
        resolved.push({ name, file })
      } else {
        nodes.push(paragraph(`[missing image: ${name}]`))
        unresolved.push(name)
      }
      i++
      continue
    }

    // A line that is entirely one inline-code span is a one-liner payload.
    const inlineMatch = trimmed.match(FULL_INLINE_RE)
    if (inlineMatch) {
      nodes.push(codeBlock(inlineMatch[1]))
      i++
      continue
    }

    nodes.push(paragraph(stripInlineCode(trimmed)))
    i++
  }

  return { nodes, unresolved, resolved }
}

// ---- write ----------------------------------------------------------------

async function main() {
  await indexDir(vaultRoot)
  const { nodes, unresolved, resolved } = await parse()

  const doc = { type: 'doc', content: nodes }

  const draftsDir = path.resolve('drafts')
  await mkdir(draftsDir, { recursive: true })

  const docPath = path.join(draftsDir, `${slug}.json`)
  const metaPath = path.join(draftsDir, `${slug}.meta.json`)

  const titleGuess = slug.charAt(0).toUpperCase() + slug.slice(1)
  const meta = {
    slug,
    target, // 'box' | 'post'
    name: titleGuess, // box machine name
    title: titleGuess, // post/box display title
    subtitle: '',
    // For a box: when the writeup unlocks freely. Default ~3 months out.
    active_until: new Date(Date.now() + 92 * 864e5).toISOString(),
    // For a box: the root hash a visitor enters to unlock. Fill from the note.
    secret: '',
    cover: null,
    source: path.resolve(notePath),
  }

  await writeFile(docPath, JSON.stringify(doc, null, 2))
  // Don't clobber an existing meta (slug may be re-imported after edits).
  try {
    await stat(metaPath)
    console.log(`! kept existing ${path.relative('.', metaPath)}`)
  } catch {
    await writeFile(metaPath, JSON.stringify(meta, null, 2))
  }

  console.log(`\nImported "${path.basename(notePath)}" -> ${path.relative('.', docPath)}`)
  console.log(`  blocks:   ${nodes.length}`)
  console.log(`  images:   ${resolved.length} embedded as base64`)
  for (const r of resolved) console.log(`            - ${r.name}  (${path.relative('.', r.file)})`)
  if (unresolved.length) {
    console.log(`  UNRESOLVED images (${unresolved.length}):`)
    for (const u of unresolved) console.log(`            ! ${u}`)
  }
  console.log(`\nNext: read each screenshot and weave descriptions into the draft, then`)
  console.log(`open /draft/${slug} on the dev server to review.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
