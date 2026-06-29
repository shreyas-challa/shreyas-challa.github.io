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

## Routes

| Path           | Page         | Notes                                             |
| -------------- | ------------ | ------------------------------------------------- |
| `/`            | `home.jsx`   | Post feed, encrypted box cards, fuzzy search      |
| `/about`       | `about.jsx`  | Portfolio: projects + CVE disclosures             |
| `/blog/:id`    | `blog.jsx`   | Single post view with owner-only inline edit mode |
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

## Development

```bash
npm install
npm run dev
```

Supabase-backed features (the live feed, auth, publishing) need a `.env` file (gitignored):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Without these the Supabase client is a null stub and the rest of the site still runs. Other scripts: `npm run lint` (ESLint), `npm run build`, `npm run preview`.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`: GitHub Actions installs dependencies, builds with the Supabase secrets injected, and deploys `dist/` to GitHub Pages through the official Pages actions. Nothing pre-built is committed to the repo. Deep links survive refreshes thanks to the redirect in `public/404.html` and the restore script in `index.html`.

## Project Structure

```
src/
├── main.jsx               # Entry point
├── App.jsx                # Routes + auth provider
├── home.jsx               # Feed, search, box grid
├── blog.jsx               # Single post view + owner edit mode
├── box.jsx                # Encrypted box writeup page
├── box-view.jsx           # Locked / unlocked writeup views
├── draft.jsx              # Local-only draft review page
├── about.jsx              # Portfolio: projects + CVEs
├── create.jsx             # Post editor (protected)
├── login.jsx              # Auth page
├── render-content.jsx     # Shared Tiptap JSON renderer (sanitized links)
├── auth-context.jsx       # Auth state
├── database.js            # Supabase client (null stub without env vars)
├── theme-provider.jsx     # Light / dark theme
├── data/
│   ├── boxes.js           # Box registry: lock gate + mock fetch endpoint
│   ├── boxes/             # Auto-generated encrypted writeups (one per box)
│   ├── portfolio.js       # Projects + CVE disclosures for /about and search
│   └── posts.js           # Legacy static posts (no longer imported)
├── components/
│   ├── writeup-editor.jsx # Shared Tiptap editor wrapper
│   ├── kibo-ui/editor/    # Editor toolbar UI
│   └── ui/                # Dock, cards, animations, theme toggler, etc.
└── lib/
    ├── crypto.js          # AES-GCM + PBKDF2 helpers (browser + Node)
    └── utils.js           # cn() class helper

scripts/                   # Writeup import / encrypt / publish CLIs
public/                    # Favicons, logo, 404 SPA shim, static images
backend/                   # Unused Express stub, not part of the deployed site
```

## Repo docs

- `DESIGN_SYSTEM.md`: the site's visual language (monochrome zinc palette, tactile shadows, motion rules), written so it can be dropped into other projects as a design brief.
- `supabase-storage-policies.sql`: storage bucket policies for image uploads. Note: it targets `post-content-images` and `post-covers`, while the app currently uploads to a `blog-images` bucket.
- `.claude/commands/import-writeup.md`: the Claude Code command that runs the writeup pipeline end to end.
