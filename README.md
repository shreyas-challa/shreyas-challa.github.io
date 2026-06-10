# Noigel Blog

Personal blog, portfolio, and security writeup site by [Shreyas "Noigel" Challa](https://github.com/shreyas-challa), built with React + Vite and deployed to GitHub Pages at [shreyas-challa.github.io](https://shreyas-challa.github.io).

The site serves three kinds of content: blog posts backed by Supabase, a portfolio page with projects and CVE disclosures, and HTB box writeups that ship encrypted and stay locked until the box retires.

## Stack

- **React 19** + **Vite 7**
- **Tailwind CSS v4** with shadcn/ui conventions (zinc palette, see `DESIGN_SYSTEM.md`)
- **React Router v7** (BrowserRouter, with a GitHub Pages SPA redirect shim)
- **Tiptap v3**: rich text editor for writing and editing posts
- **Supabase**: auth, posts table, and image storage (stubbed out when env vars are absent)
- **GSAP + Motion**: animations
- **Radix UI**: accessible UI primitives
- **Fuse.js**: fuzzy search across posts, projects, and CVEs
- **Web Crypto**: AES-GCM encryption for active box writeups

## Development

```bash
npm install
npm run dev
```

Other scripts: `npm run lint` (ESLint), `npm run preview` (preview a production build).

## Build & Deploy

```bash
npm run build
```

The `dist/` output is deployed to `shreyas-challa.github.io` (GitHub Pages user site). Push the built files to the `main` branch of the `shreyas-challa.github.io` repo.

## Routes

| Path           | Page         | Notes                                             |
| -------------- | ------------ | ------------------------------------------------- |
| `/`            | `home.jsx`   | Post feed, encrypted box cards, fuzzy search      |
| `/about`       | `about.jsx`  | Portfolio: projects + CVE disclosures             |
| `/blog/:id`    | `blog.jsx`   | Single post view with owner-only inline edit mode |
| `/box/:slug`   | `box.jsx`    | Box writeup, locked while the box is active       |
| `/draft/:slug` | `draft.jsx`  | Draft review page, dev server only (never built)  |
| `/login`       | `login.jsx`  | Supabase auth                                     |
| `/create`      | `create.jsx` | Tiptap post editor (protected)                    |

## Content model

**Posts** live in a Supabase `posts` table and are written in the Tiptap editor at `/create` (or imported through the writeup pipeline below). The home page lists published posts newest first, and the latest post owns the hero card. Content is stored as Tiptap JSON and rendered by `src/render-content.jsx`, a single renderer shared by every reader view. It handles headings, lists, quote blocks with author attribution, syntax-highlighted code blocks (lowlight), images, and inline marks, and it sanitizes link hrefs so only http(s), mailto, relative, and anchor URLs survive.

**Box writeups** are static encrypted modules in `src/data/boxes/`, one auto-generated file per box. While a box is active, `/box/:slug` shows a lock screen and the writeup can only be opened by entering the box's root hash. Retired boxes decrypt automatically. Active boxes also appear on the home grid as locked cards with scrambled preview text.

## Box encryption model

The writeup plaintext, including screenshots embedded as base64 data URIs, is AES-GCM encrypted with a key derived from the box's root hash via PBKDF2 (250k iterations). `src/lib/crypto.js` uses only Web Crypto primitives, so the exact same code encrypts in Node and decrypts in the browser. While a box is active, the repo and the shipped bundle contain ciphertext only: the root hash is never stored anywhere. A wrong hash fails the GCM auth tag outright, so there is no partial or garbled output to scrape. Once the box retires, the writeup is republished with `--release-secret`, which embeds the hash so the page auto-decrypts for everyone.

## Writeup pipeline

Obsidian note in, published writeup out, with a local review step in between:

1. **Import**: `node scripts/import-obsidian.mjs <note.md> [--slug s] [--target box|post]` parses the note into a Tiptap doc, resolves `![[Pasted image ...]]` embeds against the vault and inlines them as base64, and writes `drafts/<slug>.json` + `drafts/<slug>.meta.json` (both gitignored). The `/import-writeup` Claude Code command in `.claude/commands/` drives this end to end, including writing the prose around each screenshot.
2. **Review**: open `/draft/<slug>` on the dev server. The page renders the draft exactly as readers will see it, supports inline editing (persisted back to the draft files through a dev-only API defined in `vite.config.js`), and for box targets previews the real lock screen and unlock flow.
3. **Publish**:
   - Box target: `node scripts/publish-writeup.mjs <slug>` encrypts the draft with the root hash and writes `src/data/boxes/<slug>.js`, which `boxes.js` picks up automatically via `import.meta.glob`. Re-run with `--release-secret` after the box retires.
   - Post target: use the "Publish to Supabase" button on the draft page while logged in. It uploads embedded screenshots to Supabase storage, swaps in hosted URLs, and inserts the post row.

`scripts/encrypt-box.mjs <plaintext.json> <root-hash>` is the standalone encryption helper behind the publish script.

## Project Structure

```
src/
├── main.jsx          # Entry point
├── App.jsx           # Routes + auth provider
├── home.jsx          # Home page
├── blog.jsx          # Single post view
├── about.jsx         # About / portfolio page
├── create.jsx        # Post editor (protected)
├── login.jsx         # Auth page
├── auth-context.jsx  # Auth state
├── database.js       # Supabase client
├── data/             # Static data (posts, portfolio projects, CVEs)
├── components/ui/    # Shared UI components
└── lib/              # Utilities

public/images/        # Local image assets
```

The About page renders portfolio content from `src/data/portfolio.js` — `projects`, `cves` (security disclosures with status badges), and supporting style maps.
