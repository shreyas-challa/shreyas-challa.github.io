# Noigel Blog

Personal blog by [Shreyas "Noigel" Challa](https://github.com/shreyas-challa), built with React + Vite and deployed to GitHub Pages.

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

## Build & Deploy

```bash
npm run build
```

The `dist/` output is deployed to `shreyas-challa.github.io` (GitHub Pages user site). Push the built files to the `main` branch of the `shreyas-challa.github.io` repo.

## Project Structure

```
src/
├── main.jsx          # Entry point
├── App.jsx           # Routes
├── home.jsx          # Home page
├── blog.jsx          # Single post view
├── blogs.jsx         # All posts listing
├── about.jsx         # About page
├── create.jsx        # Post editor (protected)
├── login.jsx         # Auth page
├── auth-context.jsx  # Auth state
├── database.js       # Supabase client
├── data/             # Static post data
├── components/       # Shared UI components
└── images/           # Local image assets
```
