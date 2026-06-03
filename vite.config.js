import path from "path"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Dev-only endpoint backing the /draft/:slug review page. Lets the in-browser
// editor read and persist drafts/<slug>.json + .meta.json on local disk while
// `npm run dev` is running. It lives in configureServer, so it never exists in
// the production build — drafts and this API stay entirely local.
function draftApiPlugin() {
  const draftsDir = path.resolve(__dirname, "drafts")
  const SLUG = /^[a-z0-9-]+$/

  return {
    name: "draft-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ""
        const match = url.match(/^\/api\/drafts\/([^/?]+)/)
        if (!match) return next()

        const slug = decodeURIComponent(match[1])
        if (!SLUG.test(slug)) {
          res.statusCode = 400
          return res.end(JSON.stringify({ error: "bad slug" }))
        }
        const docPath = path.join(draftsDir, `${slug}.json`)
        const metaPath = path.join(draftsDir, `${slug}.meta.json`)
        res.setHeader("Content-Type", "application/json")

        try {
          if (req.method === "GET") {
            const doc = JSON.parse(await readFile(docPath, "utf8"))
            let meta = {}
            try {
              meta = JSON.parse(await readFile(metaPath, "utf8"))
            } catch {
              /* meta optional */
            }
            return res.end(JSON.stringify({ slug, doc, meta }))
          }

          if (req.method === "POST") {
            const chunks = []
            for await (const c of req) chunks.push(c)
            const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")
            await mkdir(draftsDir, { recursive: true })
            if (body.doc) await writeFile(docPath, JSON.stringify(body.doc, null, 2))
            if (body.meta) await writeFile(metaPath, JSON.stringify(body.meta, null, 2))
            return res.end(JSON.stringify({ ok: true }))
          }

          res.statusCode = 405
          return res.end(JSON.stringify({ error: "method not allowed" }))
        } catch (e) {
          res.statusCode = e.code === "ENOENT" ? 404 : 500
          return res.end(JSON.stringify({ error: String(e.message || e) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss(), draftApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
