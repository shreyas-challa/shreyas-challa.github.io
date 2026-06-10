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

| Path         | Page         | Notes                          |
| ------------ | ------------ | ------------------------------ |
| `/`          | `home.jsx`   | Home / post feed               |
| `/about`     | `about.jsx`  | Portfolio: projects + CVE disclosures |
| `/blog/:id`  | `blog.jsx`   | Single post view               |
| `/login`     | `login.jsx`  | Supabase auth                  |
| `/create`    | `create.jsx` | Tiptap post editor (protected) |

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
