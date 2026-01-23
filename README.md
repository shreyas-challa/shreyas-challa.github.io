# NoigelBlog

This repository contains a Vite + React blog site.

Quick start

- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Build for production: `npm run build`
- Preview production build locally: `npm run preview`

Notes on deployment to GitHub Pages (username.github.io)

- For a user/organization page, create a repository named `username.github.io` and push the built static files to the repository's default branch (e.g. `main`).
- Common approaches:
	- Build locally (`npm run build`) and push the `dist` output to the Pages branch (or the repository root for user pages).
	- Use a CI workflow (GitHub Actions) to build and deploy automatically from the source branch.
	- Use a deployment tool like `gh-pages` to publish to a `gh-pages` branch.

Example manual sequence (build and push `dist` to `main` for a user page):

```bash
npm run build
# from project root: copy or move the contents of `dist` into the repo root of username.github.io,
# or use a tool/workflow to deploy the `dist` directory.
```

If you'd like, I can add a GitHub Actions workflow or a `gh-pages` deployment script — tell me which you prefer.

Files

- Project entry: `src/main.jsx`
- App: `src/App.jsx`

For development questions or any adjustments to deployment, tell me what hosting/workflow you prefer and I'll add it.
