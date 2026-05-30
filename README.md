# Noigel Blog

Personal blog and portfolio by [Shreyas "Noigel" Challa](https://github.com/shreyas-challa), built with React + Vite and deployed to GitHub Pages.

## Stack

- **React 19** + **Vite 7**
- **Tailwind CSS v4**
- **React Router v7** (BrowserRouter)
- **Tiptap** — rich text editor for writing posts
- **Supabase** — auth and database
- **GSAP + Motion** — animations
- **Radix UI** — accessible UI primitives
- **Fuse.js** — fuzzy search

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
