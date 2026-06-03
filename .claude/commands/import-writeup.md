---
description: Turn an Obsidian HTB note into a reviewable blog writeup draft
argument-hint: <path-to-obsidian-note.md> [--slug name] [--target box|post]
---

Convert an Obsidian writeup note into a blog draft the user reviews locally, then
publish it. The note is mostly screenshots (`![[Pasted image ….png]]`) and code
blocks with little prose — your job is to read the screenshots and write the
descriptions.

Arguments: `$ARGUMENTS` (first token is the note path; optional `--slug` and
`--target box|post`).

## Steps

1. **Ingest.** Run:
   `node scripts/import-obsidian.mjs <note.md> [--slug <slug>] [--target box|post]`
   This writes `drafts/<slug>.json` (a TipTap doc with screenshots inlined as
   base64 and code blocks intact) and `drafts/<slug>.meta.json`. Note the slug
   and the list of resolved images it prints.

2. **Read every screenshot.** Use the Read tool on each resolved PNG (paths are
   printed by the script). Understand what each shows — nmap output, a foothold
   shell, a payload result, a captured flag, etc.

3. **Write the writeup.** Edit `drafts/<slug>.json` to weave in:
   - `## ` section headings (Enumeration, Foothold, User, Privilege Escalation, …)
   - a `paragraph` before each screenshot/code block explaining what it shows and
     why it matters — concise, technical, first-person operator voice
   - Keep the existing `image` (base64) and `codeBlock` nodes; insert text nodes
     **around** them. Do not retype base64.
   - Fix any Obsidian artifacts (mangled terminal captures, `[url](url)` link
     noise inside code).

4. **Cover icon.** Fetch the HackTheBox machine avatar for the box and set
   `meta.cover` (a URL, or a base64 data URI). It shows as the page/box icon.

5. **Fill meta.** Set `title`, `subtitle`, `slug`, `target`. For a **box**: set
   `active_until` (when it unlocks) and `secret` (the box root hash — usually the
   root flag in the note).

6. **Review loop.** Tell the user to run `npm run dev` and open `/draft/<slug>`:
   - **Rendered** = reader view, **Edit** = inline edits (Save persists to the
     draft file), **Locked preview** (box) = the real lock screen; it unlocks with
     the root hash.
   - When the user asks for structural changes (re-describe a shot, reorder, add a
     section), edit `drafts/<slug>.json` here; they refresh. Loop until approved.

7. **Publish.**
   - **Box:** `node scripts/publish-writeup.mjs <slug>` → writes
     `src/data/boxes/<slug>.js`. Then commit + push (deploys via GitHub Pages).
   - **Post:** the user clicks **Publish to Supabase** on the draft page while
     logged in (the live feed is Supabase-backed; no push needed).

Commit frequently and push to main, per the project workflow.
