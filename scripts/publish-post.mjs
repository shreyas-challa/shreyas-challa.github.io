// Publish a POST-target draft (drafts/<slug>.json) into the live Supabase feed.
//
// This is the headless equivalent of the "Publish to Supabase" button on the
// /draft/:slug page (src/draft.jsx): it signs in, uploads every inline base64
// screenshot (and the cover) to the `blog-images` storage bucket, swaps in the
// hosted URLs, and inserts the published post row. Use it to retire a box whose
// window has closed into a normal readable post.
//
// Usage (service role — bypasses RLS, no login needed):
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/publish-post.mjs <slug> [--title "HTB: Nimbus"]
//
// Usage (email/password login, if not using GitHub OAuth):
//   SUPABASE_EMAIL=you@example.com SUPABASE_PASSWORD=... \
//     node scripts/publish-post.mjs <slug> [--title "HTB: Nimbus"]
//
// Env (URL is read from .env automatically):
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY  (read from .env automatically)
//   SUPABASE_SERVICE_ROLE_KEY                  (preferred: bypasses RLS)
//   SUPABASE_EMAIL, SUPABASE_PASSWORD          (alternative: password login)
//   AUTHOR_ID                                  (optional; else copied from an existing post)

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: node scripts/publish-post.mjs <slug> [--title "..."]')
  process.exit(1)
}
const titleFlagIdx = process.argv.indexOf('--title')
const titleOverride = titleFlagIdx !== -1 ? process.argv[titleFlagIdx + 1] : null

async function readJson(p) {
  return JSON.parse(await readFile(p, 'utf8'))
}

// Minimal .env reader so we don't add a dependency; only pulls the two keys.
async function readEnv() {
  const out = {}
  try {
    const txt = await readFile(path.join(root, '.env'), 'utf8')
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* no .env, rely on process.env */ }
  return out
}

function dataUriToBytes(dataUri) {
  const [head, b64] = dataUri.split(',')
  const mime = head.match(/data:([^;]+)/)?.[1] || 'image/png'
  return { bytes: Buffer.from(b64, 'base64'), mime }
}

async function uploadDataUri(supabase, dataUri, hint) {
  const { bytes, mime } = dataUriToBytes(dataUri)
  const ext = mime.split('/')[1] || 'png'
  const fileName = `content/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('blog-images')
    .upload(fileName, bytes, { contentType: mime, upsert: true })
  if (error) throw new Error(`upload ${hint}: ${error.message}`)
  return supabase.storage.from('blog-images').getPublicUrl(fileName).data.publicUrl
}

// Upload every inline base64 image and swap in hosted URLs (mirrors hostImages
// in src/draft.jsx).
async function hostImages(supabase, doc) {
  const clone = JSON.parse(JSON.stringify(doc))
  const nodes = clone.content || []
  let n = 0
  for (const node of nodes) {
    if (node.type === 'image' && node.attrs?.src?.startsWith('data:')) {
      node.attrs.src = await uploadDataUri(supabase, node.attrs.src, node.attrs.alt || 'screenshot')
      n++
      process.stdout.write(`\r  uploaded ${n} image(s)...`)
    }
  }
  if (n) process.stdout.write('\n')
  return clone
}

async function main() {
  const env = await readEnv()
  const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
  const email = process.env.SUPABASE_EMAIL || env.SUPABASE_EMAIL
  const password = process.env.SUPABASE_PASSWORD || env.SUPABASE_PASSWORD
  if (!url) { console.error('Missing VITE_SUPABASE_URL.'); process.exit(1) }
  if (!serviceRole && !(email && password)) {
    console.error('Provide SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_EMAIL + SUPABASE_PASSWORD.')
    process.exit(1)
  }

  const doc = await readJson(path.join(root, 'drafts', `${slug}.json`))
  const meta = await readJson(path.join(root, 'drafts', `${slug}.meta.json`))

  // Service role bypasses RLS (no login); otherwise sign in with the anon key.
  const supabase = createClient(url, serviceRole || anon, { auth: { persistSession: false, autoRefreshToken: false } })
  let authorId = process.env.AUTHOR_ID || env.AUTHOR_ID || null
  if (serviceRole) {
    console.log('Using service-role key (RLS bypassed).')
    if (!authorId) {
      // Reuse the author_id from an existing post so the row matches the others.
      const { data: ref } = await supabase.from('posts').select('author_id').not('author_id', 'is', null).limit(1)
      authorId = ref?.[0]?.author_id || null
      if (authorId) console.log(`author_id copied from an existing post.`)
    }
  } else {
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) { console.error(`Sign-in failed: ${authErr.message}`); process.exit(1) }
    authorId = auth.user.id
    console.log(`Signed in as ${auth.user.email}`)
  }

  const postSlug = (meta.slug || slug).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // Refuse to create a duplicate slug.
  const { data: existing } = await supabase.from('posts').select('id,slug').eq('slug', postSlug)
  if (existing && existing.length) {
    console.error(`A post with slug "${postSlug}" already exists (id ${existing[0].id}). Aborting.`)
    process.exit(1)
  }

  console.log('Uploading images to storage...')
  const hosted = await hostImages(supabase, doc)
  let cover = meta.cover || null
  if (cover && cover.startsWith('data:')) cover = await uploadDataUri(supabase, cover, 'cover')

  const title = titleOverride || meta.title || meta.name
  const row = {
    title,
    sub_title: meta.subtitle || '',
    slug: postSlug,
    content: JSON.stringify(hosted),
    image: cover,
    published: true,
    author_id: authorId,
  }
  const { data: inserted, error: insErr } = await supabase.from('posts').insert([row]).select()
  if (insErr) { console.error(`Insert failed: ${insErr.message}`); process.exit(1) }

  const p = inserted[0]
  console.log('\nPublished post to Supabase:')
  console.log(`  id:        ${p.id}`)
  console.log(`  title:     ${p.title}`)
  console.log(`  slug:      ${p.slug}   -> /blog/${p.slug}`)
  console.log(`  subtitle:  ${p.sub_title}`)
  console.log(`  cover:     ${p.image ? 'set' : 'none'}`)
  console.log(`  created:   ${p.created_at}`)
  console.log('\nIt is now the newest post, so it owns the hero card on the home page.')
}

main().catch((e) => { console.error(e); process.exit(1) })
